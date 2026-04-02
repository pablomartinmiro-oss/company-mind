'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function approveAction(actionId: string) {
  await supabaseAdmin
    .from('call_actions')
    .update({ status: 'approved' })
    .eq('id', actionId);

  await supabaseAdmin.from('feedback_log').insert({
    tenant_id: 'eb14e21e-1f61-44a2-a908-48b5b43303d9',
    call_action_id: actionId,
    feedback_type: 'approve',
    user_id: 'default',
  });

  revalidatePath('/dashboard');
  revalidatePath('/calls');
}

export async function rejectAction(actionId: string) {
  await supabaseAdmin
    .from('call_actions')
    .update({ status: 'rejected' })
    .eq('id', actionId);

  await supabaseAdmin.from('feedback_log').insert({
    tenant_id: 'eb14e21e-1f61-44a2-a908-48b5b43303d9',
    call_action_id: actionId,
    feedback_type: 'reject',
    user_id: 'default',
  });

  revalidatePath('/dashboard');
  revalidatePath('/calls');
}

export async function approveDataPoint(dataPointId: string) {
  await supabaseAdmin
    .from('contact_data_points')
    .update({ source: 'approved' })
    .eq('id', dataPointId);

  revalidatePath('/calls');
}

export async function rejectDataPoint(dataPointId: string) {
  await supabaseAdmin
    .from('contact_data_points')
    .update({ source: 'rejected' })
    .eq('id', dataPointId);

  revalidatePath('/calls');
}
