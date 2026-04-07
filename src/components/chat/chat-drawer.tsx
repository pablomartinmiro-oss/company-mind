'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  ArrowUpRight,
  CheckCircle,
} from 'lucide-react';
import type { UIMessage } from 'ai';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function getPageContext(pathname: string): { page: string; callId?: string; contactId?: string } {
  if (pathname === '/dashboard') return { page: 'Daily HQ' };
  if (pathname === '/calls') return { page: 'Calls list' };
  if (pathname.startsWith('/calls/')) {
    const callId = pathname.split('/calls/')[1]?.split('/')[0];
    return { page: 'Call detail', callId };
  }
  if (pathname === '/companies') return { page: 'Companies list' };
  if (pathname.startsWith('/contacts/')) {
    const contactId = pathname.split('/contacts/')[1]?.split('/')[0];
    return { page: 'Company detail', contactId };
  }
  if (pathname === '/settings') return { page: 'Settings' };
  return { page: 'Dashboard' };
}

function getContextLabel(pathname: string): string {
  if (pathname === '/dashboard') return 'Daily HQ';
  if (pathname === '/calls') return 'Calls';
  if (pathname.startsWith('/calls/')) return 'Call Detail';
  if (pathname === '/companies') return 'Companies';
  if (pathname.startsWith('/contacts/')) return 'Company Detail';
  if (pathname === '/settings') return 'Settings';
  return 'Dashboard';
}

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const contextRef = useRef(getPageContext(pathname));
  contextRef.current = getPageContext(pathname);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          context: {
            userName: 'Pablo',
            userRole: 'owner',
            tenantName: 'Company Mind',
            industry: 'saas',
            currentPage: contextRef.current.page,
            currentContactId: contextRef.current.contactId ?? null,
            currentCallId: contextRef.current.callId ?? null,
          },
        }),
      }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    id: 'company-mind-chat',
    transport,
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input?.value.trim() || isStreaming) return;
    const text = input.value;
    input.value = '';
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const contextLabel = getContextLabel(pathname);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-screen w-full flex-col border-l border-white/[0.06] bg-[#111113] shadow-2xl transition-transform duration-200 ease-out sm:w-[420px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-100" />
            <span className="text-[13px] font-semibold text-zinc-100">Ask AI</span>
            {isStreaming && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                typing
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Context indicator */}
        <div className="shrink-0 border-b border-white/[0.04] bg-white/[0.02] px-4 py-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Context</div>
          <div className="mt-0.5 text-[11px] text-zinc-300">{contextLabel}</div>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                <Sparkles className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-zinc-300">Ask me anything</p>
                <p className="mt-0.5 text-[12px] text-zinc-500">
                  Calls, companies, tasks, pipelines, or CRM actions.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
              {error.message || 'Something went wrong.'}
            </div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/[0.06] px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              placeholder="Message..."
              disabled={isStreaming}
              rows={1}
              onKeyDown={handleKeyDown}
              className="max-h-[96px] min-h-[36px] flex-1 resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming}
              className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-30"
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] px-3 py-2 text-[12px] leading-relaxed',
          isUser
            ? 'rounded-tl-xl rounded-b-xl bg-white text-zinc-900'
            : 'rounded-tr-xl rounded-b-xl border border-white/[0.06] bg-white/[0.03] text-zinc-200'
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="whitespace-pre-wrap break-words">
                {part.text}
              </div>
            );
          }
          if ('toolCallId' in part && 'state' in part) {
            return <ToolInvocation key={i} part={part as ToolPart} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

interface ToolPart {
  type: string;
  toolCallId: string;
  toolName?: string;
  state: string;
}

function ToolInvocation({ part }: { part: ToolPart }) {
  const toolName = part.toolName ?? part.type.replace(/^tool-/, '');
  const isLoading = part.state === 'input-streaming' || part.state === 'input-available';

  const toolLabels: Record<string, string> = {
    searchContacts: 'Searching contacts',
    getContact: 'Getting contact',
    listPipelines: 'Loading pipelines',
    searchOpportunities: 'Searching deals',
    searchCalls: 'Searching calls',
    getCallDetail: 'Getting call details',
    getContactCallHistory: 'Getting call history',
    analyzeCall: 'Analyzing call',
    getConversations: 'Loading messages',
    getCompanies: 'Loading companies',
    getCompanyDetail: 'Getting company detail',
    getTasks: 'Loading tasks',
    getPipelineSummary: 'Loading pipeline summary',
    getAppointments: 'Loading appointments',
    getActivityFeed: 'Loading activity',
  };

  const label = toolLabels[toolName] || toolName;

  return (
    <div className="my-1 flex items-center gap-1.5 text-[11px] opacity-60">
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CheckCircle className="h-3 w-3" />
      )}
      <span>{label}{isLoading ? '...' : ''}</span>
    </div>
  );
}
