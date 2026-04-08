'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { approveDataPoint, rejectDataPoint, approveDataPointsBulk, rejectDataPointsBulk } from '@/app/actions';
import { useConfirm } from '@/components/ui/confirm-modal';

interface DataPoint {
  id: string;
  field_name: string;
  field_value: string;
  status: 'pending' | 'approved' | 'rejected';
  company_id: string | null;
  contact_id: string | null;
  source: string;
  created_at: string;
}

interface Props {
  callId: string;
}

function formatFieldName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function DataPointsView({ callId }: Props) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pending: true,
    approved: false,
    rejected: false,
  });
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/calls/${callId}/data-points`);
      const json = await res.json();
      setDataPoints(json.dataPoints ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending = dataPoints.filter(dp => dp.status === 'pending');
  const approved = dataPoints.filter(dp => dp.status === 'approved');
  const rejected = dataPoints.filter(dp => dp.status === 'rejected');

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map(dp => dp.id)));
    }
  }

  async function handleApprove(id: string) {
    setProcessing(prev => new Set(prev).add(id));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      await approveDataPoint(id);
      setDataPoints(prev => prev.map(dp => dp.id === id ? { ...dp, status: 'approved' as const } : dp));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e: unknown) {
      setErrors(prev => ({ ...prev, [id]: e instanceof Error ? e.message : 'Failed to approve' }));
    } finally {
      setProcessing(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  async function handleReject(id: string) {
    const confirmed = await confirm({
      title: 'Reject this data point?',
      description: 'This AI-extracted field will be marked as rejected and won\u2019t be added to the research catalog.',
      confirmLabel: 'Reject',
      variant: 'destructive',
    });
    if (!confirmed) return;

    setProcessing(prev => new Set(prev).add(id));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      await rejectDataPoint(id);
      setDataPoints(prev => prev.map(dp => dp.id === id ? { ...dp, status: 'rejected' as const } : dp));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e: unknown) {
      setErrors(prev => ({ ...prev, [id]: e instanceof Error ? e.message : 'Failed to reject' }));
    } finally {
      setProcessing(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  async function handleBulkApprove() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setProcessing(new Set(ids));
    try {
      await approveDataPointsBulk(ids);
      setDataPoints(prev => prev.map(dp => ids.includes(dp.id) ? { ...dp, status: 'approved' as const } : dp));
      setSelected(new Set());
    } catch {
      // individual errors handled inside the bulk action
    } finally {
      setProcessing(new Set());
    }
  }

  async function handleBulkReject() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const confirmed = await confirm({
      title: `Reject ${ids.length} data points?`,
      description: 'These AI-extracted fields will be marked as rejected.',
      confirmLabel: 'Reject all',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setProcessing(new Set(ids));
    try {
      await rejectDataPointsBulk(ids);
      setDataPoints(prev => prev.map(dp => ids.includes(dp.id) ? { ...dp, status: 'rejected' as const } : dp));
      setSelected(new Set());
    } catch {
      // handled inside bulk
    } finally {
      setProcessing(new Set());
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[#71717a]" />
      </div>
    );
  }

  // ── Empty state ──
  if (dataPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Database className="w-8 h-8 text-[#a1a1aa] mb-3" />
        <p className="text-[13px] text-[#71717a]">No data points extracted from this call</p>
        <p className="text-[11px] text-[#a1a1aa] mt-1">Data points are extracted automatically during call analysis.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Bulk action bar ── */}
      {pending.length > 0 && selected.size > 0 && (
        <div className="bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={selected.size === pending.length}
              onChange={toggleSelectAll}
            />
            <span className="text-[12px] font-medium text-[#1a1a1a]">
              {selected.size} of {pending.length} selected
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkReject}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-white/60 bg-white/40 text-[#52525b] hover:bg-white/60 transition-colors"
            >
              Reject selected
            </button>
            <button
              onClick={handleBulkApprove}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-white hover:bg-black transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {/* ── Pending section ── */}
      <Section
        label="Pending"
        count={pending.length}
        expanded={expandedSections.pending}
        onToggle={() => toggleSection('pending')}
        pillClass="bg-amber-50/80 text-amber-700"
      >
        {pending.map(dp => (
          <DataPointCard
            key={dp.id}
            dp={dp}
            selectable
            selected={selected.has(dp.id)}
            onToggleSelect={() => toggleSelect(dp.id)}
            processing={processing.has(dp.id)}
            error={errors[dp.id]}
            onApprove={() => handleApprove(dp.id)}
            onReject={() => handleReject(dp.id)}
          />
        ))}
      </Section>

      {/* ── Approved section ── */}
      {approved.length > 0 && (
        <Section
          label="Approved"
          count={approved.length}
          expanded={expandedSections.approved}
          onToggle={() => toggleSection('approved')}
          pillClass="bg-emerald-50/80 text-emerald-700"
        >
          {approved.map(dp => (
            <DataPointCard key={dp.id} dp={dp} statusPill="approved" />
          ))}
        </Section>
      )}

      {/* ── Rejected section ── */}
      {rejected.length > 0 && (
        <Section
          label="Rejected"
          count={rejected.length}
          expanded={expandedSections.rejected}
          onToggle={() => toggleSection('rejected')}
          pillClass="bg-rose-50/80 text-rose-700"
        >
          {rejected.map(dp => (
            <DataPointCard key={dp.id} dp={dp} statusPill="rejected" />
          ))}
        </Section>
      )}
    </div>
  );
}

// ── Section wrapper ──

function Section({
  label,
  count,
  expanded,
  onToggle,
  pillClass,
  children,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  pillClass: string;
  children: React.ReactNode;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 mb-2 cursor-pointer"
      >
        <Chevron className="w-3.5 h-3.5 text-[#71717a]" />
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[#52525b]">{label}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${pillClass}`}>
          {count}
        </span>
      </button>
      {expanded && <div>{children}</div>}
    </div>
  );
}

