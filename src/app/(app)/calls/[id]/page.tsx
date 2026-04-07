export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { formatDuration, scoreGrade, scoreColor, scoreBg } from '@/lib/format';
import { CALL_TYPE_LABELS, CALL_TYPE_PILL, OUTCOME_LABELS, OUTCOME_PILL } from '@/lib/pipeline-config';
import { ArrowLeft, User, Clock, MapPin, Star } from 'lucide-react';
import { CallDetailTabs } from './call-detail-tabs';
import { ProcessingStatusBanner } from '@/components/calls/processing-status';
import { getTenantForUser } from '@/lib/get-tenant';

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { tenantId } = await getTenantForUser();
  const { id } = await params;

  const { data: call, error } = await supabaseAdmin
    .from('calls').select('*').eq('id', id).eq('tenant_id', tenantId).single();
  if (error || !call) notFound();

  const [actionsRes, dataPointsRes, contactDpRes, nextStepsRes, pendingDpCountRes] = await Promise.all([
    supabaseAdmin.from('call_actions').select('*').eq('call_id', id).eq('tenant_id', tenantId).order('created_at', { ascending: true }),
    supabaseAdmin.from('contact_data_points').select('*').eq('source_call_id', id).eq('tenant_id', tenantId),
    supabaseAdmin.from('contact_data_points').select('field_name, field_value').eq('tenant_id', tenantId).eq('contact_ghl_id', call.contact_ghl_id).in('field_name', ['company_name', 'address']),
    supabaseAdmin.from('next_steps').select('*').eq('call_id', id).eq('tenant_id', tenantId).order('created_at', { ascending: true }),
    supabaseAdmin.from('data_points').select('id', { count: 'exact', head: true }).eq('call_id', id).eq('tenant_id', tenantId).eq('status', 'pending'),
  ]);

  const actions = actionsRes.data ?? [];
  const dataPoints = dataPointsRes.data ?? [];
  const nextSteps = (nextStepsRes.data ?? []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    action_type: s.action_type as string,
    title: s.title as string,
    description: s.description as string | null,
    status: s.status as string,
  }));
  const pendingDataPoints = pendingDpCountRes.count ?? 0;

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
      {/* ══ PROCESSING STATUS BANNER ══ */}
      {call.processing_status && call.processing_status !== 'complete' && (
        <div className="mx-6 mt-4">
          <ProcessingStatusBanner
            callId={call.id}
            initialStatus={call.processing_status}
            initialError={call.processing_error}
          />
        </div>
      )}

      {/* ══ HEADER — frosted glass ══ */}
      <div className="relative glass-card rounded-3xl overflow-hidden mb-4 mx-6 mt-4 shrink-0">
        <div className="glass-card-inner" />
        <div className="relative px-6 py-5">
          <Link href="/calls" className="text-[12px] text-zinc-500 hover:text-zinc-800 mb-3 inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3 w-3" /> Back to calls
          </Link>

          <div className="flex items-start justify-between gap-4 mt-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-[24px] font-semibold tracking-tight text-zinc-900 leading-tight">{call.contact_name}</h1>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500 flex-wrap">
                <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {call.rep_name ?? 'Pablo Martin'}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-mono"><Clock className="w-3 h-3" /> {formatDuration(call.duration_seconds ?? 0)}</span>
                {call.call_type && (
                  <>
                    <span>·</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CALL_TYPE_PILL[call.call_type] ?? 'bg-zinc-100 text-zinc-500'}`}>
                      {CALL_TYPE_LABELS[call.call_type] ?? call.call_type}
                    </span>
                  </>
                )}
                {call.outcome && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${OUTCOME_PILL[call.outcome] ?? 'bg-zinc-100 text-zinc-400'}`}>
                    {OUTCOME_LABELS[call.outcome] ?? call.outcome}
                  </span>
                )}
                {dpMap.address && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {dpMap.address}</span>
                  </>
                )}
              </div>
              {fullDate && <p className="mt-1.5 text-[11px] text-zinc-400 font-mono">{fullDate}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors">Feedback</button>
              <button className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors inline-flex items-center gap-1">
                <Star className="h-3 w-3" /> Flag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY — two columns ══ */}
      <div className="flex overflow-hidden flex-1">
        {/* LEFT COLUMN — score + strengths + red flags */}
        <div className="w-[260px] shrink-0 border-r border-zinc-100 p-6 overflow-y-auto">
          {/* Overall Grade */}
          <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 text-center mb-3">Overall Grade</p>
          {score === null ? (
            <div className="w-20 h-20 rounded-2xl bg-zinc-100/60 backdrop-blur border border-zinc-200/40 mx-auto flex flex-col items-center justify-center">
              <div className="text-[10px] text-zinc-500 text-center px-1">Not scored</div>
            </div>
          ) : (
            <>
              <div className={`w-20 h-20 rounded-xl mx-auto flex flex-col items-center justify-center ${scoreBg(overall)}`}>
                <span className={`text-[36px] font-bold leading-none ${scoreColor(overall)}`}>{grade.letter}</span>
                <span className={`text-[16px] font-medium mt-1 ${scoreColor(overall)}`}>{overall}%</span>
              </div>
              <p className={`text-[12px] text-center mt-2 cursor-pointer ${scoreColor(overall)}`}>Flag a scoring issue</p>
            </>
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
          nextSteps={nextSteps}
          pendingDataPoints={pendingDataPoints}
          callId={id}
        />
      </div>
    </div>
  );
}
