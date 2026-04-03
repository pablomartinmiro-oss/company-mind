export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '@/lib/supabase';
import { scoreGrade } from '@/lib/format';
import { InboxPanel } from '@/components/dashboard/inbox-panel';
import { AppointmentsPanel } from '@/components/dashboard/appointments-panel';
import { TaskList } from '@/components/dashboard/task-list';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export default async function DashboardPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [callsCountRes, avgScoreRes, pipelineRes, taskRes, dueTodayRes] = await Promise.all([
    supabaseAdmin.from('calls').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).gte('called_at', sevenDaysAgo),
    supabaseAdmin.from('calls').select('score').eq('tenant_id', TENANT_ID).eq('status', 'complete'),
    supabaseAdmin.from('pipeline_contacts').select('deal_value').eq('tenant_id', TENANT_ID),
    supabaseAdmin.from('tasks').select('*').eq('tenant_id', TENANT_ID).eq('completed', false).order('due_date', { ascending: true, nullsFirst: false }),
    supabaseAdmin.from('tasks').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).eq('completed', false).eq('due_date', new Date().toISOString().split('T')[0]),
  ]);

  const totalCalls = callsCountRes.count ?? 0;
  const completeCalls = avgScoreRes.data ?? [];
  const avgScore = completeCalls.length > 0
    ? Math.round(completeCalls.reduce((sum, c) => {
        const s = typeof c.score === 'object' && c.score !== null ? parseInt(String((c.score as Record<string, unknown>).overall ?? '0'), 10) : 0;
        return sum + s;
      }, 0) / completeCalls.length) : 0;

  const pipelineValue = (pipelineRes.data ?? []).reduce((sum, d) => {
    if (!d.deal_value) return sum;
    const num = parseFloat(String(d.deal_value).replace(/[^0-9.]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const openTasks = (taskRes.data ?? []).length;
  const dueToday = dueTodayRes.count ?? 0;
  const avgGrade = scoreGrade(avgScore);

  const formattedPipeline = pipelineValue >= 1000
    ? `$${(pipelineValue / 1000).toFixed(0)}k`
    : `$${pipelineValue}`;

  const taskContactIds = [...new Set((taskRes.data ?? []).map((t: { contact_id: string | null }) => t.contact_id).filter(Boolean))];
  const { data: taskCalls } = taskContactIds.length > 0
    ? await supabaseAdmin.from('calls').select('contact_ghl_id, contact_name').eq('tenant_id', TENANT_ID).in('contact_ghl_id', taskContactIds)
    : { data: [] };

  const nameMap: Record<string, string> = {};
  for (const c of taskCalls ?? []) {
    nameMap[c.contact_ghl_id] = c.contact_name;
  }

  const tasks = (taskRes.data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    contact_id: t.contact_id as string | null,
    contact_name: nameMap[t.contact_id as string] ?? (t.title as string),
    pipeline_stage: t.pipeline_stage as string | null,
    title: t.title as string,
    description: t.description as string | null,
    assigned_to: t.assigned_to as string | null,
    due_date: t.due_date as string | null,
    completed: t.completed as boolean,
  }));

  return (
    <div className="p-5 space-y-4 animate-fade-in">
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-zinc-50 rounded-lg px-4 py-3.5">
          <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">Calls</p>
          <p className="text-[22px] font-medium font-mono text-zinc-900 leading-none">{totalCalls}</p>
        </div>
        <div className="bg-zinc-50 rounded-lg px-4 py-3.5">
          <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">Avg Score</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-[22px] font-medium font-mono text-zinc-900 leading-none">{avgScore}</p>
            <span className={`text-[13px] font-semibold ${avgGrade.color}`}>{avgGrade.letter}</span>
          </div>
        </div>
        <div className="bg-zinc-50 rounded-lg px-4 py-3.5">
          <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">Pipeline</p>
          <p className="text-[22px] font-medium font-mono text-zinc-900 leading-none">{formattedPipeline}</p>
        </div>
        <div className="bg-zinc-50 rounded-lg px-4 py-3.5">
          <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">Open Tasks</p>
          <p className="text-[22px] font-medium font-mono text-zinc-900 leading-none">{openTasks}</p>
          {dueToday > 0 && <p className="text-red-500 text-[11px] mt-0.5">{dueToday} due today</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <InboxPanel />
        </div>
        <div className="col-span-1">
          <AppointmentsPanel />
        </div>
      </div>

      <TaskList initialTasks={tasks} />
    </div>
  );
}
