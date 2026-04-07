'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import { Sparkles } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const closeChat = useCallback(() => setChatOpen(false), []);

  return (
    <div className="relative flex min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col pl-[72px]">
        {/* Content header — transparent */}
        <div className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-black/[0.04]">
          <div />
          <div className="flex items-center gap-3">
            {/* Ask AI — small 40x40 coral circle */}
            <button
              onClick={() => setChatOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white shadow-[0_4px_12px_rgba(255,106,61,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_16px_rgba(255,106,61,0.4)] transition-all"
              title="Ask AI"
            >
              <Sparkles className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>
      </main>

      <ChatDrawer isOpen={chatOpen} onClose={closeChat} />
    </div>
  );
}
