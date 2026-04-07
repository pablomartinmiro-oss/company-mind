// src/lib/tenant-context.ts
// Loads tenant config and creates an authenticated GHL client
// Every Mastra tool uses this to get a tenant-scoped GHL client

import { GHLClient } from './ghl';
import { supabaseAdmin } from './supabase';

interface TenantRecord {
  id: string;
  name: string;
  industry: string | null;
  ghl_location_id: string;
  ghl_access_token: string;
  ghl_refresh_token: string;
  ghl_token_expires_at: string;
  scoring_rubric: Record<string, unknown>;
  data_point_schema: Array<Record<string, unknown>>;
  settings: Record<string, unknown>;
}

// In-memory cache to avoid repeated DB lookups within a single request
const tenantCache = new Map<string, { tenant: TenantRecord; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function getTenant(tenantId: string): Promise<TenantRecord> {
  // Check cache
  const cached = tenantCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.tenant;
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !data) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  tenantCache.set(tenantId, { tenant: data as TenantRecord, timestamp: Date.now() });
  return data as TenantRecord;
}

export async function getGHLClientForTenant(tenantId: string): Promise<GHLClient> {
  const tenant = await getTenant(tenantId);

  if (!tenant.ghl_access_token) {
    throw new Error(`Tenant ${tenantId} has no GHL access token. Complete OAuth first.`);
  }

  return new GHLClient(
    tenant.ghl_location_id,
    {
      access_token: tenant.ghl_access_token,
      refresh_token: tenant.ghl_refresh_token,
      expires_at: new Date(tenant.ghl_token_expires_at),
    },
    // Callback: persist refreshed tokens back to DB
    async (newTokens) => {
      await supabaseAdmin
        .from('tenants')
        .update({
          ghl_access_token: newTokens.access_token,
          ghl_refresh_token: newTokens.refresh_token,
          ghl_token_expires_at: newTokens.expires_at.toISOString(),
        })
        .eq('id', tenantId);

      // Invalidate cache so next call gets fresh tokens
      tenantCache.delete(tenantId);
    }
  );
}

// Current user — temporary until auth is fully wired
export const CURRENT_USER = {
  name: 'Corey Lavinder',
  initials: 'CL',
  email: 'corey@getgunner.ai',
};

// Helper: resolve tenant from GHL location ID (used by webhooks)
export async function getTenantByLocationId(locationId: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('ghl_location_id', locationId)
    .single();

  if (error || !data) return null;
  return data as TenantRecord;
}
