'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { getTenantForUser } from '@/lib/get-tenant';
import { findSectionForField } from '@/lib/ai/helpers';

export async function approveAction(actionId: string) {
  const { tenantId, userId } = await getTenantForUser();

  const { data: action } = await supabaseAdmin
    .from('call_actions')
    .select('id')
    .eq('id', actionId)
    .eq('tenant_id', tenantId)
    .single();
  if (!action) throw new Error('Action not found or access denied');

  await supabaseAdmin
    .from('call_actions')
    .update({ status: 'approved' })
    .eq('id', actionId)
    .eq('tenant_id', tenantId);

  await supabaseAdmin.from('feedback_log').insert({
    tenant_id: tenantId,
    call_action_id: actionId,
    feedback_type: 'approve',
    user_id: userId,
  });

  revalidatePath('/dashboard');
  revalidatePath('/calls');
}

export async function rejectAction(actionId: string) {
  const { tenantId, userId } = await getTenantForUser();

  const { data: action } = await supabaseAdmin
    .from('call_actions')
    .select('id')
    .eq('id', actionId)
    .eq('tenant_id', tenantId)
    .single();
  if (!action) throw new Error('Action not found or access denied');

  await supabaseAdmin
    .from('call_actions')
    .update({ status: 'rejected' })
    .eq('id', actionId)
    .eq('tenant_id', tenantId);

  await supabaseAdmin.from('feedback_log').insert({
    tenant_id: tenantId,
    call_action_id: actionId,
    feedback_type: 'reject',
    user_id: userId,
  });

  revalidatePath('/dashboard');
  revalidatePath('/calls');
}

// ── Data Points (R2 `data_points` table) ──

export async function approveDataPoint(dataPointId: string) {
  const { tenantId } = await getTenantForUser();

  const { data: dp } = await supabaseAdmin
    .from('data_points')
    .select('*')
    .eq('id', dataPointId)
    .eq('tenant_id', tenantId)
    .single();

  if (!dp) throw new Error('Data point not found or access denied');
  if (dp.status !== 'pending') throw new Error('Already processed');

  const scope = dp.company_id ? 'company' : dp.contact_id ? 'contact' : null;
  if (!scope) throw new Error('Data point has no company_id or contact_id');

  // Look up the research catalog section for this field
  const section = findSectionForField(dp.field_name, scope) || 'AI Extracted';

  // Promote to research catalog
  await supabaseAdmin.from('research').upsert({
    tenant_id: tenantId,
    company_id: dp.company_id,
    contact_id: dp.contact_id,
    scope,
    section: section === 'Unknown' ? 'AI Extracted' : section,
    field_name: dp.field_name,
    field_value: dp.field_value,
    source: 'call',
    source_call_id: dp.call_id,
    confidence: 'medium',
    locked: false,
    last_verified_at: new Date().toISOString(),
  }, {
    onConflict: dp.company_id
      ? 'tenant_id,company_id,field_name'
      : 'tenant_id,contact_id,field_name',
  });

  // Mark approved
  await supabaseAdmin.from('data_points')
    .update({ status: 'approved' })
    .eq('id', dataPointId)
    .eq('tenant_id', tenantId);

  revalidatePath('/calls');
  revalidatePath('/companies');
  revalidatePath('/contacts');
  return { success: true };
}

export async function rejectDataPoint(dataPointId: string) {
  const { tenantId } = await getTenantForUser();

  const { data: dp } = await supabaseAdmin
    .from('data_points')
    .select('id, status')
    .eq('id', dataPointId)
    .eq('tenant_id', tenantId)
    .single();

  if (!dp) throw new Error('Data point not found or access denied');
  if (dp.status !== 'pending') throw new Error('Already processed');

  await supabaseAdmin.from('data_points')
    .update({ status: 'rejected' })
    .eq('id', dataPointId)
    .eq('tenant_id', tenantId);

  revalidatePath('/calls');
  return { success: true };
}

export async function approveDataPointsBulk(dataPointIds: string[]) {
  const { tenantId } = await getTenantForUser();
  let approved = 0;
  let failed = 0;
  const errors: string[] = [];

  // Verify all belong to tenant in one query
  const { data: rows } = await supabaseAdmin
    .from('data_points')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .in('id', dataPointIds);

  const validIds = new Set((rows ?? []).map(r => r.id));

  for (const id of dataPointIds) {
    if (!validIds.has(id)) {
      failed++;
      errors.push(`${id}: not found or not pending`);
      continue;
    }
    try {
      await approveDataPoint(id);
      approved++;
    } catch (e: unknown) {
      failed++;
      errors.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { approved, failed, errors };
}

export async function rejectDataPointsBulk(dataPointIds: string[]) {
  const { tenantId } = await getTenantForUser();
  let rejected = 0;
  let failed = 0;
  const errors: string[] = [];

  const { data: rows } = await supabaseAdmin
    .from('data_points')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .in('id', dataPointIds);

  const validIds = new Set((rows ?? []).map(r => r.id));

  for (const id of dataPointIds) {
    if (!validIds.has(id)) {
      failed++;
      errors.push(`${id}: not found or not pending`);
      continue;
    }
    try {
      await rejectDataPoint(id);
      rejected++;
    } catch (e: unknown) {
      failed++;
      errors.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { rejected, failed, errors };
}
