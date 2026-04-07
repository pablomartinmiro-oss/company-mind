// src/mastra/tools/db-companies.ts
// Tools for querying companies (pipeline_contacts) from Supabase
// Note: pipeline_contacts has columns: contact_id, pipeline_id, stage, deal_value, stage_entered_at
// Names come from calls table (contact_name) and contact_data_points (company_name)

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
        contact_id: z.string(),
        contact_name: z.string().nullable(),
        company_name: z.string().nullable(),
        pipeline_name: z.string().nullable(),
        current_stage: z.string().nullable(),
        deal_value: z.number().nullable(),
        days_in_stage: z.number().nullable(),
      })
    ),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);

    // Fetch pipeline contacts
    const { data: pcRows } = await supabaseAdmin
      .from('pipeline_contacts')
      .select('contact_id, pipeline_id, stage, deal_value, stage_entered_at')
      .eq('tenant_id', tenantId)
      .order('stage_entered_at', { ascending: false })
      .limit(100);

    const rows = pcRows ?? [];

    // Fetch pipeline names
    const pipelineIds = [...new Set(rows.map((r) => r.pipeline_id))];
    const { data: pipelines } = pipelineIds.length > 0
      ? await supabaseAdmin.from('pipelines').select('id, name').in('id', pipelineIds)
      : { data: [] };
    const pipelineNameMap: Record<string, string> = {};
    for (const p of pipelines ?? []) pipelineNameMap[p.id] = p.name;

    // Fetch contact names from calls
    const contactIds = [...new Set(rows.map((r) => r.contact_id))];
    const { data: callNames } = contactIds.length > 0
      ? await supabaseAdmin.from('calls').select('contact_ghl_id, contact_name').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds)
      : { data: [] };
    const nameMap: Record<string, string> = {};
    for (const c of callNames ?? []) nameMap[c.contact_ghl_id] = c.contact_name;

    // Company names from data points
    const { data: companyDPs } = contactIds.length > 0
      ? await supabaseAdmin.from('contact_data_points').select('contact_ghl_id, field_value').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds).eq('field_name', 'company_name')
      : { data: [] };
    const companyMap: Record<string, string> = {};
    for (const dp of companyDPs ?? []) companyMap[dp.contact_ghl_id] = dp.field_value;

    const now = Date.now();
    let results = rows.map((r) => ({
      contact_id: r.contact_id,
      contact_name: nameMap[r.contact_id] ?? null,
      company_name: companyMap[r.contact_id] ?? null,
      pipeline_name: pipelineNameMap[r.pipeline_id] ?? null,
      current_stage: r.stage ?? null,
      deal_value: r.deal_value ? parseFloat(String(r.deal_value).replace(/[^0-9.]/g, '')) : null,
      days_in_stage: r.stage_entered_at ? Math.floor((now - new Date(r.stage_entered_at).getTime()) / 86400000) : null,
    }));

    // Apply filters
    if (input.pipelineName) {
      const q = input.pipelineName.toLowerCase();
      results = results.filter((r) => (r.pipeline_name ?? '').toLowerCase().includes(q));
    }
    if (input.stage) {
      const q = input.stage.toLowerCase();
      results = results.filter((r) => (r.current_stage ?? '').toLowerCase().includes(q));
    }
    if (input.search) {
      const q = input.search.toLowerCase();
      results = results.filter((r) =>
        (r.contact_name ?? '').toLowerCase().includes(q) ||
        (r.company_name ?? '').toLowerCase().includes(q)
      );
    }

    return { companies: results.slice(0, 50), total: results.length };
  },
});

export const getCompanyDetail = createTool({
  id: 'get_company_detail',
  description:
    'Get full details for a specific company/contact including all pipeline memberships, recent calls, recent activity, and research data. Use when the user asks about a specific company or contact.',
  inputSchema: z.object({
    contactId: z.string().describe('The GHL contact ID (contact_id) to look up'),
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

    const [pcRes, callsRes, activityRes, researchRes, stageLogRes] =
      await Promise.all([
        supabaseAdmin
          .from('pipeline_contacts')
          .select('pipeline_id, stage, deal_value, stage_entered_at')
          .eq('tenant_id', tenantId)
          .eq('contact_id', input.contactId),
        supabaseAdmin
          .from('calls')
          .select('id, contact_name, call_type, outcome, duration_seconds, score, coaching, called_at')
          .eq('tenant_id', tenantId)
          .eq('contact_ghl_id', input.contactId)
          .order('called_at', { ascending: false })
          .limit(10),
        supabaseAdmin
          .from('activity_feed')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('contact_id', input.contactId)
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
          .eq('contact_id', input.contactId)
          .order('entered_at', { ascending: false })
          .limit(20),
      ]);

    // Get pipeline names
    const pipelineIds = [...new Set((pcRes.data ?? []).map((r) => r.pipeline_id))];
    const { data: pipelines } = pipelineIds.length > 0
      ? await supabaseAdmin.from('pipelines').select('id, name').in('id', pipelineIds)
      : { data: [] };
    const pipelineNameMap: Record<string, string> = {};
    for (const p of pipelines ?? []) pipelineNameMap[p.id] = p.name;

    return {
      pipelines: (pcRes.data ?? []).map((r) => ({
        pipeline_name: pipelineNameMap[r.pipeline_id] ?? 'Unknown',
        stage: r.stage,
        deal_value: r.deal_value,
        stage_entered_at: r.stage_entered_at,
      })),
      recentCalls: (callsRes.data ?? []).map((c) => ({
        ...c,
        overall_score: c.score?.overall ?? null,
        summary: c.coaching?.summary ?? null,
        called_at: c.called_at ? new Date(c.called_at).toISOString() : null,
      })),
      recentActivity: activityRes.data ?? [],
      research: researchRes.data ?? [],
      stageHistory: stageLogRes.data ?? [],
    };
  },
});
