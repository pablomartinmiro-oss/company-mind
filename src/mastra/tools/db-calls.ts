// src/mastra/tools/db-calls.ts
// Tools that let the agent query the calls database
// Without these, the agent can't answer "show me my calls" or "what was Sarah's call score?"

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { getTenantId } from './get-tenant-id';

export const searchCalls = createTool({
  id: 'search_calls',
  description: 'Search recent calls in the system. Can filter by contact name, status, source, date range, or call type. Use when the user asks about calls, recent activity, or wants to see call history.',
  inputSchema: z.object({
    contactName: z.string().optional().describe('Filter by contact name (partial match)'),
    contactGhlId: z.string().optional().describe('Filter by exact GHL contact ID'),
    status: z.enum(['pending', 'transcribing', 'analyzing', 'complete', 'error']).optional(),
    source: z.enum(['ghl', 'zoom', 'google_meet', 'manual']).optional(),
    callType: z.string().optional().describe('Filter by call type (discovery, demo, etc.)'),
    rep: z.string().optional().describe('Filter by rep name or email (partial match)'),
    daysBack: z.number().optional().default(30).describe('How many days back to search'),
    limit: z.number().optional().default(20),
  }),
  outputSchema: z.object({
    calls: z.array(z.object({
      id: z.string(),
      contact_name: z.string().nullable(),
      contact_ghl_id: z.string().nullable(),
      source: z.string(),
      status: z.string(),
      call_type: z.string().nullable(),
      direction: z.string().nullable(),
      duration_seconds: z.number().nullable(),
      overall_score: z.number().nullable(),
      called_at: z.string().nullable(),
    })),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    let query = supabaseAdmin
      .from('calls')
      .select('id, contact_name, contact_ghl_id, source, status, call_type, direction, duration_seconds, score, called_at, rep_name, rep_email', { count: 'exact' })
      .eq('tenant_id', resourceId)
      .order('called_at', { ascending: false })
      .limit(input.limit || 20);

    if (input.contactName) {
      query = query.ilike('contact_name', `%${input.contactName}%`);
    }
    if (input.contactGhlId) {
      query = query.eq('contact_ghl_id', input.contactGhlId);
    }
    if (input.status) {
      query = query.eq('status', input.status);
    }
    if (input.source) {
      query = query.eq('source', input.source);
    }
    if (input.callType) {
      query = query.eq('call_type', input.callType);
    }
    if (input.rep) {
      query = query.or(`rep_name.ilike.%${input.rep}%,rep_email.ilike.%${input.rep}%`);
    }
    if (input.daysBack) {
      const since = new Date(Date.now() - input.daysBack * 86400000).toISOString();
      query = query.gte('called_at', since);
    }

    const { data, count } = await query;

    return {
      calls: (data || []).map(c => ({
        id: c.id,
        contact_name: c.contact_name,
        contact_ghl_id: c.contact_ghl_id,
        source: c.source,
        status: c.status,
        call_type: c.call_type,
        direction: c.direction,
        duration_seconds: c.duration_seconds,
        overall_score: c.score?.overall || null,
        called_at: c.called_at,
        rep_name: c.rep_name || null,
        rep_email: c.rep_email || null,
      })),
      total: count || 0,
    };
  },
});

export const getCallDetail = createTool({
  id: 'get_call_detail',
  description: 'Get full details for a specific call including transcript, score, coaching, and suggested actions. Use when the user asks about a specific call or wants to see the analysis.',
  inputSchema: z.object({
    callId: z.string().describe('The call ID to look up'),
  }),
  outputSchema: z.object({
    call: z.record(z.unknown()),
    actions: z.array(z.record(z.unknown())),
  }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', input.callId)
      .eq('tenant_id', resourceId)
      .single();

    if (!call) throw new Error('Call not found');

    const { data: actions } = await supabaseAdmin
      .from('call_actions')
      .select('*')
      .eq('call_id', input.callId)
      .order('created_at', { ascending: true });

    return { call, actions: actions || [] };
  },
});

export const getContactCallHistory = createTool({
  id: 'get_contact_call_history',
  description: 'Get call history for a specific contact, including scores over time. Use when the user asks about a contact\'s call history or scoring trends.',
  inputSchema: z.object({
    contactGhlId: z.string().describe('GHL contact ID'),
    limit: z.number().optional().default(10),
  }),
  outputSchema: z.object({
    calls: z.array(z.object({
      id: z.string(),
      called_at: z.string().nullable(),
      call_type: z.string().nullable(),
      duration_seconds: z.number().nullable(),
      overall_score: z.number().nullable(),
      summary: z.string().nullable(),
    })),
    avgScore: z.number().nullable(),
    totalCalls: z.number(),
  }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { data, count } = await supabaseAdmin
      .from('calls')
      .select('id, called_at, call_type, duration_seconds, score, coaching', { count: 'exact' })
      .eq('tenant_id', resourceId)
      .eq('contact_ghl_id', input.contactGhlId)
      .eq('status', 'complete')
      .order('called_at', { ascending: false })
      .limit(input.limit || 10);

    const calls = (data || []).map(c => ({
      id: c.id,
      called_at: c.called_at,
      call_type: c.call_type,
      duration_seconds: c.duration_seconds,
      overall_score: c.score?.overall || null,
      summary: c.coaching?.summary || null,
    }));

    const scores = calls.filter(c => c.overall_score !== null).map(c => c.overall_score!);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    return { calls, avgScore, totalCalls: count || 0 };
  },
});

export const getCallStatsByRep = createTool({
  id: 'get_call_stats_by_rep',
  description: 'Get call statistics grouped by rep (sales person). Shows total calls, average score, close rate, and breakdown by call type. Use when the user asks about rep performance, close rates, or comparisons between reps.',
  inputSchema: z.object({
    daysBack: z.number().optional().default(90).describe('How many days back to include'),
  }),
  outputSchema: z.object({
    reps: z.array(z.object({
      rep_name: z.string(),
      rep_email: z.string().nullable(),
      total_calls: z.number(),
      graded_calls: z.number(),
      avg_score: z.number().nullable(),
      closed_won: z.number(),
      not_interested: z.number(),
      close_rate: z.number().nullable(),
      by_type: z.record(z.number()),
    })),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);
    const since = new Date(Date.now() - (input.daysBack ?? 90) * 86400000).toISOString();

    const { data } = await supabaseAdmin
      .from('calls')
      .select('rep_name, rep_email, call_type, outcome, score, status')
      .eq('tenant_id', tenantId)
      .gte('called_at', since);

    const rows = data ?? [];
    const byRep = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = r.rep_name ?? 'Unknown';
      if (!byRep.has(key)) byRep.set(key, []);
      byRep.get(key)!.push(r);
    }

    const reps = [...byRep.entries()].map(([name, calls]) => {
      const graded = calls.filter(c => c.status === 'complete' && c.score?.overall != null);
      const scores = graded.map(c => c.score?.overall ?? 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      const closedWon = calls.filter(c => c.outcome === 'closed_won').length;
      const notInterested = calls.filter(c => c.outcome === 'not_interested').length;
      const decisive = closedWon + notInterested;
      const closeRate = decisive > 0 ? Math.round((closedWon / decisive) * 100) : null;

      const byType: Record<string, number> = {};
      for (const c of calls) {
        const t = c.call_type ?? 'other';
        byType[t] = (byType[t] ?? 0) + 1;
      }

      return {
        rep_name: name,
        rep_email: calls[0]?.rep_email ?? null,
        total_calls: calls.length,
        graded_calls: graded.length,
        avg_score: avgScore,
        closed_won: closedWon,
        not_interested: notInterested,
        close_rate: closeRate,
        by_type: byType,
      };
    });

    return { reps };
  },
});
