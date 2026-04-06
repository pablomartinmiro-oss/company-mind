import Link from 'next/link';
import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreGrade, scoreBg, scoreColor, formatDuration, timeAgo } from '@/lib/format';
import { CALL_TYPE_LABELS, CALL_TYPE_PILL, OUTCOME_LABELS, OUTCOME_PILL } from '@/lib/pipeline-config';
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

  if (tab === 'needs_review') {
    query = query.eq('processing_status', 'error');
  } else if (tab === 'skipped') {
    query = query.lt('duration_seconds', 45);
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

  const [allCount, reviewCount, skippedCount, archivedCount] = await Promise.all([
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('processing_status', 'error'),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).lt('duration_seconds', 45),
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('archived', true),
  ]);

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
        <h1 className="text-[28px] font-semibold">Calls</h1>
        <p className="mt-4 text-[13px] text-red-500">Failed to load calls.</p>
      </div>
    );
  }

  return (
    <div className="p-5 animate-fade-in">
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900">Calls</h1>
      <p className="mt-1 text-[13px] text-zinc-400">All recorded calls and scores.</p>

      <div className="flex items-center gap-1 mt-5">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`/calls?tab=${t.key}`}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 ${
                isActive ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 rounded-full ${
                isActive ? 'bg-white/15 text-white/80' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {counts[t.key] > 100 ? '100+' : counts[t.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {tab === 'needs_review' && (
        <p className="text-[11px] text-zinc-400 italic mt-3">Calls where transcription or scoring failed.</p>
      )}

      <Suspense>
        <CallFilters />
      </Suspense>

      <div className="mt-5 border border-zinc-200/60 rounded-xl overflow-hidden">
        {!calls || calls.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-zinc-300">No calls found.</p>
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
                className={`flex items-start gap-4 px-4 py-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 cursor-pointer transition-colors ${
                  isError ? 'border-l-2 border-l-red-400' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-zinc-900">{call.contact_name ?? 'Unknown'}</p>
                  {company && <p className="text-[13px] text-zinc-400 mt-0.5">{company}</p>}
                  {address && <p className="text-[11px] text-zinc-400">{address}</p>}
                  <div className="flex items-center gap-2 mt-1 text-[13px] text-zinc-400">
                    <span>Pablo Martin</span>
                    <span className="text-zinc-200">·</span>
                    {call.duration_seconds != null && <span className="font-mono">{formatDuration(call.duration_seconds)}</span>}
                    <span className="text-zinc-200">·</span>
                    <span>{timeAgo(call.called_at)}</span>
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
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">Processing error</span>
                    )}
                  </div>
                  {call.call_summary && (
                    <p className="text-[13px] text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">{call.call_summary}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isError ? (
                    <div className="h-[52px] w-[52px] rounded-xl border-[1.5px] border-red-300 bg-red-50 flex flex-col items-center justify-center">
                      <span className="text-[20px] text-red-500">!</span>
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
