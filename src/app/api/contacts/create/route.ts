import { NextResponse } from 'next/server';
import { getTenantForUser } from '@/lib/get-tenant';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { supabaseAdmin } from '@/lib/supabase';
import { runCompanyEnrichment } from '@/lib/ai/enrichment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName, website, location, industry, leadSource,
      firstName, lastName, email, phone,
    } = body as {
      companyName?: string;
      website?: string;
      location?: string;
      industry?: string;
      leadSource?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    };

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
    }

    const { tenantId, userName } = await getTenantForUser();
    const ghl = await getGHLClientForTenant(tenantId);

    // 1. Create contact in GHL
    const ghlResult = await ghl.createContact({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName.trim(),
      ...(email ? { email: email.trim() } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
    });

    const contactId: string | undefined = ghlResult?.contact?.id;
    if (!contactId) {
      return NextResponse.json({ error: 'Failed to create contact in GHL' }, { status: 400 });
    }

    // 2. Create company record with detail fields
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        tenant_id: tenantId,
        name: companyName.trim(),
        website: website?.trim() || null,
        location: location?.trim() || null,
        industry: industry?.trim() || null,
        lead_source: leadSource?.trim() || null,
      })
      .select('id')
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Contact created in GHL but failed to save company record' },
        { status: 400 },
      );
    }

    // 3. Link GHL contact to company
    await supabaseAdmin.from('company_contacts').insert({
      tenant_id: tenantId,
      company_id: company.id,
      contact_id: contactId,
      is_primary: true,
      contact_name: `${firstName.trim()} ${lastName.trim()}`,
      contact_email: email?.trim() || null,
      contact_phone: phone?.trim() || null,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    });

    // 4. Enroll in Sales Pipeline at New Lead
    const { data: pipeline } = await supabaseAdmin
      .from('pipelines')
      .select('id')
      .eq('name', 'Sales Pipeline')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

    if (pipeline) {
      const now = new Date().toISOString();

      await supabaseAdmin.from('pipeline_companies').insert({
        tenant_id: tenantId,
        company_id: company.id,
        contact_id: contactId,
        pipeline_id: pipeline.id,
        stage: 'New Lead',
        stage_entered_at: now,
      });

      await supabaseAdmin.from('stage_log').insert({
        tenant_id: tenantId,
        company_id: company.id,
        contact_id: contactId,
        pipeline_id: pipeline.id,
        stage: 'New Lead',
        entered_at: now,
        moved_by: userName,
        source: 'api',
        milestone: 'Lead Came In',
        entry_number: 1,
      });
    }

    // 5. Fire enrichment if all 4 detail fields are provided
    const allDetailsFilled = website?.trim() && location?.trim() && industry?.trim() && leadSource?.trim();
    if (allDetailsFilled) {
      runCompanyEnrichment(tenantId, company.id, 'creation').catch(err => {
        console.error('[create] enrichment failed silently:', err);
      });
    }

    return NextResponse.json({ success: true, companyId: company.id, contactId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
