// src/mastra/tools/db-tasks.ts
// Tool for querying tasks from Supabase

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { getTenantId } from './get-tenant-id';

export const getTasks = createTool({
  id: 'get_tasks',
  description:
    'Get tasks for the current tenant. Can filter by type, assignee, due date, or completion status. Use when the user asks about tasks, to-dos, overdue items, or work assignments.',
  inputSchema: z.object({
    taskType: z.string().optional().describe('Filter by task type (e.g. follow_up, scheduling, admin, new_lead)'),
    assignedTo: z.string().optional().describe('Filter by assigned user name (partial match)'),
    dueDate: z
      .enum(['overdue', 'today', 'week'])
      .optional()
      .describe('Filter by due date: overdue, today, or this week'),
    completed: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include completed tasks (default: false, shows only incomplete)'),
  }),
  outputSchema: z.object({
    tasks: z.array(z.record(z.unknown())),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);

    let query = supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: true })
      .limit(50);

    if (!input.completed) {
      query = query.eq('completed', false);
    }

    if (input.taskType) {
      query = query.eq('task_type', input.taskType);
    }

    if (input.assignedTo) {
      query = query.ilike('assigned_to', `%${input.assignedTo}%`);
    }

    if (input.dueDate) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 86400000);
      const endOfWeek = new Date(startOfDay.getTime() + 7 * 86400000);

      switch (input.dueDate) {
        case 'overdue':
          query = query.lt('due_date', startOfDay.toISOString());
          break;
        case 'today':
          query = query
            .gte('due_date', startOfDay.toISOString())
            .lt('due_date', endOfDay.toISOString());
          break;
        case 'week':
          query = query
            .gte('due_date', startOfDay.toISOString())
            .lt('due_date', endOfWeek.toISOString());
          break;
      }
    }

    const { data, count } = await query;

    return {
      tasks: (data || []).map((t) => ({
        ...t,
        due_date: t.due_date ? new Date(t.due_date).toISOString() : null,
        created_at: t.created_at ? new Date(t.created_at).toISOString() : null,
      })),
      total: count || 0,
    };
  },
});
