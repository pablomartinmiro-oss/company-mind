import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreGrade, formatDuration, timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

function formatCallType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CallsPage() {
  const { data: calls, error } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('called_at', { ascending: false });

  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-[28px] font-semibold">Calls</h1>
        <p className="mt-4 text-[13px] text-red-500">Failed to load calls.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-10 animate-fade-in">
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900">Calls</h1>
      <p className="mt-1 text-[13px] text-zinc-400">All recorded calls and scores.</p>

      {!calls || calls.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[13px] text-zinc-300">No calls yet.</p>
        </div>
      ) : (
        <div className="mt-10">
          {/* Header row */}
          <div className="flex items-center px-3 pb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
            <span className="w-10 shrink-0" />
            <span className="ml-4 flex-1">Contact</span>
            <span className="w-24 text-right">Type</span>
            <span className="w-20 text-right">Duration</span>
            <span className="w-24 text-right">When</span>
          </div>

          {/* Rows */}
          <div className="border-t border-zinc-100">
            {calls.map((call: Record<string, unknown>) => {
              const overall = (call.score as Record<string, unknown>)?.overall as number | undefined;
              const grade = overall != null ? scoreGrade(overall) : null;

              return (
                <Link
                  key={call.id as string}
                  href={`/calls/${call.id}`}
                  className="group flex items-center py-3.5 px-3 -mx-3 rounded-lg transition-colors hover:bg-zinc-50/60"
                >
                  {/* Score box */}
                  {grade ? (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${grade.bg}`}>
                      <span className={`text-[14px] font-bold font-mono ${grade.color}`}>{overall}</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-zinc-50">
                      <span className="text-[11px] text-zinc-300">--</span>
                    </div>
                  )}

                  {/* Name + summary */}
                  <div className="ml-4 flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-zinc-900">{(call.contact_name as string) ?? 'Unknown'}</span>
                    {typeof call.call_summary === 'string' && call.call_summary && (
                      <p className="mt-0.5 text-[12px] text-zinc-400 truncate">{call.call_summary}</p>
                    )}
                  </div>

                  {/* Type */}
                  <span className="w-24 text-right text-[12px] text-zinc-400">
                    {formatCallType((call.call_type as string) ?? '')}
                  </span>

                  {/* Duration */}
                  <span className="w-20 text-right text-[12px] font-mono text-zinc-400">
                    {call.duration_seconds != null ? formatDuration(call.duration_seconds as number) : '--'}
                  </span>

                  {/* When */}
                  <span className="w-24 text-right text-[12px] text-zinc-400">
                    {call.called_at ? timeAgo(call.called_at as string) : '--'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
