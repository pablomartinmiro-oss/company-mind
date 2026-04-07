import { NextRequest, NextResponse } from 'next/server';
import { getTenantForUser } from '@/lib/get-tenant';
import { analyzeCall } from '@/lib/ai/call-analysis';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: callId } = await ctx.params;

    const result = await analyzeCall(tenantId, callId);

    return NextResponse.json({ success: true, ...result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
