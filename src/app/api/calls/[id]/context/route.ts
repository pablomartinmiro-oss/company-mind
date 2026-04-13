import { NextResponse } from 'next/server';
import { getTenantForUser } from '@/lib/get-tenant';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getTenantForUser();
  const { id } = await params;

  const { data: call } = await supabaseAdmin
    .from('calls')
    .select('contact_name, contact_ghl_id, rep_name, call_summary')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  // Resolve company from contact
  let companyName: string | null = null;
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
        .from('companies')
        .select('name')
        .eq('id', link.company_id)
        .single();
      companyName = company?.name ?? null;
    }
  }

  return NextResponse.json({
    contactName: call.contact_name ?? null,
    contactGhlId: call.contact_ghl_id ?? null,
    companyName,
    companyId,
    repName: call.rep_name ?? null,
    callSummary: call.call_summary ?? null,
  });
}
