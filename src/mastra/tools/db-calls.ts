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
      .select('id, contact_name, contact_ghl_id, source, status, call_type, direction, duration_seconds, score, called_at', { count: 'exact' })
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
