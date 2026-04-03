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

interface PipelineData {
  id: string;
  name: string;
  stages: string[];
  contacts: { contact_id: string; stage: string }[];
  stageLog: StageLogEntry[];
}

interface Props {
  pipelines: PipelineData[];
  onStageSelect?: (stage: string | null) => void;
  selectedStage?: string | null;
}

const SOURCE_BADGE: Record<string, string> = {
  api: 'bg-violet-50 text-violet-700',
  ai: 'bg-blue-50 text-blue-700',
  manual: 'bg-green-50 text-green-700',
};

export function PipelineFunnel({ pipelines, onStageSelect, selectedStage }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [pipelines[0]?.id]: true });
  const [openLog, setOpenLog] = useState<{ pipelineId: string; stage: string } | null>(null);

  function togglePipeline(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleStageLog(pipelineId: string, stage: string) {
    if (openLog?.pipelineId === pipelineId && openLog?.stage === stage) {
      setOpenLog(null);
    } else {
      setOpenLog({ pipelineId, stage });
    }
    onStageSelect?.(selectedStage === stage ? null : stage);
  }

  return (
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden mb-4">
      {pipelines.map((pipeline, pIdx) => {
        const isExpanded = expanded[pipeline.id] ?? false;
        const contactsInStage = (stage: string) =>
          pipeline.contacts.filter((c) => c.stage === stage).length;
        const logForStage = (stage: string) =>
          pipeline.stageLog.filter((l) => l.stage === stage);

        return (
          <div key={pipeline.id} className={pIdx > 0 ? 'border-t border-zinc-100' : ''}>
            {/* Pipeline header */}
            <button
              onClick={() => togglePipeline(pipeline.id)}
              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-zinc-50/50 w-full text-left"
            >
              <span className="text-[10px] text-zinc-400">{isExpanded ? '▼' : '▶'}</span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
                {pipeline.name}
              </span>
            </button>

            {/* Stage circles */}
            {isExpanded && (
              <>
                <div className="flex items-center w-full px-6 pb-5 pt-3">
                  {pipeline.stages.map((stage, sIdx) => {
                    const count = contactsInStage(stage);
                    const isOpen = openLog?.pipelineId === pipeline.id && openLog?.stage === stage;
                    const isSelected = selectedStage === stage;

                    return (
                      <div key={stage} className="contents">
                        {sIdx > 0 && (
                          <div className="flex-1 border-t-[1.5px] border-dashed border-zinc-200 mb-[20px] min-w-[20px]" />
                        )}
                        <button
                          onClick={() => toggleStageLog(pipeline.id, stage)}
                          className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                        >
                          <div className="relative">
                            <div
                              className={`h-[44px] w-[44px] rounded-full border-[1.5px] flex items-center justify-center ${
                                isOpen || isSelected
                                  ? 'border-[2px] border-zinc-900 bg-zinc-900 text-white text-[14px] font-bold'
                                  : count > 0
                                  ? 'border-zinc-200 bg-zinc-50 text-zinc-400 text-[14px]'
                                  : 'border-zinc-200 bg-white text-zinc-400 text-[13px] font-mono'
                              }`}
                            >
                              {count > 0 && !(isOpen || isSelected) ? '✓' : sIdx + 1}
                            </div>
                            {count > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 h-[20px] w-[20px] rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center">
                                {count}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] text-center max-w-[64px] leading-tight mt-1 ${
                              isOpen || isSelected ? 'font-medium text-zinc-900' : 'text-zinc-400'
                            }`}
                          >
                            {stage}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Stage log panel */}
                {openLog?.pipelineId === pipeline.id && (
                  <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-zinc-900">{openLog.stage}</span>
                    </div>

                    {logForStage(openLog.stage).length === 0 ? (
                      <p className="text-[11px] text-zinc-400">No log entries yet.</p>
                    ) : (
                      logForStage(openLog.stage).map((entry) => (
                        <div key={entry.id} className="bg-white border border-zinc-100 rounded-lg p-2.5 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-zinc-400">
                              {new Date(entry.entered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {entry.moved_by && (
                              <span className="text-[11px] font-medium text-zinc-600">{entry.moved_by}</span>
                            )}
                            {entry.source && (
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_BADGE[entry.source] ?? 'bg-zinc-100 text-zinc-500'}`}>
                                {entry.source}
                              </span>
                            )}
                            {entry.entry_number > 1 && (
                              <span className="text-[9px] px-1.5 rounded-full bg-amber-50 text-amber-600">
                                repeat entry
                              </span>
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
