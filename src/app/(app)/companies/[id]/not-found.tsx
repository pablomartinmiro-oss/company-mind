import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function CompanyNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] p-10 text-center max-w-[400px]">
        <Building2 className="w-10 h-10 text-[#71717a] mx-auto mb-4" />
        <h1 className="text-[18px] font-medium text-[#1a1a1a]">Company not found</h1>
        <p className="text-[13px] text-[#52525b] mt-2 leading-relaxed">
          This company may have been deleted or you don&apos;t have access.
        </p>
        <Link
          href="/companies"
          className="inline-block mt-5 text-[12px] font-medium px-4 py-2 rounded-full bg-white/60 border border-white/70 text-[#52525b] hover:bg-white/80 transition-colors"
        >
          Back to companies
        </Link>
      </div>
    </div>
  );
}
