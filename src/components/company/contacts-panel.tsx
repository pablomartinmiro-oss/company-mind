'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Plus, ChevronDown, Mail, Phone, X } from 'lucide-react';
import { formatPhone } from '@/lib/format-phone';

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
  contacts: ContactInfo[];
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
  onContactUpdate: (contactId: string, updates: { role?: string | null; is_primary?: boolean }) => void;
}

const ROLES = [
  { value: 'decision_maker', label: 'Decision Maker', classes: 'bg-violet-100/60 text-violet-700' },
  { value: 'champion', label: 'Champion', classes: 'bg-emerald-100/60 text-emerald-700' },
  { value: 'influencer', label: 'Influencer', classes: 'bg-blue-100/60 text-blue-700' },
  { value: 'gatekeeper', label: 'Gatekeeper', classes: 'bg-amber-100/60 text-amber-700' },
  { value: 'user', label: 'User', classes: 'bg-zinc-100/60 text-zinc-500' },
];

const ROLE_PILL: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.classes]));
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function ContactsPanel({ companyId, contacts, selectedContactId, onSelectContact, onContactUpdate }: Props) {
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    if (!editingContactId) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEditingContactId(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editingContactId]);

  function openRoleDropdown(contactId: string) {
    if (editingContactId === contactId) {
      setEditingContactId(null);
      return;
    }
    const trigger = triggerRefs.current[contactId];
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setEditingContactId(contactId);
  }

  async function updateRole(contactId: string, role: string) {
    onContactUpdate(contactId, { role });
    setEditingContactId(null);
    await fetch(`/api/companies/${companyId}/contacts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contactId, role }),
    });
  }

  async function setPrimary(contactId: string) {
    onContactUpdate(contactId, { is_primary: true });
    setEditingContactId(null);
    await fetch(`/api/companies/${companyId}/contacts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contactId, is_primary: true }),
    });
  }

  return (
    <div className="relative glass-card rounded-3xl overflow-hidden">
      <div className="glass-card-inner" />
      <div className="relative">
        <div className="px-4 py-3 border-b border-white/40 flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">Contacts</span>
          <span className="text-[10px] text-zinc-400">{contacts.length}</span>
        </div>

        <div className="divide-y divide-white/40">
          {contacts.map(contact => {
            const isEditing = editingContactId === contact.contact_id;
            return (
              <div key={contact.contact_id} className="relative">
                <div
                  onClick={() => onSelectContact(contact.contact_id)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/30 transition-colors cursor-pointer ${
                    selectedContactId === contact.contact_id ? 'bg-white/50' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-[11px] font-semibold text-zinc-700 flex-shrink-0">
                    {getInitials(contact.contact_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/contacts/${contact.contact_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[13px] font-medium text-[#1a1a1a] truncate hover:text-zinc-600 underline-offset-2 hover:underline transition-all duration-150"
                      >{contact.contact_name}</Link>
                      {contact.is_primary && <Star className="w-3 h-3 text-[#ff6a3d] fill-[#ff6a3d] flex-shrink-0" />}
                    </div>
                    {/* Editable role pill */}
                    <div className="mt-1">
                      <button
                        ref={(el) => { triggerRefs.current[contact.contact_id] = el; }}
                        onClick={(e) => { e.stopPropagation(); openRoleDropdown(contact.contact_id); }}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${ROLE_PILL[contact.role ?? ''] ?? 'bg-zinc-100/60 text-zinc-500'}`}
                      >
                        {ROLE_LABEL[contact.role ?? ''] ?? 'Set role'}
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {contact.contact_email && (
                        <a href={`mailto:${contact.contact_email}`} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-[#ff6a3d] transition-colors" onClick={(e) => e.stopPropagation()}>
                          <Mail className="w-2.5 h-2.5" /> {contact.contact_email}
                        </a>
                      )}
                      {contact.contact_phone && (
                        <a href={`tel:${contact.contact_phone}`} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-[#ff6a3d] transition-colors font-mono" onClick={(e) => e.stopPropagation()}>
                          <Phone className="w-2.5 h-2.5" /> {formatPhone(contact.contact_phone)}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role dropdown — rendered via portal to avoid overflow clipping */}
                {isEditing && mounted && dropdownPos && createPortal(
                  <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] py-1 min-w-[160px]"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                  >
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        onClick={() => updateRole(contact.contact_id, r.value)}
                        className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-zinc-50 flex items-center gap-2 ${contact.role === r.value ? 'font-medium text-[#1a1a1a]' : 'text-zinc-600'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${r.classes.split(' ')[0]}`} />
                        {r.label}
                      </button>
                    ))}
                    {!contact.is_primary && (
                      <>
                        <div className="border-t border-zinc-100 my-1" />
                        <button
                          onClick={() => setPrimary(contact.contact_id)}
                          className="w-full text-left px-3 py-1.5 text-[11px] text-[#ff6a3d] hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Star className="w-2.5 h-2.5" /> Set as primary
                        </button>
                      </>
                    )}
                  </div>,
                  document.body
                )}
              </div>
            );
          })}
        </div>

        <AddContactForm companyId={companyId} />
      </div>
    </div>
  );
}

function AddContactForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/companies/${companyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          role: role || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to add contact');
        setSaving(false);
        return;
      }
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setRole('');
      setOpen(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError('Network error');
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 text-[11px] font-medium text-[#ff6a3d] hover:bg-white/30 transition-colors border-t border-white/40 flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3 h-3" /> Add contact
      </button>
    );
  }

  return (
    <div className="border-t border-white/40 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-400">New Contact</span>
        <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-all duration-150">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name *"
            className="text-[11px] px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150" />
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name *"
            className="text-[11px] px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150" />
        </div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
          className="w-full text-[11px] px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" type="tel"
          className="w-full text-[11px] px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150" />
        <select value={role} onChange={e => setRole(e.target.value)}
          className="w-full text-[11px] px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150">
          <option value="">Role (optional)</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
      <div className="flex justify-end gap-1.5 mt-2">
        <button onClick={() => setOpen(false)} className="text-[11px] text-zinc-400 px-2 py-1 hover:text-zinc-700 transition-all duration-150">Cancel</button>
        <button onClick={handleSave} disabled={!firstName.trim() || !lastName.trim() || saving}
          className="text-[11px] px-3 py-1 bg-zinc-900 text-white rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition-all duration-150">
          {saving ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}
