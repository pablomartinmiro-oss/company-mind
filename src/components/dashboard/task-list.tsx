'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Check, ExternalLink, Pencil } from 'lucide-react';
import { formatExactDate } from '@/lib/format';
import { STAGE_PILL_CLASSES, TEAM_MEMBERS, TASK_TYPE_LABELS, TASK_TYPE_PILL } from '@/lib/pipeline-config';

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

interface PipelineInfo {
  pipeline_name: string;
  current_stage: string;
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

const TASK_TYPE_OPTIONS = ['admin', 'follow_up', 'new_lead', 'scheduling'];

function dueDateColor(dueDate: string | null): string {
  if (!dueDate) return 'text-zinc-400';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'text-red-600';
  if (diff === 0) return 'text-amber-600';
  return 'text-zinc-400';
}

export function TaskList({ initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [typeFilter, setTypeFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '', task_type: '' });
  const [pipelineStages, setPipelineStages] = useState<Record<string, PipelineInfo[]>>({});

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
        if (!t.due_date) return 3;
        const due = new Date(t.due_date + 'T00:00:00').getTime();
        if (due < todayMs) return 0;
        if (due === todayMs) return 1;
        return 2;
      }
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return da - db;
    });

  // Fetch actual pipeline stages when a task is expanded
  useEffect(() => {
    if (!expandedId) return;
    const task = tasks.find((t) => t.id === expandedId);
    if (!task?.contact_id || pipelineStages[task.contact_id]) return;

    fetch(`/api/contacts/${task.contact_id}/pipelines`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: PipelineInfo[]) => {
        setPipelineStages((prev) => ({ ...prev, [task.contact_id!]: data }));
      })
      .catch(() => {});
  }, [expandedId, tasks, pipelineStages]);

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
    if (editingId === id) return; // don't collapse while editing
    setExpandedId(expandedId === id ? null : id);
    setEditingId(null);
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      due_date: task.due_date ?? '',
      task_type: task.task_type ?? 'follow_up',
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, title: updated.title, description: updated.description, due_date: updated.due_date, task_type: updated.task_type }
              : t
          )
        );
      }
    } catch { /* ignore */ }
    setEditingId(null);
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
          const taskType = task.task_type ?? 'follow_up';
          const typeClass = TASK_TYPE_PILL[taskType] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200';
          const typeLabel = TASK_TYPE_LABELS[taskType] ?? taskType;
          const isExpanded = expandedId === task.id;
          const isEditing = editingId === task.id;
          const dateColor = dueDateColor(task.due_date);
          const stages = task.contact_id ? pipelineStages[task.contact_id] : undefined;

          return (
            <div key={task.id} className={isCompleted ? 'opacity-35' : ''}>
              {/* Main row */}
              <div
                onClick={() => toggleExpand(task.id)}
                className="flex items-center gap-3 px-3.5 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 cursor-pointer transition-colors duration-100"
              >
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

                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${typeClass}`}>
                  {typeLabel}
                </span>

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

                {/* Exact due date */}
                {task.due_date && (
                  <span className={`text-[11px] font-mono min-w-[90px] text-right ${dateColor}`}>
                    {formatExactDate(task.due_date)}
                  </span>
                )}

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
                  {isEditing ? (
                    /* ─── Edit Mode ─── */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full text-[15px] font-medium text-zinc-900 border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-400"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description..."
                        rows={3}
                        className="w-full text-[12px] text-zinc-700 border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-400 resize-none"
                      />
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">Due Date</label>
                          <input
                            type="date"
                            value={editForm.due_date}
                            onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                            className="text-[12px] border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">Type</label>
                          <select
                            value={editForm.task_type}
                            onChange={(e) => setEditForm({ ...editForm, task_type: e.target.value })}
                            className="text-[12px] border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-400"
                          >
                            {TASK_TYPE_OPTIONS.map((t) => (
                              <option key={t} value={t}>{TASK_TYPE_LABELS[t] ?? t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="bg-zinc-900 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="border border-zinc-200 text-[12px] text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ─── View Mode ─── */
                    <>
                      <p className="text-[14px] font-semibold text-zinc-900 mb-1">{task.title}</p>

                      {task.description && (
                        <p className="text-[13px] text-zinc-500 leading-relaxed mb-3">{task.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mb-3">
                        {task.due_date && (
                          <span className={`text-[11px] font-mono ${dateColor}`}>
                            {formatExactDate(task.due_date)}
                          </span>
                        )}
                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${typeClass}`}>
                          {typeLabel}
                        </span>
                      </div>

                      {/* Pipeline stages — actual stages only (A4) */}
                      <div className="mb-3">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-1.5">Pipeline Stages</p>
                        {stages === undefined ? (
                          <p className="text-[11px] text-zinc-300">Loading...</p>
                        ) : stages.length === 0 ? (
                          <p className="text-[11px] text-zinc-400">Not in any pipeline</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {stages.map((s, i) => (
                              <span
                                key={i}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STAGE_PILL_CLASSES[s.current_stage] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}
                              >
                                <span className="text-[9px] uppercase tracking-wider text-zinc-400">{s.pipeline_name}</span>
                                {' · '}
                                {s.current_stage}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
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
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(task); }}
                          className="border border-zinc-200 text-[12px] text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5"
                        >
                          <Pencil className="h-3 w-3" /> Edit task
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
