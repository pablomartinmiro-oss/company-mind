import Link from 'next/link';
import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreGrade, scoreBg, scoreColor, formatDuration, formatExactDateTime } from '@/lib/format';
import { CALL_TYPE_LABELS, CALL_TYPE_PILL, OUTCOME_LABELS, OUTCOME_PILL } from '@/lib/pipeline-config';
import { StatCard } from '@/components/ui/stat-card';
import { CallFilters } from '@/components/calls/call-filters';
import { getTenantForUser } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

type Tab = 'all' | 'needs_review' | 'skipped' | 'archived';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All calls' },
  { key: 'needs_review', label: 'Needs review' },
  { key: 'skipped', label: 'Skipped' },
  { key: 'archived', label: 'Archived' },
];

interface CallRow {
  id: string;
  contact_name: string;
  contact_ghl_id: string;
  call_type: string | null;
  outcome: string | null;
  score: { overall: number; criteria?: unknown[] } | null;
  duration_seconds: number | null;
  called_at: string;
  call_summary: string | null;
  processing_status: string | null;
  archived: boolean | null;
}

interface SearchParams {
  tab?: string;
  time?: string;
  type?: string;
  outcome?: string;
}

export default async function CallsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { tenantId } = await getTenantForUser();
  const params = await searchParams;
  const tab = (params.tab ?? 'all') as Tab;
  const timeFilter = params.time ?? '7';
  const typeFilter = params.type ?? '';
  const outcomeFilter = params.outcome ?? '';

  let query = supabaseAdmin
    .from('calls')
    .select('id, contact_name, contact_ghl_id, call_type, outcome, score, duration_seconds, called_at, call_summary, processing_status, archived')
    .eq('tenant_id', tenantId)
    .order('called_at', { ascending: false });

  if (tab === 'all') {
    query = query.gte('duration_seconds', 60).neq('processing_status', 'error');
  } else if (tab === 'needs_review') {
    query = query.eq('processing_status', 'error');
  } else if (tab === 'skipped') {
    query = query.lt('duration_seconds', 60);
  } else if (tab === 'archived') {
    query = query.eq('archived', true);
  }

  if (timeFilter === '7') {
    query = query.gte('called_at', new Date(Date.now() - 7 * 86400000).toISOString());
  } else if (timeFilter === '30') {
    query = query.gte('called_at', new Date(Date.now() - 30 * 86400000).toISOString());
  }

  if (typeFilter) query = query.eq('call_type', typeFilter);
  if (outcomeFilter) query = query.eq('outcome', outcomeFilter);

  const { data: calls, error } = await query;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString();

  const [allCount, reviewCount, skippedCount, archivedCount, todayCount, weekCount, scoredCalls] = await Promise.all([
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('duration_seconds', 60).neq('processing_status', 'error'),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('processing_status', 'error'),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).lt('duration_seconds', 60),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('archived', true),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('called_at', todayStart.toISOString()),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('called_at', weekStart),
    supabaseAdmin.from('calls').select('score').eq('tenant_id', tenantId).eq('status', 'complete'),
  ]);

  const callsToday = todayCount.count ?? 0;
  const callsThisWeek = weekCount.count ?? 0;
  const needsReview = reviewCount.count ?? 0;

  const scored = scoredCalls.data ?? [];
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, c) => {
        const s = typeof c.score === 'object' && c.score !== null ? parseInt(String((c.score as Record<string, unknown>).overall ?? '0'), 10) : 0;
        return sum + s;
      }, 0) / scored.length) : 0;
  const avgGrade = scoreGrade(avgScore);

  const counts: Record<Tab, number> = {
    all: allCount.count ?? 0,
    needs_review: reviewCount.count ?? 0,
    skipped: skippedCount.count ?? 0,
    archived: archivedCount.count ?? 0,
  };

  const contactIds = [...new Set((calls ?? []).map((c: CallRow) => c.contact_ghl_id).filter(Boolean))];
  const { data: dataPoints } = contactIds.length > 0
    ? await supabaseAdmin
        .from('contact_data_points')
        .select('contact_ghl_id, field_name, field_value')
        .eq('tenant_id', tenantId)
        .in('contact_ghl_id', contactIds)
        .in('field_name', ['company_name', 'address'])
    : { data: [] };

  const dpMap: Record<string, { company?: string; address?: string }> = {};
  for (const dp of dataPoints ?? []) {
    if (!dpMap[dp.contact_ghl_id]) dpMap[dp.contact_ghl_id] = {};
    if (dp.field_name === 'company_name') dpMap[dp.contact_ghl_id].company = dp.field_value;
    if (dp.field_name === 'address') dpMap[dp.contact_ghl_id].address = dp.field_value;
  }

  if (error) {
    return (
      <div className="p-5">
        <p className="text-[13px] text-red-500">Failed to load calls.</p>
      </div>
    );
  }

  return (
    <div className="p-5 animate-fade-in">
      <div className="grid grid-cols-4 gap-2.5">
        <StatCard label="Today" value={callsToday} />
        <StatCard label="This Week" value={callsThisWeek} />
        <StatCard
          label="Avg Score"
          value={avgScore}
          suffix={<span className={`text-[13px] font-semibold ${avgGrade.color}`}>{avgGrade.letter}</span>}
        />
        <StatCard
          label="Needs Review"
          value={needsReview}
          footnote={needsReview > 0 ? <p className="text-red-600 text-[11px] mt-0.5">action required</p> : undefined}
        />
      </div>

      <div className="flex items-center gap-1 mt-5">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`/calls?tab=${t.key}`}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 ${
                isActive ? 'bg-white/80 backdrop-blur border border-white/80 text-zinc-900 shadow-[0_2px_8px_rgba(28,25,22,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]' : 'text-zinc-500 hover:bg-white/40'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 rounded-full ${
                isActive ? 'bg-zinc-200/50 text-zinc-600' : 'bg-white/30 text-zinc-500'
              }`}>
                {counts[t.key] > 100 ? '100+' : counts[t.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {tab === 'needs_review' && (
        <p className="text-[11px] text-zinc-500 italic mt-3">Calls where transcription or scoring failed.</p>
      )}

      <Suspense>
        <CallFilters />
      </Suspense>

      <div className="mt-5 border border-white/40 rounded-xl overflow-hidden">
        {!calls || calls.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-zinc-400">No calls found.</p>
          </div>
        ) : (
          (calls as CallRow[]).map((call) => {
            const overall = call.score?.overall;
            const grade = overall != null ? scoreGrade(overall) : null;
            const isError = call.processing_status === 'error';
            const company = dpMap[call.contact_ghl_id]?.company;
            const address = dpMap[call.contact_ghl_id]?.address;

            return (
              <Link
                key={call.id}
                href={`/calls/${call.id}`}
                className={`flex items-start gap-4 px-4 py-4 border-b border-white/30 last:border-0 hover:bg-white/30 cursor-pointer transition-colors ${
                  isError ? 'border-l-2 border-l-red-400' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#1a1a1a]">{call.contact_name ?? 'Unknown'}</p>
                  {company && <p className="text-[13px] text-zinc-500 mt-0.5">{company}</p>}
                  {address && <p className="text-[11px] text-zinc-500">{address}</p>}
                  <div className="flex items-center gap-2 mt-1 text-[13px] text-zinc-400">
                    <span>Pablo Martin</span>
                    <span className="text-zinc-300">·</span>
                    {call.duration_seconds != null && <span className="font-mono">{formatDuration(call.duration_seconds)}</span>}
                    <span className="text-zinc-300">·</span>
                    <span>{formatExactDateTime(call.called_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
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
                    {isError && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Processing error</span>
                    )}
                  </div>
                  {call.call_summary && (
                    <p className="text-[13px] text-zinc-700 mt-1.5 line-clamp-2 leading-relaxed">{call.call_summary}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isError ? (
                    <div className="h-[52px] w-[52px] rounded-xl border-[1.5px] border-red-200 bg-red-50 flex flex-col items-center justify-center">
                      <span className="text-[20px] text-red-600">!</span>
                    </div>
                  ) : grade && overall != null ? (
                    <div className={`h-[52px] w-[52px] rounded-xl flex flex-col items-center justify-center ${scoreBg(overall)}`}>
                      <span className={`text-[22px] font-bold leading-none ${scoreColor(overall)}`}>{grade.letter}</span>
                      <span className={`text-[11px] font-medium mt-0.5 ${scoreColor(overall)}`}>{overall}%</span>
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
