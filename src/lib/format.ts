export const DEFAULT_TIMEZONE = 'America/Chicago';

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatExactDateTime(date: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
    timeZoneName: 'short',
  }).format(d);
}

export function formatExactDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatExactTime(date: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
    timeZoneName: 'short',
  }).format(d);
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export function scoreGrade(score: number): { letter: string; color: string; bg: string; ring: string } {
  if (score >= 90) return { letter: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' };
  if (score >= 80) return { letter: 'B', color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' };
  if (score >= 70) return { letter: 'C', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' };
  if (score >= 60) return { letter: 'D', color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200' };
  return { letter: 'F', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' };
}
