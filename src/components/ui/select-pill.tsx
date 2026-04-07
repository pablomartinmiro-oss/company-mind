'use client';

import { ChevronDown } from 'lucide-react';

interface SelectPillProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectPill({ value, onChange, options, placeholder }: SelectPillProps) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer bg-white/60 backdrop-blur-xl border border-white/70 text-zinc-700 text-[12px] font-medium px-4 py-1.5 pr-8 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-white/80 transition-colors focus:outline-none focus:border-[#ff6a3d]/40"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
