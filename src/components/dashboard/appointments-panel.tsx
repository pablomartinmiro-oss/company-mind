'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';
import { formatExactTime } from '@/lib/format';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_PILL, APPOINTMENT_STATUS_ORDER } from '@/lib/pipeline-config';

interface Appointment {
  id: string;
  title?: string;
  contactName: string;
  type: string;
  startTime: string;
  endTime?: string;
  status: string;
  attendees?: Array<{ name?: string; email?: string }>;
  meetingLink?: string;
  description?: string;
  calendarUrl?: string;
}

export function AppointmentsPanel() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function fetchAppointments(d: Date) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);
    setExpandedId(null);

    const timeout = setTimeout(() => {
      controller.abort();
      setLoading(false);
      setError(true);
    }, 5000);

    try {
      const res = await fetch(`/api/appointments?date=${d.toISOString().split('T')[0]}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Appointment[] = Array.isArray(data) ? data : [];
      // Client-side sort as safety net
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setAppointments(list);
    } catch (err) {
      clearTimeout(timeout);
      if ((err as Error).name !== 'AbortError') {
        setAppointments([]);
        setError(true);
      }
    }
    setLoading(false);
  }

  useEffect(() => { fetchAppointments(date); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  function prevDay() { setDate(new Date(date.getTime() - 86400000)); }
  function nextDay() { setDate(new Date(date.getTime() + 86400000)); }
  function toggleExpand(id: string) { setExpandedId(expandedId === id ? null : id); }

  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="relative glass-card rounded-3xl overflow-hidden flex flex-col" style={{ height: 516 }}>
      <div className="glass-card-inner" />
      {/* Header */}
      <div className="relative h-9 flex items-center justify-between px-3.5 border-b border-white/40 shrink-0">
        <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">Appointments</span>
        <div className="flex items-center gap-1.5">
          <button onClick={prevDay} className="p-0.5 hover:bg-white/30 rounded">
            <ChevronLeft className="h-3 w-3 text-zinc-500" />
          </button>
          <span className="text-[11px] font-medium text-zinc-700 min-w-[50px] text-center">
            {isToday ? 'Today' : dateLabel}
          </span>
          <button onClick={nextDay} className="p-0.5 hover:bg-white/30 rounded">
            <ChevronRight className="h-3 w-3 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-y-auto" style={{ height: 480 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-4 w-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center px-4">
            <AlertCircle className="h-6 w-6 text-zinc-300" />
            <p className="text-[13px] text-zinc-500">Calendar unavailable</p>
            <p className="text-[11px] text-zinc-400">Check GHL connection</p>
            <button
              onClick={() => fetchAppointments(date)}
              className="mt-2 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-white/50 text-zinc-600 hover:bg-white/30"
            >
              Retry
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center px-4">
            <Calendar className="h-6 w-6 text-zinc-300" />
            <p className="text-[13px] text-zinc-500">No appointments {isToday ? 'today' : dateLabel}</p>
          </div>
        ) : (
          appointments.map((appt) => {
            const time = new Date(appt.startTime);
            const timeStr = formatExactTime(appt.startTime);
            const isConfirmed = appt.status === 'confirmed';
            const isExpanded = expandedId === appt.id;

            return (
              <div key={appt.id}>
                <div
                  onClick={() => toggleExpand(appt.id)}
                  className="flex items-start gap-2 px-3 py-2 border-b border-white/30 last:border-0 hover:bg-white/30 cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-mono text-zinc-500 w-[80px] shrink-0 pt-0.5 leading-tight">
                    {timeStr}
                  </span>
                  <div className={`w-[2px] self-stretch rounded-sm ${isToday && isConfirmed ? 'bg-[#1a1a1a]' : 'bg-zinc-200'}`} />
                  <div>
                    <p className="text-[12px] font-medium text-zinc-800">{appt.contactName || appt.title}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{appt.type || appt.title}</p>
                    <StatusPill ghlEventId={appt.id} initial={appt.status || 'confirmed'} />
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="bg-white/30 border-t border-white/30 px-3 py-3 space-y-2">
                    <p className="text-[13px] font-medium text-[#1a1a1a]">{appt.title || appt.contactName}</p>
                    <p className="text-[11px] font-mono text-zinc-500">
                      {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' '}
                      {timeStr}
                      {appt.endTime && ` — ${formatExactTime(appt.endTime)}`}
                    </p>
                    {appt.attendees && appt.attendees.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Attendees</p>
                        <p className="text-[11px] text-zinc-700">
                          {appt.attendees.map((a) => a.name || a.email || 'Unknown').join(', ')}
                        </p>
                      </div>
                    )}
                    {appt.meetingLink ? (
                      <a
                        href={appt.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Join meeting
                      </a>
                    ) : (
                      <p className="text-[11px] text-zinc-500">No meeting link</p>
                    )}
                    {appt.description && (
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{appt.description}</p>
                    )}
                    {appt.calendarUrl && (
                      <a
                        href={appt.calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" /> Open in calendar
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusPill({ ghlEventId, initial }: { ghlEventId: string; initial: string }) {
  // Normalize incoming status to a valid key
  const normalizeStatus = (s: string) => {
    const valid = APPOINTMENT_STATUS_ORDER as readonly string[];
    return valid.includes(s) ? s : 'confirmed';
  };

  const [status, setStatus] = useState(normalizeStatus(initial));
  const [updating, setUpdating] = useState(false);

  const cycle = async () => {
    if (updating) return;
    const idx = APPOINTMENT_STATUS_ORDER.indexOf(status as typeof APPOINTMENT_STATUS_ORDER[number]);
    const next = APPOINTMENT_STATUS_ORDER[(idx + 1) % APPOINTMENT_STATUS_ORDER.length];
    setUpdating(true);
    setStatus(next);
    try {
      await fetch('/api/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghl_event_id: ghlEventId, status: next }),
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        cycle();
      }}
      className={`text-[9px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block cursor-pointer hover:opacity-80 transition-opacity ${APPOINTMENT_STATUS_PILL[status] ?? 'bg-zinc-100 text-zinc-500'}`}
      title="Click to cycle status"
    >
      {APPOINTMENT_STATUS_LABELS[status] ?? status}
    </button>
  );
}
