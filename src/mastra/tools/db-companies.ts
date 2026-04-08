// src/mastra/tools/db-companies.ts
// Tools for querying companies from Supabase
// Reads from: companies, company_contacts, pipeline_companies, pipelines, calls, tasks, research, activity_feed

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { getTenantId } from './get-tenant-id';

export const getCompanies = createTool({
  id: 'get_companies',
  description:
    'Get a list of companies with their contacts, pipeline stages, and MRR. Can filter by industry, stage, pipeline name, or search by name. Use when the user asks about companies, deals, or pipeline status.',
  inputSchema: z.object({
    pipelineName: z.string().optional().describe('Filter by pipeline name (partial match)'),
    stage: z.string().optional().describe('Filter by current stage name (partial match)'),
    industry: z.string().optional().describe('Filter by industry (partial match)'),
    search: z.string().optional().describe('Search by company name'),
    limit: z.number().optional().describe('Max results (default 30)'),
  }),
  outputSchema: z.object({
    companies: z.array(z.object({
      id: z.string(),
      name: z.string(),
      industry: z.string().nullable(),
      location: z.string().nullable(),
      lead_source: z.string().nullable(),
      mrr: z.number().nullable(),
      setup_fee: z.number().nullable(),
      primary_contact: z.object({
        name: z.string().nullable(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        role: z.string().nullable(),
      }).nullable(),
      pipeline_stages: z.array(z.object({
        pipeline_name: z.string(),
        stage: z.string(),
        days_in_stage: z.number().nullable(),
      })),
    })),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);
    const maxResults = input.limit ?? 30;

    // Build query
    let query = supabaseAdmin
      .from('companies')
      .select(`
        id, name, industry, location, lead_source, mrr, setup_fee,
        company_contacts ( contact_id, contact_name, contact_email, contact_phone, role, is_primary ),
        pipeline_companies ( pipeline_id, stage, stage_entered_at )
      `)
      .eq('tenant_id', tenantId)
      .order('name');

    if (input.search) {
      query = query.ilike('name', `%${input.search}%`);
    }
    if (input.industry) {
      query = query.ilike('industry', `%${input.industry}%`);
    }

    const { data: companiesRaw } = await query.limit(maxResults);

    // Fetch pipeline name map
    const { data: pipelinesRaw } = await supabaseAdmin
      .from('pipelines')
      .select('id, name')
      .eq('tenant_id', tenantId);
    const pipelineNameMap: Record<string, string> = {};
    for (const p of pipelinesRaw ?? []) pipelineNameMap[p.id] = p.name;

    const now = Date.now();
    let results = (companiesRaw ?? []).map((c: Record<string, unknown>) => {
      const contacts = (c.company_contacts as Array<Record<string, unknown>>) ?? [];
      const primary = contacts.find((cc) => cc.is_primary) ?? contacts[0] ?? null;
      const pcs = (c.pipeline_companies as Array<Record<string, unknown>>) ?? [];

      return {
        id: c.id as string,
        name: c.name as string,
        industry: (c.industry as string) ?? null,
        location: (c.location as string) ?? null,
        lead_source: (c.lead_source as string) ?? null,
        mrr: (c.mrr as number) ?? null,
        setup_fee: (c.setup_fee as number) ?? null,
        primary_contact: primary ? {
          name: (primary.contact_name as string) ?? null,
          email: (primary.contact_email as string) ?? null,
          phone: (primary.contact_phone as string) ?? null,
          role: (primary.role as string) ?? null,
        } : null,
        pipeline_stages: pcs.map((pc) => ({
          pipeline_name: pipelineNameMap[pc.pipeline_id as string] ?? 'Unknown',
          stage: pc.stage as string,
          days_in_stage: pc.stage_entered_at
            ? Math.floor((now - new Date(pc.stage_entered_at as string).getTime()) / 86400000)
            : null,
        })),
      };
    });

    // Apply pipeline/stage filters (post-query since they're on joined data)
    if (input.pipelineName) {
      const q = input.pipelineName.toLowerCase();
      results = results.filter((r) => r.pipeline_stages.some((ps) => ps.pipeline_name.toLowerCase().includes(q)));
    }
    if (input.stage) {
      const q = input.stage.toLowerCase();
      results = results.filter((r) => r.pipeline_stages.some((ps) => ps.stage.toLowerCase().includes(q)));
    }

    return { companies: results, total: results.length };
  },
});

export const getCompanyDetail = createTool({
  id: 'get_company_detail',
  description:
    'Get full details for a specific company including contacts, pipeline stages, recent calls, tasks, activity, and research data. Use when the user asks about a specific company by name or ID.',
  inputSchema: z.object({
    companyName: z.string().optional().describe('Company name to search (partial match). Use this OR companyId.'),
    companyId: z.string().optional().describe('Exact company UUID. Use this OR companyName.'),
  }),
  outputSchema: z.object({
    company: z.object({
      id: z.string(),
      name: z.string(),
      industry: z.string().nullable(),
      location: z.string().nullable(),
      website: z.string().nullable(),
      mrr: z.number().nullable(),
      setup_fee: z.number().nullable(),
    }).nullable(),
    contacts: z.array(z.record(z.unknown())),
    pipelines: z.array(z.record(z.unknown())),
    recentCalls: z.array(z.record(z.unknown())),
    openTasks: z.array(z.record(z.unknown())),
    recentActivity: z.array(z.record(z.unknown())),
    research: z.record(z.unknown()),
    stageHistory: z.array(z.record(z.unknown())),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);

    // Find company by name or id
    let companyQuery = supabaseAdmin
      .from('companies')
      .select('*')
      .eq('tenant_id', tenantId);

    if (input.companyId) {
      companyQuery = companyQuery.eq('id', input.companyId);
    } else if (input.companyName) {
      companyQuery = companyQuery.ilike('name', `%${input.companyName}%`);
    } else {
      return { company: null, contacts: [], pipelines: [], recentCalls: [], openTasks: [], recentActivity: [], research: {}, stageHistory: [] };
    }

    const { data: companies } = await companyQuery.limit(1);
    const company = companies?.[0] ?? null;
    if (!company) {
      return { company: null, contacts: [], pipelines: [], recentCalls: [], openTasks: [], recentActivity: [], research: {}, stageHistory: [] };
    }

    // Fetch all related data in parallel
    const [contactsRes, pcRes, callsRes, tasksRes, activityRes, researchRes, stageLogRes] = await Promise.all([
      supabaseAdmin
        .from('company_contacts')
        .select('contact_id, contact_name, contact_email, contact_phone, role, is_primary')
        .eq('tenant_id', tenantId)
        .eq('company_id', company.id),
      supabaseAdmin
        .from('pipeline_companies')
        .select('pipeline_id, stage, deal_value, stage_entered_at')
        .eq('tenant_id', tenantId)
        .eq('company_id', company.id),
      // Calls: find via contacts
      supabaseAdmin
        .from('company_contacts')
        .select('contact_id')
        .eq('tenant_id', tenantId)
        .eq('company_id', company.id)
        .then(async ({ data: contacts }) => {
          const ids = (contacts ?? []).map((c: { contact_id: string }) => c.contact_id);
          if (ids.length === 0) return { data: [] };
          return supabaseAdmin
            .from('calls')
            .select('id, contact_name, call_type, outcome, duration_seconds, score, call_summary, called_at')
            .eq('tenant_id', tenantId)
            .in('contact_ghl_id', ids)
            .order('called_at', { ascending: false })
            .limit(5);
        }),
      // Tasks
      supabaseAdmin
        .from('company_contacts')
        .select('contact_id')
        .eq('tenant_id', tenantId)
        .eq('company_id', company.id)
        .then(async ({ data: contacts }) => {
          const ids = (contacts ?? []).map((c: { contact_id: string }) => c.contact_id);
          if (ids.length === 0) return { data: [] };
          return supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('tenant_id', tenantId)
            .in('contact_id', ids)
            .eq('completed', false)
            .order('due_date', { ascending: true });
        }),
      // Activity
      supabaseAdmin
        .from('company_contacts')
        .select('contact_id')
        .eq('tenant_id', tenantId)
        .eq('company_id', company.id)
        .then(async ({ data: contacts }) => {
          const ids = (contacts ?? []).map((c: { contact_id: string }) => c.contact_id);
          if (ids.length === 0) return { data: [] };
          return supabaseAdmin
            .from('activity_feed')
            .select('*')
            .eq('tenant_id', tenantId)
            .in('contact_id', ids)
            .order('created_at', { ascending: false })
            .limit(10);
        }),
      // Research (company scope)
      supabaseAdmin
        .from('research')
        .select('section, field_name, field_value, source')
        .eq('tenant_id', tenantId)
        .eq('company_id', company.id)
        .eq('scope', 'company'),
      // Stage log
      supabaseAdmin
        .from('stage_log')
        .select('stage, pipeline_id, entered_at, moved_by, note')
        .eq('tenant_id', tenantId)
        .eq('company_id', company.id)
        .order('entered_at', { ascending: false })
        .limit(20),
    ]);

    // Pipeline name map
    const pipelineIds = [...new Set((pcRes.data ?? []).map((r: { pipeline_id: string }) => r.pipeline_id))];
    const { data: pipelines } = pipelineIds.length > 0
      ? await supabaseAdmin.from('pipelines').select('id, name').in('id', pipelineIds)
      : { data: [] };
    const pipelineNameMap: Record<string, string> = {};
    for (const p of pipelines ?? []) pipelineNameMap[p.id] = p.name;

    // Group research by section
    const researchGrouped: Record<string, Record<string, string>> = {};
    for (const r of researchRes.data ?? []) {
      const typed = r as { section: string; field_name: string; field_value: string };
      if (!researchGrouped[typed.section]) researchGrouped[typed.section] = {};
      researchGrouped[typed.section][typed.field_name] = typed.field_value;
    }

    return {
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry ?? null,
        location: company.location ?? null,
        website: company.website ?? null,
        mrr: company.mrr ?? null,
        setup_fee: company.setup_fee ?? null,
      },
      contacts: (contactsRes.data ?? []).map((c: Record<string, unknown>) => ({
        name: c.contact_name,
        email: c.contact_email,
        phone: c.contact_phone,
        role: c.role,
        is_primary: c.is_primary,
      })),
      pipelines: (pcRes.data ?? []).map((r: Record<string, unknown>) => ({
        pipeline_name: pipelineNameMap[r.pipeline_id as string] ?? 'Unknown',
        stage: r.stage,
        deal_value: r.deal_value,
        stage_entered_at: r.stage_entered_at,
      })),
      recentCalls: (callsRes.data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id,
        contact_name: c.contact_name,
        call_type: c.call_type,
        outcome: c.outcome,
        overall_score: (c.score as { overall?: number } | null)?.overall ?? null,
        summary: c.call_summary,
        called_at: c.called_at,
      })),
      openTasks: (tasksRes.data ?? []).map((t: Record<string, unknown>) => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        assigned_to: t.assigned_to,
        task_type: t.task_type,
      })),
      recentActivity: activityRes.data ?? [],
      research: researchGrouped,
      stageHistory: (stageLogRes.data ?? []).map((s: Record<string, unknown>) => ({
        stage: s.stage,
        pipeline_name: pipelineNameMap[s.pipeline_id as string] ?? 'Unknown',
        entered_at: s.entered_at,
        moved_by: s.moved_by,
        note: s.note,
      })),
    };
  },
});
