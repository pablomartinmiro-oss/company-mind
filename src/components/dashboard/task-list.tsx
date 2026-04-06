'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Check, ExternalLink, Pencil } from 'lucide-react';
import { STAGE_PILL_CLASSES, TEAM_MEMBERS, TASK_TYPE_LABELS, TASK_TYPE_PILL, PIPELINES } from '@/lib/pipeline-config';

interface Task {
  id: string;
  contact_id: string | null;
  contact_name?: string;
  pipeline_stage: string | null;
  task_type?: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed: boolean;
}

interface Props {
  initialTasks: Task[];
}

const TASK_TYPE_FILTER_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Follow Up', value: 'follow_up' },
  { label: 'New Lead', value: 'new_lead' },
  { label: 'Scheduling', value: 'scheduling' },
  { label: 'Admin', value: 'admin' },
];

function dueLabel(dueDate: string | null): { text: string; className: string } | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, className: 'text-[11px] font-medium text-red-600 font-mono' };
  if (diff === 0) return { text: 'Due today', className: 'text-[11px] font-medium text-amber-600' };
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { text: label, className: 'text-[11px] text-zinc-400 font-mono' };
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2);
}

export function TaskList({ initialTasks }: Props) {
  const [tasks] = useState(initialTasks);
  const [typeFilter, setTypeFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = tasks
    .filter((t) => {
      if (t.completed || completedIds.has(t.id)) return false;
      if (typeFilter && (t.task_type ?? 'follow_up') !== typeFilter) return false;
      if (teamFilter && t.assigned_to !== teamFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      function priority(t: Task): number {
        if (!t.due_date) return 3; // no due date — last
        const due = new Date(t.due_date + 'T00:00:00').getTime();
        if (due < todayMs) return 0; // overdue
        if (due === todayMs) return 1; // due today
        return 2; // future
      }
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      // Within same bucket, sort by due date ascending (earliest first)
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return da - db;
    });

  async function completeTask(id: string) {
    setCompletedIds((prev) => new Set(prev).add(id));
    try {
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id }),
      });
    } catch { /* ignore */ }
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  const selectClass = 'text-[12px] px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-500 focus:outline-none';

  return (
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-200/60">
        <div className="flex items-center gap-2">
          <select className={selectClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {TASK_TYPE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectClass} value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">All team</option>
            {TEAM_MEMBERS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <span className="text-[12px] text-zinc-400">{filtered.length} tasks</span>
      </div>

      {/* Task rows */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[13px] text-zinc-300">No tasks.</p>
        </div>
      ) : (
        filtered.map((task) => {
          const isCompleted = completedIds.has(task.id);
          const due = dueLabel(task.due_date);
          const taskType = task.task_type ?? 'follow_up';
          const typeClass = TASK_TYPE_PILL[taskType] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200';
          const typeLabel = TASK_TYPE_LABELS[taskType] ?? taskType;
          const isExpanded = expandedId === task.id;

          return (
            <div key={task.id} className={isCompleted ? 'opacity-35' : ''}>
              {/* Main row */}
              <div
                onClick={() => toggleExpand(task.id)}
                className="flex items-center gap-3 px-3.5 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 cursor-pointer transition-colors duration-100"
              >
                {/* Radio circle */}
                <button
                  onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                  className={`h-[18px] w-[18px] rounded-full border-[1.5px] flex items-center justify-center text-[9px] cursor-pointer flex-shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'border-zinc-200 text-transparent hover:border-zinc-900'
                  }`}
                >
                  {isCompleted ? <Check className="h-2.5 w-2.5" /> : '✓'}
                </button>

                {/* Task type pill */}
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${typeClass}`}>
                  {typeLabel}
                </span>

                {/* Task body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-zinc-900">{task.contact_name || task.title}</span>
                    {task.assigned_to && (
                      <span className="text-[11px] text-blue-600">@{task.assigned_to}</span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{task.description}</p>
                  )}
                </div>

                {/* Due date */}
                {due && (
                  <span className={`min-w-[70px] text-right ${due.className}`}>{due.text}</span>
                )}

                {/* Chevron */}
                <div className="flex-shrink-0">
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-zinc-300" />
                    : <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
                  }
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="px-4 pb-4 border-b border-zinc-100 bg-zinc-50/40 transition-all duration-200 pt-3">
                  {/* Title */}
                  <p className="text-[14px] font-semibold text-zinc-900 mb-1">{task.title}</p>

                  {/* Description */}
                  {task.description && (
                    <p className="text-[13px] text-zinc-500 leading-relaxed mb-3">{task.description}</p>
                  )}

                  {/* Meta row: due date + task type pill */}
                  <div className="flex items-center gap-3 mb-3">
                    {due && (
                      <span className={due.className}>{due.text}</span>
                    )}
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${typeClass}`}>
                      {typeLabel}
                    </span>
                  </div>

                  {/* Pipeline stage pills — all stages for this contact */}
                  {task.pipeline_stage && (
                    <div className="mb-3">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-1.5">Pipeline Stages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PIPELINES.flatMap((p) => p.stages.map((s) => (
                          <span
                            key={s}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              s === task.pipeline_stage
                                ? STAGE_PILL_CLASSES[s] ?? 'bg-zinc-100 text-zinc-500'
                                : 'bg-zinc-50 text-zinc-300 border border-zinc-100'
                            }`}
                          >
                            {s}
                          </span>
                        )))}
                      </div>
                    </div>
                  )}

                  {/* Actions: Go to company + Edit task */}
                  <div className="flex gap-2">
                    {task.contact_id && (
                      <a
                        href={`/contacts/${task.contact_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-zinc-900 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-zinc-700"
                      >
                        <ExternalLink className="h-3 w-3" /> Go to company
                      </a>
                    )}
                    <button className="border border-zinc-200 text-[12px] text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5">
                      <Pencil className="h-3 w-3" /> Edit task
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
