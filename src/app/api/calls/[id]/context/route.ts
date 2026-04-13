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
    .select('contact_name, contact_ghl_id, rep_name, call_summary, metadata')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  // Build contacts list from metadata.contact_ids or fallback to primary
  const meta = call.metadata as { contact_ids?: string[] } | null;
  const contactIds: string[] = meta?.contact_ids?.length
    ? meta.contact_ids
    : call.contact_ghl_id ? [call.contact_ghl_id] : [];

  // Resolve names from company_contacts
  let contacts: { id: string; name: string }[] = [];
  if (contactIds.length > 0) {
    const { data: rows } = await supabaseAdmin
      .from('company_contacts')
      .select('contact_id, contact_name')
      .eq('tenant_id', tenantId)
      .in('contact_id', contactIds);

    const nameMap = new Map<string, string>();
    for (const r of rows ?? []) {
      if (r.contact_id && r.contact_name) nameMap.set(r.contact_id, r.contact_name);
    }

    contacts = contactIds.map(cid => ({
      id: cid,
      name: nameMap.get(cid) ?? call.contact_name ?? 'Unknown',
    }));
  } else if (call.contact_name) {
    contacts = [{ id: call.contact_ghl_id ?? '', name: call.contact_name }];
  }

  // Resolve company from any contact
  let companyName: string | null = null;
  let companyId: string | null = null;

  const lookupContactId = contactIds[0] ?? call.contact_ghl_id;
  if (lookupContactId) {
    const { data: link } = await supabaseAdmin
      .from('company_contacts')
      .select('company_id')
      .eq('contact_id', lookupContactId)
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
    contacts,
    companyName,
    companyId,
    repName: call.rep_name ?? null,
    callSummary: call.call_summary ?? null,
  });
}
