/**
 * Derive a color-coded category pill from a company's industry or use-case.
 * Used on company list rows, contact detail headers, etc.
 *
 * Design: muted tones on white/55 bg, matches Payoneer frosted glass system.
 * If no research data is available, returns a neutral default.
 */

interface LabelResult {
  label: string;
  className: string;
}

const CATEGORY_MAP: Array<{ keywords: string[]; label: string; className: string }> = [
  { keywords: ['hvac', 'plumbing', 'electrical', 'home service', 'landscaping', 'pest control'],
    label: 'Home Services', className: 'bg-blue-50/80 text-blue-700 border-blue-200/60' },
  { keywords: ['saas', 'software', 'tech', 'technology', 'ai', 'machine learning', 'fintech'],
    label: 'SaaS / Tech', className: 'bg-violet-50/80 text-violet-700 border-violet-200/60' },
  { keywords: ['dental', 'medical', 'healthcare', 'clinic', 'hospital', 'therapy', 'chiropractic', 'optometry'],
    label: 'Medical', className: 'bg-teal-50/80 text-teal-700 border-teal-200/60' },
  { keywords: ['roofing', 'construction', 'contracting', 'remodel', 'builder', 'flooring'],
    label: 'Construction', className: 'bg-amber-50/80 text-amber-700 border-amber-200/60' },
  { keywords: ['insurance', 'underwriting', 'claims', 'actuarial'],
    label: 'Insurance', className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60' },
  { keywords: ['auto', 'detailing', 'car wash', 'automotive', 'dealer', 'body shop'],
    label: 'Automotive', className: 'bg-rose-50/80 text-rose-700 border-rose-200/60' },
  { keywords: ['restaurant', 'food', 'catering', 'hospitality', 'hotel', 'bar'],
    label: 'Hospitality', className: 'bg-orange-50/80 text-orange-700 border-orange-200/60' },
  { keywords: ['legal', 'law firm', 'attorney', 'lawyer'],
    label: 'Legal', className: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/60' },
  { keywords: ['real estate', 'property', 'realtor', 'mortgage'],
    label: 'Real Estate', className: 'bg-sky-50/80 text-sky-700 border-sky-200/60' },
];

const DEFAULT_LABEL: LabelResult = {
  label: '',
  className: 'bg-white/60 text-[#52525b] border-white/60',
};

const PILL_BASE = 'text-[10px] font-medium px-2 py-0.5 rounded-full border';

export function getCompanyLabel(industry: string | null | undefined): LabelResult {
  if (!industry) return DEFAULT_LABEL;

  const lower = industry.toLowerCase();

  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return { label: cat.label, className: `${PILL_BASE} ${cat.className}` };
    }
  }

  // If we have an industry but it doesn't match any category, show it with default styling
  return { label: industry, className: `${PILL_BASE} ${DEFAULT_LABEL.className}` };
}
