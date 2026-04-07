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

export function PipelineFunnel({ pipelines, onStageSelect, selectedStage }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [pipelines[0]?.id]: true });

  function togglePipeline(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleStageClick(stage: string) {
    onStageSelect?.(selectedStage === stage ? null : stage);
  }

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-4">
      {pipelines.map((pipeline, pIdx) => {
        const isExpanded = expanded[pipeline.id] ?? false;
        const contactsInStage = (stage: string) =>
          pipeline.contacts.filter((c) => c.stage === stage).length;

        return (
          <div key={pipeline.id} className={pIdx > 0 ? 'border-t border-white/[0.04]' : ''}>
            {/* Pipeline header */}
            <button
              onClick={() => togglePipeline(pipeline.id)}
              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] w-full text-left"
            >
              <span className="text-[10px] text-zinc-500">{isExpanded ? '▼' : '▶'}</span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">
                {pipeline.name}
              </span>
            </button>

            {/* Stage circles — display/filter only */}
            {isExpanded && (
              <div className="flex items-center w-full px-6 pb-5 pt-3">
                {pipeline.stages.map((stage, sIdx) => {
                  const count = contactsInStage(stage);
                  const isSelected = selectedStage === stage;

                  return (
                    <div key={stage} className="contents">
                      {sIdx > 0 && (
                        <div className="flex-1 border-t-[1.5px] border-dashed border-white/[0.08] mb-[20px] min-w-[20px]" />
                      )}
                      <button
                        onClick={() => handleStageClick(stage)}
                        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                      >
                        <div className="relative">
                          <div
                            className={`h-[44px] w-[44px] rounded-full border-[1.5px] flex items-center justify-center ${
                              isSelected
                                ? 'border-[2px] border-white bg-white text-zinc-900 text-[14px] font-bold'
                                : count > 0
                                ? 'border-white/[0.08] bg-white/[0.03] text-zinc-500 text-[14px]'
                                : 'border-white/[0.08] bg-[#0a0a0b] text-zinc-500 text-[13px] font-mono'
                            }`}
                          >
                            {count > 0 && !isSelected ? '✓' : sIdx + 1}
                          </div>
                          {count > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-[20px] w-[20px] rounded-full bg-white text-zinc-900 text-[10px] font-semibold flex items-center justify-center">
                              {count}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] text-center max-w-[64px] leading-tight mt-1 ${
                            isSelected ? 'font-medium text-zinc-100' : 'text-zinc-500'
                          }`}
                        >
                          {stage}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
