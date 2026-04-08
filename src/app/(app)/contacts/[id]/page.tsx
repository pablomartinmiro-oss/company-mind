import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * /contacts/[id] now redirects to /companies/[companyId].
 * Contact detail lives on the company page with the contacts sidebar.
 */
export default async function ContactDetailPage({ params }: PageProps) {
  const { tenantId } = await getTenantForUser();
  const { id: contactId } = await params;

  // Look up which company this contact belongs to
  const { data: link } = await supabaseAdmin
    .from('company_contacts')
    .select('company_id')
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactId)
    .maybeSingle();

  if (link?.company_id) {
    redirect(`/companies/${link.company_id}`);
  }

  // Contact not linked to any company — redirect to companies list
  redirect('/companies');
}
