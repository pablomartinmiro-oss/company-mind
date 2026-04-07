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
  api: 'bg-violet-50 text-violet-700',
  ai: 'bg-blue-50 text-blue-700',
  manual: 'bg-green-50 text-green-700',
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
    <div className="border border-[rgba(28,25,22,0.06)] rounded-xl overflow-hidden mb-4 max-w-[50%]">
      {enrollments.map((enrollment, idx) => {
        const currentIdx = enrollment.stages.indexOf(enrollment.currentStage);
        const logForStage = (stage: string) =>
          enrollment.stageLog.filter((l) => l.stage === stage);

        return (
          <div key={enrollment.pipelineId} className={idx > 0 ? 'border-t border-[rgba(28,25,22,0.04)]' : ''}>
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
                      <div className={`flex-1 border-t border-dashed mb-[14px] min-w-[12px] ${isPast ? 'border-zinc-400' : 'border-[rgba(28,25,22,0.1)]'}`} />
                    )}
                    <button
                      onClick={() => toggleLog(enrollment.pipelineId, stage)}
                      className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                    >
                      <div className={`h-[26px] w-[26px] rounded-full border flex items-center justify-center ${
                        isActive
                          ? 'border-[#1c1916] bg-[#1c1916] text-white text-[10px] font-bold'
                          : isPast
                          ? 'border-[rgba(28,25,22,0.1)] bg-[#faf8f5] text-zinc-500 text-[10px]'
                          : 'border-[rgba(28,25,22,0.1)] bg-white text-zinc-500 text-[10px] font-mono'
                      } ${isOpen ? 'border-[2px] border-[#1c1916]' : ''}`}>
                        {isPast ? '✓' : sIdx + 1}
                      </div>
                      <span className={`text-[8px] text-center max-w-[48px] leading-tight ${
                        isActive ? 'font-medium text-[#1c1916]' : 'text-zinc-500'
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
              <div className="bg-[#faf8f5] border-t border-[rgba(28,25,22,0.04)] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-[#1c1916]">{openLog.stage}</span>
                  <div className="flex items-center gap-1.5">
                    <button className="bg-[#1c1916] text-white text-[11px] px-2.5 py-1 rounded-full">+ Log</button>
                    <button className="border border-[rgba(28,25,22,0.1)] text-[11px] px-2.5 py-1 rounded-full text-zinc-500">Edit</button>
                    <button className="border border-[rgba(28,25,22,0.1)] text-[11px] px-2.5 py-1 rounded-full text-zinc-500">Delete</button>
                  </div>
                </div>
                {logForStage(openLog.stage).length === 0 ? (
                  <p className="text-[11px] text-zinc-500">No log entries.</p>
                ) : (
                  logForStage(openLog.stage).map((entry) => (
                    <div key={entry.id} className="bg-white border border-[rgba(28,25,22,0.04)] rounded-lg p-2.5 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-500">
                          {new Date(entry.entered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {entry.moved_by && <span className="text-[11px] font-medium text-zinc-700">{entry.moved_by}</span>}
                        {entry.source && (
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_BADGE[entry.source] ?? 'bg-zinc-100 text-zinc-500'}`}>
                            {entry.source}
                          </span>
                        )}
                        {entry.entry_number > 1 && (
                          <span className="text-[9px] px-1.5 rounded-full bg-amber-50 text-amber-600">repeat entry</span>
                        )}
                      </div>
                      {entry.note && (
                        <p className="text-[11px] text-zinc-500 mt-1.5 pt-1.5 border-t border-[rgba(28,25,22,0.04)]">{entry.note}</p>
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
