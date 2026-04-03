export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { formatDuration, scoreGrade, scoreColor, scoreBg } from '@/lib/format';
import { CALL_TYPE_LABELS, CALL_TYPE_PILL, OUTCOME_LABELS, OUTCOME_PILL } from '@/lib/pipeline-config';
import { ArrowLeft, User, Clock, MapPin, Star } from 'lucide-react';
import { CallDetailTabs } from './call-detail-tabs';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: call, error } = await supabaseAdmin
    .from('calls').select('*').eq('id', id).eq('tenant_id', TENANT_ID).single();
  if (error || !call) notFound();

  const [actionsRes, dataPointsRes, contactDpRes] = await Promise.all([
    supabaseAdmin.from('call_actions').select('*').eq('call_id', id).eq('tenant_id', TENANT_ID).order('created_at', { ascending: true }),
    supabaseAdmin.from('contact_data_points').select('*').eq('source_call_id', id).eq('tenant_id', TENANT_ID),
    supabaseAdmin.from('contact_data_points').select('field_name, field_value').eq('tenant_id', TENANT_ID).eq('contact_ghl_id', call.contact_ghl_id).in('field_name', ['company_name', 'address']),
  ]);

  const actions = actionsRes.data ?? [];
  const dataPoints = dataPointsRes.data ?? [];

  const dpMap: Record<string, string> = {};
  for (const dp of contactDpRes.data ?? []) {
    dpMap[dp.field_name] = dp.field_value;
  }

  const score = call.score as { overall: number; criteria: Array<{ name: string; score: number; weight: number; evidence: string; feedback: string }> } | null;
  const coaching = call.coaching as { strengths: string[]; improvements: Array<{ area: string; current: string; suggested: string; example_script: string }>; summary: string } | null;
  const overall = score?.overall ?? 0;
  const grade = scoreGrade(overall);

  // Format full date
  const calledDate = call.called_at ? new Date(call.called_at) : null;
  const fullDate = calledDate
    ? calledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      + ' at ' + calledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* ══ HEADER ══ */}
      <div className="border-b border-zinc-200/60 px-6 py-4 bg-white shrink-0">
        {/* Row 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/calls" className="text-[13px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mr-4">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <h1 className="text-[22px] font-medium text-zinc-900">{call.contact_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-50">Feedback</button>
            <button className="border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-50">Reclassify</button>
            <button className="border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-50 flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> Flag
            </button>
          </div>
        </div>

        {/* Row 2 — meta pills */}
        <div className="flex items-center gap-3 mt-2 flex-wrap text-[13px] text-zinc-500">
          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {call.rep_name ?? 'Pablo Martin'}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDuration(call.duration_seconds ?? 0)}</span>
          {call.call_type && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CALL_TYPE_PILL[call.call_type] ?? 'bg-zinc-100 text-zinc-500'}`}>
              {CALL_TYPE_LABELS[call.call_type] ?? call.call_type}
            </span>
          )}
          {call.outcome && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${OUTCOME_PILL[call.outcome] ?? 'bg-zinc-100 text-zinc-400'}`}>
              {OUTCOME_LABELS[call.outcome] ?? call.outcome}
            </span>
          )}
          {dpMap.address && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {dpMap.address}</span>
          )}
        </div>

        {/* Row 3 — full date */}
        {fullDate && <p className="mt-1 text-[13px] text-zinc-400">{fullDate}</p>}
      </div>

      {/* ══ BODY — two columns ══ */}
      <div className="flex overflow-hidden flex-1">
        {/* LEFT COLUMN — score + strengths + red flags */}
        <div className="w-[260px] shrink-0 border-r border-zinc-100 p-6 overflow-y-auto">
          {/* Overall Grade */}
          <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 text-center mb-3">Overall Grade</p>
          <div className={`w-20 h-20 rounded-xl mx-auto flex flex-col items-center justify-center ${scoreBg(overall)}`}>
            <span className={`text-[36px] font-bold leading-none ${scoreColor(overall)}`}>{grade.letter}</span>
            <span className={`text-[16px] font-medium mt-1 ${scoreColor(overall)}`}>{overall}%</span>
          </div>
          <p className={`text-[12px] text-center mt-2 cursor-pointer ${scoreColor(overall)}`}>Flag a scoring issue</p>

          {/* Strengths */}
          {coaching?.strengths && coaching.strengths.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-600">✓</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Strengths</span>
              </div>
              <div className="mt-2 space-y-2">
                {coaching.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span className="text-[13px] text-zinc-600 leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags — from improvements as proxy */}
          {coaching?.improvements && coaching.improvements.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center text-[10px] text-amber-600">⚠</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Red Flags</span>
              </div>
              <div className="mt-2 space-y-2">
                {coaching.improvements.map((imp, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    <span className="text-[13px] text-zinc-600 leading-relaxed">{imp.area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — tabs */}
        <CallDetailTabs
          transcript={call.transcript_text ?? ''}
          score={score}
          coaching={coaching}
          callSummary={call.call_summary ?? ''}
          actions={actions}
          dataPoints={dataPoints}
          duration={call.duration_seconds ?? 0}
          contactGhlId={call.contact_ghl_id ?? ''}
        />
      </div>
    </div>
  );
}
