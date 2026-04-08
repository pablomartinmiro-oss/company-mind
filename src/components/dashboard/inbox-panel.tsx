'use client';

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { formatExactTime, formatExactDateTime } from '@/lib/format';

interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  type: string;
  dateAdded: string;
  meta?: {
    from?: string;
    to?: string;
    subject?: string;
    phone?: string;
  };
}

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  companyName?: string;
  companyId?: string;
  contactEmail?: string;
  contactPhone?: string;
  lastMessageBody: string;
  lastMessageType: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: Message[];
  channel?: string;
}

const CHANNEL_ICONS: Record<string, { bg: string; text: string; letter: string }> = {
  SMS:      { bg: 'bg-emerald-50', text: 'text-emerald-700', letter: 'S' },
  Email:    { bg: 'bg-blue-50',    text: 'text-blue-700',    letter: 'E' },
  WhatsApp: { bg: 'bg-teal-50',    text: 'text-teal-700',    letter: 'W' },
};

const CHANNEL_TABS = ['SMS', 'Email', 'WhatsApp'] as const;

function detectChannel(convo: Conversation): string {
  if (convo.channel) return convo.channel;
  const t = convo.lastMessageType;
  if (t === 'Email' || t === 'email') return 'Email';
  if (t === 'WhatsApp' || t === 'whatsapp') return 'WhatsApp';
  return 'SMS';
}

