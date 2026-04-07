'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import { Sparkles } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const closeChat = useCallback(() => setChatOpen(false), []);

  return (
    <div
      className="bg-white rounded-[28px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.4)] min-h-[calc(100vh-48px)] flex overflow-hidden"
    >
      {/* Sidebar — thin dark icon nav (Payoneer signature) */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Content header bar */}
        <div className="h-14 shrink-0 flex items-center justify-between px-8 border-b border-[rgba(28,25,22,0.06)]">
          <div />
          <div className="flex items-center gap-3">
            {/* Ask AI button (coral use #3 — primary CTA) */}
            <button
              onClick={() => setChatOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#ff6a3d] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#f5552a]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask AI
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>
      </main>

      {/* Chat drawer */}
      <ChatDrawer isOpen={chatOpen} onClose={closeChat} />
    </div>
  );
}
