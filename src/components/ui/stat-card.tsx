interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: React.ReactNode;
  footnote?: React.ReactNode;
}

export function StatCard({ label, value, suffix, footnote }: StatCardProps) {
  return (
    <div className="relative glass-card rounded-3xl px-5 py-4">
      <div className="glass-card-inner" />
      <div className="relative">
        <p className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-[48px] font-medium font-mono text-[#ff6a3d] leading-none">{value}</p>
          {suffix}
        </div>
        {footnote}
      </div>
    </div>
  );
}