// ── Checkbox ──

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`h-4 w-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
        checked
          ? 'bg-[#1a1a1a] border-[#1a1a1a]'
          : 'border-white/60 bg-white/40 hover:border-zinc-400'
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ── Data Point Card ──

function DataPointCard({
  dp,
  selectable = false,
  selected = false,
  onToggleSelect,
  processing = false,
  error,
  onApprove,
  onReject,
  statusPill,
}: {
  dp: DataPoint;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  processing?: boolean;
  error?: string;
  onApprove?: () => void;
  onReject?: () => void;
  statusPill?: 'approved' | 'rejected';
}) {
  const isReadOnly = !!statusPill;
  const scope = dp.company_id ? 'company' : dp.contact_id ? 'contact' : 'unscoped';

  return (
    <div
      className={`bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl p-4 mb-2 ring-1 ring-white/40 transition-opacity ${
        processing ? 'opacity-50' : isReadOnly ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {selectable && onToggleSelect && (
          <div className="pt-0.5">
            <Checkbox checked={selected} onChange={onToggleSelect} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#1a1a1a]">{formatFieldName(dp.field_name)}</span>
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/60">
              AI
            </span>
            {statusPill === 'approved' && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-700 border border-emerald-200/60">
                Approved
              </span>
            )}
            {statusPill === 'rejected' && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-rose-50/80 text-rose-700 border border-rose-200/60">
                Rejected
              </span>
            )}
          </div>

          <p className="text-[13px] text-[#52525b] mt-1">{dp.field_value}</p>

          <p className="text-[11px] text-[#71717a] mt-2">
            Scope: {scope} · Extracted {timeAgo(dp.created_at)}
          </p>

          {/* Inline actions for pending items */}
          {!isReadOnly && onApprove && onReject && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onApprove}
                disabled={processing}
                className="text-[11px] font-medium px-3 py-1 rounded-lg bg-[#1a1a1a] text-white hover:bg-black transition-colors disabled:opacity-50 inline-flex items-center gap-1"
              >
                {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={processing}
                className="text-[11px] font-medium px-3 py-1 rounded-lg border border-white/60 bg-white/40 text-[#52525b] hover:bg-white/60 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {/* Inline error */}
          {error && (
            <p className="text-[11px] text-rose-600 mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
