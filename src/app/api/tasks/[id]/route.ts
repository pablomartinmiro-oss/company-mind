import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { tenantId } = await getTenantForUser();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { tenantId } = await getTenantForUser();
  const { id } = await params;
  const body = await req.json();

  // Only allow updating safe fields
  const allowed: Record<string, unknown> = {};
  if (body.title !== undefined) allowed.title = body.title;
  if (body.description !== undefined) allowed.description = body.description;
  if (body.due_date !== undefined) allowed.due_date = body.due_date;
  if (body.task_type !== undefined) allowed.task_type = body.task_type;
  if (body.completed !== undefined) allowed.completed = body.completed;

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(allowed)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  return NextResponse.json(data);
}
