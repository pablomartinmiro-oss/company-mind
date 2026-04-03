'use client';

import { useState } from 'react';
import { PipelineFunnel } from './pipeline-funnel';
import { ContactList } from './contact-list';

interface StageLogEntry {
  id: string;
  stage: string;
  entered_at: string;
  moved_by: string | null;
  source: string | null;
  note: string | null;
  entry_number: number;
}

interface PipelineData {
  id: string;
  name: string;
  stages: string[];
  contacts: { contact_id: string; stage: string }[];
  stageLog: StageLogEntry[];
}

interface PipelineContact {
  contact_id: string;
  contact_name: string;
  company_name: string | null;
  stage: string;
  score: number | null;
  deal_value: string | null;
  days_in_stage: number;
}

interface Props {
  pipelines: PipelineData[];
  contacts: PipelineContact[];
  totalValue: string;
}

export function PipelinePageClient({ pipelines, contacts, totalValue }: Props) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  return (
    <div className="p-5 animate-fade-in">
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900">Pipeline</h1>
      <p className="mt-1 text-[13px] text-zinc-400">
        {contacts.length} companies · {totalValue} total value
      </p>

      <div className="mt-5">
        <PipelineFunnel
          pipelines={pipelines}
          selectedStage={selectedStage}
          onStageSelect={setSelectedStage}
        />

        <div className="border border-zinc-200/60 rounded-xl overflow-hidden">
          <ContactList
            contacts={contacts}
            selectedStage={selectedStage}
            onClearStage={() => setSelectedStage(null)}
          />
        </div>
      </div>
    </div>
  );
}
