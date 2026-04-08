/**
 * Detect GHL auth/connectivity errors so callers can fall back to local DB.
 * ghl.ts is locked — this helper lives outside it.
 */
export function isGhlAuthError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('ghl not connected') ||
    msg.includes('no ghl access token') ||
    msg.includes('no ghl') ||
    msg.includes('401') ||
    msg.includes('access token')
  );
}
