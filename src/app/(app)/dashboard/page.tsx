export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '@/lib/supabase';
import { scoreGrade } from '@/lib/format';
import { InboxPanel } from '@/components/dashboard/inbox-panel';
import { AppointmentsPanel } from '@/components/dashboard/appointments-panel';
import { TaskList } from '@/components/dashboard/task-list';
import { StatCards } from '@/components/dashboard/stat-cards';
import { getTenantForUser } from '@/lib/get-tenant';

export default async function DashboardPage() {
  const { tenantId } = await getTenantForUser();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [callsRes, avgScoreRes, pipelineRes, pipelinesListRes, taskRes, dueTodayRes] = await Promise.all([
    supabaseAdmin
      .from('calls')
      .select('id, contact_name, contact_ghl_id, score, called_at, call_type')
      .eq('tenant_id', tenantId)
      .gte('called_at', sevenDaysAgo)
      .order('called_at', { ascending: false }),
    supabaseAdmin.from('calls').select('score').eq('tenant_id', tenantId).eq('status', 'complete'),
    supabaseAdmin
      .from('pipeline_contacts')
      .select('contact_id, pipeline_id, stage, deal_value, stage_entered_at')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('pipelines')
      .select('id, name')
      .eq('tenant_id', tenantId),
    supabaseAdmin.from('tasks').select('*').eq('tenant_id', tenantId).eq('completed', false).order('due_date', { ascending: true, nullsFirst: false }),
    supabaseAdmin.from('tasks').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('completed', false).eq('due_date', new Date().toISOString().split('T')[0]),
  ]);

  const recentCalls = callsRes.data ?? [];
  const totalCalls = recentCalls.length;
  const completeCalls = avgScoreRes.data ?? [];
  const avgScore = completeCalls.length > 0
    ? Math.round(completeCalls.reduce((sum, c) => {
        const s = typeof c.score === 'object' && c.score !== null ? parseInt(String((c.score as Record<string, unknown>).overall ?? '0'), 10) : 0;
        return sum + s;
      }, 0) / completeCalls.length) : 0;

  const pipelineData = pipelineRes.data ?? [];
  const pipelineValue = pipelineData.reduce((sum, d) => {
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

  // Build pipeline name lookup
  const pipelineNameMap: Record<string, string> = {};
  for (const p of pipelinesListRes.data ?? []) {
    pipelineNameMap[p.id] = p.name;
  }

  // Build name maps from calls for pipeline contacts and tasks
  const allContactIds = [
    ...new Set([
      ...pipelineData.map((p) => p.contact_id),
      ...(taskRes.data ?? []).map((t: { contact_id: string | null }) => t.contact_id).filter(Boolean),
    ]),
  ];
  const { data: contactCalls } = allContactIds.length > 0
    ? await supabaseAdmin.from('calls').select('contact_ghl_id, contact_name').eq('tenant_id', tenantId).in('contact_ghl_id', allContactIds)
    : { data: [] };

  const nameMap: Record<string, string> = {};
  for (const c of contactCalls ?? []) {
    nameMap[c.contact_ghl_id] = c.contact_name;
  }

  // Company names from data points
  const { data: companyDPs } = allContactIds.length > 0
    ? await supabaseAdmin.from('contact_data_points').select('contact_ghl_id, field_value').eq('tenant_id', tenantId).in('contact_ghl_id', allContactIds).eq('field_name', 'company_name')
    : { data: [] };

  const companyMap: Record<string, string> = {};
  for (const dp of companyDPs ?? []) {
    companyMap[dp.contact_ghl_id] = dp.field_value;
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
    task_type: (t.task_type as string | null) ?? null,
  }));

  // Modal data: calls
  const callsForModal = recentCalls.map((c) => ({
    id: c.id,
    contact_name: c.contact_name ?? null,
    company_name: null as string | null,
    score: c.score as { overall?: number } | null,
    called_at: c.called_at ?? null,
    call_type: c.call_type ?? null,
  }));

  // Modal data: pipeline contacts (build from actual DB columns)
  const pipelineForModal = pipelineData.map((p) => ({
    contact_ghl_id: p.contact_id as string,
    contact_name: nameMap[p.contact_id] ?? null,
    company_name: companyMap[p.contact_id] ?? null,
    pipeline_name: pipelineNameMap[p.pipeline_id] ?? null,
    current_stage: p.stage ?? null,
    deal_value: p.deal_value ? parseFloat(String(p.deal_value).replace(/[^0-9.]/g, '')) : null,
  }));

  // Modal data: tasks
  const tasksForModal = tasks.map((t: { id: string; contact_id: string | null; contact_name: string; title: string; task_type: string | null; due_date: string | null }) => ({
    id: t.id,
    contact_id: t.contact_id,
    contact_name: t.contact_name,
    title: t.title,
    task_type: t.task_type,
    due_date: t.due_date,
  }));

  return (
    <div className="p-5 space-y-4 animate-fade-in">
      <StatCards
        totalCalls={totalCalls}
        avgScore={avgScore}
        avgGrade={{ letter: avgGrade.letter, color: avgGrade.color }}
        formattedPipeline={formattedPipeline}
        openTasks={openTasks}
        dueToday={dueToday}
        calls={callsForModal}
        pipelineContacts={pipelineForModal}
        tasks={tasksForModal}
      />

      <div className="grid grid-cols-3 gap-3 items-start">
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
