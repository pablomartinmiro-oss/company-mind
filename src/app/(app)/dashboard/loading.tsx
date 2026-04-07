export default function Loading() {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[72px] animate-pulse bg-white/30 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-[400px] animate-pulse bg-white/30 rounded-lg" />
        ))}
      </div>
      <div className="h-[300px] animate-pulse bg-white/30 rounded-lg" />
    </div>
  );
}
