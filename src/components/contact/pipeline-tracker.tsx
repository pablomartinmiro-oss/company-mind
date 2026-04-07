'use client';

import { useState } from 'react';

interface StageLogEntry {
  id: string;
  stage: string;
  entered_at: string;
  moved_by: string | null;
  source: string | null;
  note: string | null;
  entry_number: number;
}

interface PipelineEnrollment {
  pipelineId: string;
  pipelineName: string;
  stages: string[];
  currentStage: string;
  stageLog: StageLogEntry[];
}

interface Props {
  enrollments: PipelineEnrollment[];
}

const SOURCE_BADGE: Record<string, string> = {
  api: 'bg-violet-500/10 text-violet-300',
  ai: 'bg-blue-500/10 text-blue-300',
  manual: 'bg-green-500/10 text-green-300',
};

export function PipelineTracker({ enrollments }: Props) {
  const [openLog, setOpenLog] = useState<{ pipelineId: string; stage: string } | null>(null);

  function toggleLog(pipelineId: string, stage: string) {
    if (openLog?.pipelineId === pipelineId && openLog?.stage === stage) {
      setOpenLog(null);
    } else {
      setOpenLog({ pipelineId, stage });
    }
  }

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-4 max-w-[50%]">
      {enrollments.map((enrollment, idx) => {
        const currentIdx = enrollment.stages.indexOf(enrollment.currentStage);
        const logForStage = (stage: string) =>
          enrollment.stageLog.filter((l) => l.stage === stage);

        return (
          <div key={enrollment.pipelineId} className={idx > 0 ? 'border-t border-white/[0.04]' : ''}>
            <div className="flex items-center gap-1.5 px-3 pt-2 pb-0.5">
              <p className="text-[8px] font-semibold tracking-widest uppercase text-zinc-500">
                {enrollment.pipelineName}
              </p>
            </div>
            <div className="flex items-center w-full px-3 pb-2.5 pt-1">
              {enrollment.stages.map((stage, sIdx) => {
                const isPast = sIdx < currentIdx;
                const isActive = sIdx === currentIdx;
                const isOpen = openLog?.pipelineId === enrollment.pipelineId && openLog?.stage === stage;

                return (
                  <div key={stage} className="contents">
                    {sIdx > 0 && (
                      <div className={`flex-1 border-t border-dashed mb-[14px] min-w-[12px] ${isPast ? 'border-zinc-500' : 'border-white/[0.08]'}`} />
                    )}
                    <button
                      onClick={() => toggleLog(enrollment.pipelineId, stage)}
                      className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                    >
                      <div className={`h-[26px] w-[26px] rounded-full border flex items-center justify-center ${
                        isActive
                          ? 'border-white bg-white text-zinc-900 text-[10px] font-bold'
                          : isPast
                          ? 'border-white/[0.08] bg-white/[0.03] text-zinc-500 text-[10px]'
                          : 'border-white/[0.08] bg-[#0a0a0b] text-zinc-500 text-[10px] font-mono'
                      } ${isOpen ? 'border-[2px] border-white' : ''}`}>
                        {isPast ? '✓' : sIdx + 1}
                      </div>
                      <span className={`text-[8px] text-center max-w-[48px] leading-tight ${
                        isActive ? 'font-medium text-zinc-100' : 'text-zinc-500'
                      }`}>
                        {stage}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stage log panel */}
            {openLog?.pipelineId === enrollment.pipelineId && (
              <div className="bg-white/[0.03] border-t border-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-zinc-100">{openLog.stage}</span>
                  <div className="flex items-center gap-1.5">
                    <button className="bg-white text-zinc-900 text-[11px] px-2.5 py-1 rounded-full">+ Log</button>
                    <button className="border border-white/[0.08] text-[11px] px-2.5 py-1 rounded-full text-zinc-400">Edit</button>
                    <button className="border border-white/[0.08] text-[11px] px-2.5 py-1 rounded-full text-zinc-400">Delete</button>
                  </div>
                </div>
                {logForStage(openLog.stage).length === 0 ? (
                  <p className="text-[11px] text-zinc-500">No log entries.</p>
                ) : (
                  logForStage(openLog.stage).map((entry) => (
                    <div key={entry.id} className="bg-[#0a0a0b] border border-white/[0.04] rounded-lg p-2.5 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-500">
                          {new Date(entry.entered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {entry.moved_by && <span className="text-[11px] font-medium text-zinc-300">{entry.moved_by}</span>}
                        {entry.source && (
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_BADGE[entry.source] ?? 'bg-white/[0.06] text-zinc-400'}`}>
                            {entry.source}
                          </span>
                        )}
                        {entry.entry_number > 1 && (
                          <span className="text-[9px] px-1.5 rounded-full bg-amber-500/10 text-amber-300">repeat entry</span>
                        )}
                      </div>
                      {entry.note && (
                        <p className="text-[11px] text-zinc-400 mt-1.5 pt-1.5 border-t border-white/[0.04]">{entry.note}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
