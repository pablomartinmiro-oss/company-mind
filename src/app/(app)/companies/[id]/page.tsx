import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';
import { TEAM_MEMBERS } from '@/lib/pipeline-config';
import { CompanyDetailClient } from '@/components/company/company-detail-client';
import { scoreGrade } from '@/lib/format';

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
    return <div className="p-5"><p className="text-[13px] text-red-500">Company not found.</p></div>;
  }

  const contacts = contactsRes.data ?? [];
  const contactIds = contacts.map((c: { contact_id: string }) => c.contact_id);

  // Fetch contact names, calls, tasks, data points in parallel
  const [callNamesRes, callsRes, tasksRes, dataPointsRes, allContactResearchRes] = await Promise.all([
    contactIds.length > 0
      ? supabaseAdmin.from('calls').select('contact_ghl_id, contact_name').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds)
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? supabaseAdmin.from('calls').select('id, contact_name, contact_ghl_id, score, call_summary, call_type, called_at, duration_seconds').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds).order('called_at', { ascending: false }).limit(20)
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? supabaseAdmin.from('tasks').select('*').eq('tenant_id', tenantId).in('contact_id', contactIds).order('due_date', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? supabaseAdmin.from('contact_data_points').select('contact_ghl_id, field_name, field_value').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds)
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? supabaseAdmin.from('research').select('*').eq('tenant_id', tenantId).eq('scope', 'contact').in('contact_id', contactIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Name map
  const nameMap: Record<string, string> = {};
  for (const c of callNamesRes.data ?? []) nameMap[c.contact_ghl_id] = c.contact_name;

  // Data points map (for contact details + company research population)
  const dpMap: Record<string, Record<string, string>> = {};
  for (const dp of dataPointsRes.data ?? []) {
    if (!dpMap[dp.contact_ghl_id]) dpMap[dp.contact_ghl_id] = {};
    dpMap[dp.contact_ghl_id][dp.field_name] = dp.field_value;
  }

  // Contact research grouped by contact_id
  const contactResearchMap: Record<string, { field_name: string; field_value: string | null; source: string; section: string }[]> = {};
  for (const r of allContactResearchRes.data ?? []) {
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
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // Enriched contacts — prefer contact_name from company_contacts, then calls, then ID
  const enrichedContacts = contacts.map((c: { id: string; contact_id: string; is_primary: boolean; role: string | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null }) => ({
    id: c.id,
    contact_id: c.contact_id,
    is_primary: c.is_primary,
    role: c.role,
    contact_name: c.contact_name ?? nameMap[c.contact_id] ?? c.contact_id,
    contact_email: c.contact_email ?? dpMap[c.contact_id]?.email ?? null,
    contact_phone: c.contact_phone ?? dpMap[c.contact_id]?.phone ?? null,
  }));

  // Company research grouped by section — merge from research table AND contact_data_points
  const companyResearch: Record<string, { field_name: string; field_value: string | null; source: string }[]> = {};
  for (const r of companyResearchRes.data ?? []) {
    if (!companyResearch[r.section]) companyResearch[r.section] = [];
    companyResearch[r.section].push({ field_name: r.field_name, field_value: r.field_value, source: r.source });
  }

  // Populate company research from contact_data_points of primary contact
  const primaryContactId = contacts.find((c: { is_primary: boolean }) => c.is_primary)?.contact_id ?? contactIds[0];
  const primaryDPs = primaryContactId ? dpMap[primaryContactId] ?? {} : {};

  // Map known data point fields into research sections
  const dpToResearch: Record<string, { section: string; field: string }> = {
    company_name: { section: 'Business Info', field: 'Company name' },
    industry: { section: 'Business Info', field: 'Industry' },
    employees: { section: 'Business Info', field: 'Employees' },
    annual_revenue: { section: 'Business Info', field: 'Annual revenue' },
    years_in_business: { section: 'Business Info', field: 'Years in business' },
    website: { section: 'Business Info', field: 'Website' },
    location: { section: 'Business Info', field: 'Location' },
    primary_pain: { section: 'Pain Points', field: 'Primary pain' },
    current_crm: { section: 'Pain Points', field: 'Current CRM' },
    lead_volume: { section: 'Pain Points', field: 'Lead volume per week' },
    response_time: { section: 'Pain Points', field: 'Response time' },
    lead_sources: { section: 'Pain Points', field: 'Lead sources' },
    monthly_ad_spend: { section: 'Pain Points', field: 'Monthly ad spend' },
    budget_range: { section: 'Buying Process', field: 'Budget range' },
    timeline: { section: 'Buying Process', field: 'Timeline' },
    key_objections: { section: 'Buying Process', field: 'Key objections' },
    competitor_alternatives: { section: 'Buying Process', field: 'Competitor alternatives' },
    overall_fit: { section: 'Account Health', field: 'Overall fit' },
    next_step_agreed: { section: 'Account Health', field: 'Notes' },
    referral_source: { section: 'Account Health', field: 'Last touch' },
  };

  for (const [dpKey, mapping] of Object.entries(dpToResearch)) {
    if (primaryDPs[dpKey]) {
      if (!companyResearch[mapping.section]) companyResearch[mapping.section] = [];
      const existing = companyResearch[mapping.section].find(f => f.field_name === mapping.field);
      if (!existing) {
        companyResearch[mapping.section].push({ field_name: mapping.field, field_value: primaryDPs[dpKey], source: 'api' });
      }
    }
  }

  // Calls for overview
  const calls = (callsRes.data ?? []).map((c) => ({
    id: c.id,
    score: typeof c.score === 'object' && c.score !== null ? (c.score as { overall?: number }).overall ?? null : null,
    call_summary: c.call_summary,
    call_type: c.call_type,
    called_at: c.called_at,
    duration_seconds: c.duration_seconds,
  }));

  // Tasks for overview
  const tasks = (tasksRes.data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    description: t.description as string | null,
    due_date: t.due_date as string | null,
    completed: t.completed as boolean,
  }));

  // Team members
  const teamMembers = TEAM_MEMBERS.map((m) => ({ name: m.name, initials: m.initials, role: 'Rep' }));

  return (
    <CompanyDetailClient
      companyId={companyId}
      companyName={company.name}
      industry={company.industry ?? primaryDPs.industry ?? null}
      leadSource={company.lead_source ?? null}
      location={company.location ?? primaryDPs.location ?? null}
      website={company.website ?? primaryDPs.website ?? null}
      mrr={company.mrr ?? 0}
      setupFee={company.setup_fee ?? 0}
      enrollments={enrollments}
      contacts={enrichedContacts}
      calls={calls}
      tasks={tasks}
      teamMembers={teamMembers}
      companyResearch={companyResearch}
      contactResearchMap={contactResearchMap}
    />
  );
}
