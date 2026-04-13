import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id, entered_at, moved_by, note } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Log entry ID required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (entered_at !== undefined) updates.entered_at = entered_at;
    if (moved_by !== undefined) updates.moved_by = moved_by;
    if (note !== undefined) updates.note = note;

    const { error } = await supabaseAdmin
      .from('stage_log')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Log entry ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('stage_log')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
