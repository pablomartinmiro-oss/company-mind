import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';
import { supabaseAdmin } from '@/lib/supabase';
import { isGhlAuthError } from '@/lib/ghl-errors';
import { log } from '@/lib/log';

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId');
  const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  try {
    const { tenantId } = await getTenantForUser();
    const startTime = new Date(`${dateParam}T00:00:00`).toISOString();
    const endTime = new Date(`${dateParam}T23:59:59`).toISOString();

    // Try GHL first
    try {
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
    } catch (ghlErr) {
      if (!isGhlAuthError(ghlErr)) throw ghlErr;

      // Fallback to local DB
      log.info('appointments_ghl_fallback', { tenantId });
      let query = supabaseAdmin
        .from('appointments')
        .select('*, company:companies(name)')
        .eq('tenant_id', tenantId)
        .gte('starts_at', startTime)
        .lte('starts_at', endTime)
        .order('starts_at', { ascending: true });

      if (contactId) {
        query = query.eq('contact_ghl_id', contactId);
      }

      const { data: rows } = await query;

      const events = (rows ?? []).map((a) => ({
        id: a.id,
        contactId: a.contact_ghl_id ?? '',
        contactName: (a.company as { name: string } | null)?.name ?? '',
        type: a.appointment_type ?? a.title,
        startTime: a.starts_at,
        endTime: a.ends_at,
        status: a.status ?? 'confirmed',
        assignedTo: a.assigned_to,
        source: 'local',
      }));

      return NextResponse.json(events);
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    log.error('appointments_fetch_failed', { error: msg });
    return NextResponse.json({ error: 'Failed to load appointments', detail: msg }, { status: 502 });
  }
}
