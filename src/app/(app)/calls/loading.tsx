export default function Loading() {
  return (
    <div className="p-5 space-y-4">
      <div className="h-[36px] animate-pulse bg-white/[0.06] rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[100px] animate-pulse bg-white/[0.06] rounded-lg" />
      ))}
    </div>
  );
}
