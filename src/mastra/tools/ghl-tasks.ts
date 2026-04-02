// src/mastra/tools/ghl-tasks.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const getContactTasks = createTool({
  id: 'get_contact_tasks',
  description: 'Get all tasks for a specific contact. Use when the user asks about tasks, to-dos, or follow-ups for a contact.',
  inputSchema: z.object({
    contactId: z.string().describe('GHL contact ID'),
  }),
  outputSchema: z.object({ tasks: z.array(z.record(z.unknown())) }),
  execute: async (input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);
    const result = await ghl.getContactTasks(input.contactId);
    return { tasks: result.tasks || [] };
  },
});

export const createTask = createTool({
  id: 'create_task',
  description: 'Create a task/follow-up for a contact. Use when the user says "remind me to," "create a task," "follow up with," etc.',
  inputSchema: z.object({
    contactId: z.string().describe('GHL contact ID'),
    title: z.string().describe('Task title'),
    description: z.string().optional().describe('Task description/details'),
    dueDate: z.string().optional().describe('Due date in ISO format (YYYY-MM-DD)'),
    assignedTo: z.string().optional().describe('GHL user ID to assign to'),
  }),
  outputSchema: z.object({ task: z.record(z.unknown()), message: z.string() }),
  execute: async (input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);
    const result = await ghl.createTask(input.contactId, {
      title: input.title,
      body: input.description,
      dueDate: input.dueDate,
      assignedTo: input.assignedTo,
    });
    return { task: result.task || result, message: `Created task: ${input.title}` };
  },
});
