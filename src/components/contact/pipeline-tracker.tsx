'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  companyId?: string;
}

const SOURCE_BADGE: Record<string, string> = {
  api: 'bg-violet-50 text-violet-700',
  ai: 'bg-blue-50 text-blue-700',
  manual: 'bg-green-50 text-green-700',
};

export function PipelineTracker({ enrollments, companyId }: Props) {
  const router = useRouter();
  const [openLog, setOpenLog] = useState<{ pipelineId: string; stage: string } | null>(null);
  const [logForm, setLogForm] = useState<{ pipelineId: string; stage: string } | null>(null);
  const [logNote, setLogNote] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleLog(pipelineId: string, stage: string) {
    if (openLog?.pipelineId === pipelineId && openLog?.stage === stage) {
      setOpenLog(null);
      setLogForm(null);
    } else {
      setOpenLog({ pipelineId, stage });
      setLogForm(null);
    }
  }

  async function handleAddLog(pipelineId: string, stage: string) {
    if (!companyId || !logNote.trim()) return;
    setSaving(true);
    await fetch('/api/pipeline/move-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        pipelineId,
        newStage: stage,
        movedBy: 'manual',
        note: logNote.trim(),
      }),
    });
    setLogNote('');
    setLogForm(null);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(pipelineId: string) {
    if (!companyId) return;
    if (!confirm('Remove this company from the pipeline?')) return;
    await fetch('/api/pipeline/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, pipelineId }),
    });
    router.refresh();
  }

  async function handleEditStage(pipelineId: string, newStage: string) {
    if (!companyId) return;
    await fetch('/api/pipeline/move-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        pipelineId,
        newStage,
        movedBy: 'manual',
      }),
    });
    router.refresh();
  }

  return (
    <div className="relative glass-card rounded-3xl overflow-hidden mb-4 max-w-[50%]">
      <div className="glass-card-inner" />
      {enrollments.map((enrollment, idx) => {
        const currentIdx = enrollment.stages.indexOf(enrollment.currentStage);
        const logForStage = (stage: string) =>
          enrollment.stageLog.filter((l) => l.stage === stage);

        // Stages up to current that have no log entry
        const loggedStages = new Set(enrollment.stageLog.map(l => l.stage));
        const missingLogs = new Set(
          enrollment.stages.slice(0, currentIdx + 1).filter(s => !loggedStages.has(s))
        );

        return (
          <div key={enrollment.pipelineId} className={`relative ${idx > 0 ? 'border-t border-white/30' : ''}`}>
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
                      <div className={`flex-1 border-t border-dashed mb-[14px] min-w-[12px] ${isPast ? 'border-zinc-400' : 'border-zinc-300/50'}`} />
                    )}
                    <button
                      onClick={() => toggleLog(enrollment.pipelineId, stage)}
                      className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                    >
                      <div className="relative">
                        <div className={`h-[26px] w-[26px] rounded-full border flex items-center justify-center ${
                          isActive
                            ? 'bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white border-[#ff6a3d] text-[10px] font-bold shadow-[0_2px_8px_rgba(255,106,61,0.35)]'
                            : isPast
                            ? 'border-zinc-400 bg-zinc-100 text-zinc-600 text-[10px]'
                            : 'border-zinc-300 bg-white/30 text-zinc-400 text-[10px] font-mono'
                        } ${isOpen ? 'border-[2px] border-zinc-700' : ''}`}>
                          {isPast ? '✓' : sIdx + 1}
                        </div>
                        {missingLogs.has(stage) && (
                          <div
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#ebe7e0]"
                            title="No stage log entry"
                          />
                        )}
                      </div>
                      <span className={`text-[8px] text-center max-w-[48px] leading-tight ${
                        isActive ? 'font-semibold text-[#ff6a3d]' : isPast ? 'text-zinc-600' : 'text-zinc-500'
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
              <div className="bg-white/30 border-t border-white/30 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-[#1a1a1a]">{openLog.stage}</span>
                  {companyId && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLogForm(logForm ? null : { pipelineId: enrollment.pipelineId, stage: openLog.stage })}
                        className="bg-white/60 backdrop-blur text-zinc-700 border border-white/60 text-[11px] px-2.5 py-1 rounded-full hover:bg-white/80 transition-all duration-150"
                      >
                        + Log
                      </button>
                      {/* Edit: move to a different stage */}
                      <div className="relative group">
                        <button className="border border-white/60 text-[11px] px-2.5 py-1 rounded-full text-zinc-500 hover:bg-white/40 transition-all duration-150">
                          Edit
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.2)] py-1 min-w-[120px] hidden group-hover:block z-50">
                          {enrollment.stages.filter(s => s !== enrollment.currentStage).map(s => (
                            <button
                              key={s}
                              onClick={() => handleEditStage(enrollment.pipelineId, s)}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-600 hover:bg-zinc-50 transition-colors"
                            >
                              Move to {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(enrollment.pipelineId)}
                        className="border border-white/60 text-[11px] px-2.5 py-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50/50 transition-all duration-150"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Add log form */}
                {logForm?.pipelineId === enrollment.pipelineId && logForm?.stage === openLog.stage && (
                  <div className="mb-3 bg-white/50 border border-white/30 rounded-lg p-2.5">
                    <textarea
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      placeholder="Add a note about this stage..."
                      className="w-full text-[12px] px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 resize-none transition-all duration-150"
                      rows={2}
                    />
                    <div className="flex justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => { setLogForm(null); setLogNote(''); }}
                        className="text-[11px] text-zinc-400 px-2 py-1 hover:text-zinc-700 transition-all duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddLog(enrollment.pipelineId, openLog.stage)}
                        disabled={!logNote.trim() || saving}
                        className="text-[11px] px-3 py-1 bg-zinc-900 text-white rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition-all duration-150"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}

                {logForStage(openLog.stage).length === 0 && !logForm ? (
                  <p className="text-[11px] text-zinc-500">No log entries.</p>
                ) : (
                  logForStage(openLog.stage).map((entry) => (
                    <div key={entry.id} className="bg-white/50 border border-white/30 rounded-lg p-2.5 mb-2">
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
                        <p className="text-[11px] text-zinc-500 mt-1.5 pt-1.5 border-t border-white/30">{entry.note}</p>
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
