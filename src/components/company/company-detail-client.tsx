'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ReEnrichButton } from './re-enrich-button';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';
import { StagePopover } from './stage-popover';
import { scoreGrade, scoreBg, scoreColor } from '@/lib/format';
import { ContactsPanel } from './contacts-panel';
import { CompanyResearchTab } from './research-tab';
import { PipelineTracker } from '@/components/contact/pipeline-tracker';
import { ActivityFeed } from '@/components/contact/activity-feed';
import { DealCard } from '@/components/contact/deal-card';
import { CompanyDetailsCard } from '@/components/contact/company-details-card';

interface StageLogEntry {
  id: string;
  stage: string;
  entered_at: string;
  moved_by: string | null;
  source: string | null;
  note: string | null;
  entry_number: number;
}

interface Enrollment {
  pipelineId: string;
  pipelineName: string;
  stages: string[];
  currentStage: string;
  daysInStage: number;
  dealValue: string | null;
  stageLog: StageLogEntry[];
}

interface ContactInfo {
  id: string;
  contact_id: string;
  is_primary: boolean;
  role: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
}

interface CallInfo {
  id: string;
  score: number | null;
  call_summary: string | null;
  call_type: string | null;
  called_at: string;
  duration_seconds: number | null;
}

interface TaskInfo {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
}

interface Props {
  companyId: string;
  companyName: string;
  industry: string | null;
  leadSource: string | null;
  location: string | null;
  website: string | null;
  mrr: number;
  setupFee: number;
  termLength: number | null;
  enrollments: Enrollment[];
  contacts: ContactInfo[];
  calls: CallInfo[];
  tasks: TaskInfo[];
  teamMembers: { name: string; initials: string; role: string }[];
  companyResearch: Record<string, { value: string; source: string; source_detail?: string }>;
  contactResearchMap: Record<string, Record<string, { value: string; source: string; source_detail?: string }>>;
}

const TABS = ['Overview', 'Activity', 'Research'] as const;
type Tab = typeof TABS[number];

