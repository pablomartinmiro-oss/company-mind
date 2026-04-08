import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { ContactDetailClient } from '@/components/contact/contact-detail-client';
import { TEAM_MEMBERS } from '@/lib/pipeline-config';
import { getTenantForUser } from '@/lib/get-tenant';
import { getContactInfo } from '@/lib/lookups';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { tenantId } = await getTenantForUser();
  const { id: contactId } = await params;

  // Fetch all data in parallel
  const [callsRes, pipelineContactsRes, pipelinesRes, tasksRes, activityRes, researchRes, dataPointsRes] = await Promise.all([
    supabaseAdmin.from('calls').select('id, contact_name, contact_ghl_id, score, call_summary, call_type, called_at, duration_seconds').eq('tenant_id', tenantId).eq('contact_ghl_id', contactId).order('called_at', { ascending: false }),
    supabaseAdmin.from('pipeline_companies').select('pipeline_id, stage, stage_entered_at, deal_value').eq('tenant_id', tenantId).eq('contact_id', contactId),
    supabaseAdmin.from('pipelines').select('id, name, stages').eq('tenant_id', tenantId),
    supabaseAdmin.from('tasks').select('*').eq('tenant_id', tenantId).eq('contact_id', contactId).order('due_date', { ascending: true, nullsFirst: false }),
    supabaseAdmin.from('activity_feed').select('*').eq('tenant_id', tenantId).eq('contact_id', contactId).order('created_at', { ascending: false }),
    supabaseAdmin.from('research').select('section, field_name, field_value, source').eq('tenant_id', tenantId).eq('contact_id', contactId),
    getContactInfo(tenantId, contactId).then(info => ({ data: info })),
  ]);

  const calls = callsRes.data ?? [];

  // Validate contact exists — check company_contacts or calls
  const contactInfo = dataPointsRes.data;
  if (!contactInfo && calls.length === 0) notFound();

  const contactName = contactInfo?.contact_name ?? calls[0]?.contact_name ?? contactId;

  // Contact info from company_contacts → companies JOIN
  const dpMap: Record<string, string> = {};
  if (contactInfo) {
    if (contactInfo.contact_phone) dpMap.phone = contactInfo.contact_phone;
    if (contactInfo.contact_email) dpMap.email = contactInfo.contact_email;
    if (contactInfo.company_name) dpMap.company_name = contactInfo.company_name;
    if (contactInfo.company_location) dpMap.address = contactInfo.company_location;
  }

  // Pipeline enrollments with stage log
  const pipelineMap: Record<string, { name: string; stages: string[] }> = {};
  for (const p of pipelinesRes.data ?? []) {
    const stages = Array.isArray(p.stages) ? p.stages as string[] : JSON.parse(String(p.stages)) as string[];
    pipelineMap[p.id] = { name: p.name, stages };
  }

  const pipelineIds = (pipelineContactsRes.data ?? []).map((pc: { pipeline_id: string }) => pc.pipeline_id);
  const { data: stageLogRaw } = pipelineIds.length > 0
    ? await supabaseAdmin.from('stage_log').select('*').eq('tenant_id', tenantId).eq('contact_id', contactId).in('pipeline_id', pipelineIds).order('entered_at', { ascending: false })
    : { data: [] };

  interface Enrollment {
    pipelineId: string;
    pipelineName: string;
    stages: string[];
    currentStage: string;
    stageLog: { id: string; stage: string; entered_at: string; moved_by: string | null; source: string | null; note: string | null; entry_number: number }[];
  }

  const enrollments: Enrollment[] = (pipelineContactsRes.data ?? []).map((pc: { pipeline_id: string; stage: string; stage_entered_at: string }) => {
    const pipeline = pipelineMap[pc.pipeline_id];
    if (!pipeline) return null;
    return {
      pipelineId: pc.pipeline_id,
      pipelineName: pipeline.name,
      stages: pipeline.stages,
      currentStage: pc.stage,
      stageLog: (stageLogRaw ?? [])
        .filter((sl: { pipeline_id: string }) => sl.pipeline_id === pc.pipeline_id)
        .map((sl: { id: string; stage: string; entered_at: string; moved_by: string | null; source: string | null; note: string | null; entry_number: number }) => ({
          id: sl.id, stage: sl.stage, entered_at: sl.entered_at,
          moved_by: sl.moved_by, source: sl.source, note: sl.note, entry_number: sl.entry_number,
        })),
    };
  }).filter((x): x is Enrollment => x !== null);

  const currentStage = (pipelineContactsRes.data ?? [])[0]?.stage ?? null;
  const stageEnteredAt = (pipelineContactsRes.data ?? [])[0]?.stage_entered_at;
  const daysInStage = stageEnteredAt ? Math.max(0, Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / 86400000)) : 0;

  // Research data grouped by section
  const research: Record<string, { field_name: string; field_value: string | null; source: string }[]> = {};
  for (const r of researchRes.data ?? []) {
    if (!research[r.section]) research[r.section] = [];
    research[r.section].push({ field_name: r.field_name, field_value: r.field_value, source: r.source });
  }

  const pipelineNames = enrollments.map((e: Enrollment) => e.pipelineName);

  // Calls for overview
  const callsForOverview = calls.map((c) => ({
    id: c.id,
    score: typeof c.score === 'object' && c.score !== null ? (c.score as { overall?: number }).overall ?? null : null,
    call_summary: c.call_summary,
    call_type: c.call_type,
    called_at: c.called_at,
    duration_seconds: c.duration_seconds,
  }));

  const tasks = (tasksRes.data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    description: t.description as string | null,
    due_date: t.due_date as string | null,
    completed: t.completed as boolean,
  }));

  const activity = (activityRes.data ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    type: a.type as string,
    content: a.content as Record<string, unknown> | null,
    author: a.author as string | null,
    created_at: a.created_at as string,
  }));

  const contactDetails: { label: string; value: string }[] = [];
  if (dpMap.phone) contactDetails.push({ label: 'Phone', value: dpMap.phone });
  if (dpMap.email) contactDetails.push({ label: 'Email', value: dpMap.email });
  if (dpMap.address) contactDetails.push({ label: 'Address', value: dpMap.address });

  // Fetch company data for deal + details cards
  let companyData: { id: string; name: string; mrr: number | null; setup_fee: number | null; website: string | null; location: string | null; industry: string | null; lead_source: string | null } | null = null;
  if (contactInfo?.company_id) {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name, mrr, setup_fee, website, location, industry, lead_source')
      .eq('id', contactInfo.company_id)
      .eq('tenant_id', tenantId)
      .single();
    companyData = company;
  }

  const teamMembers = TEAM_MEMBERS.map((m) => ({ name: m.name, initials: m.initials, role: 'Rep' }));

  // Fetch appointments for this contact via internal API
  let appointments: { id: string; contactName: string; type: string; startTime: string; status: string }[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000';
    const aptRes = await fetch(`${baseUrl}/api/appointments?contactId=${contactId}`, { cache: 'no-store' });
    if (aptRes.ok) appointments = await aptRes.json();
  } catch { /* ignore */ }

  return (
    <ContactDetailClient
      contactId={contactId}
      contactName={contactName}
      companyName={companyData?.name ?? dpMap.company_name ?? null}
      location={companyData?.location ?? dpMap.address ?? null}
      currentStage={currentStage}
      daysInStage={daysInStage}
      callType={calls[0]?.call_type ?? null}
      enrollments={enrollments}
      calls={callsForOverview}
      tasks={tasks}
      activity={activity}
      research={research}
      pipelineNames={pipelineNames}
      teamMembers={teamMembers}
      contactDetails={contactDetails}
      appointments={appointments}
      company={companyData}
    />
  );
}
