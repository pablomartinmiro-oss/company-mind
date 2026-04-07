/**
 * Format a raw phone number into a human-readable US format.
 * - null/undefined/empty → ""
 * - 10 digits → (XXX) XXX-XXXX
 * - 11 digits starting with 1 → (XXX) XXX-XXXX (drop the 1)
 * - E.164 with +1 → same
 * - Other lengths → return as-is (don't mangle international)
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return raw;
}
