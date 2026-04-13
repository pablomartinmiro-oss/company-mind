import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';
import { PersonDetailClient } from '@/components/contact/person-detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { tenantId } = await getTenantForUser();
  const { id: contactId } = await params;

  // Fetch contact info from company_contacts (first row — same person across companies)
  const { data: contactRow } = await supabaseAdmin
    .from('company_contacts')
    .select('first_name, last_name, contact_name, contact_email, contact_phone, email, phone, title, linkedin, notes, role')
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactId)
    .limit(1)
    .maybeSingle();

  if (!contactRow) notFound();

  // Fetch all companies this contact belongs to, with pipeline info
  const { data: links } = await supabaseAdmin
    .from('company_contacts')
    .select('company_id, is_primary, role')
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactId);

  const companyIds = (links ?? []).map(l => l.company_id);

  const [companiesRes, pipelineRes, pipelinesRes, researchRes] = await Promise.all([
    companyIds.length > 0
      ? supabaseAdmin.from('companies').select('id, name').in('id', companyIds)
      : Promise.resolve({ data: [] }),
    companyIds.length > 0
      ? supabaseAdmin.from('pipeline_companies').select('company_id, stage, pipeline_id').eq('tenant_id', tenantId).in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin.from('pipelines').select('id, name').eq('tenant_id', tenantId),
    supabaseAdmin.from('research').select('field_name, field_value, source, source_detail').eq('tenant_id', tenantId).eq('scope', 'contact').eq('contact_id', contactId),
  ]);

  const pipelineNameMap: Record<string, string> = {};
  for (const p of pipelinesRes.data ?? []) pipelineNameMap[p.id] = p.name;

  const pipelineByCompany: Record<string, { stage: string; pipelineName: string }[]> = {};
  for (const pc of pipelineRes.data ?? []) {
    if (!pipelineByCompany[pc.company_id]) pipelineByCompany[pc.company_id] = [];
    pipelineByCompany[pc.company_id].push({
      stage: pc.stage,
      pipelineName: pipelineNameMap[pc.pipeline_id] ?? 'Unknown',
    });
  }

  const companies = (companiesRes.data ?? []).map(c => ({
    id: c.id,
    name: c.name,
    pipelines: pipelineByCompany[c.id] ?? [],
  }));

  const firstName = contactRow.first_name ?? contactRow.contact_name?.split(' ')[0] ?? '';
  const lastName = contactRow.last_name ?? contactRow.contact_name?.split(' ').slice(1).join(' ') ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || contactId;

  const researchData: Record<string, { value: string; source: string; source_detail?: string }> = {};
  for (const r of researchRes.data ?? []) {
    if (r.field_value) {
      researchData[r.field_name] = { value: r.field_value, source: r.source, source_detail: r.source_detail ?? undefined };
    }
  }

  return (
    <PersonDetailClient
      contactId={contactId}
      firstName={firstName}
      lastName={lastName}
      displayName={displayName}
      email={contactRow.email ?? contactRow.contact_email ?? null}
      phone={contactRow.phone ?? contactRow.contact_phone ?? null}
      title={contactRow.title ?? null}
      linkedin={contactRow.linkedin ?? null}
      notes={contactRow.notes ?? null}
      companies={companies}
      researchData={researchData}
    />
  );
}
