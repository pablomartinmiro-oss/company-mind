import { createSupabaseServer } from './supabase-server'
import { supabaseAdmin } from './supabase'

export async function getTenantForUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: appUser } = await supabaseAdmin
    .from('users')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!appUser) throw new Error('User not linked to tenant')
  return { tenantId: appUser.tenant_id as string, userId: user.id, email: user.email }
}
