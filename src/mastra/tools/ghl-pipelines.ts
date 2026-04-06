// src/mastra/tools/ghl-pipelines.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getTenantId } from './get-tenant-id';

export const listPipelines = createTool({
  id: 'list_pipelines',
  description: 'List all sales pipelines and their stages. Use when the user asks about pipelines, deals, or pipeline stages.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    pipelines: z.array(z.object({
      id: z.string(),
      name: z.string(),
      stages: z.array(z.object({ id: z.string(), name: z.string() })),
    })),
  }),
  execute: async (_input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId);
    const result = await ghl.listPipelines();
    return {
      pipelines: (result.pipelines || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        stages: (p.stages as Array<Record<string, unknown>> || []).map(s => ({ id: s.id as string, name: s.name as string })),
      })),
    };
  },
});

export const searchOpportunities = createTool({
  id: 'search_opportunities',
  description: 'Search for opportunities (deals) in a pipeline. Can filter by pipeline ID and/or stage ID. Use when the user asks to see deals, pipeline status, or opportunities.',
  inputSchema: z.object({
    pipelineId: z.string().optional().describe('Filter by pipeline ID'),
    stageId: z.string().optional().describe('Filter by stage ID'),
    query: z.string().optional().describe('Search by contact name or opportunity name'),
  }),
  outputSchema: z.object({
    opportunities: z.array(z.record(z.unknown())),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId);
    const result = await ghl.searchOpportunities(input.pipelineId, input.stageId);
    return {
      opportunities: result.opportunities || [],
      total: result.meta?.total || result.opportunities?.length || 0,
    };
  },
});

export const moveOpportunity = createTool({
  id: 'move_opportunity',
  description: 'Move an opportunity to a different pipeline stage. Use when the user says "move X to Y stage" or "advance the deal."',
  inputSchema: z.object({
    opportunityId: z.string().describe('The opportunity ID to move'),
    stageId: z.string().describe('The target stage ID'),
    pipelineId: z.string().optional().describe('Pipeline ID if changing pipelines'),
  }),
  outputSchema: z.object({ opportunity: z.record(z.unknown()), message: z.string() }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId);
    const result = await ghl.updateOpportunity(input.opportunityId, {
      stageId: input.stageId,
      ...(input.pipelineId && { pipelineId: input.pipelineId }),
    });
    return { opportunity: result.opportunity || result, message: `Moved opportunity to new stage.` };
  },
});

export const createOpportunity = createTool({
  id: 'create_opportunity',
  description: 'Create a new opportunity (deal) in a pipeline. Requires a pipeline ID, stage ID, contact ID, and a name.',
  inputSchema: z.object({
    pipelineId: z.string().describe('Pipeline to create in'),
    stageId: z.string().describe('Initial stage'),
    contactId: z.string().describe('GHL contact ID to associate'),
    name: z.string().describe('Opportunity name'),
    monetaryValue: z.number().optional().describe('Deal value in dollars'),
  }),
  outputSchema: z.object({ opportunity: z.record(z.unknown()), message: z.string() }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId);
    const result = await ghl.createOpportunity({
      pipelineId: input.pipelineId,
      pipelineStageId: input.stageId,
      contactId: input.contactId,
      name: input.name,
      monetaryValue: input.monetaryValue,
    });
    return { opportunity: result.opportunity || result, message: `Created opportunity: ${input.name}` };
  },
});
