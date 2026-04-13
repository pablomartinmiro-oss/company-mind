'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { PipelineFunnel } from './pipeline-funnel';
import { CompanyList } from './company-list';
import { CreateContactModal } from './create-contact-modal';

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

interface CompanyRow {
  company_id: string;
  company_name: string;
  industry?: string | null;
  lead_source?: string | null;
  enrollments: { pipeline_name: string; stage: string }[];
  deal_value: string | null;
  days_in_stage: number;
  contact_count?: number;
  primary_contact_name?: string | null;
  primary_contact_role?: string | null;
}

interface Props {
  pipelines: PipelineData[];
  contacts: CompanyRow[];
  totalValue: string;
  activeDeals: number;
  avgDaysInStage: number;
  closingSoon: number;
}

export function PipelinePageClient({ pipelines, contacts, totalValue, activeDeals, avgDaysInStage, closingSoon }: Props) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-5 animate-fade-in">
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 bg-zinc-900 text-white text-[12px] font-medium rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 transition-all duration-150"
        >
          <Plus size={14} />
          New Contact
        </button>
      </div>

      <CreateContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="grid grid-cols-4 gap-2.5">
        <StatCard label="Total MRR" value={totalValue} />
        <StatCard label="Active Deals" value={activeDeals} />
        <StatCard label="Avg Days in Stage" value={avgDaysInStage} />
        <StatCard
          label="Closing Soon"
          value={closingSoon}
          footnote={closingSoon > 0 ? <p className="text-emerald-600 text-[11px] mt-0.5">in final stage</p> : undefined}
        />
      </div>

      <div className="mt-5">
        <PipelineFunnel
          pipelines={pipelines}
          selectedStage={selectedStage}
          onStageSelect={setSelectedStage}
        />

        <div className="border border-white/40 rounded-xl overflow-hidden">
          <CompanyList
            contacts={contacts}
            selectedStage={selectedStage}
            onClearStage={() => setSelectedStage(null)}
          />
        </div>
      </div>
    </div>
  );
}
