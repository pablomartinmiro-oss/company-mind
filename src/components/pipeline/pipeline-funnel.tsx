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

  // Use the longest pipeline to set the grid column count
  const maxStages = Math.max(...pipelines.map((p) => p.stages.length), 1);

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

            {/* Stage grid — symmetric alignment via fixed column count */}
            {isExpanded && (
              <div
                className="grid items-start gap-1 px-6 pb-5 pt-3"
                style={{ gridTemplateColumns: `repeat(${maxStages}, 1fr)` }}
              >
                {pipeline.stages.map((stage, sIdx) => {
                  const count = contactsInStage(stage);
                  const isSelected = selectedStage === stage;
                  const Icon = STAGE_ICONS[stage] ?? User;
                  const stateClasses = isSelected
                    ? 'border-[#ff6a3d] bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white shadow-[0_4px_12px_rgba(255,106,61,0.3)]'
                    : count > 0
                    ? 'border-white/60 bg-white/60 text-zinc-500'
                    : 'border-white/60 bg-white/40 text-zinc-400';

                  return (
                    <div key={stage} className="flex items-center justify-center relative">
                      {/* Connector lines */}
                      {sIdx > 0 && (
                        <div className="absolute left-0 right-1/2 top-[18px] border-t-2 border-dashed border-zinc-400 -z-10" />
                      )}
                      {sIdx < pipeline.stages.length - 1 && (
                        <div className="absolute right-0 left-1/2 top-[18px] border-t-2 border-dashed border-zinc-400 -z-10" />
                      )}
                      <button
                        onClick={() => handleStageClick(stage)}
                        className="flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <div className="relative">
                          <div className={`h-[36px] w-[36px] rounded-full border backdrop-blur flex items-center justify-center transition-all duration-150 ${stateClasses}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {count > 0 && (
                            <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 rounded-full bg-zinc-900 text-white text-[9px] font-medium flex items-center justify-center">
                              {count}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] text-center max-w-[60px] leading-tight h-7 flex items-start justify-center ${
                            isSelected ? 'font-medium text-[#1a1a1a]' : 'text-zinc-500'
                          }`}
                        >
                          {stage}
                        </span>
                      </button>
                    </div>
                  );
                })}
                {/* Empty trailing cells for shorter pipelines */}
                {Array.from({ length: maxStages - pipeline.stages.length }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
