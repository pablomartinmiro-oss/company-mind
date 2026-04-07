import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('calls')
      .select('processing_status, processing_error, score')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      status: data.processing_status,
      error: data.processing_error,
      score: data.score,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
