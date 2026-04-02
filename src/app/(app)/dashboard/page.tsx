export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { formatDuration, timeAgo, scoreGrade } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, X } from 'lucide-react';
import { approveAction, rejectAction } from '@/app/actions';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

function parseDollarAmount(value: string): number {
  const match = value.replace(/,/g, '').match(/\$?([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function formatCallType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function DashboardPage() {
  const [callsCountRes, avgScoreRes, pipelineRes, pendingCountRes, recentCallsRes, pendingActionsRes] = await Promise.all([
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID),
    supabaseAdmin.from('calls').select('score').eq('tenant_id', TENANT_ID).eq('status', 'complete'),
    supabaseAdmin.from('contact_data_points').select('field_value').eq('tenant_id', TENANT_ID).eq('field_name', 'deal_value'),
    supabaseAdmin.from('call_actions').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).eq('status', 'suggested'),
    supabaseAdmin.from('calls').select('id, contact_name, call_type, score, duration_seconds, called_at').eq('tenant_id', TENANT_ID).order('called_at', { ascending: false }).limit(5),
    supabaseAdmin.from('call_actions').select('*, calls(contact_name)').eq('tenant_id', TENANT_ID).eq('status', 'suggested').order('created_at', { ascending: false }),
  ]);

  const totalCalls = callsCountRes.count ?? 0;
  const completeCalls = avgScoreRes.data ?? [];
  const avgScore = completeCalls.length > 0
    ? Math.round(completeCalls.reduce((sum, c) => {
        const s = typeof c.score === 'object' && c.score !== null ? parseInt(String((c.score as Record<string, unknown>).overall ?? '0'), 10) : 0;
        return sum + s;
      }, 0) / completeCalls.length) : 0;
  const pipelineValue = (pipelineRes.data ?? []).reduce((sum, d) => sum + parseDollarAmount(String(d.field_value ?? '')), 0);
  const pendingCount = pendingCountRes.count ?? 0;
  const recentCalls = recentCallsRes.data ?? [];
  const pendingActions = pendingActionsRes.data ?? [];
  const avgGrade = scoreGrade(avgScore);

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-10 animate-fade-in">
      {/* Header — Primary layer */}
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900">Daily HQ</h1>
      <p className="mt-1 text-[13px] text-zinc-400">Overview for today.</p>

      {/* ── KPI Strip — make numbers the hero ── */}
      <div className="mt-10 grid grid-cols-4 gap-0 border-b border-zinc-100 pb-10">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Calls</p>
          <p className="mt-1 text-[40px] font-semibold font-mono leading-none tracking-tight text-zinc-900">{totalCalls}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Avg Score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-[40px] font-semibold font-mono leading-none tracking-tight text-zinc-900">{avgScore}</p>
            <span className={`text-[14px] font-semibold ${avgGrade.color}`}>{avgGrade.letter}</span>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Pipeline</p>
          <p className="mt-1 text-[40px] font-semibold font-mono leading-none tracking-tight text-zinc-900">
            ${pipelineValue >= 1000 ? `${(pipelineValue / 1000).toFixed(0)}k` : pipelineValue}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Pending</p>
          <p className="mt-1 text-[40px] font-semibold font-mono leading-none tracking-tight text-zinc-900">{pendingCount}</p>
          {pendingCount > 0 && <p className="mt-1 text-[11px] text-amber-500">needs review</p>}
        </div>
      </div>

      {/* ── Two columns ── */}
      <div className="mt-10 flex gap-16">

        {/* Recent Calls */}
        <section className="flex-[3] min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Recent Calls</h2>
            <Link href="/calls" className="flex items-center gap-1 text-[12px] text-zinc-400 transition-colors hover:text-zinc-900">
              All calls <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-0">
            {recentCalls.map((call, i) => {
              const overall = typeof call.score === 'object' && call.score !== null
                ? parseInt(String((call.score as Record<string, unknown>).overall ?? '0'), 10) : 0;
              const grade = scoreGrade(overall);

              return (
                <Link
                  key={call.id}
                  href={`/calls/${call.id}`}
                  className="group flex items-center py-3.5 transition-colors hover:bg-zinc-50/50 -mx-3 px-3 rounded-lg"
                >
                  {/* Score */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${grade.bg}`}>
                    <span className={`text-[14px] font-bold font-mono ${grade.color}`}>{overall}</span>
                  </div>

                  {/* Info */}
                  <div className="ml-4 flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-zinc-900">{call.contact_name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-zinc-400">{formatCallType(call.call_type)}</span>
                      <span className="text-[11px] text-zinc-300">/</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{formatDuration(call.duration_seconds ?? 0)}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-[11px] text-zinc-400 shrink-0">{timeAgo(call.called_at)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Pending Actions */}
        <section className="flex-[2] min-w-0">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-5">Pending Actions</h2>

          {pendingActions.length === 0 ? (
            <p className="text-[13px] text-zinc-300 py-8">All clear.</p>
          ) : (
            <div className="space-y-4">
              {pendingActions.map((action) => {
                const contactName = (action.calls as { contact_name?: string } | null)?.contact_name ?? 'Unknown';
                return (
                  <div key={action.id} className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-medium text-zinc-900">{contactName}</span>
                      {action.priority === 'high' && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                    </div>
                    <p className="text-[13px] text-zinc-500 leading-snug">{action.description}</p>
                    <div className="flex gap-2 mt-2.5">
                      <form action={approveAction.bind(null, action.id)}>
                        <Button type="submit" size="sm" className="h-7 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 text-[11px] px-4 font-medium tracking-wide">
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      </form>
                      <form action={rejectAction.bind(null, action.id)}>
                        <Button type="submit" size="sm" variant="ghost" className="h-7 text-[11px] text-zinc-400 hover:text-zinc-600 px-2">
                          <X className="h-3 w-3" />
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
