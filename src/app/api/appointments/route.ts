import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';

function getDemoAppointments() {
  // Compute fresh dates at request time (not module load time)
  // so they don't go stale on warm serverless instances
  const now = new Date();

  function todayAt(hour: number, minute: number) {
    const d = new Date(now);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  function futureDay(daysFromNow: number, hour: number, minute: number) {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  return [
    { id: 'demo-apt-001', contactId: 'demo-contact-002', contactName: 'Marcus Thompson', type: 'Demo scheduled', startTime: todayAt(9, 30), endTime: todayAt(10, 0), status: 'confirmed', description: 'HVAC proposal walkthrough with CFO' },
    { id: 'demo-apt-002', contactId: 'demo-contact-004', contactName: 'Jake Rivera', type: 'Discovery call', startTime: todayAt(12, 0), endTime: todayAt(12, 30), status: 'pending', description: 'Initial landscaping CRM demo' },
    { id: 'demo-apt-003', contactId: 'demo-contact-001', contactName: 'Sarah Chen', type: 'Closing call', startTime: todayAt(15, 30), endTime: todayAt(16, 0), status: 'confirmed', description: 'Agreement review and signatures' },
    { id: 'demo-apt-004', contactId: 'demo-contact-003', contactName: 'Lisa Patel', type: 'Follow-up', startTime: futureDay(1, 10, 0), endTime: futureDay(1, 10, 30), status: 'pending' },
    { id: 'demo-apt-005', contactId: 'demo-contact-005', contactName: 'David Kim', type: 'Check-in', startTime: futureDay(2, 11, 0), endTime: futureDay(2, 11, 30), status: 'confirmed' },
    { id: 'demo-apt-006', contactId: 'demo-contact-002', contactName: 'Marcus Thompson', type: 'Closing call', startTime: futureDay(3, 14, 0), endTime: futureDay(3, 14, 30), status: 'pending' },
  ];
}

function filterByDate(appointments: ReturnType<typeof getDemoAppointments>, dateStr: string, contactId?: string | null) {
  const dayStart = new Date(`${dateStr}T00:00:00`).getTime();
  const dayEnd = new Date(`${dateStr}T23:59:59`).getTime();

  let filtered = appointments.filter((a) => {
    const t = new Date(a.startTime).getTime();
    return t >= dayStart && t <= dayEnd;
  });

  if (contactId) {
    filtered = filtered.filter((a) => a.contactId === contactId);
  }

  filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return filtered;
}

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
      return NextResponse.json(filterByDate(getDemoAppointments(), dateParam, contactId));
    }

    const eventsData = await ghl.listCalendarEvents(calendars[0].id, startTime, endTime);
    const events = (eventsData?.events ?? []).map((evt: Record<string, unknown>) => ({
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

    if (events.length === 0) {
      return NextResponse.json(filterByDate(getDemoAppointments(), dateParam, contactId));
    }

    events.sort((a: { startTime: string }, b: { startTime: string }) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return NextResponse.json(events);
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(filterByDate(getDemoAppointments(), dateParam, contactId));
  }
}
