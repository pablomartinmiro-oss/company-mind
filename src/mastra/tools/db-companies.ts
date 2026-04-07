// src/mastra/tools/db-companies.ts
// Tools for querying companies (pipeline_contacts) from Supabase

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { getTenantId } from './get-tenant-id';

export const getCompanies = createTool({
  id: 'get_companies',
  description:
    'Get a list of companies in the pipeline. Can filter by pipeline name, stage, or search by company/contact name. Use when the user asks about companies, deals, or pipeline status.',
  inputSchema: z.object({
    pipelineName: z.string().optional().describe('Filter by pipeline name (partial match)'),
    stage: z.string().optional().describe('Filter by current stage name (partial match)'),
    search: z.string().optional().describe('Search by contact name or company name'),
  }),
  outputSchema: z.object({
    companies: z.array(
      z.object({
        contact_ghl_id: z.string(),
        contact_name: z.string().nullable(),
        company_name: z.string().nullable(),
        pipeline_name: z.string().nullable(),
        current_stage: z.string().nullable(),
        deal_value: z.number().nullable(),
        stage_entered_at: z.string().nullable(),
        days_in_stage: z.number().nullable(),
      })
    ),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);

    let query = supabaseAdmin
      .from('pipeline_contacts')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('stage_entered_at', { ascending: false })
      .limit(50);

    if (input.pipelineName) {
      query = query.ilike('pipeline_name', `%${input.pipelineName}%`);
    }
    if (input.stage) {
      query = query.ilike('current_stage', `%${input.stage}%`);
    }
    if (input.search) {
      query = query.or(
        `contact_name.ilike.%${input.search}%,company_name.ilike.%${input.search}%`
      );
    }

    const { data, count } = await query;
    const now = Date.now();

    return {
      companies: (data || []).map((c) => ({
        contact_ghl_id: c.contact_ghl_id,
        contact_name: c.contact_name ?? null,
        company_name: c.company_name ?? null,
        pipeline_name: c.pipeline_name ?? null,
        current_stage: c.current_stage ?? null,
        deal_value: c.deal_value ?? null,
        stage_entered_at: c.stage_entered_at
          ? new Date(c.stage_entered_at).toISOString()
          : null,
        days_in_stage: c.stage_entered_at
          ? Math.floor(
              (now - new Date(c.stage_entered_at).getTime()) / 86400000
            )
          : null,
      })),
      total: count || 0,
    };
  },
});

export const getCompanyDetail = createTool({
  id: 'get_company_detail',
  description:
    'Get full details for a specific company/contact including all pipeline memberships, recent calls, recent activity, and research data. Use when the user asks about a specific company or contact.',
  inputSchema: z.object({
    contactId: z
      .string()
      .describe('The GHL contact ID (contact_ghl_id) to look up'),
  }),
  outputSchema: z.object({
    pipelines: z.array(z.record(z.unknown())),
    recentCalls: z.array(z.record(z.unknown())),
    recentActivity: z.array(z.record(z.unknown())),
    research: z.array(z.record(z.unknown())),
    stageHistory: z.array(z.record(z.unknown())),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);

    const [pipelinesRes, callsRes, activityRes, researchRes, stageLogRes] =
      await Promise.all([
        supabaseAdmin
          .from('pipeline_contacts')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('contact_ghl_id', input.contactId),
        supabaseAdmin
          .from('calls')
          .select(
            'id, contact_name, call_type, outcome, duration_seconds, score, coaching, called_at'
          )
          .eq('tenant_id', tenantId)
          .eq('contact_ghl_id', input.contactId)
          .order('called_at', { ascending: false })
          .limit(10),
        supabaseAdmin
          .from('activity_feed')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('contact_ghl_id', input.contactId)
          .order('created_at', { ascending: false })
          .limit(15),
        supabaseAdmin
          .from('contact_data_points')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('contact_ghl_id', input.contactId),
        supabaseAdmin
          .from('stage_log')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('contact_ghl_id', input.contactId)
          .order('moved_at', { ascending: false })
          .limit(20),
      ]);

    return {
      pipelines: pipelinesRes.data || [],
      recentCalls: (callsRes.data || []).map((c) => ({
        ...c,
        overall_score: c.score?.overall ?? null,
        summary: c.coaching?.summary ?? null,
        called_at: c.called_at
          ? new Date(c.called_at).toISOString()
          : null,
      })),
      recentActivity: activityRes.data || [],
      research: researchRes.data || [],
      stageHistory: stageLogRes.data || [],
    };
  },
});
