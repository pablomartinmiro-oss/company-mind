'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Send, Link as LinkIcon } from 'lucide-react';

interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  type: string;
  dateAdded: string;
}

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  lastMessageBody: string;
  lastMessageType: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: Message[];
}

const CHANNEL_ICONS: Record<string, { bg: string; text: string; letter: string }> = {
  SMS:      { bg: 'bg-emerald-50', text: 'text-emerald-700', letter: 'S' },
  Email:    { bg: 'bg-blue-50',    text: 'text-blue-700',    letter: 'E' },
  WhatsApp: { bg: 'bg-teal-50',    text: 'text-teal-700',    letter: 'W' },
};

const CHANNEL_TABS = ['SMS', 'Email', 'WhatsApp'] as const;

export function InboxPanel() {
  const [conversations, setConversations] = useState<{ unread: Conversation[]; needsReply: Conversation[] }>({ unread: [], needsReply: [] });
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [replyChannel, setReplyChannel] = useState<string>('SMS');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchInbox() {
    setLoading(true);
    try {
      const res = await fetch('/api/inbox');
      const data = await res.json();
      setConversations(data);
      if (!selected && (data.unread.length > 0 || data.needsReply.length > 0)) {
        setSelected(data.unread[0] || data.needsReply[0]);
      }
    } catch {
      setConversations({ unread: [], needsReply: [] });
    }
    setLoading(false);
  }

  useEffect(() => { fetchInbox(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        }),
      });
      setReplyText('');
      fetchInbox();
    } catch { /* ignore */ }
    setSending(false);
  }

  const allConvos = [...conversations.unread, ...conversations.needsReply];
  const totalUnread = conversations.unread.length;

  function getChannelIcon(type: string) {
    return CHANNEL_ICONS[type] ?? CHANNEL_ICONS.SMS;
  }

  return (
    <div className="border border-zinc-200/60 rounded-xl overflow-hidden flex flex-col bg-white">
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
      <div className="flex" style={{ height: 320 }}>
        {/* Left: conversation list */}
        <div className="w-[240px] border-r border-zinc-200/60 overflow-y-auto">
          {conversations.unread.length > 0 && (
            <>
              <div className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-3 py-1.5 border-b border-zinc-100 flex items-center gap-1.5">
                Unread
                <span className="text-[9px] px-1 py-0.5 rounded-full bg-red-50 text-red-600">{conversations.unread.length}</span>
              </div>
              {conversations.unread.map((c) => (
                <ConvoRow key={c.id} convo={c} isSelected={selected?.id === c.id} onSelect={() => setSelected(c)} getIcon={getChannelIcon} />
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
                <ConvoRow key={c.id} convo={c} isSelected={selected?.id === c.id} onSelect={() => setSelected(c)} getIcon={getChannelIcon} />
              ))}
            </>
          )}
          {allConvos.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center px-4">
              <p className="text-[13px] font-medium text-zinc-400">Inbox connected</p>
              <p className="text-[11px] text-zinc-300">No unread messages right now</p>
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
                <div>
                  <span className="text-[13px] font-medium">{selected.contactName}</span>
                </div>
                <LinkIcon className="ml-auto h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer" />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2 bg-zinc-50/40">
                {selected.messages.map((msg) => (
                  <div key={msg.id} className={msg.direction === 'inbound' ? 'self-start' : 'self-end'}>
                    <div className={`max-w-[78%] px-3 py-2 text-[12px] ${
                      msg.direction === 'inbound'
                        ? 'bg-white border border-zinc-200/80 text-zinc-800 rounded-tr-xl rounded-b-xl'
                        : 'bg-zinc-900 text-white rounded-tl-xl rounded-b-xl'
                    }`}>
                      {msg.body}
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">
                      {new Date(msg.dateAdded).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Reply area */}
              <div className="border-t border-zinc-200/60 px-3 py-2.5 bg-white shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-medium tracking-widest uppercase text-zinc-400">Reply via</span>
                  {CHANNEL_TABS.map((ch) => {
                    const isActive = replyChannel === ch;
                    const activeClass = ch === 'WhatsApp'
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-zinc-900 text-white border-zinc-900';
                    return (
                      <button
                        key={ch}
                        onClick={() => setReplyChannel(ch)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                          isActive ? activeClass : 'text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none text-[12px] px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !replyText.trim()}
                    className="px-3.5 py-1.5 bg-zinc-900 text-white text-[12px] font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[12px] text-zinc-300">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConvoRow({
  convo,
  isSelected,
  onSelect,
  getIcon,
}: {
  convo: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  getIcon: (type: string) => { bg: string; text: string; letter: string };
}) {
  const icon = getIcon(convo.lastMessageType);
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
            {new Date(convo.lastMessageDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
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