export function InboxPanel() {
  const [conversations, setConversations] = useState<{ unread: Conversation[]; needsReply: Conversation[] }>({ unread: [], needsReply: [] });
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [replyChannel, setReplyChannel] = useState<string>('SMS');
  const [replyText, setReplyText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchInbox() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/inbox');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConversations(data);
      if (!selected && (data.unread.length > 0 || data.needsReply.length > 0)) {
        const first = data.unread[0] || data.needsReply[0];
        setSelected(first);
        setReplyChannel(detectChannel(first));
      }
    } catch {
      setConversations({ unread: [], needsReply: [] });
      setError(true);
    }
    setLoading(false);
  }

  useEffect(() => { fetchInbox(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectConversation(convo: Conversation) {
    setSelected(convo);
    setReplyChannel(detectChannel(convo));
    setReplyText('');
    setEmailSubject('');
  }

  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSend() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selected.id,
          contactId: selected.contactId,
          message: replyText,
          channel: replyChannel.toLowerCase(),
          subject: replyChannel === 'Email' ? emailSubject : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Send failed (${res.status})`);
      }
      setReplyText('');
      setEmailSubject('');
      fetchInbox();
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Failed to send message');
    }
    setSending(false);
  }

  const allConvos = [...conversations.unread, ...conversations.needsReply];
  const totalUnread = conversations.unread.length;
  const activeChannel = selected ? detectChannel(selected) : 'SMS';

  return (
    <div className="relative glass-card rounded-3xl overflow-hidden flex flex-col" style={{ height: 516 }}>
      <div className="glass-card-inner" />
      {/* Header */}
      <div className="relative h-9 flex items-center justify-between px-3.5 border-b border-white/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">Inbox</span>
          {totalUnread > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
              {totalUnread}
            </span>
          )}
        </div>
        <button onClick={fetchInbox} className="p-1">
          <RefreshCw className={`h-3 w-3 text-zinc-500 hover:text-zinc-700 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="relative flex" style={{ height: 480 }}>
        {/* Left: conversation list */}
        <div className="w-[240px] border-r border-white/40 overflow-y-auto">
          {conversations.unread.length > 0 && (
            <>
              <div className="text-[9px] font-semibold tracking-widest uppercase text-zinc-500 bg-white/30 px-3 py-1.5 border-b border-white/30 flex items-center gap-1.5">
                Unread
                <span className="text-[9px] px-1 py-0.5 rounded-full bg-red-50 text-red-600">{conversations.unread.length}</span>
              </div>
              {conversations.unread.map((c) => (
                <ConvoRow key={c.id} convo={c} isSelected={selected?.id === c.id} onSelect={() => selectConversation(c)} />
              ))}
            </>
          )}
          {conversations.needsReply.length > 0 && (
            <>
              <div className="text-[9px] font-semibold tracking-widest uppercase text-zinc-500 bg-white/30 px-3 py-1.5 border-b border-white/30 flex items-center gap-1.5">
                Needs Reply
                <span className="text-[9px] px-1 py-0.5 rounded-full bg-amber-50 text-amber-700">{conversations.needsReply.length}</span>
              </div>
              {conversations.needsReply.map((c) => (
                <ConvoRow key={c.id} convo={c} isSelected={selected?.id === c.id} onSelect={() => selectConversation(c)} />
              ))}
            </>
          )}
          {allConvos.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center px-4">
              {error ? (
                <>
                  <AlertCircle className="h-6 w-6 text-zinc-300" />
                  <p className="text-[13px] text-zinc-500">Inbox unavailable</p>
                  <p className="text-[11px] text-zinc-400">Check GHL connection</p>
                  <button
                    onClick={fetchInbox}
                    className="mt-2 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-white/50 text-zinc-600 hover:bg-white/30"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <Mail className="h-6 w-6 text-zinc-300" />
                  <p className="text-[13px] text-zinc-500">No conversations yet</p>
                  <p className="text-[11px] text-zinc-400">Conversations from SMS, email, and WhatsApp will appear here</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: thread */}
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              {/* Thread header */}
              <div className="h-10 flex items-center gap-2.5 px-3.5 border-b border-white/40">
                <div className="h-7 w-7 rounded-full bg-zinc-700 text-white text-[10px] font-semibold flex items-center justify-center">
                  {selected.contactName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#1a1a1a] truncate">{selected.contactName}</span>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${CHANNEL_ICONS[activeChannel]?.bg ?? 'bg-white/30'} ${CHANNEL_ICONS[activeChannel]?.text ?? 'text-zinc-500'}`}>
                      {activeChannel}
                    </span>
                  </div>
                  {selected.companyName && selected.companyId && (
                    <a
                      href={`/companies/${selected.companyId}`}
                      className="text-[10px] text-[#71717a] hover:text-[#ff6a3d] transition-colors truncate block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {selected.companyName}
                    </a>
                  )}
                </div>
              </div>

              {/* Messages — channel-specific layout */}
              <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2 bg-white/20">
                {activeChannel === 'Email'
                  ? <EmailThread messages={selected.messages} contactName={selected.contactName} contactEmail={selected.contactEmail} />
                  : activeChannel === 'WhatsApp'
                    ? <WhatsAppThread messages={selected.messages} contactName={selected.contactName} contactPhone={selected.contactPhone} />
                    : <SMSThread messages={selected.messages} contactName={selected.contactName} contactPhone={selected.contactPhone} />
                }
              </div>

              {/* Reply area */}
              <div className="border-t border-white/40 px-3 py-2.5 bg-white/30 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-500">Reply via</span>
                  {CHANNEL_TABS.map((ch) => {
                    const isActive = replyChannel === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => setReplyChannel(ch)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                          isActive
                            ? 'bg-white/70 backdrop-blur text-[#1a1a1a] border-white/60'
                            : 'text-zinc-500 border-white/40 hover:bg-white/30'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>

                {/* Email subject field */}
                {replyChannel === 'Email' && (
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject..."
                    className="w-full text-[12px] px-2.5 py-1.5 border border-white/60 rounded-lg bg-white/50 text-[#1a1a1a] focus:outline-none focus:border-zinc-400 mb-2"
                  />
                )}

                <div className="flex items-center gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    rows={replyChannel === 'Email' ? 3 : 1}
                    className={`flex-1 resize-none text-[12px] px-2.5 py-1.5 border border-white/60 rounded-lg bg-white/50 text-[#1a1a1a] focus:outline-none focus:border-zinc-400 ${replyChannel === 'Email' ? 'min-h-[100px]' : ''}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && replyChannel !== 'Email') { e.preventDefault(); handleSend(); } }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !replyText.trim()}
                    className="px-3.5 py-1.5 bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white text-[12px] font-medium rounded-full hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 self-end"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="text-[11px]">
                      {replyChannel === 'Email' ? 'Send Email' : replyChannel === 'WhatsApp' ? 'Send WhatsApp' : 'Send SMS'}
                    </span>
                  </button>
                </div>
                {sendError && (
                  <p className="text-[11px] text-rose-600 mt-1 px-1">{sendError}</p>
                )}
              </div>
            </>
          ) : allConvos.length > 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[12px] text-zinc-400">Select a conversation</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Contact metadata available but not displayed in bubbles — thread header shows name + channel

/* ─── SMS Thread ─── */
function SMSThread({ messages }: { messages: Message[]; contactName: string; contactPhone?: string }) {
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.direction === 'inbound' ? 'self-start max-w-[78%]' : 'self-end max-w-[78%]'}>
          <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
            msg.direction === 'inbound'
              ? 'bg-white/70 backdrop-blur border border-white/60 text-zinc-800 rounded-2xl rounded-tl-md shadow-[0_2px_8px_rgba(28,25,22,0.04)]'
              : 'bg-emerald-500/90 text-white rounded-2xl rounded-tr-md shadow-[0_2px_8px_rgba(16,185,129,0.2)]'
          }`}>
            {msg.body}
          </div>
          <div className={`text-[10px] text-zinc-400 mt-1 font-mono ${msg.direction === 'inbound' ? 'ml-1' : 'mr-1 text-right'}`}>
            {formatExactTime(msg.dateAdded)}
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Email Thread ─── */
function EmailThread({ messages }: { messages: Message[]; contactName: string; contactEmail?: string }) {
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.direction === 'inbound' ? 'self-start max-w-[85%]' : 'self-end max-w-[85%]'}>
          <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
            msg.direction === 'inbound'
              ? 'bg-white/70 backdrop-blur border border-white/60 text-zinc-800 rounded-tl-md shadow-[0_2px_8px_rgba(28,25,22,0.04)]'
              : 'bg-blue-500/90 text-white rounded-tr-md shadow-[0_2px_8px_rgba(59,130,246,0.2)]'
          }`}>
            {msg.meta?.subject && (
              <p className={`text-[10px] font-medium mb-1 ${msg.direction === 'inbound' ? 'text-zinc-500' : 'text-blue-100'}`}>
                {msg.meta.subject}
              </p>
            )}
            <div className="whitespace-pre-wrap">{msg.body}</div>
          </div>
          <div className={`text-[10px] text-zinc-400 mt-1 font-mono ${msg.direction === 'inbound' ? 'ml-1' : 'mr-1 text-right'}`}>
            {formatExactDateTime(msg.dateAdded)}
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── WhatsApp Thread ─── */
function WhatsAppThread({ messages }: { messages: Message[]; contactName: string; contactPhone?: string }) {
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.direction === 'inbound' ? 'self-start max-w-[78%]' : 'self-end max-w-[78%]'}>
          <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
            msg.direction === 'inbound'
              ? 'bg-white/70 backdrop-blur border border-white/60 text-zinc-800 rounded-2xl rounded-tl-md shadow-[0_2px_8px_rgba(28,25,22,0.04)]'
              : 'bg-teal-500/90 text-white rounded-2xl rounded-tr-md shadow-[0_2px_8px_rgba(20,184,166,0.2)]'
          }`}>
            {msg.body}
          </div>
          <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'inbound' ? 'ml-1' : 'mr-1 justify-end'}`}>
            {msg.direction === 'outbound' && (
              <span className="text-teal-500 text-[10px]">✓✓</span>
            )}
            <span className="text-[10px] text-zinc-400 font-mono">
              {formatExactTime(msg.dateAdded)}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

function ConvoRow({
  convo,
  isSelected,
  onSelect,
}: {
  convo: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const channel = detectChannel(convo);
  const icon = CHANNEL_ICONS[channel] ?? CHANNEL_ICONS.SMS;
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 border-b border-white/30 flex items-start gap-2 cursor-pointer hover:bg-white/30 ${
        isSelected ? 'bg-white/50 border-l-2 border-l-[#ff6a3d]' : ''
      }`}
    >
      <div className={`h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${icon.bg} ${icon.text}`}>
        {icon.letter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[12px] font-medium text-[#1a1a1a] truncate">{convo.contactName}</span>
          <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
            {formatExactTime(convo.lastMessageDate)}
          </span>
        </div>
        {convo.companyName && (
          <p className="text-[10px] text-[#71717a] truncate">{convo.companyName}</p>
        )}
        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{convo.lastMessageBody}</p>
      </div>
      {convo.unreadCount > 0 && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] flex-shrink-0 mt-2" />
      )}
    </button>
  );
}
