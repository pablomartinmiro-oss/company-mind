import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';

function todayAt(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function futureDay(daysFromNow: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const DEMO_APPOINTMENTS = [
  { id: 'demo-apt-001', contactId: 'demo-contact-002', contactName: 'Marcus Thompson', type: 'Demo scheduled', startTime: todayAt(12, 0), status: 'confirmed' },
  { id: 'demo-apt-002', contactId: 'demo-contact-004', contactName: 'Jake Rivera', type: 'Discovery call', startTime: todayAt(15, 30), status: 'pending' },
  { id: 'demo-apt-003', contactId: 'demo-contact-001', contactName: 'Sarah Chen', type: 'Closing call', startTime: futureDay(2, 14, 0), status: 'confirmed' },
  { id: 'demo-apt-004', contactId: 'demo-contact-003', contactName: 'Lisa Patel', type: 'Follow-up', startTime: futureDay(4, 10, 0), status: 'pending' },
  { id: 'demo-apt-005', contactId: 'demo-contact-005', contactName: 'David Kim', type: 'Check-in', startTime: futureDay(6, 11, 0), status: 'confirmed' },
  { id: 'demo-apt-006', contactId: 'demo-contact-002', contactName: 'Marcus Thompson', type: 'Closing call', startTime: futureDay(4, 14, 0), status: 'pending' },
];

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId');

  try {
    const { tenantId } = await getTenantForUser();
    const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
    const startTime = new Date(`${dateParam}T00:00:00`).toISOString();
    const endTime = new Date(`${dateParam}T23:59:59`).toISOString();

    const ghl = await getGHLClientForTenant(tenantId);
    const calData = await ghl.listCalendars();
    const calendars = calData?.calendars ?? [];

    if (calendars.length === 0) {
      const filtered = contactId ? DEMO_APPOINTMENTS.filter((a) => a.contactId === contactId) : DEMO_APPOINTMENTS;
      return NextResponse.json(filtered);
    }

    const eventsData = await ghl.listCalendarEvents(calendars[0].id, startTime, endTime);
    const events = (eventsData?.events ?? []).map((evt: Record<string, unknown>) => ({
      id: evt.id,
      contactId: evt.contactId ?? '',
      contactName: evt.contactName ?? (evt.contact as Record<string, unknown>)?.name ?? '',
      type: evt.appointmentType ?? evt.calendarName ?? '',
      startTime: typeof evt.startTime === 'number' ? new Date(evt.startTime).toISOString() : evt.startTime,
      status: evt.appointmentStatus ?? evt.status ?? 'pending',
    }));

    if (events.length === 0) {
      const filtered = contactId ? DEMO_APPOINTMENTS.filter((a) => a.contactId === contactId) : DEMO_APPOINTMENTS;
      return NextResponse.json(filtered);
    }

    return NextResponse.json(events);
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const filtered = contactId ? DEMO_APPOINTMENTS.filter((a) => a.contactId === contactId) : DEMO_APPOINTMENTS;
    return NextResponse.json(filtered);
  }
}
