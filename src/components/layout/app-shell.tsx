'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import { AiBar } from '@/components/ai/ai-bar';
import { AiFloatingButton } from '@/components/ai/ai-floating-button';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const pendingQueryRef = useRef<string | null>(null);

  // Listen for ai-query events from the AiBar
  useEffect(() => {
    const queryHandler = (e: Event) => {
      const query = (e as CustomEvent<{ query: string }>).detail.query;
      if (query) {
        pendingQueryRef.current = query;
        setChatOpen(true);
      }
    };
    const openHandler = () => setChatOpen(true);

    window.addEventListener('ai-query', queryHandler);
    window.addEventListener('open-ai-panel', openHandler);
    return () => {
      window.removeEventListener('ai-query', queryHandler);
      window.removeEventListener('open-ai-panel', openHandler);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col pl-[72px]">
        {/* Content header — transparent */}
        <div className="h-16 shrink-0 flex items-center justify-end px-8 border-b border-black/[0.04]">
          <AiBar />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>
      </main>

      <AiFloatingButton />
      <ChatDrawer isOpen={chatOpen} onClose={closeChat} />
    </div>
  );
}