export function CompanyDetailClient(props: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [selectedContactId, setSelectedContactId] = useState(
    props.contacts.find(c => c.is_primary)?.contact_id ?? props.contacts[0]?.contact_id ?? null
  );
  const [contactsState, setContactsState] = useState(props.contacts);

  const selectedContact = contactsState.find(c => c.contact_id === selectedContactId);

  const trackerEnrollments = props.enrollments.map(e => ({
    pipelineId: e.pipelineId,
    pipelineName: e.pipelineName,
    stages: e.stages,
    currentStage: e.currentStage,
    stageLog: e.stageLog,
  }));

  function handleContactUpdate(contactId: string, updates: { role?: string | null; is_primary?: boolean }) {
    setContactsState(prev => prev.map(c => {
      if (updates.is_primary && c.contact_id !== contactId) return { ...c, is_primary: false };
      if (c.contact_id === contactId) return { ...c, ...updates };
      return c;
    }));
  }

  return (
    <div className="p-5 animate-fade-in overflow-hidden">
      {/* ══ HEADER — frosted glass ══ */}
      <div className="relative glass-card rounded-3xl overflow-hidden mb-4">
        <div className="glass-card-inner" />
        <div className="relative">
          <div className="px-6 py-5 border-b border-white/40">
            <Link href="/companies" className="text-[12px] text-zinc-500 hover:text-zinc-800 mb-3 inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3 w-3" /> Back to companies
            </Link>

            {/* Top row: company name + actions */}
            <div className="flex items-start justify-between gap-4 mt-2">
              <div>
                <h1 className="text-[24px] font-medium text-[#1a1a1a] leading-tight">
                  {props.companyName}
                </h1>
                <p className="text-[14px] text-[#52525b] mt-1">
                  {contactsState.find(c => c.is_primary)?.contact_name ?? contactsState[0]?.contact_name ?? ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ReEnrichButton companyId={props.companyId} />
                <button className="text-[12px] font-medium px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/60 text-zinc-700 hover:bg-white/80 flex items-center gap-1.5">
                  GHL <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Pill row: pipeline stages + industry + lead source */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {props.enrollments.map(e => (
                <StagePopover
                  key={e.pipelineId}
                  pipelineName={e.pipelineName}
                  pipelineId={e.pipelineId}
                  stages={e.stages}
                  currentStage={e.currentStage}
                  companyId={props.companyId}
                  onUpdate={() => window.location.reload()}
                />
              ))}
              {props.industry && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/60">
                  {props.industry}
                </span>
              )}
              {props.leadSource && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-violet-50/80 text-violet-700 border border-violet-200/60">
                  {props.leadSource}
                </span>
              )}
            </div>
          </div>

          {/* Pipeline tracker */}
          <div className="px-6 py-4 border-b border-white/40">
            <PipelineTracker enrollments={trackerEnrollments} />
          </div>

        </div>
      </div>

      {/* ══ DEAL + COMPANY CARDS ══ */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <DealCard
          companyId={props.companyId}
          mrr={props.mrr}
          setupFee={props.setupFee}
          termLength={props.termLength}
        />
        <CompanyDetailsCard
          companyId={props.companyId}
          website={props.website}
          location={props.location}
          industry={props.industry}
          leadSource={props.leadSource}
        />
      </div>

      {/* ══ TABS ══ */}
      <div className="flex gap-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all ${
              activeTab === tab
                ? 'bg-white/70 text-[#1a1a1a] shadow-sm border border-white/60'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-[300px_1fr] gap-5 max-w-full overflow-hidden">
        {/* Left: Contacts */}
        <ContactsPanel
          companyId={props.companyId}
          contacts={contactsState}
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
          onContactUpdate={handleContactUpdate}
        />

        {/* Right: Tab content */}
        <div className="min-w-0">
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              {/* Team */}
              <div className="glass-card rounded-2xl overflow-hidden relative">
                <div className="glass-card-inner" />
                <div className="relative px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">Team</h3>
                    <span className="text-[11px] text-blue-600 cursor-pointer">+</span>
                  </div>
                  {props.teamMembers.map((m) => (
                    <div key={m.name} className="flex items-center gap-2 py-1.5 border-b border-white/30 last:border-0">
                      <div className="h-[26px] w-[26px] rounded-full bg-zinc-700 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                        {m.initials}
                      </div>
                      <span className="text-[12px] font-medium text-[#1a1a1a] flex-1 truncate">{m.name}</span>
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/30 text-zinc-500 tracking-wide uppercase">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graded Calls */}
              <div className="glass-card rounded-2xl overflow-hidden relative">
                <div className="glass-card-inner" />
                <div className="relative px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">Graded Calls</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/30 text-zinc-500">{props.calls.length}</span>
                  </div>
                  <div>
                    {props.calls.map((call) => {
                      const grade = call.score != null ? scoreGrade(call.score) : null;
                      return (
                        <Link
                          key={call.id}
                          href={`/calls/${call.id}`}
                          className="flex items-start gap-2.5 py-2 border-b border-white/30 last:border-0 cursor-pointer hover:bg-white/30 rounded-lg px-1 -mx-1"
                        >
                          {grade && call.score != null ? (
                            <div className={`h-[34px] w-[34px] rounded-full border-[1.5px] flex flex-col items-center justify-center flex-shrink-0 ${scoreBg(call.score)}`}>
                              <span className={`text-[11px] font-medium font-mono ${scoreColor(call.score)}`}>{call.score}</span>
                              <span className={`text-[8px] ${scoreColor(call.score)}`}>{grade.letter}</span>
                            </div>
                          ) : (
                            <div className="h-[34px] w-[34px] rounded-full border-[1.5px] border-white/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] text-zinc-400">—</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-zinc-700 line-clamp-2">{call.call_summary ?? 'No summary'}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {new Date(call.called_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                    {props.calls.length === 0 && <p className="text-[12px] text-zinc-400 py-4">No graded calls.</p>}
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="glass-card rounded-2xl overflow-hidden relative">
                <div className="glass-card-inner" />
                <div className="relative px-4 py-3">
                  <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-2">Tasks</h3>
                  <div className="max-h-[240px] overflow-y-auto">
                    {props.tasks.filter(t => !t.completed).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 py-2 border-b border-white/30 last:border-0">
                        <div className="h-3.5 w-3.5 rounded border border-zinc-300 flex-shrink-0" />
                        <span className="text-[12px] text-zinc-700 flex-1 truncate">{task.title}</span>
                        {task.due_date && (
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">
                            {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    ))}
                    {props.tasks.filter(t => !t.completed).length === 0 && <p className="text-[12px] text-zinc-400 py-4">No tasks.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Activity' && (
            <ActivityFeed contactId={props.companyId} initialEntries={[]} />
          )}

          {activeTab === 'Research' && (
            <CompanyResearchTab
              companyId={props.companyId}
              selectedContactId={selectedContactId}
              selectedContactName={selectedContact?.contact_name ?? null}
              companyResearch={props.companyResearch}
              contactResearch={selectedContactId ? (props.contactResearchMap[selectedContactId] ?? {}) : {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}
