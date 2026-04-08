'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Check, ExternalLink, Pencil } from 'lucide-react';
import { formatExactDate } from '@/lib/format';
import { TEAM_MEMBERS, TASK_TYPE_LABELS, TASK_TYPE_PILL, getTeamMember } from '@/lib/pipeline-config';
import { SelectPill } from '@/components/ui/select-pill';

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

function timeStatusPill(dueDate: string | null): { text: string; className: string } {
  if (!dueDate) return { text: 'No due date', className: 'bg-zinc-100 text-zinc-500 border border-zinc-200' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, className: 'bg-red-50 text-red-700 border border-red-100' };
  if (diff === 0) return { text: 'Due today', className: 'bg-amber-50 text-amber-700 border border-amber-100' };
  return { text: `Due in ${diff}d`, className: 'bg-zinc-100 text-zinc-500 border border-zinc-200' };
}

function dueDateColor(dueDate: string | null): string {
  if (!dueDate) return 'text-zinc-500';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'text-red-600';
  if (diff === 0) return 'text-amber-700';
  return 'text-zinc-500';
}

export function TaskList({ initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [typeFilter, setTypeFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '', task_type: '', assigned_to: '' });
  const [pipelineStages, setPipelineStages] = useState<Record<string, PipelineInfo[]>>({});
  const [companyNames, setCompanyNames] = useState<Record<string, string | null>>({});

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

  // Fetch pipeline stages and company name when a task is expanded
  useEffect(() => {
    if (!expandedId) return;
    const task = tasks.find((t) => t.id === expandedId);
    if (!task?.contact_id) return;

    if (!pipelineStages[task.contact_id]) {
      fetch(`/api/contacts/${task.contact_id}/pipelines`)
        .then((r) => r.ok ? r.json() : [])
        .then((data: PipelineInfo[]) => {
          setPipelineStages((prev) => ({ ...prev, [task.contact_id!]: data }));
        })
        .catch(() => {});
    }

    if (companyNames[task.contact_id] === undefined) {
      fetch(`/api/contacts/${task.contact_id}/company`)
        .then((r) => r.ok ? r.json() : { company_name: null })
        .then((data: { company_name: string | null }) => {
          setCompanyNames((prev) => ({ ...prev, [task.contact_id!]: data.company_name }));
        })
        .catch(() => {
          setCompanyNames((prev) => ({ ...prev, [task.contact_id!]: null }));
        });
    }
  }, [expandedId, tasks, pipelineStages, companyNames]);

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
    if (editingId === id) return;
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
      assigned_to: task.assigned_to ?? '',
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
              ? { ...t, title: updated.title, description: updated.description, due_date: updated.due_date, task_type: updated.task_type, assigned_to: updated.assigned_to }
              : t
          )
        );
      }
    } catch { /* ignore */ }
    setEditingId(null);
  }

  return (
    <div className="relative glass-card rounded-3xl overflow-hidden">
      <div className="glass-card-inner" />
      {/* Header */}
      <div className="relative flex items-center justify-between px-3.5 py-2.5 border-b border-white/40">
        <div className="flex items-center gap-2">
          <SelectPill
            value={typeFilter}
            onChange={setTypeFilter}
            options={TASK_TYPE_FILTER_OPTIONS}
            placeholder="All types"
          />
          <SelectPill
            value={teamFilter}
            onChange={setTeamFilter}
            options={TEAM_MEMBERS.map(m => ({ value: m.name, label: m.name }))}
            placeholder="All team"
          />
        </div>
        <span className="text-[12px] text-zinc-500">{filtered.length} tasks</span>
      </div>

      {/* Task rows */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[13px] text-zinc-400">No tasks.</p>
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
          const timePill = timeStatusPill(task.due_date);

          return (
            <div key={task.id} className={isCompleted ? 'opacity-35' : ''}>
              {/* Main row: [checkbox] [stage pill] [assignee pill] [content] [due date] [chevron] */}
              <div
                onClick={() => toggleExpand(task.id)}
                className="relative flex items-center gap-3 px-3.5 py-3 border-b border-white/30 last:border-0 hover:bg-white/30 cursor-pointer transition-colors duration-100"
              >
                {/* 1. Checkbox — FIRST */}
                <button
                  onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                  className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'border-zinc-300 hover:border-zinc-600'
                  }`}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isCompleted && <Check className="w-2.5 h-2.5" />}
                </button>

                {/* 2. Task type pill in fixed-width slot */}
                <div className="w-[90px] flex-shrink-0">
                  <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${typeClass}`}>
                    {typeLabel}
                  </span>
                </div>

                {/* 3. Assignee pill in fixed-width slot */}
                <div className="w-[120px] flex-shrink-0">
                  {task.assigned_to && (() => {
                    const member = getTeamMember(task.assigned_to);
                    return (
                      <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${member.pillClass}`}>
                        {member.name}
                      </span>
                    );
                  })()}
                </div>

                {/* 4. Contact name + task description */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#1a1a1a] truncate">
                    {task.contact_name || task.title}
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{task.description}</p>
                  )}
                </div>

                {/* 5. Due date */}
                {task.due_date && (
                  <span className={`text-[11px] font-mono min-w-[70px] text-right flex-shrink-0 ${dateColor}`}>
                    {timePill.text}
                  </span>
                )}

                {/* 6. Chevron */}
                <div className="flex-shrink-0">
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-zinc-300" />
                    : <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
                  }
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="relative px-4 pb-4 border-b border-white/30 bg-white/20 transition-all duration-200 pt-3">
                  {isEditing ? (
                    /* ─── Edit Mode ─── */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full text-[15px] font-medium text-[#1a1a1a] border border-white/60 rounded-lg px-3 py-1.5 bg-white/50 focus:outline-none focus:border-zinc-400"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description..."
                        rows={3}
                        className="w-full text-[12px] text-zinc-700 border border-white/60 rounded-lg px-3 py-1.5 bg-white/50 focus:outline-none focus:border-zinc-400 resize-none"
                      />
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Due Date</label>
                          <input
                            type="date"
                            value={editForm.due_date}
                            onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                            className="text-[11px] border border-white/60 rounded-lg px-3 py-1.5 bg-white/95 backdrop-blur-xl text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none focus:border-[#ff6a3d]/40"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Type</label>
                          <select
                            value={editForm.task_type}
                            onChange={(e) => setEditForm({ ...editForm, task_type: e.target.value })}
                            className="text-[11px] border border-white/60 rounded-lg px-3 py-1.5 bg-white/95 backdrop-blur-xl text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none focus:border-[#ff6a3d]/40"
                          >
                            {TASK_TYPE_OPTIONS.map((t) => (
                              <option key={t} value={t}>{TASK_TYPE_LABELS[t] ?? t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Assigned To</label>
                          <select
                            value={editForm.assigned_to}
                            onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                            className="text-[11px] border border-white/60 rounded-lg px-3 py-1.5 bg-white/95 backdrop-blur-xl text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none focus:border-[#ff6a3d]/40"
                          >
                            <option value="">Unassigned</option>
                            {TEAM_MEMBERS.map((m) => (
                              <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white text-[12px] font-medium px-3 py-1.5 rounded-full hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-[12px] text-zinc-500 px-3 py-1.5 hover:text-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ─── View Mode ─── */
                    <>
                      {/* Contact + Company hierarchy */}
                      <div className="mb-3">
                        {task.contact_id ? (
                          <a
                            href={`/contacts/${task.contact_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[16px] font-semibold text-[#1a1a1a] hover:text-[#ff6a3d] transition-colors"
                          >
                            {task.contact_name || task.title}
                          </a>
                        ) : (
                          <span className="text-[16px] font-semibold text-[#1a1a1a]">
                            {task.contact_name || task.title}
                          </span>
                        )}
                        {task.contact_id && companyNames[task.contact_id] && (
                          <div className="text-[12px] text-zinc-500 mt-0.5">
                            {companyNames[task.contact_id]}
                          </div>
                        )}
                      </div>

                      {/* Task title */}
                      <h3 className="text-[14px] font-medium text-[#1a1a1a] mb-1">{task.title}</h3>

                      {task.description && (
                        <p className="text-[12px] text-zinc-600 leading-relaxed mb-4">{task.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {task.due_date && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            dateColor === 'text-red-600' ? 'bg-red-100/60 text-red-700' : 'bg-zinc-100/60 text-zinc-600'
                          }`}>
                            {formatExactDate(task.due_date)}
                          </span>
                        )}
                        <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${typeClass}`}>
                          {typeLabel}
                        </span>
                        {task.assigned_to && (
                          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-blue-100/60 text-blue-700 border border-blue-200/40">
                            @{task.assigned_to}
                          </span>
                        )}
                        {stages && stages.length > 0 && (
                          <span className="text-[10px] text-zinc-400">
                            · {stages[0].pipeline_name}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {task.contact_id && (
                          <a
                            href={`/contacts/${task.contact_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Go to company
                          </a>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(task); }}
                          className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors inline-flex items-center gap-1.5"
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
