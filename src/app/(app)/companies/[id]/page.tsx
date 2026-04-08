import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { getTenantForUser } from '@/lib/get-tenant';
import { TEAM_MEMBERS } from '@/lib/pipeline-config';
import { CompanyDetailClient } from '@/components/company/company-detail-client';
import { scoreGrade } from '@/lib/format';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { tenantId } = await getTenantForUser();
  const { id: companyId } = await params;

  // Fetch all data in parallel
  const [companyRes, contactsRes, pipelinesRes, allPipelinesRes, companyResearchRes, stageLogRes] = await Promise.all([
    supabaseAdmin.from('companies').select('*').eq('tenant_id', tenantId).eq('id', companyId).single(),
    supabaseAdmin.from('company_contacts').select('*').eq('tenant_id', tenantId).eq('company_id', companyId).order('is_primary', { ascending: false }),
    supabaseAdmin.from('pipeline_companies').select('id, pipeline_id, stage, deal_value, stage_entered_at').eq('tenant_id', tenantId).eq('company_id', companyId),
    supabaseAdmin.from('pipelines').select('id, name, stages').eq('tenant_id', tenantId),
    supabaseAdmin.from('research').select('*').eq('tenant_id', tenantId).eq('scope', 'company').eq('company_id', companyId),
    supabaseAdmin.from('stage_log').select('*').eq('tenant_id', tenantId).eq('company_id', companyId).order('entered_at', { ascending: false }),
  ]);

  const company = companyRes.data;
  if (!company) notFound();

  const contacts = contactsRes.data ?? [];
  const contactIds = contacts.map((c: { contact_id: string }) => c.contact_id);

  // Fetch contact names, calls, tasks, data points in parallel
  const [callNamesRes, callsRes, tasksRes, dataPointsRes, allContactResearchRes, activityRes] = await Promise.all([
    contactIds.length > 0
      ? supabaseAdmin.from('calls').select('contact_ghl_id, contact_name').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds)
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? supabaseAdmin.from('calls').select('id, contact_name, contact_ghl_id, score, call_summary, call_type, called_at, duration_seconds').eq('tenant_id', tenantId).in('contact_ghl_id', contactIds).order('called_at', { ascending: false }).limit(20)
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? supabaseAdmin.from('tasks').select('*').eq('tenant_id', tenantId).in('contact_id', contactIds).order('due_date', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    Promise.resolve({ data: [] }), // was contact_data_points — migrated to company_contacts JOIN
    contactIds.length > 0
      ? supabaseAdmin.from('research').select('*').eq('tenant_id', tenantId).eq('scope', 'contact').in('contact_id', contactIds)
      : Promise.resolve({ data: [] }),
    contactIds.length > 0
      ? supabaseAdmin.from('activity_feed').select('*').eq('tenant_id', tenantId).in('contact_id', contactIds).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
  ]);

  // Name map
  const nameMap: Record<string, string> = {};
  for (const c of callNamesRes.data ?? []) nameMap[c.contact_ghl_id] = c.contact_name;

  // Legacy dpMap removed — contact email/phone now from company_contacts directly
  const dpMap: Record<string, Record<string, string>> = {};

  // Contact research — flat map per contact_id keyed by field_name
  const contactResearchMap: Record<string, Record<string, { value: string; source: string; source_detail?: string }>> = {};
  for (const r of allContactResearchRes.data ?? []) {
    if (!contactResearchMap[r.contact_id]) contactResearchMap[r.contact_id] = {};
    if (r.field_value) {
      contactResearchMap[r.contact_id][r.field_name] = { value: r.field_value, source: r.source, source_detail: r.source_detail ?? undefined };
    }
  }

  // Build pipeline name map
  const pipelineNameMap: Record<string, { name: string; stages: string[] }> = {};
  for (const p of allPipelinesRes.data ?? []) {
    const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];
    pipelineNameMap[p.id] = { name: p.name, stages };
  }

  // Build enrollments
  const enrollments = (pipelinesRes.data ?? []).map((pc: { id: string; pipeline_id: string; stage: string; deal_value: string | null; stage_entered_at: string }) => {
    const pipeline = pipelineNameMap[pc.pipeline_id];
    if (!pipeline) return null;
    const daysInStage = Math.max(0, Math.floor((Date.now() - new Date(pc.stage_entered_at).getTime()) / 86400000));
    return {
      pipelineId: pc.pipeline_id,
      pipelineName: pipeline.name,
      stages: pipeline.stages,
      currentStage: pc.stage,
      daysInStage,
      dealValue: pc.deal_value,
      stageLog: (stageLogRes.data ?? [])
        .filter((sl: { pipeline_id: string }) => sl.pipeline_id === pc.pipeline_id)
        .map((sl: { id: string; stage: string; entered_at: string; moved_by: string | null; source: string | null; note: string | null; entry_number: number }) => ({
          id: sl.id, stage: sl.stage, entered_at: sl.entered_at,
          moved_by: sl.moved_by, source: sl.source, note: sl.note, entry_number: sl.entry_number,
        })),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // Enriched contacts — prefer contact_name from company_contacts, then calls, then ID
  const enrichedContacts = contacts.map((c: { id: string; contact_id: string; is_primary: boolean; role: string | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null }) => ({
    id: c.id,
    contact_id: c.contact_id,
    is_primary: c.is_primary,
    role: c.role,
    contact_name: c.contact_name ?? nameMap[c.contact_id] ?? c.contact_id,
    contact_email: c.contact_email ?? dpMap[c.contact_id]?.email ?? null,
    contact_phone: c.contact_phone ?? dpMap[c.contact_id]?.phone ?? null,
  }));

  // Company research — flat map keyed by field_name (matches catalog keys)
  const companyResearch: Record<string, { value: string; source: string; source_detail?: string }> = {};
  for (const r of companyResearchRes.data ?? []) {
    if (r.field_value) {
      companyResearch[r.field_name] = { value: r.field_value, source: r.source, source_detail: r.source_detail ?? undefined };
    }
  }

  // Legacy dpToCatalog mapping removed — research table is now the source of truth

  // Calls for overview
  const calls = (callsRes.data ?? []).map((c) => ({
    id: c.id,
    score: typeof c.score === 'object' && c.score !== null ? (c.score as { overall?: number }).overall ?? null : null,
    call_summary: c.call_summary,
    call_type: c.call_type,
    called_at: c.called_at,
    duration_seconds: c.duration_seconds,
  }));

  // Tasks for overview
  const tasks = (tasksRes.data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    description: t.description as string | null,
    due_date: t.due_date as string | null,
    completed: t.completed as boolean,
  }));

  // Team members
  const teamMembers = TEAM_MEMBERS.map((m) => ({ name: m.name, initials: m.initials, role: 'Rep' }));

  // Activity feed for all contacts in this company
  const activity = (activityRes.data ?? []).map((a: { id: string; type: string; content: Record<string, unknown> | null; author: string | null; created_at: string }) => ({
    id: a.id,
    type: a.type,
    content: a.content,
    author: a.author,
    created_at: a.created_at,
  }));

  return (
    <CompanyDetailClient
      companyId={companyId}
      companyName={company.name}
      industry={company.industry ?? null}
      leadSource={company.lead_source ?? null}
      location={company.location ?? null}
      website={company.website ?? null}
      mrr={company.mrr ?? 0}
      setupFee={company.setup_fee ?? 0}
      termLength={company.term_length ?? null}
      enrollments={enrollments}
      contacts={enrichedContacts}
      calls={calls}
      tasks={tasks}
      teamMembers={teamMembers}
      companyResearch={companyResearch}
      contactResearchMap={contactResearchMap}
      activity={activity}
    />
  );
}
