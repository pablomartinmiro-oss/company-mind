import { colors } from '../../../../brand/tokens/colors';
import { typography } from '../../../../brand/tokens/typography';
import { radii } from '../../../../brand/tokens/radii';
import { shadows } from '../../../../brand/tokens/shadows';

export default function BrandPage() {
  const colorEntries = Object.entries(colors).filter(([, v]) => typeof v === 'string');

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight text-[#1a1a1a]">Brand Kit</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Company Mind design system — Frosted Glass Edition. Dense operator CRM with warm grey-cream and glass morphism.</p>
      </div>

      {/* ── Frosted Glass Demo ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Frosted Glass Cards</h2>
        <div className="rounded-[28px] p-6 bg-gradient-to-br from-[#f5f0eb] to-[#ebe5de]">
          <div className="grid grid-cols-3 gap-3">
            <div className="relative glass-card rounded-3xl overflow-hidden p-5">
              <div className="glass-card-inner" />
              <div className="relative">
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Glass Card</p>
                <p className="text-[#ff6a3d] text-[36px] font-mono font-medium leading-none">12</p>
                <p className="text-zinc-400 text-[11px] mt-1">Frosted glass on warm grey-cream bg</p>
              </div>
            </div>
            <div className="bg-white/30 rounded-3xl p-5 border border-white/40">
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Subtle Panel</p>
              <p className="text-[#1a1a1a] text-[13px]">Dense data rows go here — calls list, tasks, activity feed.</p>
            </div>
            <div className="bg-white/50 backdrop-blur rounded-3xl p-5 border border-white/60">
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Strong Frost</p>
              <p className="text-zinc-600 text-[13px]">Higher opacity for inputs, active tabs, and focused elements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Logo Variants</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mark — Coral', bg: 'bg-white', border: true, src: '/brand/mark-coral.svg' },
            { label: 'Mark — Light', bg: 'bg-[#1c1916]', border: false, src: '/brand/mark-light.svg' },
            { label: 'Mark — Dark', bg: 'bg-white', border: true, src: '/brand/mark-dark.svg' },
            { label: 'Wordmark — Coral', bg: 'bg-white', border: true, src: '/brand/wordmark-coral.svg' },
            { label: 'Wordmark — Light', bg: 'bg-[#1c1916]', border: false, src: '/brand/wordmark-light.svg' },
            { label: 'Wordmark — Dark', bg: 'bg-white', border: true, src: '/brand/wordmark-dark.svg' },
          ].map((logo) => (
            <div key={logo.label} className={`rounded-2xl overflow-hidden ${logo.border ? 'border border-white/40' : ''}`}>
              <div className={`${logo.bg} h-24 flex items-center justify-center p-4`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.src} alt={logo.label} className="h-10 w-auto" />
              </div>
              <div className="px-3 py-2 bg-white border-t border-white/30">
                <p className="text-[11px] text-zinc-500">{logo.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Colors ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Color Palette</h2>
        <div className="grid grid-cols-5 gap-2">
          {colorEntries.map(([name, value]) => {
            const isDark = (value as string).startsWith('#1') || (value as string).startsWith('#0') || (value as string).startsWith('rgba(255');
            return (
              <div key={name} className="rounded-xl overflow-hidden border border-white/40">
                <div className="h-10" style={{ background: value as string }} />
                <div className="px-2 py-1.5 bg-white">
                  <p className={`text-[10px] font-medium font-mono ${isDark ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}>{name}</p>
                  <p className="text-[8px] text-zinc-400 font-mono truncate">{value as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Typography ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Typography Scale</h2>
        <div className="space-y-2 bg-white rounded-2xl border border-white/40 p-5">
          {Object.entries(typography.fontSize).map(([name, size]) => (
            <div key={name} className="flex items-baseline gap-4">
              <span className="text-[10px] text-zinc-400 font-mono w-14 shrink-0">{name}</span>
              <span className="text-[10px] text-zinc-300 font-mono w-10 shrink-0">{size}</span>
              <span style={{ fontSize: size }} className="text-[#1a1a1a] font-sans">
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
          <div className="border-t border-white/30 pt-3 mt-3">
            <p className="text-[10px] text-zinc-400 mb-2">Mono (numbers, times, scores)</p>
            <span className="text-[13px] text-[#1a1a1a] font-mono">91 / 100 — $45,000 — 2:15 PM CDT — 4m 32s</span>
          </div>
        </div>
      </section>

      {/* ── Radii ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Border Radii</h2>
        <div className="flex gap-3 items-end">
          {Object.entries(radii).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div
                className="w-14 h-14 border border-white/50 bg-white/30"
                style={{ borderRadius: value }}
              />
              <span className="text-[9px] text-zinc-400 font-mono">{name}</span>
              <span className="text-[8px] text-zinc-300 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shadows ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Shadows</h2>
        <div className="flex gap-4">
          {Object.entries(shadows).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-2xl bg-white" style={{ boxShadow: value }} />
              <span className="text-[9px] text-zinc-400 font-mono">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Components ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Components</h2>
        <div className="space-y-4">
          {/* Buttons */}
          <div className="relative glass-card rounded-3xl overflow-hidden p-5">
            <div className="glass-card-inner" />
            <div className="relative">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3">Buttons</p>
              <div className="flex gap-3 items-center flex-wrap">
                <button className="bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white text-[13px] font-medium px-5 py-2.5 rounded-full">Primary CTA</button>
                <button className="bg-white/60 backdrop-blur border border-white/60 text-zinc-700 text-[13px] font-medium px-5 py-2.5 rounded-full hover:bg-white/80">Secondary</button>
                <button className="text-zinc-600 hover:text-[#1a1a1a] hover:bg-white/30 text-[13px] font-medium px-3 py-1.5 rounded-lg">Ghost</button>
                <button className="bg-white/80 backdrop-blur border border-white/80 text-[#1a1a1a] text-[13px] font-medium px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(28,25,22,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]">Frosted Pill</button>
              </div>
            </div>
          </div>

          {/* Pills */}
          <div className="bg-white rounded-2xl border border-white/40 p-5">
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3">Pills & Badges</p>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Closed</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Qualification</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Closing</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Follow Up</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">3d overdue</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">Admin</span>
            </div>
          </div>

          {/* Frosted stat card */}
          <div className="relative glass-card rounded-3xl overflow-hidden p-5">
            <div className="glass-card-inner" />
            <div className="relative">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3">Frosted Stat Cards</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Calls', value: '12', icon: 'Phone' },
                  { label: 'Avg Score', value: '84', icon: 'BarChart' },
                  { label: 'Pipeline', value: '$195k', icon: 'TrendingUp' },
                  { label: 'Tasks', value: '8', icon: 'CheckSquare' },
                ].map((card) => (
                  <div key={card.label} className="relative glass-card rounded-2xl overflow-hidden p-5">
                    <div className="glass-card-inner" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{card.label}</p>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] flex items-center justify-center">
                          <span className="text-white text-[12px]">{card.icon[0]}</span>
                        </div>
                      </div>
                      <p className="text-[#ff6a3d] text-[36px] font-mono font-medium leading-none">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score circles */}
          <div className="bg-white rounded-2xl border border-white/40 p-5">
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3">Score Circles</p>
            <div className="flex gap-4 items-center">
              {[
                { score: 95, color: 'text-[#10b981]', ring: 'border-[#ff6a3d]', coral: true },
                { score: 82, color: 'text-[#3b82f6]', ring: 'border-blue-200', coral: false },
                { score: 71, color: 'text-[#f59e0b]', ring: 'border-amber-200', coral: false },
                { score: 58, color: 'text-[#ef4444]', ring: 'border-red-200', coral: false },
              ].map(({ score, color, ring, coral }) => (
                <div key={score} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-full border-2 ${ring} flex items-center justify-center font-mono text-[16px] font-semibold ${coral ? 'text-[#ff6a3d]' : color}`}>
                    {score}
                  </div>
                  <span className="text-[9px] text-zinc-400">{score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Voice ── */}
      <section>
        <h2 className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Voice & Tone</h2>
        <div className="bg-white rounded-2xl border border-white/40 overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="px-4 py-2 border-b border-white/30 text-[10px] font-medium text-red-600 uppercase tracking-widest">Don&apos;t say</div>
            <div className="px-4 py-2 border-b border-white/30 text-[10px] font-medium text-emerald-600 uppercase tracking-widest">Say instead</div>
          </div>
          {[
            ['"Oops! Something went wrong."', '"Couldn\'t load calls. Retry."'],
            ['"Great job! Task completed!"', '"Task done."'],
            ['"Our AI is analyzing..."', '"Scoring..."'],
            ['"Welcome back, user!"', '"Good morning, Pablo."'],
            ['"No items to display"', '"No calls yet."'],
          ].map(([bad, good], i) => (
            <div key={i} className="grid grid-cols-2 border-b border-white/30 last:border-0">
              <div className="px-4 py-2 text-[12px] text-zinc-400">{bad}</div>
              <div className="px-4 py-2 text-[12px] text-[#1a1a1a]">{good}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="pb-8">
        <p className="text-[11px] text-zinc-300">Company Mind Brand Kit v3.0 (Frosted Glass Edition) — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
}
