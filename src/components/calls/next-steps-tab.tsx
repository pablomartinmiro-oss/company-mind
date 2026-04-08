'use client';

import { useState } from 'react';
import { ACTION_TYPE_CONFIG } from '@/lib/pipeline-config';
import { CheckSquare, Calendar, Mail, StickyNote, ArrowRight, Search, Pencil, X, Send } from 'lucide-react';

const ICON_MAP: Record<string, typeof CheckSquare> = { CheckSquare, Calendar, Mail, StickyNote, ArrowRight, Search };

interface NextStep {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  status: string;
}

interface Props {
  steps: NextStep[];
  callId: string;
}

export function NextStepsTab({ steps, callId }: Props) {
  const [items, setItems] = useState(steps);

  const handleAction = async (stepId: string, action: 'push' | 'skip') => {
    setItems(prev => prev.map(s =>
      s.id === stepId
        ? { ...s, status: action === 'push' ? 'pushed' : 'skipped' }
        : s
    ));
    await fetch(`/api/next-steps/${stepId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  };

  if (!items.length) {
    return <div className="text-[13px] text-zinc-400 py-8 text-center">No suggested next steps for this call.</div>;
  }

  return (
    <div className="space-y-3 p-6">
      {items.map(step => {
        const config = ACTION_TYPE_CONFIG[step.action_type] ?? ACTION_TYPE_CONFIG.task;
        const Icon = ICON_MAP[config.icon] ?? CheckSquare;
        const isActed = step.status !== 'pending';

        return (
          <div
            key={step.id}
            className={`relative glass-card rounded-2xl overflow-hidden p-4 transition-opacity ${isActed ? 'opacity-50' : ''}`}
          >
            <div className="glass-card-inner" />
            <div className="relative flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.pillClass}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.pillClass}`}>
                    {config.label}
                  </span>
                  {isActed && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100/60 text-zinc-500">
                      {step.status}
                    </span>
                  )}
                </div>
                <h4 className="text-[13px] font-medium text-[#1a1a1a]">{step.title}</h4>
                {step.description && (
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{step.description}</p>
                )}
              </div>

              {!isActed && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleAction(step.id, 'push')}
                    className="bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white text-[10px] font-medium px-3 py-1.5 rounded-full shadow-[0_2px_8px_rgba(255,106,61,0.25)] hover:from-[#ff8a5d] hover:to-[#ff6a3d] inline-flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Push
                  </button>
                  <button className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[10px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 inline-flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleAction(step.id, 'skip')}
                    className="bg-white/40 backdrop-blur border border-white/60 text-zinc-500 text-[10px] font-medium px-3 py-1.5 rounded-full hover:bg-white/60 inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Skip
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
