import { NextResponse } from 'next/server';
import { getTenantForUser } from '@/lib/get-tenant';
import { getContactInfo } from '@/lib/lookups';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getTenantForUser();
  const { id } = await params;

  const info = await getContactInfo(tenantId, id);
  return NextResponse.json({ company_name: info?.company_name ?? null });
}
