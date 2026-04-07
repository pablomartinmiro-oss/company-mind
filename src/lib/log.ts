/**
 * Structured JSON logger for server-side routes.
 * Outputs one JSON line per log event for Vercel function logs.
 *
 * DO NOT log env vars, tokens, or full transcripts.
 */

type LogData = Record<string, unknown>;

function emit(level: 'info' | 'warn' | 'error', event: string, data: LogData) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  };

  try {
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  } catch {
    // Circular ref fallback
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'log_serialization_failed', originalEvent: event }));
  }
}

export const log = {
  info: (event: string, data: LogData = {}) => emit('info', event, data),
  warn: (event: string, data: LogData = {}) => emit('warn', event, data),
  error: (event: string, data: LogData = {}) => emit('error', event, data),
};
