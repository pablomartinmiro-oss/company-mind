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

    let query = supabaseAdmin
      .from('pipeline_contacts')
      .select('pipeline_name, current_stage, deal_value')
      .eq('tenant_id', tenantId);

    if (input.pipelineName) {
      query = query.ilike('pipeline_name', `%${input.pipelineName}%`);
    }

    const { data } = await query;
    const rows = data || [];

    // Group by pipeline, then by stage
    const pipelineMap = new Map<
      string,
      Map<string, { count: number; totalValue: number }>
    >();

    for (const row of rows) {
      const pName = row.pipeline_name || 'Unknown';
      const stage = row.current_stage || 'Unknown';
      const value = row.deal_value || 0;

      if (!pipelineMap.has(pName)) {
        pipelineMap.set(pName, new Map());
      }
      const stageMap = pipelineMap.get(pName)!;
      const existing = stageMap.get(stage) || { count: 0, totalValue: 0 };
      stageMap.set(stage, {
        count: existing.count + 1,
        totalValue: existing.totalValue + value,
      });
    }

    const pipelines = Array.from(pipelineMap.entries()).map(
      ([pipelineName, stageMap]) => {
        const stages = Array.from(stageMap.entries()).map(
          ([stage, { count, totalValue }]) => ({
            stage,
            count,
            total_deal_value: totalValue,
          })
        );
        return {
          pipeline_name: pipelineName,
          stages,
          total_contacts: stages.reduce((s, st) => s + st.count, 0),
          total_deal_value: stages.reduce(
            (s, st) => s + st.total_deal_value,
            0
          ),
        };
      }
    );

    return { pipelines };
  },
});
