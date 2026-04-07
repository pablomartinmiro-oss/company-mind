'use client';

import { Star, Plus } from 'lucide-react';

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
  contacts: ContactInfo[];
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
}

const ROLE_PILL: Record<string, string> = {
  decision_maker: 'bg-violet-100/60 text-violet-700',
  champion: 'bg-emerald-100/60 text-emerald-700',
  influencer: 'bg-blue-100/60 text-blue-700',
  gatekeeper: 'bg-amber-100/60 text-amber-700',
  user: 'bg-zinc-100/60 text-zinc-500',
};

const ROLE_LABEL: Record<string, string> = {
  decision_maker: 'Decision Maker',
  champion: 'Champion',
  influencer: 'Influencer',
  gatekeeper: 'Gatekeeper',
  user: 'User',
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function ContactsPanel({ contacts, selectedContactId, onSelectContact }: Props) {
  return (
    <div className="relative glass-card rounded-3xl overflow-hidden">
      <div className="glass-card-inner" />
      <div className="relative">
        <div className="px-4 py-3 border-b border-white/40 flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">
            Contacts
          </span>
          <span className="text-[10px] text-zinc-400">{contacts.length}</span>
        </div>

        <div className="divide-y divide-white/40">
          {contacts.map(contact => (
            <button
              key={contact.contact_id}
              onClick={() => onSelectContact(contact.contact_id)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/30 transition-colors ${
                selectedContactId === contact.contact_id ? 'bg-white/50' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-[11px] font-semibold text-zinc-700 flex-shrink-0">
                {getInitials(contact.contact_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-zinc-900 truncate">
                    {contact.contact_name}
                  </span>
                  {contact.is_primary && (
                    <Star className="w-3 h-3 text-[#ff6a3d] fill-[#ff6a3d] flex-shrink-0" />
                  )}
                </div>
                {contact.role && (
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${ROLE_PILL[contact.role] ?? 'bg-zinc-100 text-zinc-500'}`}>
                    {ROLE_LABEL[contact.role] ?? contact.role}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button className="w-full px-4 py-3 text-[11px] font-medium text-[#ff6a3d] hover:bg-white/30 transition-colors border-t border-white/40 flex items-center justify-center gap-1.5">
          <Plus className="w-3 h-3" /> Add contact
        </button>
      </div>
    </div>
  );
}
