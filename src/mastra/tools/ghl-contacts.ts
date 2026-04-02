// src/mastra/tools/ghl-contacts.ts
// Mastra tool definitions for GHL Contact operations
// This pattern is replicated for pipelines, tasks, calendar, notes, conversations

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const searchContacts = createTool({
  id: 'search_contacts',
  description: 'Search for contacts in the CRM by name, email, or phone number. Use this when the user asks to find, look up, or show contacts.',
  inputSchema: z.object({
    query: z.string().describe('Search query — name, email, or phone number'),
    limit: z.number().optional().default(10).describe('Max results to return'),
  }),
  outputSchema: z.object({
    contacts: z.array(z.object({
      id: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    // resourceId contains the tenant ID, passed when agent is invoked
    // In production, you'd load the GHL client for this tenant
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);

    const result = await ghl.searchContacts(input.query, input.limit);

    return {
      contacts: (result.contacts || []).map((c: Record<string, unknown>) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        tags: c.tags,
      })),
      total: result.meta?.total || result.contacts?.length || 0,
    };
  },
});

export const getContact = createTool({
  id: 'get_contact',
  description: 'Get full details for a specific contact by their ID. Use after searching to get complete information.',
  inputSchema: z.object({
    contactId: z.string().describe('The contact ID to look up'),
  }),
  outputSchema: z.object({
    contact: z.record(z.unknown()),
  }),
  execute: async (input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);

    const result = await ghl.getContact(input.contactId);
    return { contact: result.contact };
  },
});

export const createContact = createTool({
  id: 'create_contact',
  description: 'Create a new contact in the CRM. Requires at least a name and either email or phone.',
  inputSchema: z.object({
    firstName: z.string().describe('First name'),
    lastName: z.string().optional().describe('Last name'),
    email: z.string().optional().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    tags: z.array(z.string()).optional().describe('Tags to apply'),
    customFields: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).optional().describe('Custom field values'),
  }),
  outputSchema: z.object({
    contact: z.record(z.unknown()),
    message: z.string(),
  }),
  execute: async (input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);

    const result = await ghl.createContact({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      tags: input.tags,
      customField: input.customFields,
    });

    return {
      contact: result.contact,
      message: `Created contact: ${input.firstName} ${input.lastName || ''}`.trim(),
    };
  },
});

export const updateContact = createTool({
  id: 'update_contact',
  description: 'Update an existing contact\'s information. Provide the contact ID and fields to update.',
  inputSchema: z.object({
    contactId: z.string().describe('The contact ID to update'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).optional(),
  }),
  outputSchema: z.object({
    contact: z.record(z.unknown()),
    message: z.string(),
  }),
  execute: async (input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);

    const { contactId, ...updates } = input;
    const result = await ghl.updateContact(contactId, updates);

    return {
      contact: result.contact,
      message: `Updated contact ${contactId}`,
    };
  },
});
