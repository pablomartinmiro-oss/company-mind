import { supabaseAdmin } from '@/lib/supabase';

export async function fetchCompanies(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select(`
      *,
      pipeline_companies(id, stage, deal_value, pipeline_id, stage_entered_at),
      company_contacts(contact_id, is_primary, role)
    `)
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchCompany(tenantId: string, companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', companyId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCompanyContacts(tenantId: string, companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('company_contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('company_id', companyId)
    .order('is_primary', { ascending: false })
    .order('added_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchCompanyResearch(tenantId: string, companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('research')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scope', 'company')
    .eq('company_id', companyId);

  if (error) throw error;
  return data ?? [];
}

export async function fetchContactResearch(tenantId: string, contactId: string) {
  const { data, error } = await supabaseAdmin
    .from('research')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scope', 'contact')
    .eq('contact_id', contactId);

  if (error) throw error;
  return data ?? [];
}

export async function fetchCompanyPipelines(tenantId: string, companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('pipeline_companies')
    .select('*, pipelines(name, stages)')
    .eq('tenant_id', tenantId)
    .eq('company_id', companyId);

  if (error) throw error;
  return data ?? [];
}
