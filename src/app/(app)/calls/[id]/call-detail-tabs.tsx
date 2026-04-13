'use client';

import { useState } from 'react';
import { approveAction, rejectAction } from '@/app/actions';
import { NEXT_STEP_TYPE_LABELS, NEXT_STEP_TYPE_PILL } from '@/lib/pipeline-config';
import { Pencil, X, RefreshCw } from 'lucide-react';
import { scoreColor } from '@/lib/format';
import { NextStepsTab } from '@/components/calls/next-steps-tab';
import { DataPointsView } from '@/components/calls/data-points-view';

interface ScoreData {
  overall: number;
  criteria?: Array<{
    name: string;
    score: number;
    weight: number;
    evidence: string;
    feedback: string;
  }>;
}

interface CoachingData {
  strengths: (string | { title: string; detail: string })[];
  red_flags?: (string | { title: string; detail: string })[];
  improvements: Array<{
    area: string;
    tip?: string;
    current?: string;
    suggested?: string;
    example_script?: string;
  }>;
  summary: string;
}

interface Action {
  id: string;
  action_type: string;
  description: string;
  priority: string;
  status: string;
  suggested_payload?: { reasoning?: string } | null;
}

interface NextStepItem {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  status: string;
}

interface Props {
  transcript: string;
  score: ScoreData | null;
  coaching: CoachingData | null;
  callSummary: string;
  actions: Action[];
  dataPoints?: unknown[];
  duration: number;
  contactGhlId?: string;
  nextSteps?: NextStepItem[];
  pendingDataPoints?: number;
  callId?: string;
  recordingUrl?: string | null;
}

const TABS = ['Overview', 'Next Steps', 'Data Points'] as const;
type Tab = typeof TABS[number];

function itemText(item: string | { title: string; detail?: string }): string {
  return typeof item === 'string' ? item : item.detail ?? item.title;
}

