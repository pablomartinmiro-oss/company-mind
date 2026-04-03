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
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden mb-4">
      {enrollments.map((enrollment, idx) => {
        const currentIdx = enrollment.stages.indexOf(enrollment.currentStage);
        const logForStage = (stage: string) =>
          enrollment.stageLog.filter((l) => l.stage === stage);

        return (
          <div key={enrollment.pipelineId} className={idx > 0 ? 'border-t border-zinc-100' : ''}>
            <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 px-4 pt-3 pb-1">
              {enrollment.pipelineName}
            </p>
            <div className="flex items-center px-4 pb-3 pt-1">
              {enrollment.stages.map((stage, sIdx) => {
                const isPast = sIdx < currentIdx;
                const isActive = sIdx === currentIdx;
                const isOpen = openLog?.pipelineId === enrollment.pipelineId && openLog?.stage === stage;

                return (
                  <div key={stage} className="flex items-center">
                    {sIdx > 0 && (
                      <div className={`flex-1 border-t-[1.5px] border-dashed min-w-4 mx-1 ${isPast ? 'border-zinc-400' : 'border-zinc-200'}`} />
                    )}
                    <button
                      onClick={() => toggleLog(enrollment.pipelineId, stage)}
                      className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                    >
                      <div className={`h-[30px] w-[30px] rounded-full border-[1.5px] flex items-center justify-center text-[11px] font-medium font-mono ${
                        isActive
                          ? 'border-zinc-900 bg-zinc-900 text-white font-bold'
                          : isPast
                          ? 'border-zinc-200 bg-zinc-100 text-zinc-400'
                          : 'border-zinc-200 bg-white text-zinc-400'
                      } ${isOpen ? 'border-[2px] border-zinc-900' : ''}`}>
                        {isPast ? '✓' : sIdx + 1}
                      </div>
                      <span className={`text-[9px] text-center max-w-[58px] leading-tight ${
                        isActive ? 'font-medium text-zinc-900' : 'text-zinc-400'
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
              <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-3">
                <p className="text-[13px] font-medium text-zinc-900 mb-2">{openLog.stage}</p>
                {logForStage(openLog.stage).length === 0 ? (
                  <p className="text-[11px] text-zinc-400">No log entries.</p>
                ) : (
                  logForStage(openLog.stage).map((entry) => (
                    <div key={entry.id} className="bg-white border border-zinc-100 rounded-lg p-2.5 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-400">
                          {new Date(entry.entered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {entry.moved_by && <span className="text-[11px] font-medium text-zinc-600">{entry.moved_by}</span>}
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
                        <p className="text-[11px] text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-100">{entry.note}</p>
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
