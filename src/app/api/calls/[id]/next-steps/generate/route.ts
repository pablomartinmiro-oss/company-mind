import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getTenantForUser } from '@/lib/get-tenant';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: callId } = await params;
    const { instruction } = await req.json();

    if (!instruction?.trim()) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
    }

    // Load call context
    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('contact_name, contact_ghl_id, call_summary, transcript_text, rep_name')
      .eq('id', callId)
      .eq('tenant_id', tenantId)
      .single();

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Get company context
    let companyName = 'Unknown';
    let companyId: string | null = null;
    if (call.contact_ghl_id) {
      const { data: link } = await supabaseAdmin
        .from('company_contacts')
        .select('company_id')
        .eq('contact_id', call.contact_ghl_id)
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle();
      if (link?.company_id) {
        companyId = link.company_id;
        const { data: company } = await supabaseAdmin
          .from('companies').select('name').eq('id', link.company_id).single();
        companyName = company?.name ?? 'Unknown';
      }
    }

    const transcriptSnippet = (call.transcript_text ?? '').slice(0, 2000);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a CRM action generator. Based on the user's instruction and call context, generate ONE structured action card.

USER INSTRUCTION: "${instruction}"

CALL CONTEXT:
- Contact: ${call.contact_name}
- Company: ${companyName}
- Rep: ${call.rep_name ?? 'Unknown'}
- Summary: ${call.call_summary ?? 'No summary'}
- Transcript snippet: ${transcriptSnippet}

Return a JSON object with these fields:
{
  "action_type": "task" | "appointment" | "email" | "sms" | "note",
  "title": "action title",
  "description": "detailed description",
  "reasoning": "why this action is recommended",
  "fields": {
    // For task: { "title": "...", "description": "...", "dueDate": "YYYY-MM-DD", "assignedTo": "rep name" }
    // For appointment: { "title": "...", "dateTime": "YYYY-MM-DDTHH:mm", "assignedTo": "rep name" }
    // For email: { "subject": "...", "message": "full email body" }
    // For sms: { "message": "sms text" }
    // For note: { "content": "note text" }
  }
}

Return ONLY the JSON object, no markdown fences.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(match[0]);

    // Insert into next_steps table
    const { data: step, error } = await supabaseAdmin
      .from('next_steps')
      .insert({
        tenant_id: tenantId,
        call_id: callId,
        company_id: companyId,
        contact_id: call.contact_ghl_id,
        action_type: parsed.action_type ?? 'task',
        title: parsed.title ?? instruction,
        description: parsed.description ?? null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !step) {
      return NextResponse.json({ error: 'Failed to save action' }, { status: 500 });
    }

    return NextResponse.json({
      id: step.id,
      action_type: parsed.action_type ?? 'task',
      title: parsed.title ?? instruction,
      description: parsed.description ?? null,
      reasoning: parsed.reasoning ?? null,
      fields: parsed.fields ?? {},
      status: 'pending',
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
