'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { ComponentType } from 'react';

interface StatusConfig {
  label: string;
  description: string;
  color: 'amber' | 'blue' | 'violet' | 'emerald' | 'red' | 'zinc';
  icon: ComponentType<{ className?: string }>;
  spinning: boolean;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Queued',
    description: 'Waiting to be picked up by the processor',
    color: 'amber',
    icon: Clock,
    spinning: false,
  },
  fetching_audio: {
    label: 'Fetching audio',
    description: 'Downloading the recording from GHL',
    color: 'blue',
    icon: Loader2,
    spinning: true,
  },
  transcribing: {
    label: 'Transcribing',
    description: 'AssemblyAI is converting speech to text with speaker labels',
    color: 'blue',
    icon: Loader2,
    spinning: true,
  },
  analyzing: {
    label: 'Analyzing',
    description: 'Claude is extracting research, scoring, and generating next steps',
    color: 'violet',
    icon: Loader2,
    spinning: true,
  },
  complete: {
    label: 'Complete',
    description: 'Fully processed',
    color: 'emerald',
    icon: CheckCircle,
    spinning: false,
  },
  failed: {
    label: 'Failed',
    description: 'Processing encountered an error',
    color: 'red',
    icon: AlertTriangle,
    spinning: false,
  },
  skipped: {
    label: 'Skipped',
    description: 'Call was under 60 seconds and not analyzed',
    color: 'zinc',
    icon: Clock,
    spinning: false,
  },
};

const COLOR_CLASSES: Record<string, string> = {
  amber: 'bg-amber-100/60 border-amber-200/40 text-amber-800',
  blue: 'bg-blue-100/60 border-blue-200/40 text-blue-800',
  violet: 'bg-violet-100/60 border-violet-200/40 text-violet-800',
  emerald: 'bg-emerald-100/60 border-emerald-200/40 text-emerald-800',
  red: 'bg-red-100/60 border-red-200/40 text-red-800',
  zinc: 'bg-zinc-100/60 border-zinc-200/40 text-zinc-700',
};

export function ProcessingStatusBanner({
  callId,
  initialStatus,
  initialError,
}: {
  callId: string;
  initialStatus: string;
  initialError?: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState(initialError);
  const [retrying, setRetrying] = useState(false);

  // Poll while in active processing states
  useEffect(() => {
    if (status === 'complete' || status === 'failed' || status === 'skipped') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/${callId}/status`);
        const data = await res.json();
        if (data.status !== status) {
          setStatus(data.status);
          setError(data.error || null);
          if (data.status === 'complete') {
            window.location.reload();
          }
        }
      } catch {
        // Silent fail, retry next tick
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [callId, status]);

  if (status === 'complete') return null;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  async function handleRetry() {
    setRetrying(true);
    try {
      await fetch(`/api/calls/${callId}/retry`, { method: 'POST' });
      setStatus('pending');
      setError(null);
    } catch {
      // ignore
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className={`backdrop-blur-xl border rounded-2xl p-4 mb-4 ${COLOR_CLASSES[config.color]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.spinning ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold">{config.label}</div>
          <div className="text-[12px] mt-0.5 opacity-80">{config.description}</div>
          {error && (
            <div className="text-[11px] mt-2 font-mono opacity-70 break-all">
              {error}
            </div>
          )}
          {status === 'failed' && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="
                mt-2 text-[11px] font-medium px-3 py-1.5 rounded-full
                bg-white/60 border border-white/70 text-zinc-700
                hover:bg-white/80 transition-colors disabled:opacity-50
              "
            >
              {retrying ? 'Retrying\u2026' : 'Retry processing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
