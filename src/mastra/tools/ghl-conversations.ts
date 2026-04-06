// src/mastra/tools/ghl-conversations.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getTenantId } from './get-tenant-id';

export const getConversations = createTool({
  id: 'get_conversations',
  description: 'Get recent conversations (messages inbox). Use when the user asks about their inbox, recent messages, or communications.',
  inputSchema: z.object({
    limit: z.number().optional().default(20).describe('Max conversations to return'),
  }),
  outputSchema: z.object({ conversations: z.array(z.record(z.unknown())) }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId);
    const result = await ghl.getConversations(input.limit);
    return { conversations: result.conversations || [] };
  },
});

export const sendMessage = createTool({
  id: 'send_message',
  description: 'Send an SMS or email message to a contact through the CRM. ALWAYS confirm with the user before sending. Use when the user explicitly asks to send a message.',
  inputSchema: z.object({
    contactId: z.string().describe('GHL contact ID'),
    type: z.enum(['SMS', 'Email']).describe('Message type'),
    message: z.string().optional().describe('Message body (for SMS)'),
    subject: z.string().optional().describe('Email subject (for Email)'),
    html: z.string().optional().describe('Email HTML body (for Email)'),
  }),
  outputSchema: z.object({ result: z.record(z.unknown()), message: z.string() }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId);
    const result = await ghl.sendMessage({
      contactId: input.contactId,
      type: input.type,
      message: input.message,
      subject: input.subject,
      html: input.html,
    });
    return { result, message: `${input.type} sent to contact.` };
  },
});
