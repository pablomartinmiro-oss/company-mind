import { supabaseAdmin } from '@/lib/supabase';
import { PipelinePageClient } from '@/components/pipeline/pipeline-page-client';

export const dynamic = 'force-dynamic';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export default async function PipelinePage() {
  // Fetch pipelines
  const { data: pipelinesRaw } = await supabaseAdmin
    .from('pipelines')
    .select('id, name, stages')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: true });

  // Fetch pipeline contacts
  const { data: pipelineContacts } = await supabaseAdmin
    .from('pipeline_contacts')
    .select('id, contact_id, pipeline_id, stage, deal_value, stage_entered_at')
    .eq('tenant_id', TENANT_ID);

  // Fetch stage log
  const pipelineIds = (pipelinesRaw ?? []).map((p: { id: string }) => p.id);
  const { data: stageLogRaw } = pipelineIds.length > 0
    ? await supabaseAdmin
        .from('stage_log')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .in('pipeline_id', pipelineIds)
        .order('entered_at', { ascending: false })
    : { data: [] };

  // Fetch calls for scores
  const { data: calls } = await supabaseAdmin
    .from('calls')
    .select('contact_ghl_id, contact_name, score')
    .eq('tenant_id', TENANT_ID);

  // Fetch company names
  const contactIds = [...new Set((pipelineContacts ?? []).map((pc: { contact_id: string }) => pc.contact_id))];
  const { data: dataPoints } = contactIds.length > 0
    ? await supabaseAdmin
        .from('contact_data_points')
        .select('contact_ghl_id, field_name, field_value')
        .eq('tenant_id', TENANT_ID)
        .in('contact_ghl_id', contactIds)
        .eq('field_name', 'company_name')
    : { data: [] };

  // Build lookup maps
  const callMap: Record<string, { name: string; score: number | null }> = {};
  for (const call of calls ?? []) {
    const score = typeof call.score === 'object' && call.score !== null
      ? (call.score as { overall?: number }).overall ?? null
      : null;
    callMap[call.contact_ghl_id] = { name: call.contact_name, score };
  }

  const companyMap: Record<string, string> = {};
  for (const dp of dataPoints ?? []) {
    companyMap[dp.contact_ghl_id] = dp.field_value;
  }

  // Build pipeline data for client
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

  // Build contact list
  const contacts = (pipelineContacts ?? []).map((pc: { contact_id: string; stage: string; deal_value: string | null; stage_entered_at: string }) => {
    const callData = callMap[pc.contact_id];
    const daysInStage = Math.floor((Date.now() - new Date(pc.stage_entered_at).getTime()) / 86400000);

    return {
      contact_id: pc.contact_id,
      contact_name: callData?.name ?? pc.contact_id,
      company_name: companyMap[pc.contact_id] ?? null,
      stage: pc.stage,
      score: callData?.score ?? null,
      deal_value: pc.deal_value,
      days_in_stage: Math.max(0, daysInStage),
    };
  });

  // Total pipeline value
  const totalValue = (pipelineContacts ?? []).reduce((sum: number, pc: { deal_value: string | null }) => {
    if (!pc.deal_value) return sum;
    const num = parseFloat(pc.deal_value.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const formattedValue = totalValue >= 1000
    ? `$${(totalValue / 1000).toFixed(0)}k`
    : `$${totalValue}`;

  return (
    <PipelinePageClient
      pipelines={pipelines}
      contacts={contacts}
      totalValue={formattedValue}
    />
  );
}
