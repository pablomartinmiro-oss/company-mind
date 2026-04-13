import { NextResponse } from 'next/server';
import { getTenantForUser } from '@/lib/get-tenant';
import { getGHLClientForTenant } from '@/lib/tenant-context';

export async function GET() {
  try {
    const { tenantId } = await getTenantForUser();
    const ghl = await getGHLClientForTenant(tenantId);
    const result = await ghl.listCalendars();
    const calendars = (result?.calendars ?? []).map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
    }));
    return NextResponse.json(calendars);
  } catch {
    return NextResponse.json([]);
  }
}
