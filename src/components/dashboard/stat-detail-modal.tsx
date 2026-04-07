'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { formatExactDateTime, formatExactDate, scoreBg } from '@/lib/format';
import { STAGE_PILL_CLASSES, TASK_TYPE_LABELS, TASK_TYPE_PILL, CALL_TYPE_LABELS, CALL_TYPE_PILL } from '@/lib/pipeline-config';

type ModalType = 'calls' | 'score' | 'pipeline' | 'tasks' | null;

interface CallRow {
  id: string;
  contact_name: string | null;
  company_name: string | null;
  score: { overall?: number } | null;
  called_at: string | null;
  call_type: string | null;
}

interface PipelineRow {
  contact_ghl_id: string;
  contact_name: string | null;
  company_name: string | null;
  pipeline_name: string | null;
  current_stage: string | null;
  deal_value: number | null;
}

interface TaskRow {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  title: string;
  task_type: string | null;
  due_date: string | null;
}

interface StatDetailModalProps {
  type: ModalType;
  onClose: () => void;
  calls: CallRow[];
  pipelineContacts: PipelineRow[];
  tasks: TaskRow[];
}

export function StatDetailModal({ type, onClose, calls, pipelineContacts, tasks }: StatDetailModalProps) {
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setSearch('');
  }, [type]);

  // Esc to close
  useEffect(() => {
    if (!type) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [type, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!type) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [type]);

  if (!mounted || !type) return null;

  const q = search.toLowerCase();

  const config: Record<string, { title: string; count: number; placeholder: string }> = {
    calls: { title: 'Calls this week', count: calls.length, placeholder: 'Search by contact or company...' },
    score: {
      title: 'Scored calls',
      count: calls.filter((c) => c.score?.overall != null).length,
      placeholder: 'Search by contact name...',
    },
    pipeline: { title: 'Pipeline companies', count: pipelineContacts.length, placeholder: 'Search by company name...' },
    tasks: { title: 'Open tasks', count: tasks.length, placeholder: 'Search by title or contact...' },
  };

  const { title, count, placeholder } = config[type];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[640px] h-[560px] glass-card rounded-3xl overflow-hidden flex flex-col">
        <div className="glass-card-inner" />
        {/* Header */}
        <div className="relative h-12 px-5 border-b border-white/40 flex items-center justify-between shrink-0">
          <span className="text-[13px] font-semibold text-[#1a1a1a]">
            {title} ({count})
          </span>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative px-5 py-2.5 border-b border-white/30 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full text-[12px] pl-8 pr-3 py-1.5 border border-white/60 bg-white/50 text-[#1a1a1a] rounded-lg focus:outline-none focus:border-[#ff6a3d] placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="relative flex-1 overflow-y-auto">
          {type === 'calls' && <CallsList calls={calls} search={q} />}
          {type === 'score' && <ScoreList calls={calls} search={q} />}
          {type === 'pipeline' && <PipelineList contacts={pipelineContacts} search={q} />}
          {type === 'tasks' && <TasksList tasks={tasks} search={q} />}
        </div>
      </div>
    </div>,
    document.body
  );
}

