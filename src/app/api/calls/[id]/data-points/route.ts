import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: callId } = await params;

    const { data, error } = await supabaseAdmin
      .from('data_points')
      .select('id, field_name, field_value, status, company_id, contact_id, source, created_at')
      .eq('call_id', callId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ dataPoints: data ?? [] });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
