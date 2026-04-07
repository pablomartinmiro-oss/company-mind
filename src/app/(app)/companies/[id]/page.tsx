import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';
import { CompanyDetailClient } from '@/components/company/company-detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { tenantId } = await getTenantForUser();
  const { id: companyId } = await params;

  // Fetch all data in parallel
  const [companyRes, contactsRes, pipelinesRes, allPipelinesRes, companyResearchRes, stageLogRes] = await Promise.all([
    supabaseAdmin.from('companies').select('*').eq('tenant_id', tenantId).eq('id', companyId).single(),
    supabaseAdmin.from('company_contacts').select('*').eq('tenant_id', tenantId).eq('company_id', companyId).order('is_primary', { ascending: false }),
    supabaseAdmin.from('pipeline_companies').select('id, pipeline_id, stage, deal_value, stage_entered_at').eq('tenant_id', tenantId).eq('company_id', companyId),
    supabaseAdmin.from('pipelines').select('id, name, stages').eq('tenant_id', tenantId),
    supabaseAdmin.from('research').select('*').eq('tenant_id', tenantId).eq('scope', 'company').eq('company_id', companyId),
    supabaseAdmin.from('stage_log').select('*').eq('tenant_id', tenantId).eq('company_id', companyId).order('entered_at', { ascending: false }),
  ]);

  const company = companyRes.data;
  if (!company) {
    return (
      <div className="p-5">
        <p className="text-[13px] text-red-500">Company not found.</p>
      </div>
    );
  }

  const contacts = contactsRes.data ?? [];

  // Get contact names from calls
  const contactIds = contacts.map((c: { contact_id: string }) => c.contact_id);
  const { data: callNames } = contactIds.length > 0
    ? await supabaseAdmin.from('calls').select('contact_ghl_id, contact_name').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds)
    : { data: [] };

  const nameMap: Record<string, string> = {};
  for (const c of callNames ?? []) nameMap[c.contact_ghl_id] = c.contact_name;

  // Get contact details from data points
  const { data: dataPoints } = contactIds.length > 0
    ? await supabaseAdmin.from('contact_data_points').select('contact_ghl_id, field_name, field_value').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds).in('field_name', ['email', 'phone'])
    : { data: [] };

  const dpMap: Record<string, Record<string, string>> = {};
  for (const dp of dataPoints ?? []) {
    if (!dpMap[dp.contact_ghl_id]) dpMap[dp.contact_ghl_id] = {};
    dpMap[dp.contact_ghl_id][dp.field_name] = dp.field_value;
  }

  // Fetch contact-level research for all contacts
  const { data: allContactResearch } = contactIds.length > 0
    ? await supabaseAdmin.from('research').select('*').eq('tenant_id', tenantId).eq('scope', 'contact').in('contact_id', contactIds)
    : { data: [] };

  // Group contact research by contact_id
  const contactResearchMap: Record<string, { field_name: string; field_value: string | null; source: string; section: string }[]> = {};
  for (const r of allContactResearch ?? []) {
    if (!contactResearchMap[r.contact_id]) contactResearchMap[r.contact_id] = [];
    contactResearchMap[r.contact_id].push({ field_name: r.field_name, field_value: r.field_value, source: r.source, section: r.section });
  }

  // Build pipeline name map
  const pipelineNameMap: Record<string, { name: string; stages: string[] }> = {};
  for (const p of allPipelinesRes.data ?? []) {
    const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];
    pipelineNameMap[p.id] = { name: p.name, stages };
  }

  // Build enrollments
  const enrollments = (pipelinesRes.data ?? []).map((pc: { id: string; pipeline_id: string; stage: string; deal_value: string | null; stage_entered_at: string }) => {
    const pipeline = pipelineNameMap[pc.pipeline_id];
    if (!pipeline) return null;
    const daysInStage = Math.max(0, Math.floor((Date.now() - new Date(pc.stage_entered_at).getTime()) / 86400000));
    return {
      pipelineId: pc.pipeline_id,
      pipelineName: pipeline.name,
      stages: pipeline.stages,
      currentStage: pc.stage,
      daysInStage,
      dealValue: pc.deal_value,
      stageLog: (stageLogRes.data ?? [])
        .filter((sl: { pipeline_id: string }) => sl.pipeline_id === pc.pipeline_id)
        .map((sl: { id: string; stage: string; entered_at: string; moved_by: string | null; source: string | null; note: string | null; entry_number: number }) => ({
          id: sl.id, stage: sl.stage, entered_at: sl.entered_at,
          moved_by: sl.moved_by, source: sl.source, note: sl.note, entry_number: sl.entry_number,
        })),
    };
  }).filter(Boolean);

  // Build enriched contacts
  const enrichedContacts = contacts.map((c: { id: string; contact_id: string; is_primary: boolean; role: string | null }) => ({
    id: c.id,
    contact_id: c.contact_id,
    is_primary: c.is_primary,
    role: c.role,
    contact_name: nameMap[c.contact_id] ?? c.contact_id,
    contact_email: dpMap[c.contact_id]?.email ?? null,
    contact_phone: dpMap[c.contact_id]?.phone ?? null,
  }));

  // Company research grouped by section
  const companyResearch: Record<string, { field_name: string; field_value: string | null; source: string }[]> = {};
  for (const r of companyResearchRes.data ?? []) {
    if (!companyResearch[r.section]) companyResearch[r.section] = [];
    companyResearch[r.section].push({ field_name: r.field_name, field_value: r.field_value, source: r.source });
  }

  // Get company data from contact_data_points (employees count etc.)
  const primaryContactId = contacts.find((c: { is_primary: boolean }) => c.is_primary)?.contact_id ?? contactIds[0];
  const { data: companyDPs } = primaryContactId
    ? await supabaseAdmin.from('contact_data_points').select('field_name, field_value').eq('tenant_id', tenantId).eq('contact_ghl_id', primaryContactId).in('field_name', ['company_name', 'employees', 'industry', 'location'])
    : { data: [] };

  const companyMeta: Record<string, string> = {};
  for (const dp of companyDPs ?? []) companyMeta[dp.field_name] = dp.field_value;

  return (
    <CompanyDetailClient
      companyId={companyId}
      companyName={company.name}
      industry={company.industry ?? companyMeta.industry ?? null}
      location={company.location ?? companyMeta.location ?? null}
      employeeCount={companyMeta.employees ?? null}
      enrollments={enrollments}
      contacts={enrichedContacts}
      companyResearch={companyResearch}
      contactResearchMap={contactResearchMap}
    />
  );
}
