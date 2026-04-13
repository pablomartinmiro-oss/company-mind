'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X, ArrowRight, Ban } from 'lucide-react';
import { TEAM_MEMBERS, STAGE_MILESTONES } from '@/lib/pipeline-config';

interface StageLogEntry {
  id: string;
  stage: string;
  entered_at: string;
  moved_by: string | null;
  source: string | null;
  note: string | null;
  milestone: string | null;
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
  const [savingMilestone, setSavingMilestone] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editMovedBy, setEditMovedBy] = useState('');
  const [editNote, setEditNote] = useState('');

  function toggleLog(pipelineId: string, stage: string) {
    if (openLog?.pipelineId === pipelineId && openLog?.stage === stage) {
      setOpenLog(null);
      setLogForm(null);
      setEditingId(null);
    } else {
      setOpenLog({ pipelineId, stage });
      setLogForm(null);
      setEditingId(null);
    }
  }

  function startEdit(entry: StageLogEntry) {
    setEditingId(entry.id);
    setEditDate(entry.entered_at.slice(0, 10));
    setEditMovedBy(entry.moved_by ?? '');
    setEditNote(entry.note ?? '');
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    await fetch('/api/pipeline/stage-log', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        entered_at: new Date(editDate + 'T12:00:00Z').toISOString(),
        moved_by: editMovedBy || null,
        note: editNote || null,
      }),
    });
    setEditingId(null);
    setSaving(false);
    router.refresh();
  }

  async function handleDeleteLog(logId: string) {
    setSaving(true);
    await fetch('/api/pipeline/stage-log', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: logId }),
    });
    setSaving(false);
    router.refresh();
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

  async function handleMoveToFollowUp(currentPipelineId: string, stage: string) {
    if (!companyId) return;
    // Remove from current pipeline, then enroll in Follow Up at Nurture or Dead
    await fetch('/api/pipeline/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, pipelineId: currentPipelineId }),
    });
    // The move-stage API will create the Follow Up enrollment via the server
    // We need to find the Follow Up pipeline ID — call move-stage with the pipeline name hint
    await fetch('/api/pipeline/move-to-follow-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, stage }),
    });
    router.refresh();
  }

  async function handleMilestone(pipelineId: string, stage: string, milestone: string, contactId: string | null) {
    if (!companyId) return;
    setSavingMilestone(milestone);
    try {
      const res = await fetch('/api/pipeline/move-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          contactId,
          pipelineId,
          newStage: stage,
          movedBy: null,
          note: milestone,
          milestone,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Milestone save failed:', err);
      }
    } catch (e) {
      console.error('Milestone save error:', e);
    }
    setSavingMilestone(null);
    router.refresh();
  }

  return (
    <div className="relative glass-card rounded-3xl overflow-hidden mb-4 max-w-[50%]">
      <div className="glass-card-inner" />
      {enrollments.map((enrollment, idx) => {
        const currentIdx = enrollment.stages.indexOf(enrollment.currentStage);
        const logForStage = (stage: string) =>
          enrollment.stageLog.filter((l) => l.stage === stage);

        // Check which stages have incomplete milestones (past or current stages only)
        const incompleteMilestones = new Set(
          enrollment.stages.slice(0, currentIdx + 1).filter(s => {
            const milestones = STAGE_MILESTONES[s];
            if (!milestones || milestones.length === 0) return false;
            const completedMs = new Set(logForStage(s).filter(l => l.milestone).map(l => l.milestone));
            return milestones.some(ms => !completedMs.has(ms));
          })
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
                        {incompleteMilestones.has(stage) && (
                          <div
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#ebe7e0]"
                            title="Incomplete milestones"
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
            {openLog?.pipelineId === enrollment.pipelineId && (() => {
              const nextIdx = currentIdx + 1;
              const nextStage = nextIdx < enrollment.stages.length ? enrollment.stages[nextIdx] : null;
              const isLastStage = currentIdx === enrollment.stages.length - 1;

              return (
              <div className="bg-white/30 border-t border-white/30 px-4 py-3">
                <div className="mb-2">
                  <span className="text-[13px] font-medium text-[#1a1a1a]">{openLog.stage}</span>
                </div>

                {/* Milestones */}
                {STAGE_MILESTONES[openLog.stage] && (
                  <div className="mb-3 space-y-1">
                    {STAGE_MILESTONES[openLog.stage].map(ms => {
                      const entry = logForStage(openLog.stage).find(e => e.milestone === ms);
                      const done = !!entry;
                      const isEditingMs = editingId === entry?.id;

                      return (
                        <div key={ms}>
                          {!done ? (
                            <button
                              type="button"
                              disabled={savingMilestone === ms}
                              onClick={() => handleMilestone(enrollment.pipelineId, openLog.stage, ms, null)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/40 border border-white/30 cursor-pointer hover:bg-white/60 disabled:opacity-50 transition-all duration-150 text-left"
                            >
                              <div className={`h-4 w-4 rounded flex-shrink-0 ${savingMilestone === ms ? 'bg-zinc-200 animate-pulse' : 'border border-zinc-300'}`} />
                              <span className="text-[11px] text-zinc-600">{ms}</span>
                              {savingMilestone === ms && <span className="ml-auto text-[9px] text-zinc-400">saving...</span>}
                            </button>
                          ) : (
                          <div className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50/60 border border-emerald-200/40 transition-all duration-150">
                            <div className="h-4 w-4 rounded bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span className="text-[11px] text-emerald-700 font-medium flex-1">{ms}</span>
                            {entry && !isEditingMs && (
                              <span className="flex items-center gap-1 text-[9px] text-zinc-400">
                                {new Date(entry.entered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {entry.moved_by ? ` · ${entry.moved_by}` : ''}
                                {entry.source && (
                                  <span className={`font-medium px-1 py-0.5 rounded-full ${SOURCE_BADGE[entry.source] ?? 'bg-zinc-100 text-zinc-500'}`}>
                                    {entry.source}
                                  </span>
                                )}
                              </span>
                            )}
                            {entry && !isEditingMs && companyId && (
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => startEdit(entry)} className="text-zinc-400 hover:text-zinc-700 p-0.5 transition-all duration-150" title="Edit">
                                  <Pencil className="h-2.5 w-2.5" />
                                </button>
                                <button onClick={() => handleDeleteLog(entry.id)} className="text-zinc-400 hover:text-red-500 p-0.5 transition-all duration-150" title="Delete">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          )}

                          {/* Inline edit form */}
                          {isEditingMs && entry && (
                            <div className="ml-6 mt-1 mb-1 bg-white/50 border border-white/30 rounded-lg p-2 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-zinc-400 w-[32px]">Date</label>
                                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                                  className="text-[11px] px-2 py-1 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150" />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-zinc-400 w-[32px]">By</label>
                                <select value={editMovedBy} onChange={(e) => setEditMovedBy(e.target.value)}
                                  className="text-[11px] px-2 py-1 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150">
                                  <option value="">Select...</option>
                                  {TEAM_MEMBERS.map(m => (<option key={m.name} value={m.name}>{m.name}</option>))}
                                </select>
                              </div>
                              <div className="flex justify-end gap-1.5 pt-1">
                                <button onClick={() => setEditingId(null)} className="text-[11px] text-zinc-400 px-2 py-1 hover:text-zinc-700 transition-all duration-150">Cancel</button>
                                <button onClick={saveEdit} disabled={saving} className="text-[11px] px-3 py-1 bg-zinc-900 text-white rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition-all duration-150">
                                  {saving ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stage advancement */}
                {companyId && openLog.stage === enrollment.currentStage && (
                  <div className="pt-2 border-t border-white/30 flex items-center gap-2">
                    {nextStage && (
                      <button
                        onClick={() => handleEditStage(enrollment.pipelineId, nextStage)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-[11px] font-medium rounded-lg hover:bg-zinc-700 transition-all duration-150"
                      >
                        Advance to {nextStage} <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                    {!isLastStage && (
                      <div className="relative group">
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200/60 text-zinc-500 text-[11px] font-medium rounded-lg hover:bg-zinc-50 transition-all duration-150">
                          <Ban className="h-3 w-3" /> Not progressing
                        </button>
                        <div className="absolute left-0 top-full mt-1 bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.2)] py-1 min-w-[140px] hidden group-hover:block z-50">
                          <button
                            onClick={() => handleMoveToFollowUp(enrollment.pipelineId, 'Follow Up')}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-600 hover:bg-zinc-50 transition-colors"
                          >
                            Move to Follow Up
                          </button>
                          <button
                            onClick={() => handleMoveToFollowUp(enrollment.pipelineId, 'Nurture')}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-600 hover:bg-zinc-50 transition-colors"
                          >
                            Move to Nurture
                          </button>
                          <button
                            onClick={() => handleMoveToFollowUp(enrollment.pipelineId, 'Dead')}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50/50 transition-colors"
                          >
                            Move to Dead
                          </button>
                          <div className="border-t border-zinc-100 my-1" />
                          <button
                            onClick={() => handleDelete(enrollment.pipelineId)}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-50/50 transition-colors"
                          >
                            Remove from pipeline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
