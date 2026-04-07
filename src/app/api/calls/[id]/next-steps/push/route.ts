import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { actionId } = await req.json();

    if (!actionId) {
      return NextResponse.json({ error: 'actionId required' }, { status: 400 });
    }

    const { data: action, error } = await supabaseAdmin
      .from('call_actions')
      .select('*')
      .eq('id', actionId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const ghl = await getGHLClientForTenant(tenantId);

    // Load call to get contact ID
    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('contact_ghl_id')
      .eq('id', action.call_id)
      .single();

    const contactGhlId = call?.contact_ghl_id;
    const payload = action.suggested_payload as Record<string, unknown> | null;

    if (action.action_type === 'create_task' && contactGhlId) {
      await ghl.createTask(contactGhlId, {
        title: action.description,
        body: (payload?.reasoning as string) ?? '',
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      });
    } else if (action.action_type === 'create_note' && contactGhlId) {
      await ghl.createNote(contactGhlId, action.description);
    }

    // Mark as approved
    await supabaseAdmin
      .from('call_actions')
      .update({ status: 'approved' })
      .eq('id', actionId)
      .eq('tenant_id', tenantId);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to push action' }, { status: 500 });
  }
}
