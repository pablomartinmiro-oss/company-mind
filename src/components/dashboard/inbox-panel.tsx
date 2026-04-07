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

  async function handleSend() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      await fetch('/api/inbox/send', {
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
      setReplyText('');
      setEmailSubject('');
      fetchInbox();
    } catch { /* ignore */ }
    setSending(false);
  }

  const allConvos = [...conversations.unread, ...conversations.needsReply];
  const totalUnread = conversations.unread.length;
  const activeChannel = selected ? detectChannel(selected) : 'SMS';

  return (
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden flex flex-col bg-white" style={{ height: 516 }}>
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3.5 border-b border-zinc-200/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-400">Inbox</span>
          {totalUnread > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
              {totalUnread}
            </span>
          )}
        </div>
        <button onClick={fetchInbox} className="p-1">
          <RefreshCw className={`h-3 w-3 text-zinc-400 hover:text-zinc-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 480 }}>
        {/* Left: conversation list */}
        <div className="w-[240px] border-r border-zinc-200/60 overflow-y-auto">
          {conversations.unread.length > 0 && (
            <>
              <div className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-3 py-1.5 border-b border-zinc-100 flex items-center gap-1.5">
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
              <div className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-3 py-1.5 border-b border-zinc-100 flex items-center gap-1.5">
                Needs Reply
                <span className="text-[9px] px-1 py-0.5 rounded-full bg-amber-50 text-amber-600">{conversations.needsReply.length}</span>
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
                  <p className="text-[13px] text-zinc-400">Inbox unavailable</p>
                  <p className="text-[11px] text-zinc-300">Check GHL connection</p>
                  <button
                    onClick={fetchInbox}
                    className="mt-2 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <Mail className="h-6 w-6 text-zinc-300" />
                  <p className="text-[13px] text-zinc-400">No conversations yet</p>
                  <p className="text-[11px] text-zinc-300">Conversations from SMS, email, and WhatsApp will appear here</p>
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
              <div className="h-10 flex items-center gap-2.5 px-3.5 border-b border-zinc-200/60">
                <div className="h-7 w-7 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center">
                  {selected.contactName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{selected.contactName}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${CHANNEL_ICONS[activeChannel]?.bg ?? 'bg-zinc-50'} ${CHANNEL_ICONS[activeChannel]?.text ?? 'text-zinc-500'}`}>
                    {activeChannel}
                  </span>
                </div>
                <LinkIcon className="ml-auto h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer" />
              </div>

              {/* Messages — channel-specific layout */}
              <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2 bg-zinc-50/40">
                {activeChannel === 'Email'
                  ? <EmailThread messages={selected.messages} contactName={selected.contactName} contactEmail={selected.contactEmail} />
                  : activeChannel === 'WhatsApp'
                    ? <WhatsAppThread messages={selected.messages} contactName={selected.contactName} contactPhone={selected.contactPhone} />
                    : <SMSThread messages={selected.messages} contactName={selected.contactName} contactPhone={selected.contactPhone} />
                }
              </div>

              {/* Reply area */}
              <div className="border-t border-zinc-200/60 px-3 py-2.5 bg-white shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-400">Reply via</span>
                  {CHANNEL_TABS.map((ch) => {
                    const isActive = replyChannel === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => setReplyChannel(ch)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                          isActive
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'text-zinc-500 border-zinc-200 hover:bg-zinc-50'
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
                    className="w-full text-[12px] px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 mb-2"
                  />
                )}

                <div className="flex items-center gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    rows={replyChannel === 'Email' ? 3 : 1}
                    className={`flex-1 resize-none text-[12px] px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 ${replyChannel === 'Email' ? 'min-h-[100px]' : ''}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && replyChannel !== 'Email') { e.preventDefault(); handleSend(); } }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !replyText.trim()}
                    className="px-3.5 py-1.5 bg-zinc-900 text-white text-[12px] font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 flex items-center gap-1.5 self-end"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="text-[11px]">
                      {replyChannel === 'Email' ? 'Send Email' : replyChannel === 'WhatsApp' ? 'Send WhatsApp' : 'Send SMS'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : allConvos.length > 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[12px] text-zinc-300">Select a conversation</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const TENANT_DISPLAY = 'Company Mind';
const TENANT_EMAIL = 'pablo.martin.miro@gmail.com';
const TENANT_PHONE = '+1 (555) 100-0001';

/* ─── SMS Thread ─── */
function SMSThread({ messages, contactName, contactPhone }: { messages: Message[]; contactName: string; contactPhone?: string }) {
  const cPhone = contactPhone ?? '—';
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.direction === 'inbound' ? 'items-start' : 'items-end'}`}>
          <span className="text-[10px] text-zinc-400 mb-0.5">
            {msg.direction === 'inbound'
              ? `From: ${contactName} (${msg.meta?.from ?? cPhone}) → To: ${TENANT_DISPLAY} (${TENANT_PHONE})`
              : `From: ${TENANT_DISPLAY} (${TENANT_PHONE}) → To: ${contactName} (${msg.meta?.to ?? cPhone})`}
          </span>
          <div className={`max-w-[78%] px-3 py-2 text-[13px] ${
            msg.direction === 'inbound'
              ? 'self-start bg-white border border-emerald-200 rounded-2xl text-zinc-800'
              : 'self-end bg-emerald-600 text-white rounded-2xl'
          }`}>
            {msg.body}
          </div>
          <span className="text-[10px] text-zinc-400 mt-0.5">
            {formatExactTime(msg.dateAdded)}
          </span>
        </div>
      ))}
    </>
  );
}

