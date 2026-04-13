import { NextRequest, NextResponse } from 'next/server';
import { getTenantForUser } from '@/lib/get-tenant';
import { runCompanyEnrichment } from '@/lib/ai/enrichment';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const maxDuration = 60;

export async function POST(_req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: companyId } = await ctx.params;

    const result = await runCompanyEnrichment(tenantId, companyId, 'manual');

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.company_fields_updated + result.contact_fields_updated} fields updated`,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
