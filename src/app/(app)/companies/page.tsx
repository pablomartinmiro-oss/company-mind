import { supabaseAdmin } from '@/lib/supabase';
import { PipelinePageClient } from '@/components/pipeline/pipeline-page-client';
import { getTenantForUser } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const { tenantId } = await getTenantForUser();

  // Fetch companies with pipeline enrollments and contacts
  const { data: companiesRaw } = await supabaseAdmin
    .from('companies')
    .select(`
      id, name, industry, location, lead_source,
      pipeline_companies(id, pipeline_id, stage, deal_value, stage_entered_at),
      company_contacts(contact_id, is_primary, role)
    `)
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  // Fetch pipelines for funnel
  const { data: pipelinesRaw } = await supabaseAdmin
    .from('pipelines')
    .select('id, name, stages')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  // Fetch stage log
  const pipelineIds = (pipelinesRaw ?? []).map((p: { id: string }) => p.id);
  const { data: stageLogRaw } = pipelineIds.length > 0
    ? await supabaseAdmin
        .from('stage_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('pipeline_id', pipelineIds)
        .order('entered_at', { ascending: false })
    : { data: [] };

  // Get contact names from calls
  const allContactIds = [
    ...new Set(
      (companiesRaw ?? []).flatMap((c: { company_contacts: { contact_id: string }[] }) =>
        c.company_contacts.map((cc) => cc.contact_id)
      )
    ),
  ];
  const { data: callNames } = allContactIds.length > 0
    ? await supabaseAdmin
        .from('calls')
        .select('contact_ghl_id, contact_name')
        .eq('tenant_id', tenantId)
        .in('contact_ghl_id', allContactIds)
    : { data: [] };

  const nameMap: Record<string, string> = {};
  for (const c of callNames ?? []) nameMap[c.contact_ghl_id] = c.contact_name;

  // Build pipeline name map
  const pipelineNameMap: Record<string, string> = {};
  for (const p of pipelinesRaw ?? []) pipelineNameMap[p.id] = p.name;

  // Build pipeline data for funnel
  const pipelines = (pipelinesRaw ?? []).map((p: { id: string; name: string; stages: unknown }) => {
    const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];

    // Collect all companies in this pipeline
    const contacts: { contact_id: string; stage: string }[] = [];
    for (const company of companiesRaw ?? []) {
      const typed = company as { id: string; pipeline_companies: { pipeline_id: string; stage: string }[] };
      for (const pc of typed.pipeline_companies) {
        if (pc.pipeline_id === p.id) {
          contacts.push({ contact_id: typed.id, stage: pc.stage });
        }
      }
    }

    const stageLog = (stageLogRaw ?? [])
      .filter((sl: { pipeline_id: string }) => sl.pipeline_id === p.id)
      .map((sl: { id: string; stage: string; entered_at: string; moved_by: string | null; source: string | null; note: string | null; entry_number: number }) => ({
        id: sl.id, stage: sl.stage, entered_at: sl.entered_at,
        moved_by: sl.moved_by, source: sl.source, note: sl.note, entry_number: sl.entry_number,
      }));

    return { id: p.id, name: p.name, stages, contacts, stageLog };
  });

  // Build company list for display
  interface CompanyRow {
    company_id: string;
    company_name: string;
    industry: string | null;
    lead_source: string | null;
    enrollments: { pipeline_name: string; stage: string }[];
    deal_value: string | null;
    days_in_stage: number;
    contact_count: number;
    primary_contact_name: string | null;
    primary_contact_role: string | null;
  }

  const companies: CompanyRow[] = (companiesRaw ?? []).map((c) => {
    const typed = c as {
      id: string;
      name: string;
      industry: string | null;
      lead_source: string | null;
      pipeline_companies: { pipeline_id: string; stage: string; deal_value: string | null; stage_entered_at: string }[];
      company_contacts: { contact_id: string; is_primary: boolean; role: string | null }[];
    };

    const enrollments = typed.pipeline_companies.map((pc) => ({
      pipeline_name: pipelineNameMap[pc.pipeline_id] ?? 'Unknown',
      stage: pc.stage,
    }));

    const totalDeal = typed.pipeline_companies.reduce((sum, pc) => {
      if (!pc.deal_value) return sum;
      const num = parseFloat(String(pc.deal_value).replace(/[^0-9.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const maxDays = Math.max(0, ...typed.pipeline_companies.map((pc) =>
      Math.floor((Date.now() - new Date(pc.stage_entered_at).getTime()) / 86400000)
    ));

    const primary = typed.company_contacts.find((cc) => cc.is_primary);

    return {
      company_id: typed.id,
      company_name: typed.name,
      industry: typed.industry,
      lead_source: typed.lead_source,
      enrollments,
      deal_value: totalDeal > 0 ? `$${totalDeal}` : null,
      days_in_stage: maxDays,
      contact_count: typed.company_contacts.length,
      primary_contact_name: primary ? (nameMap[primary.contact_id] ?? null) : null,
      primary_contact_role: primary?.role ?? null,
    };
  });

  // Stats
  const totalValue = companies.reduce((sum, c) => {
    if (!c.deal_value) return sum;
    const num = parseFloat(c.deal_value.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const formattedValue = totalValue >= 1000
    ? `$${(totalValue / 1000).toFixed(0)}k`
    : `$${totalValue}`;

  const activeDeals = companies.length;
  const allDays = companies.map(c => c.days_in_stage);
  const avgDaysInStage = allDays.length > 0 ? Math.round(allDays.reduce((a, b) => a + b, 0) / allDays.length) : 0;

  // "Closing soon" = companies in the last stage of any pipeline
  const lastStages = new Set(
    (pipelinesRaw ?? []).map((p: { stages: unknown }) => {
      const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];
      return stages[stages.length - 1];
    }).filter(Boolean)
  );
  const closingSoon = companies.filter(c => c.enrollments.some(e => lastStages.has(e.stage))).length;

  return (
    <PipelinePageClient
      pipelines={pipelines}
      contacts={companies}
      totalValue={formattedValue}
      activeDeals={activeDeals}
      avgDaysInStage={avgDaysInStage}
      closingSoon={closingSoon}
    />
  );
}
