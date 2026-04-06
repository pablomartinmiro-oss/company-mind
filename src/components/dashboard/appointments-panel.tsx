'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface Appointment {
  id: string;
  title?: string;
  contactName: string;
  type: string;
  startTime: string;
  status: string;
}

export function AppointmentsPanel() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function fetchAppointments(d: Date) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);

    // Timeout fallback: stop loading after 5 seconds
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
      setAppointments(Array.isArray(data) ? data : []);
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

  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden bg-white flex flex-col" style={{ height: 516 }}>
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3.5 border-b border-zinc-200/60 shrink-0">
        <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-400">Appointments</span>
        <div className="flex items-center gap-1.5">
          <button onClick={prevDay} className="p-0.5 hover:bg-zinc-100 rounded">
            <ChevronLeft className="h-3 w-3 text-zinc-400" />
          </button>
          <span className="text-[11px] font-medium text-zinc-600 min-w-[50px] text-center">
            {isToday ? 'Today' : dateLabel}
          </span>
          <button onClick={nextDay} className="p-0.5 hover:bg-zinc-100 rounded">
            <ChevronRight className="h-3 w-3 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Body — fixed height to match inbox */}
      <div className="flex-1 overflow-y-auto" style={{ height: 480 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-4 w-4 border-2 border-zinc-200 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center px-4">
            <AlertCircle className="h-6 w-6 text-zinc-300" />
            <p className="text-[13px] text-zinc-400">Calendar unavailable</p>
            <p className="text-[11px] text-zinc-300">Check GHL connection</p>
            <button
              onClick={() => fetchAppointments(date)}
              className="mt-2 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            >
              Retry
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center px-4">
            <Calendar className="h-6 w-6 text-zinc-300" />
            <p className="text-[13px] text-zinc-400">No appointments {isToday ? 'today' : dateLabel}</p>
          </div>
        ) : (
          appointments.map((appt) => {
            const time = new Date(appt.startTime);
            const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const isConfirmed = appt.status === 'confirmed';

            return (
              <div key={appt.id} className="flex items-start gap-2 px-3 py-2 border-b border-zinc-100 last:border-0">
                <span className="text-[10px] font-mono text-zinc-400 w-[44px] shrink-0 pt-0.5 leading-tight">
                  {timeStr}
                </span>
                <div className={`w-[2px] self-stretch rounded-sm ${isToday && isConfirmed ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                <div>
                  <p className="text-[12px] font-medium">{appt.contactName || appt.title}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{appt.type || appt.title}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                    isConfirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {isConfirmed ? 'Confirmed' : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
