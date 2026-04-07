'use client';

import { useState } from 'react';
import { approveAction, rejectAction, approveDataPoint, rejectDataPoint } from '@/app/actions';
import { NEXT_STEP_TYPE_LABELS, NEXT_STEP_TYPE_PILL } from '@/lib/pipeline-config';
import { Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, Heart, AlertTriangle, Info, Pencil, X } from 'lucide-react';

interface ScoreData {
  overall: number;
  criteria: Array<{
    name: string;
    score: number;
    weight: number;
    evidence: string;
    feedback: string;
  }>;
}

interface CoachingData {
  strengths: string[];
  improvements: Array<{
    area: string;
    current: string;
    suggested: string;
    example_script: string;
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

interface DataPoint {
  id: string;
  field_name: string;
  field_value: string;
  confidence: string;
  source: string;
}

interface TranscriptLine {
  speaker: 'rep' | 'contact';
  speakerName: string;
  text: string;
  timestamp?: string;
}

interface KeyMoment {
  time: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

interface Props {
  transcript: string;
  score: ScoreData | null;
  coaching: CoachingData | null;
  callSummary: string;
  actions: Action[];
  dataPoints: DataPoint[];
  duration: number;
  contactGhlId: string;
}

const TABS = ['Coaching', 'Criteria', 'Transcript', 'Next Steps', 'Data Points'] as const;
type Tab = typeof TABS[number];

function formatType(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CallDetailTabs({ transcript, score, coaching, callSummary, actions, dataPoints, duration, contactGhlId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Coaching');
  const pendingActions = actions.filter((a) => a.status === 'suggested');

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
                ? 'text-zinc-900 border-zinc-900'
                : 'text-zinc-400 border-transparent hover:text-zinc-600'
            }`}
          >
            {tab}
            {tab === 'Next Steps' && pendingActions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 ml-1">
                {pendingActions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'Coaching' && <CoachingView coaching={coaching} callSummary={callSummary} />}
        {activeTab === 'Criteria' && <CriteriaView score={score} />}
        {activeTab === 'Transcript' && <TranscriptView text={transcript} duration={duration} />}
        {activeTab === 'Next Steps' && <NextStepsView actions={actions} />}
        {activeTab === 'Data Points' && <DataPointsView dataPoints={dataPoints} contactGhlId={contactGhlId} />}
      </div>
    </div>
  );
}

/* ── Coaching Tab ── */

function CoachingView({ coaching, callSummary }: { coaching: CoachingData | null; callSummary: string }) {
  if (!coaching) return <p className="py-8 text-center text-[13px] text-zinc-400">No coaching data available.</p>;

  return (
    <div>
      {/* Summary */}
      {callSummary && (
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 mb-2 flex items-center gap-1.5">Summary</h3>
          <p className="text-[14px] text-zinc-700 leading-relaxed">{callSummary}</p>
        </div>
      )}

      {/* Strengths */}
      {coaching.strengths && coaching.strengths.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-600">✓</span>
            Strengths
          </h3>
          <div className="space-y-2">
            {coaching.strengths.map((s, i) => (
              <div key={i} className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span className="text-[13px] text-zinc-600 leading-relaxed">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {coaching.improvements && coaching.improvements.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center text-[10px] text-amber-600">⚠</span>
            Red Flags
          </h3>
          <div className="space-y-2">
            {coaching.improvements.map((imp, i) => (
              <div key={i} className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span className="text-[13px] text-zinc-600 leading-relaxed">{imp.area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas for Improvement */}
      {coaching.improvements.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Areas for Improvement
          </h3>
          {coaching.improvements.map((imp, i) => (
            <div key={i} className="mb-6">
              <p className="text-[14px] text-zinc-700 leading-relaxed">
                <span className="font-medium">{imp.area}:</span> {imp.current}
              </p>

              {imp.suggested && (
                <div className="my-3 pl-3 border-l-2 border-zinc-300">
                  <p className="italic text-[13px] text-zinc-500 leading-relaxed">{imp.suggested}</p>
                </div>
              )}

              {imp.example_script && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-600">Script Suggestion</span>
                  </div>
                  <p className="text-[13px] text-blue-900 leading-relaxed">{imp.example_script}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Criteria Tab ── */

function CriteriaView({ score }: { score: ScoreData | null }) {
  if (!score) return <p className="py-8 text-center text-[13px] text-zinc-400">No score data available.</p>;

  function barColor(pct: number) {
    if (pct > 70) return 'bg-emerald-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {score.criteria.map((c) => {
        const maxScore = 10;
        const pct = (c.score / maxScore) * 100;
        return (
          <div key={c.name} className="border border-zinc-100 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[14px] font-medium text-zinc-900">{c.name}</span>
              <span className="text-[14px] font-medium text-zinc-900 font-mono">{c.score}/{maxScore}</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full mb-3">
              <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <p className="text-[13px] text-zinc-500 leading-relaxed">{c.feedback || c.evidence}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Transcript Tab ── */

function TranscriptView({ text, duration }: { text: string; duration: number }) {
  const [playing, setPlaying] = useState(false);

  // Parse transcript
  const lines: TranscriptLine[] = [];
  if (text) {
    const parts = text.split(/\n/).filter(Boolean);
    for (const line of parts) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Rep:')) {
        lines.push({ speaker: 'rep', speakerName: 'Rep', text: trimmed.replace(/^Rep:\s*/, '') });
      } else if (trimmed.startsWith('Prospect:') || trimmed.startsWith('Contact:')) {
        lines.push({ speaker: 'contact', speakerName: 'Contact', text: trimmed.replace(/^(Prospect|Contact):\s*/, '') });
      } else if (lines.length > 0) {
        lines[lines.length - 1].text += ' ' + trimmed;
      }
    }
  }

  const durationStr = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;

  return (
    <div>
      {/* Call Recording Player */}
      <div className="border border-zinc-100 rounded-xl p-4 mb-5">
        <p className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3">Call Recording</p>

        {/* Waveform */}
        <div className="flex items-end gap-[2px] h-[32px]">
          {Array.from({ length: 40 }, (_, i) => {
            const h = 8 + Math.sin(i * 0.7) * 12 + Math.random() * 10;
            return <div key={i} className="flex-1 bg-zinc-200 rounded-sm" style={{ height: `${Math.max(4, h)}px` }} />;
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3">
          <SkipBack className="h-4 w-4 text-zinc-400 cursor-pointer hover:text-zinc-600" />
          <button
            onClick={() => setPlaying(!playing)}
            className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <SkipForward className="h-4 w-4 text-zinc-400 cursor-pointer hover:text-zinc-600" />
          <span className="text-[13px] font-mono text-zinc-500">— / {durationStr}</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="text-[12px] font-medium text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded">1x</button>
            <Volume2 className="h-4 w-4 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Transcript */}
      {lines.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-zinc-400">No transcript available.</p>
      ) : (
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-[11px] font-medium text-zinc-400 w-[80px] shrink-0 pt-1 text-right">
                {line.speakerName}
              </span>
              <div className={`px-3 py-2 rounded-lg text-[13px] leading-relaxed ${
                line.speaker === 'rep'
                  ? 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                  : 'bg-white border border-zinc-200 text-zinc-800 rounded-tr-none'
              }`}>
                {line.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Next Steps Tab ── */

function NextStepsView({ actions }: { actions: Action[] }) {
  const pending = actions.filter((a) => a.status === 'suggested');
  const [pushing, setPushing] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  async function handlePush(action: Action) {
    setPushing((prev) => new Set(prev).add(action.id));
    try {
      await fetch(`/api/calls/${action.id}/next-steps/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.id }),
      });
    } catch { /* ignore */ }
    setPushing((prev) => { const n = new Set(prev); n.delete(action.id); return n; });
  }

  function startEdit(action: Action) {
    setEditingId(action.id);
    setEditText(action.description);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText('');
  }

  async function saveEdit(actionId: string) {
    await rejectAction(actionId);
    setEditingId(null);
    setEditText('');
  }

  function getStepType(action: Action): string {
    const payload = action.suggested_payload as Record<string, unknown> | null;
    return (payload?.type as string) ?? 'follow_up';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[14px] font-medium text-zinc-900">{pending.length} pending</span>
        <button className="border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-50">
          Add Action
        </button>
      </div>

      {actions.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-zinc-400">No actions suggested.</p>
      ) : (
        actions.map((action) => {
          const reasoning = (action.suggested_payload as { reasoning?: string } | null)?.reasoning;
          const stepType = getStepType(action);
          const typePill = NEXT_STEP_TYPE_PILL[stepType] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200';
          const typeLabel = NEXT_STEP_TYPE_LABELS[stepType] ?? formatType(stepType);
          const isEditing = editingId === action.id;
          const isPushing = pushing.has(action.id);

          return (
            <div key={action.id} className="border border-zinc-100 rounded-xl p-4 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${typePill}`}>
                    {typeLabel}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    {formatType(action.action_type)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">AI</span>
                </div>
              </div>

              {isEditing ? (
                <div className="mb-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveEdit(action.id)}
                      className="bg-zinc-900 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-[12px] text-zinc-400 hover:text-zinc-700 px-2 py-1.5 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-zinc-700 mb-2">{action.description}</p>
              )}

              {reasoning && !isEditing && (
                <div className="pl-3 border-l-2 border-zinc-200 italic text-[13px] text-zinc-400 mb-3">
                  {reasoning}
                </div>
              )}

              {action.status === 'suggested' && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePush(action)}
                    disabled={isPushing}
                    className="bg-zinc-900 text-white text-[13px] font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40"
                  >
                    {isPushing ? 'Pushing…' : 'Push to CRM'}
                  </button>
                  <button
                    onClick={() => startEdit(action)}
                    className="border border-zinc-200 text-[13px] text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-50 flex items-center gap-1"
                  >
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

/* ── Data Points Tab ── */

function DataPointsView({ dataPoints, contactGhlId }: { dataPoints: DataPoint[]; contactGhlId: string }) {
  const [approved, setApproved] = useState<Set<string>>(new Set());

  function confidenceBadge(c: string) {
    const n = parseFloat(c);
    if (n >= 0.9) return { cls: 'bg-green-50 text-green-700', label: 'high' };
    if (n >= 0.7) return { cls: 'bg-amber-50 text-amber-700', label: 'medium' };
    return { cls: 'bg-zinc-100 text-zinc-500', label: 'low' };
  }

  async function handleApprove(dp: DataPoint) {
    setApproved((prev) => new Set(prev).add(dp.id));
    await approveDataPoint(dp.id);
    // Also push to contact research
    await fetch(`/api/contacts/${contactGhlId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName: dp.field_name, fieldValue: dp.field_value, section: 'Sales Context', source: 'ai' }),
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[16px] font-medium text-zinc-900">Deal Intelligence from Call</span>
        <button className="bg-zinc-900 text-white text-[13px] font-medium px-3 py-1.5 rounded-lg">
          Approve All ({dataPoints.filter((dp) => !approved.has(dp.id) && dp.source === 'call').length})
        </button>
      </div>

      {dataPoints.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-zinc-400">No data points extracted.</p>
      ) : (
        dataPoints.map((dp) => {
          const conf = confidenceBadge(dp.confidence);
          const isApproved = approved.has(dp.id);

          return (
            <div key={dp.id} className={`flex items-start gap-3 py-3 border-b border-zinc-50 ${isApproved ? 'opacity-50' : ''}`}>
              <div className="flex-1">
                <span className="text-[13px] font-medium text-zinc-700">{formatType(dp.field_name)}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[13px] text-zinc-900 font-medium">{dp.field_value}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${conf.cls}`}>
                  {conf.label}
                </span>
              </div>

              {!isApproved && dp.source === 'call' ? (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(dp)}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[12px] font-medium px-2.5 py-1 rounded-lg"
                  >
                    Approve
                  </button>
                  <button className="text-[12px] text-zinc-400 hover:text-zinc-700 px-2 py-1">Edit</button>
                  <form action={rejectDataPoint.bind(null, dp.id)}>
                    <button type="submit" className="text-[12px] text-zinc-400 hover:text-zinc-700 px-2 py-1">Skip</button>
                  </form>
                </div>
              ) : isApproved ? (
                <span className="text-emerald-600 text-[12px]">✓</span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
