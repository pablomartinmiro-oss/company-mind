import { colors } from '../../../../brand/tokens/colors';
import { typography } from '../../../../brand/tokens/typography';
import { radii } from '../../../../brand/tokens/radii';
import { shadows } from '../../../../brand/tokens/shadows';

export default function BrandPage() {
  const colorEntries = Object.entries(colors).filter(([, v]) => typeof v === 'string' && !v.includes('gradient'));
  const gradientValue = colors.accentGradient;

  return (
    <div className="p-6 space-y-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-[18px] font-medium tracking-tight text-zinc-100">Brand Kit</h1>
        <p className="text-[13px] text-zinc-400 mt-1">Company Mind design system. Dense operator tool meets fintech-grade surface polish.</p>
      </div>

      {/* ── Logos ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Logo Variants</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mark — Gradient', bg: 'bg-[#0a0a0b]', src: '/brand/mark-gradient.svg' },
            { label: 'Mark — Light', bg: 'bg-[#0a0a0b]', src: '/brand/mark-light.svg' },
            { label: 'Mark — Dark', bg: 'bg-zinc-100', src: '/brand/mark-dark.svg' },
            { label: 'Wordmark — Gradient', bg: 'bg-[#0a0a0b]', src: '/brand/wordmark-gradient.svg' },
            { label: 'Wordmark — Light', bg: 'bg-[#0a0a0b]', src: '/brand/wordmark-light.svg' },
            { label: 'Wordmark — Dark', bg: 'bg-zinc-100', src: '/brand/wordmark-dark.svg' },
          ].map((logo) => (
            <div key={logo.label} className="border border-white/[0.06] rounded-xl overflow-hidden">
              <div className={`${logo.bg} h-24 flex items-center justify-center p-4`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.src} alt={logo.label} className="h-10 w-auto" />
              </div>
              <div className="px-3 py-2 border-t border-white/[0.04]">
                <p className="text-[11px] text-zinc-400">{logo.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Colors ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Color Palette</h2>
        <div className="grid grid-cols-4 gap-2">
          {colorEntries.map(([name, value]) => (
            <div key={name} className="border border-white/[0.06] rounded-lg overflow-hidden">
              <div className="h-12" style={{ background: value as string }} />
              <div className="px-2.5 py-1.5">
                <p className="text-[11px] font-medium text-zinc-100 font-mono">{name}</p>
                <p className="text-[9px] text-zinc-500 font-mono">{value as string}</p>
              </div>
            </div>
          ))}
          <div className="border border-white/[0.06] rounded-lg overflow-hidden col-span-2">
            <div className="h-12" style={{ background: gradientValue }} />
            <div className="px-2.5 py-1.5">
              <p className="text-[11px] font-medium text-zinc-100 font-mono">accentGradient</p>
              <p className="text-[9px] text-zinc-500 font-mono truncate">{gradientValue}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Typography ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Typography Scale</h2>
        <div className="space-y-2 border border-white/[0.06] rounded-xl p-4">
          {Object.entries(typography.fontSize).map(([name, size]) => (
            <div key={name} className="flex items-baseline gap-4">
              <span className="text-[10px] text-zinc-500 font-mono w-16 shrink-0">{name}</span>
              <span className="text-[10px] text-zinc-600 font-mono w-10 shrink-0">{size}</span>
              <span style={{ fontSize: size }} className="text-zinc-100 font-sans">
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
          <div className="border-t border-white/[0.04] pt-2 mt-3">
            <p className="text-[10px] text-zinc-500 mb-2">Mono (numbers, times, scores)</p>
            <div className="flex items-baseline gap-4">
              <span className="text-[10px] text-zinc-500 font-mono w-16 shrink-0">mono</span>
              <span className="text-[13px] text-zinc-100 font-mono">91 / 100 — $45,000 — 2:15 PM CDT — 4m 32s</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Radii ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Border Radii</h2>
        <div className="flex gap-3 items-end">
          {Object.entries(radii).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div
                className="w-14 h-14 border border-white/[0.1] bg-white/[0.03]"
                style={{ borderRadius: value }}
              />
              <span className="text-[9px] text-zinc-500 font-mono">{name}</span>
              <span className="text-[9px] text-zinc-600 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shadows ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Shadows</h2>
        <div className="flex gap-4">
          {Object.entries(shadows).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-xl bg-[#111113]"
                style={{ boxShadow: value }}
              />
              <span className="text-[9px] text-zinc-500 font-mono">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Components ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Components</h2>
        <div className="space-y-4">
          {/* Buttons */}
          <div className="border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Buttons</p>
            <div className="flex gap-2 items-center flex-wrap">
              <button className="bg-white text-zinc-900 text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-200">Primary</button>
              <button className="border border-white/[0.08] text-zinc-400 text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/[0.03]">Secondary</button>
              <button className="bg-gradient-accent text-white text-[12px] font-medium px-3 py-1.5 rounded-lg">Gradient CTA</button>
              <button className="bg-red-500/10 text-red-400 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-red-500/20">Destructive</button>
              <button className="text-zinc-400 text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hover:text-zinc-100">Ghost</button>
            </div>
          </div>

          {/* Pills */}
          <div className="border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Pills & Badges</p>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Closed</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Qualification</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">Closing</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">Follow Up</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">3d overdue</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">Admin</span>
            </div>
          </div>

          {/* Inputs */}
          <div className="border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Inputs</p>
            <div className="flex gap-3 items-center">
              <input type="text" placeholder="Search contacts..." className="text-[12px] px-3 py-1.5 border border-white/[0.08] rounded-lg bg-white/[0.03] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 w-56" />
              <select className="text-[12px] px-3 py-1.5 border border-white/[0.08] rounded-lg bg-white/[0.03] text-zinc-400 focus:outline-none">
                <option>All types</option>
                <option>Follow Up</option>
              </select>
            </div>
          </div>

          {/* Score Circles */}
          <div className="border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Score Circles</p>
            <div className="flex gap-4 items-center">
              {[
                { score: 95, color: 'text-emerald-400', gradient: true },
                { score: 82, color: 'text-blue-400', gradient: false },
                { score: 71, color: 'text-amber-400', gradient: false },
                { score: 58, color: 'text-red-400', gradient: false },
              ].map(({ score, color, gradient }) => (
                <div key={score} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono text-[16px] font-semibold ${
                    gradient ? 'border-violet-500/40 text-gradient-accent' : `border-white/[0.08] ${color}`
                  }`}>
                    {score}
                  </div>
                  <span className="text-[9px] text-zinc-500">{score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stat Card */}
          <div className="border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Stat Card</p>
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-white/[0.03] rounded-lg px-4 py-3.5 hover:bg-white/[0.06] transition-colors">
                <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Calls</p>
                <p className="text-[22px] font-medium font-mono text-gradient-accent leading-none">12</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg px-4 py-3.5 hover:bg-white/[0.06] transition-colors">
                <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Avg Score</p>
                <p className="text-[22px] font-medium font-mono text-gradient-accent leading-none">84</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg px-4 py-3.5 hover:bg-white/[0.06] transition-colors">
                <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Pipeline</p>
                <p className="text-[22px] font-medium font-mono text-gradient-accent leading-none">$195k</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg px-4 py-3.5 hover:bg-white/[0.06] transition-colors">
                <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">Tasks</p>
                <p className="text-[22px] font-medium font-mono text-gradient-accent leading-none">8</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Voice ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-3">Voice & Tone</h2>
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="px-4 py-2 border-b border-white/[0.04] text-[10px] font-medium text-red-400 uppercase tracking-widest">Don&apos;t say</div>
            <div className="px-4 py-2 border-b border-white/[0.04] text-[10px] font-medium text-emerald-400 uppercase tracking-widest">Say instead</div>
          </div>
          {[
            ['"Oops! Something went wrong."', '"Couldn\'t load calls. Retry."'],
            ['"Great job! You\'ve completed a task!"', '"Task done."'],
            ['"Our AI is analyzing your call..."', '"Scoring..."'],
            ['"Welcome back, user!"', '"Good morning, Pablo."'],
            ['"No items to display"', '"No calls yet."'],
          ].map(([bad, good], i) => (
            <div key={i} className="grid grid-cols-2 border-b border-white/[0.04] last:border-0">
              <div className="px-4 py-2 text-[12px] text-zinc-500">{bad}</div>
              <div className="px-4 py-2 text-[12px] text-zinc-200">{good}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="pb-8">
        <p className="text-[11px] text-zinc-600">Company Mind Brand Kit v1.0 — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
}
