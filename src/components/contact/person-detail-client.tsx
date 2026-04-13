'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, ExternalLink, ChevronRight } from 'lucide-react';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';
import { ContactResearchPanel } from './contact-research-panel';
import { formatPhone } from '@/lib/format-phone';

interface CompanyLink {
  id: string;
  name: string;
  pipelines: { stage: string; pipelineName: string }[];
}

interface ResearchData {
  value: string;
  source: string;
  source_detail?: string;
}

interface Props {
  contactId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  linkedin: string | null;
  notes: string | null;
  companies: CompanyLink[];
  researchData: Record<string, ResearchData>;
}

export function PersonDetailClient(props: Props) {
  const router = useRouter();

  const initials = [props.firstName?.[0], props.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="p-5 max-w-4xl mx-auto animate-fade-in">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="text-[12px] text-zinc-400 hover:text-zinc-700 inline-flex items-center gap-1 mb-5 transition-all duration-150"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="h-[48px] w-[48px] rounded-full bg-zinc-900 text-white text-[16px] font-semibold flex items-center justify-center">
            {initials}
          </div>
          <h1 className="text-[24px] font-medium text-zinc-900 mt-3">{props.displayName}</h1>
          {props.title && (
            <p className="text-[13px] text-zinc-400 mt-0.5">{props.title}</p>
          )}
        </div>
      </div>

      {/* Contact info strip */}
      <div className="flex gap-4 mb-5">
        {props.email && (
          <a href={`mailto:${props.email}`} className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-700 transition-all duration-150">
            <Mail className="h-3.5 w-3.5 text-zinc-400" /> {props.email}
          </a>
        )}
        {props.phone && (
          <a href={`tel:${props.phone}`} className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-700 transition-all duration-150">
            <Phone className="h-3.5 w-3.5 text-zinc-400" /> {formatPhone(props.phone)}
          </a>
        )}
        {props.linkedin && (
          <a href={props.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-700 transition-all duration-150">
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" /> LinkedIn
          </a>
        )}
      </div>

      {/* Companies section */}
      {props.companies.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-2">
            COMPANIES
          </div>
          {props.companies.map(company => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="border border-zinc-200/60 rounded-xl p-3 mb-2 flex items-center justify-between hover:bg-zinc-50 transition-all duration-150 block"
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-zinc-900">{company.name}</span>
                {company.pipelines.map((p, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-0.5 rounded-full ${STAGE_PILL_CLASSES[p.stage] ?? 'bg-zinc-100 text-zinc-500'}`}
                  >
                    {p.stage}
                  </span>
                ))}
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-300" />
            </Link>
          ))}
        </div>
      )}

      {/* Research section */}
      <div>
        <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-2">
          RESEARCH
        </div>
        <ContactResearchPanel contactId={props.contactId} initialData={props.researchData} />
      </div>
    </div>
  );
}
