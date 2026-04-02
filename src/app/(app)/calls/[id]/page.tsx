export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { formatDuration, timeAgo, scoreGrade } from '@/lib/format';
import { ArrowLeft } from 'lucide-react';
import { CallDetailTabs } from './call-detail-tabs';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

function formatCallType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: call, error } = await supabaseAdmin
    .from('calls').select('*').eq('id', id).eq('tenant_id', TENANT_ID).single();
  if (error || !call) notFound();

  const { data: actions } = await supabaseAdmin
    .from('call_actions').select('*').eq('call_id', id).eq('tenant_id', TENANT_ID).order('created_at', { ascending: true });
  const { data: dataPoints } = await supabaseAdmin
    .from('contact_data_points').select('*').eq('source_call_id', id).eq('tenant_id', TENANT_ID);

  const score = call.score as { overall: number; criteria: Array<{ name: string; score: number; weight: number; evidence: string; feedback: string }> } | null;
  const coaching = call.coaching as { strengths: string[]; improvements: Array<{ area: string; current: string; suggested: string; example_script: string }>; summary: string } | null;
  const overall = score?.overall ?? 0;
  const grade = scoreGrade(overall);

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-10 animate-fade-in">
      {/* Breadcrumb — tertiary */}
      <Link href="/calls" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400 transition-colors hover:text-zinc-700">
        <ArrowLeft className="h-3 w-3" /> Calls
      </Link>

      {/* ── Header with score — Primary layer ── */}
      <div className="mt-6 mb-10 flex items-start gap-6">
        {/* Score — the ONE thing you see first */}
        <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl ${grade.bg}`}>
          <span className={`text-[28px] font-bold font-mono leading-none ${grade.color}`}>{overall}</span>
          <span className={`text-[11px] font-semibold mt-0.5 ${grade.color} opacity-60`}>{grade.letter}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold tracking-tight text-zinc-900">{call.contact_name}</h1>
          {/* Meta — tertiary layer */}
          <div className="mt-1.5 flex items-center gap-3 text-[12px] text-zinc-400">
            <span>{formatCallType(call.call_type)}</span>
            <span className="text-zinc-200">/</span>
            <span className="font-mono">{formatDuration(call.duration_seconds ?? 0)}</span>
            <span className="text-zinc-200">/</span>
            <span>{call.direction}</span>
            <span className="text-zinc-200">/</span>
            <span>{call.called_at ? timeAgo(call.called_at) : ''}</span>
          </div>
          {/* Strengths inline */}
          {coaching?.strengths && coaching.strengths.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {coaching.strengths.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  {s.length > 60 ? s.slice(0, 57) + '...' : s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <CallDetailTabs
        transcript={call.transcript_text ?? ''}
        score={score}
        coaching={coaching}
        callSummary={call.call_summary ?? ''}
        actions={actions ?? []}
        dataPoints={dataPoints ?? []}
      />
    </div>
  );
}
