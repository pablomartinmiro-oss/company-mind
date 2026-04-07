// src/mastra/tools/db-appointments.ts
// Tool for fetching appointments via GHL calendar API

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getTenantId } from './get-tenant-id';
import { getGHLClientForTenant } from '../../lib/tenant-context';

export const getAppointments = createTool({
  id: 'get_appointments',
  description:
    'Get upcoming appointments from the CRM calendar. Use when the user asks about their schedule, meetings, or appointments.',
  inputSchema: z.object({
    date: z
      .string()
      .optional()
      .describe('Start date in ISO format (defaults to today)'),
    days: z
      .number()
      .optional()
      .default(7)
      .describe('Number of days ahead to look (default: 7)'),
  }),
  outputSchema: z.object({
    appointments: z.array(z.record(z.unknown())),
    total: z.number(),
  }),
  execute: async (input, executionContext) => {
    const tenantId = getTenantId(executionContext);
    const ghl = await getGHLClientForTenant(tenantId);

    const startDate = input.date ? new Date(input.date) : new Date();
    const endDate = new Date(
      startDate.getTime() + (input.days || 7) * 86400000
    );

    // List calendars first, then get events from all calendars
    const calendarsRes = await ghl.listCalendars();
    const calendars = calendarsRes.calendars || [];

    if (calendars.length === 0) {
      return { appointments: [], total: 0 };
    }

    const allEvents: Record<string, unknown>[] = [];

    for (const cal of calendars) {
      const calId =
        typeof cal === 'object' && cal !== null && 'id' in cal
          ? (cal as { id: string }).id
          : null;
      if (!calId) continue;

      try {
        const eventsRes = await ghl.listCalendarEvents(
          calId,
          startDate.toISOString(),
          endDate.toISOString()
        );
        const events = eventsRes.events || [];
        allEvents.push(...(events as Record<string, unknown>[]));
      } catch {
        // Skip calendars that fail
      }
    }

    return {
      appointments: allEvents,
      total: allEvents.length,
    };
  },
});