function CallsList({ calls, search }: { calls: CallRow[]; search: string }) {
  const filtered = calls.filter(
    (c) =>
      (c.contact_name ?? '').toLowerCase().includes(search) ||
      (c.company_name ?? '').toLowerCase().includes(search)
  );
  if (filtered.length === 0) return <EmptyState />;
  return (
    <>
      {filtered.map((c) => {
        const score = c.score?.overall;
        const typeKey = c.call_type ?? 'follow_up';
        return (
          <a
            key={c.id}
            href={`/calls/${c.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-2.5 border-b border-white/30 hover:bg-white/30 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1a1a1a] truncate">{c.contact_name ?? 'Unknown'}</p>
              {c.company_name && <p className="text-[11px] text-zinc-500 truncate">{c.company_name}</p>}
            </div>
            {score != null && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${scoreBg(score)}`}>
                {score}
              </span>
            )}
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CALL_TYPE_PILL[typeKey] ?? 'bg-zinc-100 text-zinc-500'}`}>
              {CALL_TYPE_LABELS[typeKey] ?? typeKey}
            </span>
            {c.called_at && (
              <span className="text-[10px] text-zinc-500 font-mono min-w-[90px] text-right">
                {formatExactDateTime(c.called_at)}
              </span>
            )}
          </a>
        );
      })}
    </>
  );
}

function ScoreList({ calls, search }: { calls: CallRow[]; search: string }) {
  const scored = calls
    .filter((c) => c.score?.overall != null)
    .filter((c) => (c.contact_name ?? '').toLowerCase().includes(search));
  if (scored.length === 0) return <EmptyState />;
  return (
    <>
      {scored.map((c) => {
        const score = c.score!.overall!;
        const typeKey = c.call_type ?? 'follow_up';
        return (
          <a
            key={c.id}
            href={`/calls/${c.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-2.5 border-b border-white/30 hover:bg-white/30 cursor-pointer"
          >
            <span className={`text-[18px] font-semibold font-mono min-w-[40px] ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {score}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1a1a1a] truncate">{c.contact_name ?? 'Unknown'}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CALL_TYPE_PILL[typeKey] ?? 'bg-zinc-100 text-zinc-500'}`}>
              {CALL_TYPE_LABELS[typeKey] ?? typeKey}
            </span>
            {c.called_at && (
              <span className="text-[10px] text-zinc-500 font-mono min-w-[90px] text-right">
                {formatExactDateTime(c.called_at)}
              </span>
            )}
          </a>
        );
      })}
    </>
  );
}

function PipelineList({ contacts, search }: { contacts: PipelineRow[]; search: string }) {
  // Group by contact_ghl_id to show multi-pipeline
  const grouped = new Map<string, PipelineRow[]>();
  for (const c of contacts) {
    const key = c.contact_ghl_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }

  const entries = Array.from(grouped.entries()).filter(([, rows]) =>
    (rows[0].company_name ?? rows[0].contact_name ?? '').toLowerCase().includes(search)
  );

  if (entries.length === 0) return <EmptyState />;
  return (
    <>
      {entries.map(([ghlId, rows]) => {
        const first = rows[0];
        const totalValue = rows.reduce((s, r) => s + (r.deal_value ?? 0), 0);
        return (
          <a
            key={ghlId}
            href={`/contacts/${ghlId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-2.5 border-b border-white/30 hover:bg-white/30 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1a1a1a] truncate">
                {first.company_name ?? first.contact_name ?? 'Unknown'}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {rows.map((r, i) => (
                  <span
                    key={i}
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STAGE_PILL_CLASSES[r.current_stage ?? ''] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}
                  >
                    {r.pipeline_name} &middot; {r.current_stage}
                  </span>
                ))}
              </div>
            </div>
            {totalValue > 0 && (
              <span className="text-[12px] font-semibold text-[#1a1a1a] font-mono">
                ${totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}k` : totalValue}
              </span>
            )}
          </a>
        );
      })}
    </>
  );
}

function TasksList({ tasks, search }: { tasks: TaskRow[]; search: string }) {
  const filtered = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search) ||
      (t.contact_name ?? '').toLowerCase().includes(search)
  );
  if (filtered.length === 0) return <EmptyState />;
  return (
    <>
      {filtered.map((t) => {
        const typeKey = t.task_type ?? 'follow_up';
        const dueColor = getDueDateColor(t.due_date);
        return (
          <a
            key={t.id}
            href={t.contact_id ? `/contacts/${t.contact_id}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-2.5 border-b border-white/30 hover:bg-white/30 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1a1a1a] truncate">{t.title}</p>
              {t.contact_name && <p className="text-[11px] text-zinc-500 truncate">{t.contact_name}</p>}
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TASK_TYPE_PILL[typeKey] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
              {TASK_TYPE_LABELS[typeKey] ?? typeKey}
            </span>
            {t.due_date && (
              <span className={`text-[11px] font-mono min-w-[90px] text-right ${dueColor}`}>
                {formatExactDate(t.due_date)}
              </span>
            )}
          </a>
        );
      })}
    </>
  );
}

function getDueDateColor(dueDate: string | null): string {
  if (!dueDate) return 'text-zinc-500';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'text-red-600';
  if (diff === 0) return 'text-amber-700';
  return 'text-zinc-500';
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-[12px] text-zinc-400">No results</p>
    </div>
  );
}
