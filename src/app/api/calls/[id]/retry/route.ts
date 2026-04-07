import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id } = await params;

    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('processing_status, processing_attempts')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

    if (call.processing_status !== 'failed') {
      return NextResponse.json({ error: 'Only failed calls can be retried' }, { status: 400 });
    }

    // Reset to pending — the cron worker will pick it up.
    // Don't reset processing_attempts — we want to track total attempts.
    await supabaseAdmin
      .from('calls')
      .update({
        processing_status: 'pending',
        processing_error: null,
        processing_started_at: null,
        processing_completed_at: null,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
