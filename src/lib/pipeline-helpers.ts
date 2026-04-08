import { supabaseAdmin } from '@/lib/supabase';

/**
 * Returns the set of stage names (up to and including currentStage)
 * that have no stage_log entry for the given company + pipeline.
 */
export async function getStagesMissingLogs(
  tenantId: string,
  companyId: string,
  pipelineId: string,
  currentStage: string,
  allStages: string[],
): Promise<Set<string>> {
  const currentIdx = allStages.indexOf(currentStage);
  if (currentIdx < 0) return new Set();
  const relevantStages = allStages.slice(0, currentIdx + 1);

  const { data } = await supabaseAdmin
    .from('stage_log')
    .select('stage')
    .eq('tenant_id', tenantId)
    .eq('company_id', companyId)
    .eq('pipeline_id', pipelineId);

  const loggedStages = new Set((data ?? []).map((r: { stage: string }) => r.stage));
  return new Set(relevantStages.filter(s => !loggedStages.has(s)));
}
