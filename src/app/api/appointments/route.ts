import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';
import { log } from '@/lib/log';

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId');
  const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  try {
    const { tenantId } = await getTenantForUser();
    const startTime = new Date(`${dateParam}T00:00:00`).toISOString();
    const endTime = new Date(`${dateParam}T23:59:59`).toISOString();

    const ghl = await getGHLClientForTenant(tenantId);
    const calData = await ghl.listCalendars();
    const calendars = calData?.calendars ?? [];

    if (calendars.length === 0) {
      return NextResponse.json([]);
    }

    const eventsData = await ghl.listCalendarEvents(calendars[0].id, startTime, endTime);
    let events = (eventsData?.events ?? []).map((evt: Record<string, unknown>) => ({
      id: evt.id,
      contactId: evt.contactId ?? '',
      contactName: evt.contactName ?? (evt.contact as Record<string, unknown>)?.name ?? '',
      type: evt.appointmentType ?? evt.calendarName ?? '',
      startTime: typeof evt.startTime === 'number' ? new Date(evt.startTime).toISOString() : evt.startTime,
      endTime: typeof evt.endTime === 'number' ? new Date(evt.endTime).toISOString() : evt.endTime,
      status: evt.appointmentStatus ?? evt.status ?? 'pending',
      attendees: evt.attendees ?? [],
      meetingLink: evt.meetingLink ?? evt.locationUrl ?? null,
      description: evt.description ?? evt.notes ?? null,
    }));

    if (contactId) {
      events = events.filter((e: { contactId: string }) => e.contactId === contactId);
    }

    events.sort((a: { startTime: string }, b: { startTime: string }) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return NextResponse.json(events);
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    log.error('appointments_fetch_failed', { error: msg });
    if (msg.includes('no GHL access token') || msg.includes('No GHL')) {
      return NextResponse.json({ error: 'GHL not connected' }, { status: 401 });
    }
    return NextResponse.json({ error: 'GHL request failed', detail: msg }, { status: 502 });
  }
}
