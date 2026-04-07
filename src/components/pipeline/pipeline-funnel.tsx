'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { STAGE_ICONS } from '@/lib/pipeline-config';

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
    <div className="relative glass-card rounded-3xl overflow-hidden mb-4">
      <div className="glass-card-inner" />
      {pipelines.map((pipeline, pIdx) => {
        const isExpanded = expanded[pipeline.id] ?? false;
        const contactsInStage = (stage: string) =>
          pipeline.contacts.filter((c) => c.stage === stage).length;

        return (
          <div key={pipeline.id} className={`relative ${pIdx > 0 ? 'border-t border-white/30' : ''}`}>
            {/* Pipeline header */}
            <button
              onClick={() => togglePipeline(pipeline.id)}
              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-white/30 w-full text-left"
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
                        <div className="flex-1 border-t-[1.5px] border-dashed border-zinc-300/50 mb-[20px] min-w-[20px]" />
                      )}
                      <button
                        onClick={() => handleStageClick(stage)}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
                      >
                        <div className="relative">
                          {(() => {
                            const Icon = STAGE_ICONS[stage] ?? User;
                            const stateClasses = isSelected
                              ? 'border-[#ff6a3d] bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white shadow-[0_4px_12px_rgba(255,106,61,0.3)]'
                              : count > 0
                              ? 'border-white/60 bg-white/60 text-zinc-500'
                              : 'border-white/60 bg-white/40 text-zinc-400';
                            return (
                              <div className={`h-[36px] w-[36px] rounded-full border backdrop-blur flex items-center justify-center transition-all duration-150 ${stateClasses}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                            );
                          })()}
                          {count > 0 && (
                            <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 rounded-full bg-zinc-900 text-white text-[9px] font-medium flex items-center justify-center">
                              {count}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] text-center max-w-[60px] leading-tight ${
                            isSelected ? 'font-medium text-[#1a1a1a]' : 'text-zinc-500'
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
