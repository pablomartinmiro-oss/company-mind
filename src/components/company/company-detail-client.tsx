'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { STAGE_PILL_CLASSES, STAGE_ICONS } from '@/lib/pipeline-config';
import { ContactsPanel } from './contacts-panel';
import { CompanyResearchTab } from './research-tab';
import { PipelineTracker } from '@/components/contact/pipeline-tracker';
import { ActivityFeed } from '@/components/contact/activity-feed';

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

interface Props {
  companyId: string;
  companyName: string;
  industry: string | null;
  location: string | null;
  employeeCount: string | null;
  enrollments: Enrollment[];
  contacts: ContactInfo[];
  companyResearch: Record<string, { field_name: string; field_value: string | null; source: string }[]>;
  contactResearchMap: Record<string, { field_name: string; field_value: string | null; source: string; section: string }[]>;
}

const TABS = ['Overview', 'Activity', 'Research'] as const;
type Tab = typeof TABS[number];

export function CompanyDetailClient(props: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [selectedContactId, setSelectedContactId] = useState(
    props.contacts.find(c => c.is_primary)?.contact_id ?? props.contacts[0]?.contact_id ?? null
  );

  const selectedContact = props.contacts.find(c => c.contact_id === selectedContactId);

  // Build enrollments in PipelineTracker format
  const trackerEnrollments = props.enrollments.map(e => ({
    pipelineId: e.pipelineId,
    pipelineName: e.pipelineName,
    stages: e.stages,
    currentStage: e.currentStage,
    stageLog: e.stageLog,
  }));

  const daysInStage = props.enrollments[0]?.daysInStage ?? 0;

  return (
    <div className="p-5 animate-fade-in">
      {/* Header card */}
      <div className="relative glass-card rounded-3xl overflow-hidden mb-4">
        <div className="glass-card-inner" />
        <div className="relative px-6 py-5">
          <Link href="/companies" className="text-[12px] text-zinc-500 hover:text-zinc-800 mb-3 inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3 w-3" /> Back to companies
          </Link>

          <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900 leading-tight mt-2">
            {props.companyName}
          </h1>

          <div className="flex items-center gap-2 mt-2 text-[12px] text-zinc-500">
            {props.industry && <span>{props.industry}</span>}
            {props.industry && props.location && <span>·</span>}
            {props.location && <span>{props.location}</span>}
            {props.employeeCount && <><span>·</span><span>{props.employeeCount} employees</span></>}
          </div>

          {/* Pipeline status row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {props.enrollments.map(e => (
              <div key={e.pipelineId} className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400">{e.pipelineName}</span>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${STAGE_PILL_CLASSES[e.currentStage] ?? 'bg-zinc-100 text-zinc-500'}`}>
                  {e.currentStage}
                </span>
                <span className="text-[10px] text-zinc-400">{e.daysInStage}d in stage</span>
                {e.dealValue && <span className="text-[11px] font-mono text-zinc-600">{e.dealValue}</span>}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Re-enrich
            </button>
            <button className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors inline-flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" /> Open in GHL
            </button>
          </div>
        </div>

        {/* Pipeline tracker */}
        <div className="px-6 py-4 border-t border-white/40">
          <PipelineTracker enrollments={trackerEnrollments} />
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-t border-white/40">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[13px] font-medium cursor-pointer border-b-2 -mb-px transition-all ${
                activeTab === tab
                  ? 'text-zinc-900 border-[#ff6a3d]'
                  : 'text-zinc-500 border-transparent hover:text-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-[320px_1fr] gap-4">
        {/* Left: Contacts */}
        <ContactsPanel
          contacts={props.contacts}
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
        />

        {/* Right: Tab content */}
        <div>
          {activeTab === 'Overview' && (
            <div className="relative glass-card rounded-3xl overflow-hidden p-5">
              <div className="glass-card-inner" />
              <div className="relative">
                <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Overview</h3>
                {selectedContact && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Selected Contact</span>
                      <p className="text-[14px] font-medium text-zinc-900 mt-1">{selectedContact.contact_name}</p>
                      {selectedContact.contact_email && <p className="text-[12px] text-zinc-500">{selectedContact.contact_email}</p>}
                      {selectedContact.contact_phone && <p className="text-[12px] text-zinc-500">{selectedContact.contact_phone}</p>}
                    </div>
                    <div className="border-t border-white/40 pt-3">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Pipeline Progress</span>
                      {props.enrollments.map(e => (
                        <div key={e.pipelineId} className="mt-2">
                          <p className="text-[12px] text-zinc-700">{e.pipelineName}: <span className="font-medium">{e.currentStage}</span></p>
                          <p className="text-[11px] text-zinc-500">{e.daysInStage} days in current stage</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!selectedContact && (
                  <p className="text-[12px] text-zinc-400">No contacts attached to this company.</p>
                )}
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
              contactResearch={selectedContactId ? (props.contactResearchMap[selectedContactId] ?? []) : []}
            />
          )}
        </div>
      </div>
    </div>
  );
}
