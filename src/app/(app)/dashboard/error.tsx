'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-5">
      <h2 className="text-[16px] font-medium text-[#1a1a1a] mb-2">Something went wrong</h2>
      <p className="text-[13px] text-zinc-500 mb-4 max-w-md text-center">{error.message}</p>
      <button onClick={reset} className="bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white text-[13px] font-medium px-4 py-2 rounded-full">
        Try again
      </button>
    </div>
  );
}
