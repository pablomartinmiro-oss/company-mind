import { COMPANY_SECTIONS, CONTACT_SECTIONS } from '@/lib/research/catalog';

export function findSectionForField(fieldKey: string, scope: 'company' | 'contact'): string {
  const sections = scope === 'company' ? COMPANY_SECTIONS : CONTACT_SECTIONS;
  for (const section of sections) {
    if (section.fields.find(f => f.key === fieldKey)) {
      return section.label;
    }
  }
  return 'Unknown';
}

export function extractJsonFromText(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