export function CallDetailTabs({ score, coaching, callSummary, actions, nextSteps, pendingDataPoints, callId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200/60 shrink-0 px-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[14px] font-medium border-b-2 pb-3 -mb-px px-4 transition-all ${
              activeTab === tab
                ? 'text-[#1a1a1a] border-zinc-900'
                : 'text-zinc-400 border-transparent hover:text-zinc-600'
            }`}
          >
            {tab}
            {tab === 'Next Steps' && (nextSteps ?? []).filter(s => s.status === 'pending').length > 0 && (
              <span className="ml-1.5 text-[9px] font-semibold bg-[#ff6a3d] text-white rounded-full px-1.5 py-0.5 min-w-[18px] inline-flex items-center justify-center">
                {(nextSteps ?? []).filter(s => s.status === 'pending').length}
              </span>
            )}
            {tab === 'Data Points' && (pendingDataPoints ?? 0) > 0 && (
              <span className="ml-1.5 text-[9px] font-semibold bg-[#ff6a3d] text-white rounded-full px-1.5 py-0.5 min-w-[18px] inline-flex items-center justify-center">
                {pendingDataPoints}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'Overview' && (
          <OverviewTab score={score} coaching={coaching} callSummary={callSummary} />
        )}
        {activeTab === 'Next Steps' && (
          nextSteps && nextSteps.length > 0
            ? <NextStepsTab steps={nextSteps} callId={callId ?? ''} />
            : <NextStepsView actions={actions} callId={callId ?? ''} />
        )}
        {activeTab === 'Data Points' && <DataPointsView callId={callId ?? ''} />}
      </div>
    </div>
  );
}

/* ── Overview Tab ── */

function OverviewTab({ score, coaching, callSummary }: { score: ScoreData | null; coaching: CoachingData | null; callSummary: string }) {
  return (
    <div>
      {/* Section 1: AI Summary */}
      {callSummary && (
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">AI SUMMARY</span>
          </div>
          <p className="text-[13px] text-zinc-600 leading-relaxed">{callSummary}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Scout · AI Generated</p>
        </div>
      )}

      {/* Section 2: Coaching Scores */}
      {score && (
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-[52px] w-[52px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              score.overall >= 70 ? 'border-emerald-400' : score.overall >= 40 ? 'border-amber-400' : 'border-red-400'
            }`}>
              <span className={`text-[18px] font-medium font-mono ${scoreColor(score.overall)}`}>{score.overall}</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-zinc-900">
                {coaching?.summary ? coaching.summary.split('.')[0] + '.' : 'Call scored'}
              </p>
            </div>
          </div>

          {score.criteria && score.criteria.length > 0 && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {score.criteria.map(c => {
                const pct = (c.score / 10) * 100;
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500 w-[120px] shrink-0 truncate">{c.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${pct > 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 w-[32px] text-right">{c.score}/10</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Section 3: What Went Well + Watch Out For */}
      {coaching && (coaching.strengths.length > 0 || coaching.improvements.length > 0 || (coaching.red_flags ?? []).length > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* What Went Well */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-700 mb-3 block">
              WHAT WENT WELL
            </span>
            {coaching.strengths.length > 0 ? coaching.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-2.5 last:mb-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="text-[12px] text-emerald-900 leading-relaxed">{itemText(s)}</span>
              </div>
            )) : (
              <p className="text-[12px] text-emerald-700/60">No strengths noted.</p>
            )}
          </div>

          {/* Watch Out For */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-700 mb-3 block">
              WATCH OUT FOR
            </span>
            {[...(coaching.red_flags ?? []), ...coaching.improvements].length > 0 ? (
              [...(coaching.red_flags ?? []), ...coaching.improvements].map((item, i) => {
                const text = typeof item === 'string' ? item
                  : 'detail' in item ? item.detail ?? (item as { title: string }).title
                  : 'area' in item ? ((item as { area: string; tip?: string }).tip ?? (item as { area: string }).area)
                  : String(item);
                return (
                  <div key={i} className="flex items-start gap-2 mb-2.5 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] text-amber-900 leading-relaxed">{text}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-[12px] text-amber-700/60">Nothing flagged.</p>
            )}
          </div>
        </div>
      )}

      {/* Section 4: For Next Call */}
      {coaching?.summary && (
        <div className="border-l-4 border-blue-400 bg-blue-50 rounded-r-xl px-4 py-3">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-blue-700 mb-2 block">
            FOR NEXT CALL
          </span>
          <p className="text-[12px] text-blue-900 leading-relaxed">{coaching.summary}</p>
        </div>
      )}

      {/* Empty state */}
      {!callSummary && !score && !coaching && (
        <p className="py-8 text-center text-[13px] text-zinc-400">No analysis data available yet.</p>
      )}
    </div>
  );
}

/* ── Next Steps (legacy actions fallback) ── */

function NextStepsView({ actions, callId }: { actions: Action[]; callId: string }) {
  const pending = actions.filter((a) => a.status === 'suggested');
  const [pushing, setPushing] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function formatType(s: string) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function handlePush(action: Action) {
    setPushing((prev) => new Set(prev).add(action.id));
    try {
      await fetch(`/api/calls/${callId}/next-steps/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.id }),
      });
    } catch { /* ignore */ }
    setPushing((prev) => { const n = new Set(prev); n.delete(action.id); return n; });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[14px] font-medium text-[#1a1a1a]">{pending.length} pending</span>
      </div>

      {actions.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-zinc-400">No actions suggested.</p>
      ) : (
        actions.map((action) => {
          const reasoning = (action.suggested_payload as { reasoning?: string } | null)?.reasoning;
          const stepType = (action.suggested_payload as Record<string, unknown> | null)?.type as string ?? 'follow_up';
          const typePill = NEXT_STEP_TYPE_PILL[stepType] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200';
          const typeLabel = NEXT_STEP_TYPE_LABELS[stepType] ?? formatType(stepType);
          const isPushing = pushing.has(action.id);
          const isEditing = editingId === action.id;

          return (
            <div key={action.id} className="border border-zinc-100 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${typePill}`}>{typeLabel}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">AI</span>
              </div>

              {isEditing ? (
                <div className="mb-3">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
                    className="w-full text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 resize-none" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { rejectAction(action.id); setEditingId(null); }}
                      className="bg-zinc-900 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg">Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="text-[12px] text-zinc-400 hover:text-zinc-700 px-2 py-1.5 flex items-center gap-1">
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-zinc-700 mb-2">{action.description}</p>
              )}

              {reasoning && !isEditing && (
                <div className="pl-3 border-l-2 border-zinc-200 italic text-[13px] text-zinc-400 mb-3">{reasoning}</div>
              )}

              {action.status === 'suggested' && !isEditing && (
                <div className="flex gap-2">
                  <button onClick={() => handlePush(action)} disabled={isPushing}
                    className="bg-zinc-900 text-white text-[13px] font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40">
                    {isPushing ? 'Pushing…' : 'Push to CRM'}
                  </button>
                  <button onClick={() => { setEditingId(action.id); setEditText(action.description); }}
                    className="border border-zinc-200 text-[13px] text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-50 flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <form action={rejectAction.bind(null, action.id)}>
                    <button type="submit" className="text-[13px] text-zinc-400 hover:text-zinc-700 px-2 py-1.5">Skip</button>
                  </form>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
