import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getTenantForUser();
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from('contact_data_points')
    .select('field_value')
    .eq('tenant_id', tenantId)
    .eq('contact_ghl_id', id)
    .eq('field_name', 'company_name')
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ company_name: data?.field_value ?? null });
}