/* ─── Email Thread ─── */
function EmailThread({ messages, contactName, contactEmail }: { messages: Message[]; contactName: string; contactEmail?: string }) {
  const cEmail = contactEmail ?? '—';
  const contactFull = `${contactName} <${cEmail}>`;
  const tenantFull = `${TENANT_DISPLAY} <${TENANT_EMAIL}>`;
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className="bg-white border border-blue-100 rounded-lg p-3 mb-2">
          <div className="text-[10px] text-zinc-500 leading-relaxed space-y-0.5">
            <p>From: {msg.direction === 'inbound' ? (msg.meta?.from ?? contactFull) : (msg.meta?.from ?? tenantFull)}</p>
            <p>To: {msg.direction === 'outbound' ? (msg.meta?.to ?? contactFull) : (msg.meta?.to ?? tenantFull)}</p>
            {msg.meta?.subject && <p>Subject: {msg.meta.subject}</p>}
            <p>{formatExactDateTime(msg.dateAdded)}</p>
          </div>
          <div className="border-t border-zinc-100 my-2" />
          <div className="text-[12px] text-zinc-800 whitespace-pre-wrap">{msg.body}</div>
        </div>
      ))}
    </>
  );
}

/* ─── WhatsApp Thread ─── */
function WhatsAppThread({ messages, contactName, contactPhone }: { messages: Message[]; contactName: string; contactPhone?: string }) {
  const cPhone = contactPhone ?? '—';
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.direction === 'inbound' ? 'items-start' : 'items-end'}`}>
          <span className="text-[10px] text-zinc-400 mb-0.5">
            {msg.direction === 'inbound'
              ? `From: ${contactName} (${msg.meta?.from ?? cPhone}) → To: ${TENANT_DISPLAY} (${TENANT_PHONE})`
              : `From: ${TENANT_DISPLAY} (${TENANT_PHONE}) → To: ${contactName} (${msg.meta?.to ?? cPhone})`}
          </span>
          <div className={`max-w-[78%] px-3 py-2 text-[13px] ${
            msg.direction === 'inbound'
              ? 'self-start bg-white border border-teal-200 rounded-lg text-zinc-800'
              : 'self-end bg-teal-600 text-white rounded-lg'
          }`}>
            {msg.body}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {msg.direction === 'outbound' && (
              <span className="text-teal-300 text-[10px]">✓✓</span>
            )}
            <span className="text-[10px] text-zinc-400">
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
      className={`w-full text-left px-3 py-2 border-b border-zinc-100 flex items-start gap-2 cursor-pointer hover:bg-zinc-50/80 ${
        isSelected ? 'bg-zinc-50 border-l-2 border-l-zinc-900' : ''
      }`}
    >
      <div className={`h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${icon.bg} ${icon.text}`}>
        {icon.letter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-zinc-900 truncate">{convo.contactName}</span>
          <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">
            {formatExactTime(convo.lastMessageDate)}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 truncate">{convo.lastMessageBody}</p>
      </div>
      {convo.unreadCount > 0 && (
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 flex-shrink-0 mt-2" />
      )}
    </button>
  );
}
