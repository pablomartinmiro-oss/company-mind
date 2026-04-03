'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PipelineTracker } from './pipeline-tracker';
import { ActivityFeed } from './activity-feed';
import { ResearchTab } from './research-tab';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';
import { scoreGrade, scoreBg, scoreColor } from '@/lib/format';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface StageLogEntry {
  id: string;
  stage: string;
  entered_at: string;
  moved_by: string | null;
  source: string | null;
  note: string | null;
  entry_number: number;
}

interface PipelineEnrollment {
  pipelineId: string;
  pipelineName: string;
  stages: string[];
  currentStage: string;
  stageLog: StageLogEntry[];
}

interface ContactCall {
  id: string;
  score: number | null;
  call_summary: string | null;
  call_type: string | null;
  called_at: string;
  duration_seconds: number | null;
}

interface ContactTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
}

interface ActivityEntry {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
  author: string | null;
  created_at: string;
}

interface ResearchField {
  field_name: string;
  field_value: string | null;
  source: string;
}

interface Props {
  contactId: string;
  contactName: string;
  companyName: string | null;
  location: string | null;
  currentStage: string | null;
  daysInStage: number;
  callType: string | null;
  enrollments: PipelineEnrollment[];
  calls: ContactCall[];
  tasks: ContactTask[];
  activity: ActivityEntry[];
  research: Record<string, ResearchField[]>;
  pipelineNames: string[];
  teamMembers: { name: string; initials: string; role: string }[];
  contactDetails: { label: string; value: string }[];
  contactRole?: string | null;
  appointments?: { id: string; contactName: string; type: string; startTime: string; status: string }[];
}

const TABS = ['Overview', 'Activity', 'Research'] as const;
type Tab = typeof TABS[number];

export function ContactDetailClient(props: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <div className="p-5 animate-fade-in">
      {/* Back link */}
      <Link href="/pipeline" className="text-[12px] text-zinc-400 hover:text-zinc-700 py-3 inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to pipeline
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mt-2">
        <div>
          {/* Badge row — show all pipeline enrollments */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {props.enrollments.map((e) => (
              <span
                key={e.pipelineId}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${STAGE_PILL_CLASSES[e.currentStage] ?? 'bg-zinc-100 text-zinc-500'}`}
              >
                {e.currentStage} — {e.pipelineName}
              </span>
            ))}
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500">
              {props.daysInStage}d in stage
            </span>
            {props.callType && (
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {props.callType}
              </span>
            )}
          </div>

          <h1 className="text-[24px] font-medium text-zinc-900 leading-tight">{props.contactName}</h1>
          {(props.companyName || props.location) && (
            <p className="text-[14px] text-zinc-500 mt-1">
              {props.companyName}{props.companyName && props.location ? ' · ' : ''}{props.location}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5">
            GHL <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Pipeline tracker */}
      <div className="mt-5">
        <PipelineTracker enrollments={props.enrollments} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200/60 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer border-b-2 -mb-px transition-all ${
              activeTab === tab
                ? 'text-zinc-900 border-zinc-900'
                : 'text-zinc-400 border-transparent hover:text-zinc-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-[300px_1fr] gap-5">
          {/* Left column */}
          <div>
            {/* Contacts */}
            <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-2">Contacts</h3>
            <div className="border border-zinc-200/60 rounded-lg p-3 mb-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{props.contactName}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 cursor-pointer">
                  {props.contactRole ?? 'Owner / Decision Maker'} ▾
                </span>
              </div>
              {props.contactDetails.length > 0 && (
                <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  {props.contactDetails.map((d) => d.value).join(' · ')}
                </div>
              )}
            </div>
            <span className="text-[11px] text-blue-600 cursor-pointer mt-1.5 block">+ Add contact</span>

            <div className="border-t border-zinc-100 my-3" />

            {/* Team */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400">Team</h3>
              <span className="text-[11px] text-blue-600 cursor-pointer">+</span>
            </div>
            {props.teamMembers.map((m) => (
              <div key={m.name} className="flex items-center gap-2 py-1.5 border-b border-zinc-100 last:border-0">
                <div className="h-[26px] w-[26px] rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                  {m.initials}
                </div>
                <span className="text-[12px] font-medium flex-1">{m.name}</span>
                <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-400 tracking-wide uppercase">{m.role}</span>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div>
            {/* Graded calls */}
            <div className="flex items-center gap-1.5 mb-2">
              <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400">Graded Calls</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{props.calls.length}</span>
            </div>
            {props.calls.map((call) => {
              const grade = call.score != null ? scoreGrade(call.score) : null;
              return (
                <Link
                  key={call.id}
                  href={`/calls/${call.id}`}
                  className="flex items-start gap-2.5 py-2 border-b border-zinc-100 last:border-0 cursor-pointer hover:bg-zinc-50/50 rounded-lg px-1 -mx-1"
                >
                  {grade && call.score != null ? (
                    <div className={`h-[34px] w-[34px] rounded-full border-[1.5px] flex flex-col items-center justify-center flex-shrink-0 ${scoreBg(call.score)}`}>
                      <span className={`text-[11px] font-medium font-mono ${scoreColor(call.score)}`}>{call.score}</span>
                      <span className={`text-[8px] ${scoreColor(call.score)}`}>{grade.letter}</span>
                    </div>
                  ) : (
                    <div className="h-[34px] w-[34px] rounded-full border-[1.5px] border-zinc-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] text-zinc-300">—</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-zinc-600 line-clamp-2">{call.call_summary ?? 'No summary'}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {new Date(call.called_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </Link>
              );
            })}
            {props.calls.length === 0 && <p className="text-[12px] text-zinc-300 py-4">No graded calls.</p>}

            {/* Tasks */}
            <div className="mt-5">
              <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-2">Tasks</h3>
              {props.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 py-2 border-b border-zinc-100 last:border-0">
                  <div className={`h-3.5 w-3.5 rounded border flex-shrink-0 ${task.completed ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'}`} />
                  <span className="text-[12px] text-zinc-600 flex-1">{task.title}</span>
                  {task.due_date && (
                    <span className="text-[10px] text-zinc-400">
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              ))}
              {props.tasks.length === 0 && <p className="text-[12px] text-zinc-300 py-4">No tasks.</p>}
            </div>

            {/* Upcoming Appointments */}
            <div className="mt-5">
              <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-2">Upcoming Appointments</h3>
              {(props.appointments ?? []).length > 0 ? (
                (props.appointments ?? []).map((appt) => {
                  const time = new Date(appt.startTime);
                  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const isConfirmed = appt.status === 'confirmed';
                  return (
                    <div key={appt.id} className="flex items-start gap-2 py-2 border-b border-zinc-100 last:border-0">
                      <span className="text-[10px] font-mono text-zinc-400 w-[44px] shrink-0 pt-0.5">{timeStr}</span>
                      <div className={`w-[2px] self-stretch rounded-sm ${isConfirmed ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                      <div>
                        <p className="text-[12px] font-medium">{appt.contactName}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{appt.type}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${isConfirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                          {isConfirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[12px] text-zinc-400 py-4">No upcoming appointments</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Activity' && (
        <ActivityFeed contactId={props.contactId} initialEntries={props.activity} />
      )}

      {activeTab === 'Research' && (
        <ResearchTab contactId={props.contactId} researchData={props.research} pipelineNames={props.pipelineNames} />
      )}
    </div>
  );
}
