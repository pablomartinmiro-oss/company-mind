// src/mastra/tools/db-pipelines.ts
// Tool for querying pipeline summary data from Supabase

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { getTenantId } from './get-tenant-id';

export const getPipelineSummary = createTool({
  id: 'get_pipeline_summary',
  description:
    'Get a summary of pipeline stages with contact counts and total deal values. Use when the user asks about pipeline health, funnel metrics, or stage distribution.',
  inputSchema: z.object({
    pipelineName: z
      .string()
      .optional()
      .describe('Filter to a specific pipeline name (partial match). Omit to see all pipelines.'),
  }),
  outputSchema: z.object({
    pipelines: z.array(
      z.object({
        pipeline_name: z.string(),
        stages: z.array(
          z.object({
            stage: z.string(),
            count: z.number(),
            total_deal_value: z.number(),
          })
        ),
        total_contacts: z.number(),
        total_deal_value: z.number(),
      })
    ),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);

    // Fetch pipeline contacts (actual columns: contact_id, pipeline_id, stage, deal_value)
    const { data: pcRows } = await supabaseAdmin
      .from('pipeline_companies')
      .select('pipeline_id, stage, deal_value')
      .eq('tenant_id', tenantId);

    const rows = pcRows ?? [];

    // Fetch pipeline names
    const pipelineIds = [...new Set(rows.map((r) => r.pipeline_id))];
    const { data: pipelines } = pipelineIds.length > 0
      ? await supabaseAdmin.from('pipelines').select('id, name').in('id', pipelineIds)
      : { data: [] };
    const pipelineNameMap: Record<string, string> = {};
    for (const p of pipelines ?? []) pipelineNameMap[p.id] = p.name;

    // Group by pipeline_id, then by stage
    const pipelineMap = new Map<string, Map<string, { count: number; totalValue: number }>>();

    for (const row of rows) {
      const pId = row.pipeline_id;
      const stage = row.stage || 'Unknown';
      const value = row.deal_value ? parseFloat(String(row.deal_value).replace(/[^0-9.]/g, '')) : 0;

      if (!pipelineMap.has(pId)) pipelineMap.set(pId, new Map());
      const stageMap = pipelineMap.get(pId)!;
      const existing = stageMap.get(stage) || { count: 0, totalValue: 0 };
      stageMap.set(stage, { count: existing.count + 1, totalValue: existing.totalValue + (isNaN(value) ? 0 : value) });
    }

    let result = Array.from(pipelineMap.entries()).map(([pId, stageMap]) => {
      const stages = Array.from(stageMap.entries()).map(([stage, { count, totalValue }]) => ({
        stage,
        count,
        total_deal_value: totalValue,
      }));
      return {
        pipeline_name: pipelineNameMap[pId] ?? 'Unknown',
        stages,
        total_contacts: stages.reduce((s, st) => s + st.count, 0),
        total_deal_value: stages.reduce((s, st) => s + st.total_deal_value, 0),
      };
    });

    if (input.pipelineName) {
      const q = input.pipelineName.toLowerCase();
      result = result.filter((p) => p.pipeline_name.toLowerCase().includes(q));
    }

    return { pipelines: result };
  },
});
