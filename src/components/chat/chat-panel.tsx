'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Phone,
  Users,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { UIMessage } from 'ai';

interface ChatPanelProps {
  currentPage: string;
  isOpen: boolean;
  onToggle: () => void;
  currentContactId?: string;
  currentContactName?: string;
}

export function ChatPanel({
  currentPage,
  isOpen,
  onToggle,
  currentContactId,
  currentContactName,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const contextRef = useRef({ currentPage, currentContactId, currentContactName });
  contextRef.current = { currentPage, currentContactId, currentContactName };

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
            currentPage: contextRef.current.currentPage,
            currentContactId: contextRef.current.currentContactId ?? null,
            currentContactName: contextRef.current.currentContactName ?? null,
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

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

  // FAB button when closed
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-l border-zinc-200/80 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-zinc-900">AI Assistant</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              typing
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 border-t border-zinc-100">
        <div ref={scrollRef} className="flex flex-col gap-4 px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <Sparkles className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-zinc-700">Ask me anything</p>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                  Contacts, calls, pipelines, or CRM actions.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error.message || 'Something went wrong.'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-100 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 transition-colors focus-within:border-zinc-300 focus-within:bg-white">
          <textarea
            ref={inputRef}
            placeholder="Message..."
            disabled={isStreaming}
            rows={1}
            onKeyDown={handleKeyDown}
            className="max-h-24 min-h-[20px] flex-1 resize-none border-0 bg-transparent text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white transition-all hover:bg-zinc-700 disabled:opacity-30"
          >
            {isStreaming ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowUpRight className="h-3 w-3" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100">
          <Sparkles className="h-3 w-3 text-zinc-500" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser
            ? 'rounded-br-md bg-zinc-900 text-white'
            : 'rounded-bl-md bg-zinc-100 text-zinc-700'
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
  input?: unknown;
  output?: unknown;
}

function ToolInvocation({ part }: { part: ToolPart }) {
  const toolName = part.toolName ?? part.type.replace(/^tool-/, '');
  const { state } = part;

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
  };

  const label = toolLabels[toolName] || toolName;
  const isLoading = state === 'input-streaming' || state === 'input-available';

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
