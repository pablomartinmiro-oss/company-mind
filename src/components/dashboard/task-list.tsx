'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import { STAGE_PILL_CLASSES, TEAM_MEMBERS } from '@/lib/pipeline-config';

interface Task {
  id: string;
  contact_id: string | null;
  contact_name?: string;
  pipeline_stage: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed: boolean;
}

interface Props {
  initialTasks: Task[];
}

const ALL_STAGES = [
  'New Lead', 'Qualification', 'Closing', 'Closed',
  'New Client', 'Building', 'Built', 'Operating',
  'Tier 1', 'Tier 2', 'Tier 3', 'Nurture', 'Dead',
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

export function TaskList({ initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [stageFilter, setStageFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const filtered = tasks.filter((t) => {
    if (t.completed) return false;
    if (completedIds.has(t.id)) return false;
    if (stageFilter && t.pipeline_stage !== stageFilter) return false;
    if (teamFilter && t.assigned_to !== teamFilter) return false;
    return true;
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

  const selectClass = 'text-[12px] px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-500 focus:outline-none';

  return (
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-200/60">
        <div className="flex items-center gap-2">
          <select className={selectClass} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">All stages</option>
            {ALL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
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

          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 px-3.5 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 cursor-pointer transition-colors duration-100 ${
                isCompleted ? 'opacity-35' : ''
              }`}
            >
              {/* Radio circle */}
              <button
                onClick={(e) => { e.preventDefault(); completeTask(task.id); }}
                className={`h-[18px] w-[18px] rounded-full border-[1.5px] flex items-center justify-center text-[9px] cursor-pointer flex-shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'border-zinc-200 text-transparent hover:border-zinc-900'
                }`}
              >
                {isCompleted ? <Check className="h-2.5 w-2.5" /> : '✓'}
              </button>

              {/* Stage pill */}
              {task.pipeline_stage && (
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${
                  STAGE_PILL_CLASSES[task.pipeline_stage] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}>
                  {task.pipeline_stage}
                </span>
              )}

              {/* Task body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-zinc-900">{task.contact_name || task.title}</span>
                  {task.assigned_to && (
                    <span className="text-[11px] text-blue-600">@{task.assigned_to}</span>
                  )}
                </div>
                {task.description && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">{task.description}</p>
                )}
              </div>

              {/* Due date */}
              {due && (
                <span className={`min-w-[70px] text-right ${due.className}`}>{due.text}</span>
              )}

              {/* Chevron */}
              {task.contact_id && (
                <Link href={`/contacts/${task.contact_id}`} className="flex-shrink-0">
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
                </Link>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
