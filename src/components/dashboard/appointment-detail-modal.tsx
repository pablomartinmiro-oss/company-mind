'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Video } from 'lucide-react';
import { formatExactTime, formatExactDate } from '@/lib/format';
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_TYPE_PILL } from '@/lib/pipeline-config';
import { getTeamMember } from '@/lib/pipeline-config';

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed', classes: 'bg-white/60 text-[#52525b] border-white/60' },
  { value: 'showed', label: 'Showed', classes: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60' },
  { value: 'no_show', label: 'No Show', classes: 'bg-rose-50/80 text-rose-700 border-rose-200/60' },
  { value: 'cancelled', label: 'Cancelled', classes: 'bg-zinc-100/80 text-zinc-500 border-zinc-200/60' },
] as const;

interface Appointment {
  id: string;
  title?: string;
  contactName: string;
  companyId?: string;
  type: string;
  startTime: string;
  endTime?: string;
  status: string;
  meetingLink?: string;
  organizer?: string;
  assignedTo?: string;
}

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onStatusChange: (newStatus: string) => void;
}

export function AppointmentDetailModal({ appointment, onClose, onStatusChange }: Props) {
  const [status, setStatus] = useState(appointment.status || 'confirmed');
  const [saving, setSaving] = useState(false);

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        onStatusChange(newStatus);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  const organizer = appointment.organizer || appointment.assignedTo || 'Unassigned';
  const member = getTeamMember(organizer);
  const typePill = APPOINTMENT_TYPE_PILL[appointment.type] ?? 'bg-zinc-100 text-zinc-500';
  const typeLabel = APPOINTMENT_TYPE_LABELS[appointment.type] ?? appointment.type ?? appointment.title;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] mx-4 bg-white/90 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-2xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-medium text-[#1a1a1a]">{appointment.title || appointment.contactName}</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${typePill}`}>
                {typeLabel}
              </span>
              <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${STATUS_OPTIONS.find(s => s.value === status)?.classes ?? 'bg-zinc-100 text-zinc-500'}`}>
                {STATUS_OPTIONS.find(s => s.value === status)?.label ?? status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Time */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Time</p>
          <p className="text-[13px] text-[#1a1a1a]">
            {formatExactDate(appointment.startTime)} · {formatExactTime(appointment.startTime)}
            {appointment.endTime && ` — ${formatExactTime(appointment.endTime)}`}
          </p>
        </div>

        {/* Organizer */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Organizer</p>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white ${member.avatarClass}`}>
              {member.initials}
            </div>
            <span className="text-[13px] text-[#1a1a1a]">{member.name}</span>
          </div>
        </div>

        {/* Meeting link */}
        {appointment.meetingLink && (
          <div className="mb-4">
            <a
              href={appointment.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-white hover:bg-black transition-colors"
            >
              <Video className="w-3.5 h-3.5" /> Join Meeting <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Company link */}
        {appointment.companyId && (
          <div className="mb-5">
            <a
              href={`/companies/${appointment.companyId}`}
              className="text-[11px] text-[#ff6a3d] hover:underline"
            >
              View company →
            </a>
          </div>
        )}

        {/* Status action bar */}
        <div className="border-t border-white/40 pt-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Status</p>
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateStatus(opt.value)}
                disabled={saving}
                className={`text-[10px] font-medium px-3 py-1.5 rounded-full border transition-all ${
                  status === opt.value
                    ? `${opt.classes} ring-2 ring-offset-1 ring-zinc-300`
                    : 'border-white/60 bg-white/40 text-zinc-500 hover:bg-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
