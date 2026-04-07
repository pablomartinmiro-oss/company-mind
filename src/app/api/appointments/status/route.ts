import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantForUser();
    const { ghl_event_id, status } = await req.json();

    if (!ghl_event_id || !status) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const validStatuses = ['confirmed', 'showed', 'no_show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('appointment_status')
      .upsert(
        { tenant_id: tenantId, ghl_event_id, status, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id,ghl_event_id' }
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
