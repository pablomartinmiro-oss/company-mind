export default function Loading() {
  return (
    <div className="p-5 space-y-4">
      <div className="h-[36px] animate-pulse bg-zinc-100 rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[100px] animate-pulse bg-zinc-100 rounded-lg" />
      ))}
    </div>
  );
}
