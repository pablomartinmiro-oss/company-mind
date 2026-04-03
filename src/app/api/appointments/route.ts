import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant, getTenant } from '@/lib/tenant-context';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
    const startTime = new Date(`${dateParam}T00:00:00`).toISOString();
    const endTime = new Date(`${dateParam}T23:59:59`).toISOString();

    const ghl = await getGHLClientForTenant(TENANT_ID);

    // Get calendars first
    const calData = await ghl.listCalendars();
    const calendars = calData?.calendars ?? [];

    if (calendars.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch events from first calendar
    const eventsData = await ghl.listCalendarEvents(calendars[0].id, startTime, endTime);
    const events = (eventsData?.events ?? []).map((evt: Record<string, unknown>) => ({
      id: evt.id,
      title: evt.title ?? evt.name ?? 'Appointment',
      contactName: evt.contactName ?? (evt.contact as Record<string, unknown>)?.name ?? '',
      type: evt.appointmentType ?? evt.calendarName ?? '',
      startTime: typeof evt.startTime === 'number' ? new Date(evt.startTime).toISOString() : evt.startTime,
      status: evt.appointmentStatus ?? evt.status ?? 'pending',
    }));

    return NextResponse.json(events);
  } catch {
    return NextResponse.json([]);
  }
}
