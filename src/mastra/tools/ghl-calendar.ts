// src/mastra/tools/ghl-calendar.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const listCalendars = createTool({
  id: 'list_calendars',
  description: 'List all calendars configured in the CRM. Use to find calendar IDs before querying events.',
  inputSchema: z.object({}),
  outputSchema: z.object({ calendars: z.array(z.record(z.unknown())) }),
  execute: async (_input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);
    const result = await ghl.listCalendars();
    return { calendars: result.calendars || [] };
  },
});

export const listCalendarEvents = createTool({
  id: 'list_calendar_events',
  description: 'List calendar events within a date range. Use when the user asks about their schedule, appointments, or upcoming meetings.',
  inputSchema: z.object({
    calendarId: z.string().describe('Calendar ID (use list_calendars to find it)'),
    startTime: z.string().describe('Start of range in ISO format'),
    endTime: z.string().describe('End of range in ISO format'),
  }),
  outputSchema: z.object({ events: z.array(z.record(z.unknown())) }),
  execute: async (input, executionContext) => {
    const resourceId = executionContext.agent?.resourceId;
    const { getGHLClientForTenant } = await import('../../lib/tenant-context');
    const ghl = await getGHLClientForTenant(resourceId!);
    const result = await ghl.listCalendarEvents(input.calendarId, input.startTime, input.endTime);
    return { events: result.events || [] };
  },
});
