import { supabaseAdmin } from './supabase';

export interface ContactInfo {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company_id: string | null;
  company_name: string | null;
  company_location: string | null;
}

/**
 * Look up a contact by GHL ID. Joins company_contacts → companies.
 * Returns null if contact not found or not in tenant.
 */
export async function getContactInfo(
  tenantId: string,
  contactGhlId: string
): Promise<ContactInfo | null> {
  const { data } = await supabaseAdmin
    .from('company_contacts')
    .select(`
      contact_name,
      contact_email,
      contact_phone,
      company_id,
      companies ( name, location )
    `)
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactGhlId)
    .maybeSingle();

  if (!data) return null;
  const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
  return {
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    company_id: data.company_id,
    company_name: (company as { name: string; location: string } | null)?.name ?? null,
    company_location: (company as { name: string; location: string } | null)?.location ?? null,
  };
}

/**
 * Batch lookup. Returns Map keyed by contact_id (GHL ID).
 */
export async function getContactInfoBatch(
  tenantId: string,
  contactGhlIds: string[]
): Promise<Map<string, ContactInfo>> {
  const map = new Map<string, ContactInfo>();
  if (contactGhlIds.length === 0) return map;

  const { data } = await supabaseAdmin
    .from('company_contacts')
    .select(`
      contact_id,
      contact_name,
      contact_email,
      contact_phone,
      company_id,
      companies ( name, location )
    `)
    .eq('tenant_id', tenantId)
    .in('contact_id', contactGhlIds);

  for (const row of data ?? []) {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    map.set(row.contact_id, {
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      company_id: row.company_id,
      company_name: (company as { name: string; location: string } | null)?.name ?? null,
      company_location: (company as { name: string; location: string } | null)?.location ?? null,
    });
  }
  return map;
}
