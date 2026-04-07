'use client';

import { Sparkles } from 'lucide-react';

export function AiFloatingButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('open-ai-panel'))}
      aria-label="Open AI assistant"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] shadow-[0_8px_24px_rgba(255,106,61,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:from-[#ff8a5d] hover:to-[#ff6a3d] flex items-center justify-center transition-all duration-150 hover:scale-105"
    >
      <Sparkles className="w-6 h-6 text-white" />
    </button>
  );
}
