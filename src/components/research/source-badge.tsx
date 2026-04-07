import { Sparkles, Database, Phone, User } from 'lucide-react';
import type { FieldSource } from '@/lib/research/catalog';
import type { LucideIcon } from 'lucide-react';

const SOURCE_CONFIG: Record<FieldSource, { label: string; icon: LucideIcon; pillClass: string; description: string }> = {
  api: { label: 'API', icon: Database, pillClass: 'bg-violet-100/60 text-violet-700 border border-violet-200/40', description: 'Pulled from external data source' },
  ai: { label: 'AI', icon: Sparkles, pillClass: 'bg-blue-100/60 text-blue-700 border border-blue-200/40', description: 'Inferred by AI from available data' },
  call: { label: 'Call', icon: Phone, pillClass: 'bg-emerald-100/60 text-emerald-700 border border-emerald-200/40', description: 'Extracted from a call transcript' },
  manual: { label: 'Manual', icon: User, pillClass: 'bg-amber-100/60 text-amber-700 border border-amber-200/40', description: 'Entered by a team member' },
};

export function SourceBadge({ source, sourceDetail }: { source: FieldSource; sourceDetail?: string }) {
  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[8px] font-medium px-1.5 py-0.5 rounded-full ${config.pillClass}`}
      title={sourceDetail ?? config.description}
    >
      <Icon className="w-2 h-2" />
      {config.label}
    </span>
  );
}
