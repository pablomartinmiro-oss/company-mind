'use client';

import { useState, useEffect } from 'react';
import { TEAM_MEMBERS } from '@/lib/pipeline-config';
import {
  CheckSquare, Calendar, Mail, MessageSquare, StickyNote,
  Send, ChevronDown, ChevronUp, Sparkles, X, Plus, Check, Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

type ActionType = 'task' | 'appointment' | 'email' | 'sms' | 'note';

interface NextStep {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  status: string;
}

interface ContactInfo {
  id: string;
  name: string;
}

interface CallContext {
  contactName: string | null;
  contacts: ContactInfo[];
  companyName: string | null;
  companyId: string | null;
  repName: string | null;
}

interface ActionCard {
  id: string;
  type: ActionType;
  title: string;
  description: string | null;
  reasoning: string | null;
  aiGenerated: boolean;
  status: 'pending' | 'pushed' | 'skipped';
  pushedAt: string | null;
  fields: Record<string, string>;
}

interface CardUI {
  showReasoning: boolean;
  aiInput: string;
  modifying: boolean;
  pushing: boolean;
  dirty: boolean;
}

// ── Config ─────────────────────────────────────────────────────────────

const TYPE_BADGES: Record<ActionType, { label: string; cls: string; Icon: typeof CheckSquare; pushLabel: string }> = {
  task:        { label: 'Create Task',        cls: 'bg-violet-50 text-violet-700 border border-violet-200',   Icon: CheckSquare,    pushLabel: 'Push to GHL' },
  appointment: { label: 'Create Appointment', cls: 'bg-blue-50 text-blue-700 border border-blue-200',         Icon: Calendar,       pushLabel: 'Push to GHL' },
  email:       { label: 'Send Email',         cls: 'bg-amber-50 text-amber-700 border border-amber-200',      Icon: Mail,           pushLabel: 'Send Email' },
  sms:         { label: 'Send SMS',           cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', Icon: MessageSquare, pushLabel: 'Send SMS' },
  note:        { label: 'Add Note',           cls: 'bg-zinc-100 text-zinc-500 border border-zinc-200',        Icon: StickyNote,     pushLabel: 'Add Note' },
};

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}

function defaultDateTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function normalizeType(t: string): ActionType {
  const map: Record<string, ActionType> = {
    task: 'task', create_task: 'task',
    appointment: 'appointment', create_appointment: 'appointment',
    email: 'email', send_email: 'email',
    sms: 'sms', send_sms: 'sms',
    note: 'note', create_note: 'note', add_note: 'note',
  };
  return map[t] ?? 'task';
}

// ── Component ──────────────────────────────────────────────────────────

interface Props {
  steps: NextStep[];
  callId: string;
  callSummary?: string;
  contactGhlId?: string;
}

export function NextStepsTab({ steps, callId, callSummary, contactGhlId }: Props) {
  const [ctx, setCtx] = useState<CallContext | null>(null);
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [ui, setUI] = useState<Record<string, CardUI>>({});
  const [showAll, setShowAll] = useState(false);
  const [cmdInput, setCmdInput] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch call context on mount
  useEffect(() => {
    if (!callId) return;
    fetch(`/api/calls/${callId}/context`)
      .then(r => r.json())
      .then(data => setCtx({
        contactName: data.contactName,
        contacts: data.contacts ?? [],
        companyName: data.companyName,
        companyId: data.companyId,
        repName: data.repName,
      }))
      .catch(() => {});
  }, [callId]);

  // Build cards once context is loaded
  useEffect(() => {
    if (!ctx) return;

    const built: ActionCard[] = [];
    const uiInit: Record<string, CardUI> = {};

    // Summary note card (always first)
    if (callSummary) {
      const noteId = `summary-note-${callId}`;
      built.push({
        id: noteId,
        type: 'note',
        title: `Add call summary to ${ctx.companyName ?? 'Company'}`,
        description: null,
        reasoning: 'Every call should have its key takeaways logged to the company timeline for team visibility.',
        aiGenerated: true,
        status: 'pending',
        pushedAt: null,
        fields: { content: shortenSummary(callSummary) },
      });
      uiInit[noteId] = { showReasoning: false, aiInput: '', modifying: false, pushing: false, dirty: false };
    }

    const defaultContactId = ctx.contacts[0]?.id ?? '';

    // Action cards from next_steps
    for (const step of steps) {
      if (step.status === 'skipped') continue;
      const type = normalizeType(step.action_type);
      const fields = { ...buildDefaultFields(type, step, ctx), selectedContactGhlId: defaultContactId };
      built.push({
        id: step.id,
        type,
        title: step.title,
        description: step.description,
        reasoning: null,
        aiGenerated: true,
        status: step.status as 'pending' | 'pushed' | 'skipped',
        pushedAt: null,
        fields,
      });
      uiInit[step.id] = { showReasoning: false, aiInput: '', modifying: false, pushing: false, dirty: false };
    }

    setCards(built);
    setUI(prev => ({ ...prev, ...uiInit }));
  }, [ctx, steps, callId, callSummary]);

  // ── Handlers ───────────────────────────────────────────────────────

  function updateField(cardId: string, key: string, value: string) {
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, fields: { ...c.fields, [key]: value } } : c
    ));
    setUI(prev => ({ ...prev, [cardId]: { ...prev[cardId], dirty: true } }));
  }

  function updateUI(cardId: string, patch: Partial<CardUI>) {
    setUI(prev => ({ ...prev, [cardId]: { ...prev[cardId], ...patch } }));
  }

  async function handleGenerate() {
    if (!cmdInput.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/calls/${callId}/next-steps/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: cmdInput.trim() }),
      });
      const data = await res.json();
      if (data.id) {
        const type = normalizeType(data.action_type);
        const newCard: ActionCard = {
          id: data.id,
          type,
          title: data.title ?? cmdInput.trim(),
          description: data.description ?? null,
          reasoning: data.reasoning ?? null,
          aiGenerated: true,
          status: 'pending',
          pushedAt: null,
          fields: { ...(data.fields ?? buildDefaultFields(type, { title: data.title, description: data.description } as NextStep, ctx)), selectedContactGhlId: ctx?.contacts[0]?.id ?? '' },
        };
        setCards(prev => {
          // Insert after summary note
          const summaryIdx = prev.findIndex(c => c.id.startsWith('summary-note-'));
          if (summaryIdx >= 0) {
            return [...prev.slice(0, summaryIdx + 1), newCard, ...prev.slice(summaryIdx + 1)];
          }
          return [newCard, ...prev];
        });
        setUI(prev => ({ ...prev, [data.id]: { showReasoning: true, aiInput: '', modifying: false, pushing: false, dirty: false } }));
        setCmdInput('');
      }
    } catch { /* ignore */ }
    setGenerating(false);
  }

  async function handleModify(cardId: string) {
    const card = cards.find(c => c.id === cardId);
    const cardUI = ui[cardId];
    if (!card || !cardUI?.aiInput.trim()) return;
    updateUI(cardId, { modifying: true });
    try {
      const res = await fetch(`/api/calls/${callId}/next-steps/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: cardUI.aiInput.trim(),
          currentFields: card.fields,
          actionType: card.type,
        }),
      });
      const data = await res.json();
      if (data.fields) {
        setCards(prev => prev.map(c =>
          c.id === cardId ? { ...c, fields: { ...c.fields, ...data.fields } } : c
        ));
        updateUI(cardId, { aiInput: '', dirty: true });
      }
    } catch { /* ignore */ }
    updateUI(cardId, { modifying: false });
  }

  async function handlePush(cardId: string) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    updateUI(cardId, { pushing: true });
    try {
      const res = await fetch(`/api/calls/${callId}/next-steps/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: card.id.startsWith('summary-note-') ? null : card.id,
          type: card.type,
          fields: card.fields,
          contactGhlId: card.fields.selectedContactGhlId || contactGhlId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCards(prev => prev.map(c =>
          c.id === cardId ? { ...c, status: 'pushed', pushedAt: data.pushedAt } : c
        ));
      }
    } catch { /* ignore */ }
    updateUI(cardId, { pushing: false });
  }

  async function handleSkip(cardId: string) {
    // For DB-backed steps, update status
    if (!cardId.startsWith('summary-note-')) {
      fetch(`/api/next-steps/${cardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      }).catch(() => {});
    }
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, status: 'skipped' } : c
    ));
  }

  // ── Visible cards ──────────────────────────────────────────────────

  const activeCards = cards.filter(c => c.status !== 'skipped');
  const summaryCard = activeCards.find(c => c.id.startsWith('summary-note-'));
  const actionCards = activeCards.filter(c => !c.id.startsWith('summary-note-'));
  const visibleActions = showAll ? actionCards : actionCards.slice(0, 3);
  const hiddenCount = actionCards.length - visibleActions.length;

  const visibleCards = summaryCard ? [summaryCard, ...visibleActions] : visibleActions;

  if (!ctx) {
    return <div className="py-8 text-center text-[13px] text-zinc-400">Loading…</div>;
  }

  if (visibleCards.length === 0 && !callSummary) {
    return (
      <div>
        <CommandBar value={cmdInput} onChange={setCmdInput} onSubmit={handleGenerate} loading={generating} />
        <p className="py-8 text-center text-[13px] text-zinc-400 italic">
          No suggested actions for this call. Use the bar above to add one.
        </p>
      </div>
    );
  }

  return (
    <div>
      <CommandBar value={cmdInput} onChange={setCmdInput} onSubmit={handleGenerate} loading={generating} />

      {visibleCards.map(card => (
        <ActionCardView
          key={card.id}
          card={card}
          ui={ui[card.id] ?? { showReasoning: false, aiInput: '', modifying: false, pushing: false, dirty: false }}
          ctx={ctx}
          onFieldChange={(k, v) => updateField(card.id, k, v)}
          onUIChange={(p) => updateUI(card.id, p)}
          onPush={() => handlePush(card.id)}
          onSkip={() => handleSkip(card.id)}
          onModify={() => handleModify(card.id)}
        />
      ))}

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-[11px] text-zinc-400 hover:text-zinc-600 cursor-pointer py-3 flex items-center justify-center gap-1"
        >
          Show {hiddenCount} more suggestion{hiddenCount === 1 ? '' : 's'}
        </button>
      )}
      {showAll && actionCards.length > 3 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full text-center text-[12px] text-zinc-500 hover:text-zinc-700 py-2 flex items-center justify-center gap-1"
        >
          <ChevronUp className="h-3.5 w-3.5" /> Show less
        </button>
      )}
    </div>
  );
}

// ── Command Bar ────────────────────────────────────────────────────────

function CommandBar({ value, onChange, onSubmit, loading }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white border border-zinc-200/60 rounded-xl p-3 mb-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
          placeholder="Add an action... e.g. 'Schedule onboarding call Tuesday 10am'"
          className="flex-1 text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50 focus:outline-none focus:border-zinc-400 focus:bg-white"
        />
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="px-3 py-2 bg-zinc-900 text-white text-[12px] font-medium rounded-lg hover:bg-zinc-700 flex items-center gap-1.5 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add
        </button>
      </div>
    </div>
  );
}

// ── Action Card ────────────────────────────────────────────────────────

function ActionCardView({ card, ui: cardUI, ctx, onFieldChange, onUIChange, onPush, onSkip, onModify }: {
  card: ActionCard;
  ui: CardUI;
  ctx: CallContext;
  onFieldChange: (key: string, value: string) => void;
  onUIChange: (patch: Partial<CardUI>) => void;
  onPush: () => void;
  onSkip: () => void;
  onModify: () => void;
}) {
  const badge = TYPE_BADGES[card.type];
  const isPushed = card.status === 'pushed';

  return (
    <div className={`bg-white border border-zinc-200/60 rounded-xl overflow-hidden mb-3 transition-opacity ${isPushed ? 'opacity-60' : ''}`}>
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${badge.cls}`}>
            <badge.Icon className="h-3 w-3" />
            {badge.label}
          </span>
          {card.aiGenerated && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          )}
          {ctx.contacts.length > 1 ? (
            <span className="ml-auto text-[11px] text-zinc-400">
              re: {ctx.contacts.find(c => c.id === card.fields.selectedContactGhlId)?.name ?? ctx.contacts[0]?.name}
            </span>
          ) : ctx.contactName ? (
            <span className="ml-auto text-[11px] text-zinc-400">re: {ctx.contactName}</span>
          ) : null}
        </div>

        <h4 className="text-[14px] font-medium text-zinc-900 mt-1.5">{card.title}</h4>

        {card.reasoning && (
          <div className="mt-1.5">
            <button
              onClick={() => onUIChange({ showReasoning: !cardUI.showReasoning })}
              className="text-[11px] text-blue-500 cursor-pointer flex items-center gap-1 hover:text-blue-600"
            >
              <Sparkles className="h-2.5 w-2.5" />
              Why this action? {cardUI.showReasoning ? '▾' : '›'}
            </button>
            {cardUI.showReasoning && (
              <p className="text-[12px] text-zinc-500 leading-relaxed mt-1.5 bg-zinc-50 rounded-lg px-3 py-2">
                {card.reasoning}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Form (only for pending) ── */}
      {!isPushed && (
        <>
          <div className="px-4 py-4">
            <CardForm card={card} onFieldChange={onFieldChange} ctx={ctx} />
          </div>

          {/* ── AI Change Bar ── */}
          <div className="px-4 pb-3">
            <div className="text-[10px] font-medium text-blue-500 tracking-widest mb-1.5 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> TELL AI WHAT TO CHANGE
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={cardUI.aiInput}
                onChange={e => onUIChange({ aiInput: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') onModify(); }}
                placeholder="e.g. Make it more urgent, change date to next Tuesday..."
                className="flex-1 text-[12px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400"
              />
              <button
                onClick={onModify}
                disabled={cardUI.modifying || !cardUI.aiInput.trim()}
                className="px-3 py-2 bg-zinc-900 text-white text-[12px] rounded-lg hover:bg-zinc-700 disabled:opacity-40 flex items-center gap-1"
              >
                {cardUI.modifying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Footer ── */}
      {isPushed ? (
        <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-500" />
          <span className="text-[12px] text-emerald-700 font-medium">Pushed to GHL</span>
          {card.pushedAt && (
            <span className="text-[11px] text-emerald-500">
              {new Date(card.pushedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })} CT
            </span>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 bg-zinc-50/50 border-t border-zinc-100 flex items-center gap-2">
          <button
            onClick={onPush}
            disabled={cardUI.pushing}
            className="bg-zinc-900 text-white text-[12px] font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 disabled:opacity-40"
          >
            {cardUI.pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {badge.pushLabel}
          </button>

          <button
            onClick={onSkip}
            className="ml-auto text-[12px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}

// ── Type-specific forms ────────────────────────────────────────────────

function CardForm({ card, onFieldChange, ctx }: {
  card: ActionCard;
  onFieldChange: (key: string, value: string) => void;
  ctx: CallContext;
}) {
  switch (card.type) {
    case 'task': return <TaskForm fields={card.fields} onChange={onFieldChange} ctx={ctx} />;
    case 'appointment': return <AppointmentForm fields={card.fields} onChange={onFieldChange} ctx={ctx} />;
    case 'email': return <EmailForm fields={card.fields} onChange={onFieldChange} ctx={ctx} />;
    case 'sms': return <SmsForm fields={card.fields} onChange={onFieldChange} ctx={ctx} />;
    case 'note': return <NoteForm fields={card.fields} onChange={onFieldChange} ctx={ctx} />;
  }
}

const LABEL = 'text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1';
const INPUT = 'w-full text-[12px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400';
const TEXTAREA = `${INPUT} resize-none`;

function ContactField({ fields, onChange, ctx }: { fields: Record<string, string>; onChange: (k: string, v: string) => void; ctx: CallContext }) {
  if (ctx.contacts.length > 1) {
    return (
      <div>
        <label className={LABEL}>Contact</label>
        <select
          value={fields.selectedContactGhlId ?? ctx.contacts[0]?.id ?? ''}
          onChange={e => onChange('selectedContactGhlId', e.target.value)}
          className={INPUT}
        >
          {ctx.contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
    );
  }
  if (ctx.contactName) {
    return (
      <div>
        <label className={LABEL}>Contact</label>
        <div className="text-[12px] px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500">{ctx.contactName}</div>
      </div>
    );
  }
  return null;
}

function TaskForm({ fields, onChange, ctx }: { fields: Record<string, string>; onChange: (k: string, v: string) => void; ctx: CallContext }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Task Title</label>
        <input type="text" value={fields.title ?? ''} onChange={e => onChange('title', e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea rows={2} value={fields.description ?? ''} onChange={e => onChange('description', e.target.value)} className={TEXTAREA} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Due Date</label>
          <input type="date" value={fields.dueDate ?? ''} onChange={e => onChange('dueDate', e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Assigned To</label>
          <select value={fields.assignedTo ?? ''} onChange={e => onChange('assignedTo', e.target.value)} className={INPUT}>
            {TEAM_MEMBERS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <ContactField fields={fields} onChange={onChange} ctx={ctx} />
    </div>
  );
}

function AppointmentForm({ fields, onChange, ctx }: { fields: Record<string, string>; onChange: (k: string, v: string) => void; ctx: CallContext }) {
  const [calendars, setCalendars] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/calendars')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCalendars(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Appointment Title</label>
        <input type="text" value={fields.title ?? ''} onChange={e => onChange('title', e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Calendar</label>
        <select value={fields.calendarId ?? ''} onChange={e => onChange('calendarId', e.target.value)} className={INPUT}>
          <option value="">Select calendar…</option>
          {calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Date & Time</label>
          <input type="datetime-local" value={fields.dateTime ?? ''} onChange={e => onChange('dateTime', e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Assigned To</label>
          <select value={fields.assignedTo ?? ''} onChange={e => onChange('assignedTo', e.target.value)} className={INPUT}>
            {TEAM_MEMBERS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <ContactField fields={fields} onChange={onChange} ctx={ctx} />
    </div>
  );
}

function EmailForm({ fields, onChange, ctx }: { fields: Record<string, string>; onChange: (k: string, v: string) => void; ctx: CallContext }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Subject</label>
        <input type="text" value={fields.subject ?? ''} onChange={e => onChange('subject', e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Message</label>
        <textarea rows={4} value={fields.message ?? ''} onChange={e => onChange('message', e.target.value)} className={TEXTAREA} />
      </div>
      {ctx.contactName && (
        <div>
          <label className={LABEL}>To</label>
          <div className="text-[12px] px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500">{ctx.contactName}</div>
        </div>
      )}
    </div>
  );
}

function SmsForm({ fields, onChange, ctx }: { fields: Record<string, string>; onChange: (k: string, v: string) => void; ctx: CallContext }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Message</label>
        <textarea rows={3} value={fields.message ?? ''} onChange={e => onChange('message', e.target.value)} className={TEXTAREA} />
      </div>
      {ctx.contactName && (
        <div>
          <label className={LABEL}>To</label>
          <div className="text-[12px] px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500">{ctx.contactName}</div>
        </div>
      )}
    </div>
  );
}

function NoteForm({ fields, onChange, ctx }: { fields: Record<string, string>; onChange: (k: string, v: string) => void; ctx: CallContext }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Note Content</label>
        <textarea rows={4} value={fields.content ?? ''} onChange={e => onChange('content', e.target.value)} className={TEXTAREA} />
      </div>
      {ctx.companyName && (
        <div>
          <label className={LABEL}>Scope</label>
          <div className="text-[12px] px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500 flex items-center gap-1.5">
            <StickyNote className="h-3 w-3" /> {ctx.companyName}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function shortenSummary(text: string): string {
  if (text.length <= 400) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 3).join(' ');
}

function buildDefaultFields(type: ActionType, step: Pick<NextStep, 'title' | 'description'>, ctx: CallContext | null): Record<string, string> {
  const rep = ctx?.repName ?? TEAM_MEMBERS[0].name;
  switch (type) {
    case 'task':
      return { title: step.title ?? '', description: step.description ?? '', dueDate: defaultDueDate(), assignedTo: rep };
    case 'appointment':
      return { title: step.title ?? '', dateTime: defaultDateTime(), assignedTo: rep };
    case 'email':
      return { subject: step.title ?? '', message: step.description ?? '' };
    case 'sms':
      return { message: step.description ?? step.title ?? '' };
    case 'note':
      return { content: step.description ?? '' };
    default:
      return {};
  }
}
