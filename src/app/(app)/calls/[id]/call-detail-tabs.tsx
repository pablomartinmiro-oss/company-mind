'use client';

import { useState } from 'react';
import { approveAction, rejectAction } from '@/app/actions';
import { NEXT_STEP_TYPE_LABELS, NEXT_STEP_TYPE_PILL } from '@/lib/pipeline-config';
import { ChevronDown, Pencil, X, Check } from 'lucide-react';
import { scoreColor, scoreGrade } from '@/lib/format';
import { NextStepsTab } from '@/components/calls/next-steps-tab';
import { DataPointsView } from '@/components/calls/data-points-view';
import { CallCompanyLink } from '@/components/calls/call-company-link';

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

function txt(item: unknown): string {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    const o = item as Record<string, unknown>;
    return String(o.detail ?? o.tip ?? o.area ?? o.title ?? o.text ?? '');
  }
  return String(item);
}

export function CallDetailTabs({ score, coaching, callSummary, actions, nextSteps, pendingDataPoints, callId, contactGhlId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex border-b border-zinc-200/60 shrink-0 px-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[14px] font-medium border-b-2 pb-3 -mb-px px-4 transition-all ${
              activeTab === tab ? 'text-[#1a1a1a] border-zinc-900' : 'text-zinc-400 border-transparent hover:text-zinc-600'
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

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'Overview' && <OverviewTab score={score} coaching={coaching} callSummary={callSummary} contactGhlId={contactGhlId} />}
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

/* ══════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════ */

function OverviewTab({ score, coaching, callSummary, contactGhlId }: { score: ScoreData | null; coaching: CoachingData | null; callSummary: string; contactGhlId?: string }) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [strengthsExpanded, setStrengthsExpanded] = useState(false);
  const [watchoutsExpanded, setWatchoutsExpanded] = useState(false);
  const [checkedPrep, setCheckedPrep] = useState<Set<number>>(new Set());

  const strengths = coaching?.strengths ?? [];
  const watchouts = [...(coaching?.red_flags ?? []), ...coaching?.improvements ?? []];
  const sentiment = deriveSentiment(coaching);
  const badges = deriveBadges(score, coaching);
  const headline = coaching?.summary ? coaching.summary.split(/[.!]/)[0] + '.' : null;

  // Derive prep items from improvements/weaknesses
  const prepItems = watchouts.slice(0, 4).map(w => 'Address: ' + txt(w).split('—')[0].split('–')[0].trim().slice(0, 80));

  const hasAnyContent = callSummary || score || (strengths.length > 0) || (watchouts.length > 0);

  if (!hasAnyContent) {
    return <p className="py-8 text-center text-[13px] text-zinc-400 italic">Analysis not available yet.</p>;
  }

  return (
    <div>
      {contactGhlId && <CallCompanyLink contactGhlId={contactGhlId} />}
      {/* ── Section 1: AI Summary (collapsible) ── */}
      {callSummary && (
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4 mb-4">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">AI SUMMARY</span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400">Scout · AI Generated</span>
              <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${summaryExpanded ? 'rotate-180' : ''}`} />
            </span>
          </button>
          <p className={`text-[13px] text-zinc-600 leading-relaxed mt-2 transition-all duration-200 ${summaryExpanded ? '' : 'line-clamp-2'}`}>
            {callSummary}
          </p>
        </div>
      )}

      {/* ── Section 2: Score + Headline + Badges ── */}
      {score && (
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className={`h-[56px] w-[56px] rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${
              score.overall >= 70 ? 'border-emerald-400' : score.overall >= 40 ? 'border-amber-400' : 'border-red-400'
            }`}>
              <span className={`text-[20px] font-medium font-mono ${scoreColor(score.overall)}`}>{score.overall}</span>
              <span className={`text-[11px] -mt-0.5 ${scoreColor(score.overall)}`}>{scoreGrade(score.overall).letter}</span>
            </div>
            <div className="flex-1 min-w-0">
              {headline && <p className="text-[14px] font-medium text-zinc-900 leading-snug mb-3">{headline}</p>}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <span key={i} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${b.classes}`}>{b.label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Criteria bars if available */}
          {score.criteria && score.criteria.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              {score.criteria.map(c => {
                const pct = (c.score / 10) * 100;
                return (
                  <div key={c.name} className="flex items-center gap-3 mb-3 last:mb-0">
                    <span className="text-[11px] text-zinc-500 w-[110px] shrink-0 truncate">{c.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-zinc-100">
                      <div className={`h-2 rounded-full transition-all duration-500 ${pct > 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 w-[36px] text-right shrink-0">{c.score}/10</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: Deal Snapshot + Sentiment ── */}
      {(sentiment > 0) && (
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4 mb-4">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-3 block">DEAL SNAPSHOT</span>

          {/* Sentiment meter */}
          <div className="mb-1">
            <span className="text-[10px] text-zinc-400 block mb-1.5">PROSPECT SENTIMENT</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className={`w-3 h-3 rounded-full ${
                    n <= sentiment
                      ? sentiment <= 2 ? 'bg-red-400' : sentiment <= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                      : 'bg-zinc-100'
                  }`} />
                ))}
              </div>
              <span className="text-[10px] text-zinc-400">
                {sentiment <= 2 ? 'Cold' : sentiment <= 3 ? 'Warm' : 'Hot'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 4: What Went Well + Watch Out For ── */}
      {(strengths.length > 0 || watchouts.length > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* What Went Well */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-700 mb-3 block">WHAT WENT WELL</span>
            {strengths.length > 0 ? (
              <>
                {(strengthsExpanded ? strengths : strengths.slice(0, 3)).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2.5 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] text-emerald-900 leading-relaxed">{txt(s)}</span>
                  </div>
                ))}
                {strengths.length > 3 && !strengthsExpanded && (
                  <button onClick={() => setStrengthsExpanded(true)} className="text-[11px] text-emerald-600 cursor-pointer hover:text-emerald-800 mt-1">
                    + {strengths.length - 3} more
                  </button>
                )}
              </>
            ) : <p className="text-[12px] text-emerald-700/60 italic">None noted.</p>}
          </div>

          {/* Watch Out For */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-700 mb-3 block">WATCH OUT FOR</span>
            {watchouts.length > 0 ? (
              <>
                {(watchoutsExpanded ? watchouts : watchouts.slice(0, 3)).map((w, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2.5 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] text-amber-900 leading-relaxed">{txt(w)}</span>
                  </div>
                ))}
                {watchouts.length > 3 && !watchoutsExpanded && (
                  <button onClick={() => setWatchoutsExpanded(true)} className="text-[11px] text-amber-600 cursor-pointer hover:text-amber-800 mt-1">
                    + {watchouts.length - 3} more
                  </button>
                )}
              </>
            ) : <p className="text-[12px] text-amber-700/60 italic">Nothing flagged.</p>}
          </div>
        </div>
      )}

      {/* ── Section 5: Before Next Call ── */}
      {prepItems.length > 0 && (
        <div className="border-l-4 border-blue-400 bg-blue-50 rounded-r-xl px-4 py-4">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-blue-700 mb-3 block">BEFORE NEXT CALL</span>
          {prepItems.map((item, i) => {
            const checked = checkedPrep.has(i);
            return (
              <div
                key={i}
                onClick={() => setCheckedPrep(prev => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i); else next.add(i);
                  return next;
                })}
                className="flex items-start gap-2.5 mb-2.5 last:mb-0 cursor-pointer"
              >
                <div className={`h-4 w-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                  checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-blue-300'
                }`}>
                  {checked && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className={`text-[12px] text-blue-900 leading-relaxed ${checked ? 'line-through opacity-50' : ''}`}>
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */

function deriveSentiment(coaching: CoachingData | null): number {
  if (!coaching) return 0;
  // Map sentiment string to 1-5 scale
  const summaryLower = coaching.summary?.toLowerCase() ?? '';
  const hasPositive = summaryLower.includes('positive') || summaryLower.includes('strong') || summaryLower.includes('excited');
  const hasNegative = summaryLower.includes('negative') || summaryLower.includes('cold') || summaryLower.includes('disengaged');

  if (hasNegative) return 2;
  if (hasPositive && coaching.strengths.length >= 5) return 5;
  if (hasPositive) return 4;
  if (coaching.strengths.length > coaching.improvements.length) return 4;
  return 3;
}

function deriveBadges(score: ScoreData | null, coaching: CoachingData | null): { label: string; classes: string }[] {
  if (!coaching) return [];
  const badges: { label: string; classes: string }[] = [];
  const summary = coaching.summary?.toLowerCase() ?? '';
  const strengths = coaching.strengths.map(s => txt(s).toLowerCase()).join(' ');
  const watchouts = [...(coaching.red_flags ?? []), ...coaching.improvements].map(w => txt(w).toLowerCase()).join(' ');

  // Intent signal
  if (strengths.includes('commitment') || strengths.includes('ready') || strengths.includes('agreed') || strengths.includes('like it')) {
    badges.push({ label: 'Strong Intent', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' });
  } else if (strengths.includes('engaged') || strengths.includes('interest')) {
    badges.push({ label: 'Soft Commitment', classes: 'bg-amber-50 text-amber-700 border border-amber-200' });
  }

  // Next step signal
  if (strengths.includes('next step') || strengths.includes('follow-up') || strengths.includes('tuesday') || strengths.includes('monday')) {
    badges.push({ label: 'Next Step Set', classes: 'bg-blue-50 text-blue-700 border border-blue-200' });
  } else if (watchouts.includes('no next step') || watchouts.includes('not confirmed')) {
    badges.push({ label: 'Follow-up Soft', classes: 'bg-amber-50 text-amber-700 border border-amber-200' });
  }

  // Risk signal
  if (watchouts.includes('budget') || watchouts.includes('pricing')) {
    badges.push({ label: 'Budget Unclear', classes: 'bg-amber-50 text-amber-700 border border-amber-200' });
  } else if (score && score.overall >= 70) {
    badges.push({ label: 'Low Risk', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' });
  }

  return badges.slice(0, 3);
}

/* ══════════════════════════════════════
   NEXT STEPS (legacy actions fallback)
   ══════════════════════════════════════ */

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
