'use client';

import { useState, useCallback } from 'react';
import { StatDetailModal } from './stat-detail-modal';

type ModalType = 'calls' | 'score' | 'pipeline' | 'tasks' | null;

interface StatCardsProps {
  totalCalls: number;
  avgScore: number;
  avgGrade: { letter: string; color: string };
  formattedPipeline: string;
  openTasks: number;
  dueToday: number;
  calls: Array<{
    id: string;
    contact_name: string | null;
    company_name: string | null;
    score: { overall?: number } | null;
    called_at: string | null;
    call_type: string | null;
  }>;
  pipelineContacts: Array<{
    contact_ghl_id: string;
    contact_name: string | null;
    company_name: string | null;
    pipeline_name: string | null;
    current_stage: string | null;
    deal_value: number | null;
  }>;
  tasks: Array<{
    id: string;
    contact_id: string | null;
    contact_name: string | null;
    title: string;
    task_type: string | null;
    due_date: string | null;
  }>;
}

export function StatCards({
  totalCalls,
  avgScore,
  avgGrade,
  formattedPipeline,
  openTasks,
  dueToday,
  calls,
  pipelineContacts,
  tasks,
}: StatCardsProps) {
  const [modal, setModal] = useState<ModalType>(null);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <>
      <div className="grid grid-cols-4 gap-2.5">
        <button onClick={() => setModal('calls')} className="relative glass-card rounded-3xl px-5 py-4 text-left hover:bg-white/70 transition-all cursor-pointer">
          <div className="glass-card-inner" />
          <div className="relative">
            <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Calls</p>
            <p className="text-[48px] font-medium font-mono text-[#ff6a3d] leading-none">{totalCalls}</p>
          </div>
        </button>
        <button onClick={() => setModal('score')} className="relative glass-card rounded-3xl px-5 py-4 text-left hover:bg-white/70 transition-all cursor-pointer">
          <div className="glass-card-inner" />
          <div className="relative">
            <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Avg Score</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-[48px] font-medium font-mono text-[#ff6a3d] leading-none">{avgScore}</p>
              <span className={`text-[13px] font-semibold ${avgGrade.color}`}>{avgGrade.letter}</span>
            </div>
          </div>
        </button>
        <button onClick={() => setModal('pipeline')} className="relative glass-card rounded-3xl px-5 py-4 text-left hover:bg-white/70 transition-all cursor-pointer">
          <div className="glass-card-inner" />
          <div className="relative">
            <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Pipeline</p>
            <p className="text-[48px] font-medium font-mono text-[#ff6a3d] leading-none">{formattedPipeline}</p>
          </div>
        </button>
        <button onClick={() => setModal('tasks')} className="relative glass-card rounded-3xl px-5 py-4 text-left hover:bg-white/70 transition-all cursor-pointer">
          <div className="glass-card-inner" />
          <div className="relative">
            <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Open Tasks</p>
            <p className="text-[48px] font-medium font-mono text-[#ff6a3d] leading-none">{openTasks}</p>
            {dueToday > 0 && <p className="text-red-600 text-[11px] mt-0.5">{dueToday} due today</p>}
          </div>
        </button>
      </div>

      <StatDetailModal
        type={modal}
        onClose={closeModal}
        calls={calls}
        pipelineContacts={pipelineContacts}
        tasks={tasks}
      />
    </>
  );
}
