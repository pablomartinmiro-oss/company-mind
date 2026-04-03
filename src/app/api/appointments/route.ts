import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

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
  { id: 'demo-apt-001', contactName: 'Marcus Thompson', type: 'Demo scheduled', startTime: todayAt(12, 0), status: 'confirmed' },
  { id: 'demo-apt-002', contactName: 'Jake Rivera', type: 'Discovery call', startTime: todayAt(15, 30), status: 'pending' },
  { id: 'demo-apt-003', contactName: 'Sarah Chen', type: 'Closing call', startTime: futureDay(2, 14, 0), status: 'confirmed' },
  { id: 'demo-apt-004', contactName: 'Lisa Patel', type: 'Follow-up', startTime: futureDay(4, 10, 0), status: 'pending' },
  { id: 'demo-apt-005', contactName: 'David Kim', type: 'Check-in', startTime: futureDay(6, 11, 0), status: 'confirmed' },
];

export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
    const startTime = new Date(`${dateParam}T00:00:00`).toISOString();
    const endTime = new Date(`${dateParam}T23:59:59`).toISOString();

    const ghl = await getGHLClientForTenant(TENANT_ID);
    const calData = await ghl.listCalendars();
    const calendars = calData?.calendars ?? [];

    if (calendars.length === 0) {
      console.log('Using demo appointment data');
      return NextResponse.json(DEMO_APPOINTMENTS);
    }

    const eventsData = await ghl.listCalendarEvents(calendars[0].id, startTime, endTime);
    const events = (eventsData?.events ?? []).map((evt: Record<string, unknown>) => ({
      id: evt.id,
      title: evt.title ?? evt.name ?? 'Appointment',
      contactName: evt.contactName ?? (evt.contact as Record<string, unknown>)?.name ?? '',
      type: evt.appointmentType ?? evt.calendarName ?? '',
      startTime: typeof evt.startTime === 'number' ? new Date(evt.startTime).toISOString() : evt.startTime,
      status: evt.appointmentStatus ?? evt.status ?? 'pending',
    }));

    if (events.length === 0) {
      console.log('Using demo appointment data');
      return NextResponse.json(DEMO_APPOINTMENTS);
    }

    return NextResponse.json(events);
  } catch {
    console.log('Using demo appointment data');
    return NextResponse.json(DEMO_APPOINTMENTS);
  }
}
