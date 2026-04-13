import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userName } = await getTenantForUser();
    const { id: callId } = await params;
    const { stepId, type, fields, contactGhlId } = await req.json();

    if (!type || !fields) {
      return NextResponse.json({ error: 'type and fields are required' }, { status: 400 });
    }

    const ghl = await getGHLClientForTenant(tenantId);
    const now = new Date().toISOString();

    if (type === 'task' && contactGhlId) {
      await ghl.createTask(contactGhlId, {
        title: fields.title ?? 'Task from call',
        body: fields.description ?? '',
        dueDate: fields.dueDate
          ? new Date(fields.dueDate).toISOString()
          : new Date(Date.now() + 3 * 86400000).toISOString(),
        assignedTo: fields.assignedTo ?? userName,
      });
    } else if (type === 'email' && contactGhlId) {
      await ghl.sendMessage({
        type: 'Email',
        contactId: contactGhlId,
        subject: fields.subject ?? 'Follow-up',
        html: (fields.message ?? '').replace(/\n/g, '<br>'),
      });
    } else if (type === 'sms' && contactGhlId) {
      await ghl.sendMessage({
        type: 'SMS',
        contactId: contactGhlId,
        message: fields.message ?? '',
      });
    } else if (type === 'note') {
      // Add note to activity_feed for the company
      // Resolve company from call
      const { data: call } = await supabaseAdmin
        .from('calls')
        .select('contact_ghl_id')
        .eq('id', callId)
        .eq('tenant_id', tenantId)
        .single();

      let companyId: string | null = null;
      const cGhlId = contactGhlId || call?.contact_ghl_id;
      if (cGhlId) {
        const { data: link } = await supabaseAdmin
          .from('company_contacts')
          .select('company_id')
          .eq('contact_id', cGhlId)
          .eq('tenant_id', tenantId)
          .limit(1)
          .maybeSingle();
        companyId = link?.company_id ?? null;
      }

      if (companyId) {
        await supabaseAdmin.from('activity_feed').insert({
          tenant_id: tenantId,
          company_id: companyId,
          type: 'note',
          title: 'Call Summary Note',
          body: fields.content ?? '',
          author: userName,
          source: 'call_analysis',
        });
      }

      // Also create GHL note if we have a contact
      if (cGhlId) {
        try {
          await ghl.createNote(cGhlId, fields.content ?? '');
        } catch {
          // Non-blocking — activity_feed is the primary target
        }
      }
    }

    // Update next_steps status if stepId provided
    if (stepId) {
      await supabaseAdmin
        .from('next_steps')
        .update({ status: 'pushed', acted_at: now })
        .eq('id', stepId)
        .eq('tenant_id', tenantId);
    }

    return NextResponse.json({ success: true, pushedAt: now });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
