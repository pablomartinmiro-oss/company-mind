import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { buildCallAnalysisSchema } from '@/lib/research/schemas';
import { findSectionForField, extractJsonFromText } from './helpers';

const MODEL = 'claude-sonnet-4-6';

interface CallAnalysisResult {
  call_id: string;
  company_fields_updated: number;
  contact_fields_updated: number;
  next_steps_created: number;
  data_points_created: number;
  score: number;
  errors: string[];
}

export async function analyzeCall(tenantId: string, callId: string): Promise<CallAnalysisResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const errors: string[] = [];
  let companyFieldsUpdated = 0;
  let contactFieldsUpdated = 0;
  let nextStepsCreated = 0;
  let dataPointsCreated = 0;

  const { data: call } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('id', callId)
    .eq('tenant_id', tenantId)
    .single();

  if (!call) throw new Error('Call not found');
  if (!call.transcript) throw new Error('Call has no transcript');

  if ((call.duration_seconds ?? 0) < 60) {
    return { call_id: callId, company_fields_updated: 0, contact_fields_updated: 0, next_steps_created: 0, data_points_created: 0, score: 0, errors: ['Call under 60s, skipped'] };
  }

  const contactId = call.contact_ghl_id;

  // Get company context
  const { data: companyContact } = await supabaseAdmin
    .from('company_contacts')
    .select('*, company_id')
    .eq('contact_id', contactId)
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();

  const companyId = companyContact?.company_id ?? null;

  let companyName = 'Unknown';
  if (companyId) {
    const { data: company } = await supabaseAdmin.from('companies').select('name').eq('id', companyId).single();
    companyName = company?.name ?? 'Unknown';
  }

  // Existing research for context
  const { data: companyResearch } = companyId
    ? await supabaseAdmin.from('research').select('field_name, field_value, source, locked').eq('tenant_id', tenantId).eq('scope', 'company').eq('company_id', companyId)
    : { data: [] };

  const { data: contactResearch } = await supabaseAdmin
    .from('research')
    .select('field_name, field_value, source, locked')
    .eq('tenant_id', tenantId)
    .eq('scope', 'contact')
    .eq('contact_id', contactId);

  const companyLocked = new Set((companyResearch ?? []).filter(r => r.locked || r.source === 'manual').map(r => r.field_name));
  const contactLocked = new Set((contactResearch ?? []).filter(r => r.locked || r.source === 'manual').map(r => r.field_name));

  const prompt = `You are analyzing a sales call transcript for a B2B CRM. Extract everything possible.

CALL CONTEXT:
- Company: ${companyName}
- Contact: ${companyContact?.contact_name ?? call.contact_name}
- Contact role: ${companyContact?.role ?? 'unknown'}
- Duration: ${Math.round((call.duration_seconds ?? 0) / 60)} minutes
- Type: ${call.call_type ?? 'unknown'}

EXISTING COMPANY RESEARCH:
${(companyResearch ?? []).filter(r => r.field_value).map(r => `  ${r.field_name}: ${r.field_value}`).join('\n') || '  (none)'}

EXISTING CONTACT RESEARCH:
${(contactResearch ?? []).filter(r => r.field_value).map(r => `  ${r.field_name}: ${r.field_value}`).join('\n') || '  (none)'}

LOCKED FIELDS (suggest changes via data_points, don't overwrite directly):
- Company: ${Array.from(companyLocked).join(', ') || 'none'}
- Contact: ${Array.from(contactLocked).join(', ') || 'none'}

TRANSCRIPT:
${call.transcript}

Return ONLY a JSON object matching this schema:

${buildCallAnalysisSchema()}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlocks = response.content.filter(b => b.type === 'text');
  const fullText = textBlocks.map(b => (b as { type: 'text'; text: string }).text).join('\n');
  const analysis = extractJsonFromText(fullText) as Record<string, unknown> | null;
  if (!analysis) throw new Error('No JSON in Claude response');

  // Update call record
  await supabaseAdmin
    .from('calls')
    .update({
      call_summary: analysis.call_summary as string,
      score: { overall: analysis.call_score as number },
      outcome: analysis.outcome as string,
      processing_status: 'complete',
      coaching_data: {
        strengths: analysis.strengths ?? [],
        weaknesses: analysis.weaknesses ?? [],
        red_flags: analysis.red_flags ?? [],
        sentiment: analysis.sentiment,
        score_reasoning: analysis.score_reasoning,
      },
    })
    .eq('id', callId);

  // Update company research
  const companyUpdates = analysis.company_field_updates as Record<string, unknown> | null;
  if (companyId && companyUpdates) {
    for (const [fieldKey, fieldValue] of Object.entries(companyUpdates)) {
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') continue;
      if (companyLocked.has(fieldKey)) continue;

      const valueStr = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
      const { error } = await supabaseAdmin
        .from('research')
        .upsert({
          tenant_id: tenantId, scope: 'company', company_id: companyId, contact_id: null,
          section: findSectionForField(fieldKey, 'company'),
          field_name: fieldKey, field_value: valueStr, source: 'call',
          source_call_id: callId, last_verified_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id,company_id,field_name' });
      if (!error) companyFieldsUpdated++;
    }
  }

  // Update contact research
  const contactUpdates = analysis.contact_field_updates as Record<string, unknown> | null;
  if (contactUpdates) {
    for (const [fieldKey, fieldValue] of Object.entries(contactUpdates)) {
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') continue;
      if (contactLocked.has(fieldKey)) continue;

      const valueStr = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
      const { error } = await supabaseAdmin
        .from('research')
        .upsert({
          tenant_id: tenantId, scope: 'contact', company_id: null, contact_id: contactId,
          section: findSectionForField(fieldKey, 'contact'),
          field_name: fieldKey, field_value: valueStr, source: 'call',
          source_call_id: callId, last_verified_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id,contact_id,field_name' });
      if (!error) contactFieldsUpdated++;
    }
  }

  // Create next steps
  const nextSteps = analysis.next_steps as Array<{ action_type: string; title: string; description: string }> | null;
  for (const step of nextSteps ?? []) {
    await supabaseAdmin.from('next_steps').insert({
      tenant_id: tenantId, call_id: callId, company_id: companyId, contact_id: contactId,
      action_type: step.action_type, title: step.title, description: step.description, status: 'pending',
    });
    nextStepsCreated++;
  }

  // Create data points
  const dataPoints = analysis.data_points as Array<{ field_name: string; suggested_value: string; scope: string }> | null;
  for (const dp of dataPoints ?? []) {
    await supabaseAdmin.from('data_points').insert({
      tenant_id: tenantId, call_id: callId,
      company_id: dp.scope === 'company' ? companyId : null,
      contact_id: dp.scope === 'contact' ? contactId : null,
      field_name: dp.field_name, field_value: dp.suggested_value, source: 'ai', status: 'pending',
    });
    dataPointsCreated++;
  }

  return {
    call_id: callId, company_fields_updated: companyFieldsUpdated, contact_fields_updated: contactFieldsUpdated,
    next_steps_created: nextStepsCreated, data_points_created: dataPointsCreated,
    score: (analysis.call_score as number) ?? 0, errors,
  };
}
