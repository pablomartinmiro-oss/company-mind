import { supabaseAdmin } from '@/lib/supabase';
import { PipelinePageClient } from '@/components/pipeline/pipeline-page-client';
import { getTenantForUser } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const { tenantId } = await getTenantForUser();

  // Fetch pipelines
  const { data: pipelinesRaw } = await supabaseAdmin
    .from('pipelines')
    .select('id, name, stages')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  // Fetch pipeline contacts
  const { data: pipelineContacts } = await supabaseAdmin
    .from('pipeline_contacts')
    .select('id, contact_id, pipeline_id, stage, deal_value, stage_entered_at')
    .eq('tenant_id', tenantId);

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

  // Fetch company names + contact names
  const contactIds = [...new Set((pipelineContacts ?? []).map((pc: { contact_id: string }) => pc.contact_id))];
  const { data: dataPoints } = contactIds.length > 0
    ? await supabaseAdmin
        .from('contact_data_points')
        .select('contact_ghl_id, field_name, field_value')
        .eq('tenant_id', tenantId)
        .in('contact_ghl_id', contactIds)
        .eq('field_name', 'company_name')
    : { data: [] };

  // Fetch contact names from calls
  const { data: calls } = await supabaseAdmin
    .from('calls')
    .select('contact_ghl_id, contact_name')
    .eq('tenant_id', tenantId);

  // Build lookup maps
  const nameMap: Record<string, string> = {};
  for (const call of calls ?? []) {
    nameMap[call.contact_ghl_id] = call.contact_name;
  }

  const companyMap: Record<string, string> = {};
  for (const dp of dataPoints ?? []) {
    companyMap[dp.contact_ghl_id] = dp.field_value;
  }

  // Build pipeline lookup
  const pipelineMap: Record<string, { name: string; stages: string[] }> = {};
  for (const p of pipelinesRaw ?? []) {
    const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];
    pipelineMap[p.id] = { name: p.name, stages };
  }

  // Build pipeline data for funnel component
  const pipelines = (pipelinesRaw ?? []).map((p: { id: string; name: string; stages: unknown }) => {
    const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];
    const contacts = (pipelineContacts ?? [])
      .filter((pc: { pipeline_id: string }) => pc.pipeline_id === p.id)
      .map((pc: { contact_id: string; stage: string }) => ({
        contact_id: pc.contact_id,
        stage: pc.stage,
      }));
    const stageLog = (stageLogRaw ?? [])
      .filter((sl: { pipeline_id: string }) => sl.pipeline_id === p.id)
      .map((sl: { id: string; stage: string; entered_at: string; moved_by: string | null; source: string | null; note: string | null; entry_number: number }) => ({
        id: sl.id,
        stage: sl.stage,
        entered_at: sl.entered_at,
        moved_by: sl.moved_by,
        source: sl.source,
        note: sl.note,
        entry_number: sl.entry_number,
      }));

    return { id: p.id, name: p.name, stages, contacts, stageLog };
  });

  // Build company list — group all pipeline enrollments per contact
  const contactEnrollments: Record<string, { pipeline_name: string; stage: string; deal_value: string | null; days_in_stage: number }[]> = {};
  for (const pc of pipelineContacts ?? []) {
    const cid = (pc as { contact_id: string }).contact_id;
    const pid = (pc as { pipeline_id: string }).pipeline_id;
    const stage = (pc as { stage: string }).stage;
    const dealValue = (pc as { deal_value: string | null }).deal_value;
    const stageEnteredAt = (pc as { stage_entered_at: string }).stage_entered_at;
    const pipelineName = pipelineMap[pid]?.name ?? 'Unknown';
    const daysInStage = Math.max(0, Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / 86400000));

    if (!contactEnrollments[cid]) contactEnrollments[cid] = [];
    contactEnrollments[cid].push({ pipeline_name: pipelineName, stage, deal_value: dealValue, days_in_stage: daysInStage });
  }

  // Deduplicate contacts (one row per contact_id)
  const seenContacts = new Set<string>();
  const contacts: {
    contact_id: string;
    contact_name: string;
    company_name: string | null;
    enrollments: { pipeline_name: string; stage: string }[];
    deal_value: string | null;
    days_in_stage: number;
  }[] = [];

  for (const pc of pipelineContacts ?? []) {
    const cid = (pc as { contact_id: string }).contact_id;
    if (seenContacts.has(cid)) continue;
    seenContacts.add(cid);

    const enrollments = contactEnrollments[cid] ?? [];
    const maxDays = Math.max(0, ...enrollments.map(e => e.days_in_stage));
    const totalDeal = enrollments.reduce((sum, e) => {
      if (!e.deal_value) return sum;
      const num = parseFloat(e.deal_value.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    contacts.push({
      contact_id: cid,
      contact_name: nameMap[cid] ?? cid,
      company_name: companyMap[cid] ?? null,
      enrollments: enrollments.map(e => ({ pipeline_name: e.pipeline_name, stage: e.stage })),
      deal_value: totalDeal > 0 ? `$${totalDeal}` : null,
      days_in_stage: maxDays,
    });
  }

  // Total pipeline value
  const totalValue = (pipelineContacts ?? []).reduce((sum: number, pc: { deal_value: string | null }) => {
    if (!pc.deal_value) return sum;
    const num = parseFloat(pc.deal_value.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const formattedValue = totalValue >= 1000
    ? `$${(totalValue / 1000).toFixed(0)}k`
    : `$${totalValue}`;

  // Compute stats for hero row
  const activeDeals = contacts.length;
  const allDays = contacts.map(c => c.days_in_stage);
  const avgDaysInStage = allDays.length > 0 ? Math.round(allDays.reduce((a, b) => a + b, 0) / allDays.length) : 0;

  // "Closing soon" = contacts in the last stage of any pipeline
  const lastStages = new Set(
    (pipelinesRaw ?? []).map((p: { stages: unknown }) => {
      const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];
      return stages[stages.length - 1];
    }).filter(Boolean)
  );
  const closingSoon = contacts.filter(c => c.enrollments.some(e => lastStages.has(e.stage))).length;

  return (
    <PipelinePageClient
      pipelines={pipelines}
      contacts={contacts}
      totalValue={formattedValue}
      activeDeals={activeDeals}
      avgDaysInStage={avgDaysInStage}
      closingSoon={closingSoon}
    />
  );
}
