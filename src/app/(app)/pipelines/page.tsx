import { supabaseAdmin } from '@/lib/supabase';
import { scoreGrade } from '@/lib/format';
import { getTenantForUser } from '@/lib/get-tenant';

const callTypePill: Record<string, string> = {
  discovery: 'bg-blue-50 text-blue-600',
  demo: 'bg-violet-50 text-violet-600',
  follow_up: 'bg-amber-50 text-amber-600',
  closing: 'bg-emerald-50 text-emerald-600',
};

export const dynamic = 'force-dynamic';

const STAGES = [
  'Lead',
  'Discovery',
  'Demo Scheduled',
  'Pilot',
  'Closed Won',
] as const;

type Stage = (typeof STAGES)[number];

/** Map each contact to a pipeline stage based on call context */
const CONTACT_STAGE_MAP: Record<string, Stage> = {
  'demo-contact-004': 'Lead',           // Jake Rivera — discovery call, early stage
  'demo-contact-003': 'Discovery',      // Lisa Patel — follow-up, needs CEO buy-in
  'demo-contact-002': 'Demo Scheduled', // Marcus Thompson — demo completed
  'demo-contact-001': 'Pilot',          // Sarah Chen — closing, pilot starting
  'demo-contact-005': 'Closed Won',     // David Kim — closed on call
};

interface PipelineContact {
  contactName: string;
  contactGhlId: string;
  score: number;
  callType: string;
  companyName: string | null;
  dealValue: string | null;
  stage: Stage;
}

export default async function PipelinesPage() {
  const { tenantId } = await getTenantForUser();

  // Fetch all calls for this tenant
  const { data: calls } = await supabaseAdmin
    .from('calls')
    .select('contact_name, contact_ghl_id, score, call_type')
    .eq('tenant_id', tenantId);

  // Fetch company_name and deal_value data points for all contacts
  const contactIds = Object.keys(CONTACT_STAGE_MAP);

  const { data: dataPoints } = await supabaseAdmin
    .from('contact_data_points')
    .select('contact_ghl_id, field_name, field_value')
    .eq('tenant_id', tenantId)
    .in('contact_ghl_id', contactIds)
    .in('field_name', ['company_name', 'deal_value']);

  // Build a lookup: contact_ghl_id -> { company_name, deal_value }
  const dpMap: Record<string, { company_name: string | null; deal_value: string | null }> = {};
  for (const dp of dataPoints ?? []) {
    if (!dpMap[dp.contact_ghl_id]) {
      dpMap[dp.contact_ghl_id] = { company_name: null, deal_value: null };
    }
    if (dp.field_name === 'company_name') {
      dpMap[dp.contact_ghl_id].company_name = dp.field_value;
    }
    if (dp.field_name === 'deal_value') {
      dpMap[dp.contact_ghl_id].deal_value = dp.field_value;
    }
  }

  // Build pipeline contacts from calls
  const contacts: PipelineContact[] = (calls ?? [])
    .filter((c) => CONTACT_STAGE_MAP[c.contact_ghl_id])
    .map((c) => ({
      contactName: c.contact_name,
      contactGhlId: c.contact_ghl_id,
      score: typeof c.score === 'object' && c.score !== null ? (c.score as { overall: number }).overall : 0,
      callType: (c as Record<string, unknown>).call_type as string ?? '',
      companyName: dpMap[c.contact_ghl_id]?.company_name ?? null,
      dealValue: dpMap[c.contact_ghl_id]?.deal_value ?? null,
      stage: CONTACT_STAGE_MAP[c.contact_ghl_id],
    }));

  // Group by stage
  const columns: Record<Stage, PipelineContact[]> = {
    Lead: [],
    Discovery: [],
    'Demo Scheduled': [],
    Pilot: [],
    'Closed Won': [],
  };

  for (const contact of contacts) {
    columns[contact.stage].push(contact);
  }

  // Total pipeline value (sum up deal values)
  const totalValue = contacts.reduce((sum, c) => {
    if (!c.dealValue) return sum;
    const num = parseFloat(c.dealValue.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="flex h-full flex-col animate-fade-in">
      {/* Header */}
      <div className="px-8 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Pipeline</h1>
        <p className="mt-1 text-[13px] text-zinc-400">
          {contacts.length} deals&nbsp;&middot;&nbsp;$
          {totalValue.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{' '}
          pipeline value
        </p>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-8 pb-6">
        <div className="flex h-full gap-3">
          {STAGES.map((stage) => {
            const stageContacts = columns[stage];
            return (
              <div
                key={stage}
                className="flex min-w-[220px] flex-1 flex-col"
              >
                {/* Column header */}
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {stage}
                  </h2>
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-zinc-200/60 px-1 text-[10px] font-medium text-zinc-500">
                    {stageContacts.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="flex flex-1 flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5">
                  {stageContacts.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-10">
                      <p className="text-[11px] text-zinc-300">No deals</p>
                    </div>
                  ) : (
                    stageContacts.map((contact) => {
                      const grade = scoreGrade(contact.score);
                      return (
                        <div
                          key={contact.contactGhlId}
                          className="rounded-xl border border-zinc-100 bg-white p-3.5 shadow-sm hover-lift"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-zinc-900">
                              {contact.contactName}
                            </p>
                            {contact.companyName && (
                              <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                                {contact.companyName}
                              </p>
                            )}
                          </div>

                          {contact.callType && (
                            <span className={`mt-1.5 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md w-fit ${callTypePill[contact.callType] ?? 'bg-zinc-50 text-zinc-500'}`}>
                              {contact.callType.replace(/_/g, ' ')}
                            </span>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold font-mono ${grade.bg} ${grade.color}`}
                            >
                              {grade.letter} {contact.score}
                            </span>
                            {contact.dealValue && (
                              <span className="text-[11px] font-mono text-zinc-500">
                                {contact.dealValue}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
