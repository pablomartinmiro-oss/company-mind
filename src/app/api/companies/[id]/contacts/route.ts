import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Add a contact to a company
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: companyId } = await ctx.params;
    const { contact_id, role, is_primary } = await req.json();

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    // If setting as primary, unset other primaries first
    if (is_primary) {
      await supabaseAdmin
        .from('company_contacts')
        .update({ is_primary: false })
        .eq('tenant_id', tenantId)
        .eq('company_id', companyId)
        .eq('is_primary', true);
    }

    const { data, error } = await supabaseAdmin
      .from('company_contacts')
      .upsert(
        {
          tenant_id: tenantId,
          company_id: companyId,
          contact_id,
          role: role ?? null,
          is_primary: is_primary ?? false,
        },
        { onConflict: 'tenant_id,company_id,contact_id' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Update a contact's role or primary status
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: companyId } = await ctx.params;
    const { contact_id, role, is_primary } = await req.json();

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    // If setting as primary, unset other primaries first
    if (is_primary) {
      await supabaseAdmin
        .from('company_contacts')
        .update({ is_primary: false })
        .eq('tenant_id', tenantId)
        .eq('company_id', companyId)
        .eq('is_primary', true);
    }

    const updates: Record<string, unknown> = {};
    if (role !== undefined) updates.role = role;
    if (is_primary !== undefined) updates.is_primary = is_primary;

    const { error } = await supabaseAdmin
      .from('company_contacts')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId)
      .eq('contact_id', contact_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Remove a contact from a company
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: companyId } = await ctx.params;
    const { contact_id } = await req.json();

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('company_contacts')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId)
      .eq('contact_id', contact_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
