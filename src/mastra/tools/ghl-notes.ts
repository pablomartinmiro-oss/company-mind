// src/mastra/tools/ghl-notes.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createNote = createTool({
  id: 'create_note',
  description: 'Add a note to a contact record. Use when the user wants to log information, save call notes, or document something about a contact.',
  inputSchema: z.object({
    contactId: z.string().describe('GHL contact ID'),
    body: z.string().describe('Note content — can be multi-line'),
  }),
  outputSchema: z.object({ note: z.record(z.unknown()), message: z.string() }),
  execute: async (input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);
    const result = await ghl.createNote(input.contactId, input.body);
    return { note: result.note || result, message: 'Note added to contact.' };
  },
});
