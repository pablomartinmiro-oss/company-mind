'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  contactName: string;
  type: string;
  startTime: string;
  status: string;
}

export function AppointmentsPanel() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAppointments(d: Date) {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?date=${d.toISOString().split('T')[0]}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAppointments(date); }, [date]);

  function prevDay() { setDate(new Date(date.getTime() - 86400000)); }
  function nextDay() { setDate(new Date(date.getTime() + 86400000)); }

  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3.5 border-b border-zinc-200/60">
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

      {/* Appointment rows */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="py-8 text-center">
            <p className="text-[11px] text-zinc-300">Loading...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
            <span className="text-[13px] font-medium text-zinc-400">No appointments today</span>
            <span className="text-[11px] text-zinc-300">Calendar connected via GHL</span>
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
                    isConfirmed
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-600'
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
