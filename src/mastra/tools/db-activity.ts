// src/mastra/tools/db-activity.ts
// Tool for querying activity feed entries from Supabase

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { getTenantId } from './get-tenant-id';

export const getActivityFeed = createTool({
  id: 'get_activity_feed',
  description:
    'Get recent activity feed entries (notes, call logs, stage moves, etc.). Can be filtered to a specific contact. Use when the user asks about recent activity, history, or what happened with a contact.',
  inputSchema: z.object({
    contactId: z
      .string()
      .optional()
      .describe('Filter to a specific GHL contact ID. Omit to see all activity.'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Number of entries to return (default: 20)'),
  }),
  outputSchema: z.object({
    activities: z.array(z.record(z.unknown())),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);

    let query = supabaseAdmin
      .from('activity_feed')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(input.limit || 20);

    if (input.contactId) {
      query = query.eq('contact_id', input.contactId);
    }

    const { data, count } = await query;

    return {
      activities: (data || []).map((a) => ({
        ...a,
        created_at: a.created_at
          ? new Date(a.created_at).toISOString()
          : null,
      })),
      total: count || 0,
    };
  },
});
