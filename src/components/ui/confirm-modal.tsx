'use client';

import { useState, useCallback, useRef, createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

// ── Types ──

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string | null;   // null = hide cancel button (alert-style)
  variant?: 'default' | 'destructive';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

// ── Context ──

const ConfirmContext = createContext<{
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
} | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx.confirm;
}

// ── Provider (mount once in layout) ──

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const handleClose = (confirmed: boolean) => {
    state?.resolve(confirmed);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {mounted && state && createPortal(
        <ConfirmModalOverlay state={state} onClose={handleClose} />,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

// ── Modal UI ──

function ConfirmModalOverlay({ state, onClose }: { state: ConfirmState; onClose: (confirmed: boolean) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isDestructive = state.variant === 'destructive';
  const showCancel = state.cancelLabel !== null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => onClose(false)}
      />

      {/* Panel — frosted glass card */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-[380px] mx-4 bg-white/90 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-2xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.15),0_2px_8px_-2px_rgba(28,25,22,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] p-5"
      >
        {isDestructive && (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100/60 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
        )}

        <h3 className="text-[15px] font-semibold text-[#1a1a1a] leading-snug">
          {state.title}
        </h3>

        {state.description && (
          <p className="mt-2 text-[13px] text-[#52525b] leading-relaxed">
            {state.description}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          {showCancel && (
            <button
              onClick={() => onClose(false)}
              className="text-[12px] font-medium px-4 py-2 rounded-full bg-white/60 border border-white/70 text-[#52525b] hover:bg-white/80 transition-colors"
            >
              {state.cancelLabel ?? 'Cancel'}
            </button>
          )}
          <button
            onClick={() => onClose(true)}
            className={`text-[12px] font-medium px-4 py-2 rounded-full transition-colors ${
              isDestructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gradient-to-r from-[#ff7a4d] to-[#ff5a2d] text-white hover:opacity-90 shadow-[0_2px_8px_rgba(255,106,61,0.3)]'
            }`}
          >
            {state.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
