'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, Check } from 'lucide-react';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';
import { useConfirm } from '@/components/ui/confirm-modal';

interface StagePopoverProps {
  pipelineName: string;
  pipelineId: string;
  stages: string[];
  currentStage: string;
  companyId: string;
  onUpdate?: () => void;
}

export function StagePopover({ pipelineName, pipelineId, stages, currentStage, companyId, onUpdate }: StagePopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const confirm = useConfirm();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const moveToStage = async (newStage: string) => {
    if (newStage === currentStage) { setOpen(false); return; }
    const res = await fetch('/api/pipeline/move-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, pipelineId, newStage }),
    });
    if (res.status === 422) {
      const { error } = await res.json();
      await confirm({
        title: 'Cannot move stage',
        description: error,
        confirmLabel: 'OK',
        cancelLabel: null,
      });
      return;
    }
    setOpen(false);
    onUpdate?.();
  };

  const removeFromPipeline = async () => {
    const confirmed = await confirm({
      title: `Remove from ${pipelineName}?`,
      description: 'This company will be removed from this pipeline. You can re-add it later.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await fetch('/api/pipeline/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, pipelineId }),
    });
    setOpen(false);
    onUpdate?.();
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`text-[10px] font-medium px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity cursor-pointer ${STAGE_PILL_CLASSES[currentStage] ?? 'bg-zinc-100/60 text-zinc-700'}`}
      >
        {pipelineName} · {currentStage}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] py-1">
          <div className="px-3 pb-1.5 pt-1 text-[9px] font-semibold tracking-widest uppercase text-zinc-400 border-b border-zinc-100">
            {pipelineName}
          </div>
          <div className="py-1">
            {stages.map(stage => (
              <button
                key={stage}
                onClick={() => moveToStage(stage)}
                className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center justify-between gap-2 hover:bg-zinc-50 transition-colors ${stage === currentStage ? 'font-medium text-[#1a1a1a]' : 'text-zinc-600'}`}
              >
                <span>{stage}</span>
                {stage === currentStage && <Check className="w-3 h-3 text-[#ff6a3d]" />}
              </button>
            ))}
          </div>
          <button
            onClick={removeFromPipeline}
            className="w-full text-left px-3 py-1.5 text-[11px] text-red-600 flex items-center gap-1.5 hover:bg-red-50 transition-colors border-t border-zinc-100 mt-1"
          >
            <Trash2 className="w-3 h-3" /> Remove from pipeline
          </button>
        </div>
      )}
    </div>
  );
}
