import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildCompanyEnrichmentSchema,
  buildContactEnrichmentSchema,
  buildCompanyPredictiveSchema,
} from '@/lib/research/schemas';
import { findSectionForField, extractJsonFromText } from './helpers';

const MODEL = 'claude-sonnet-4-6';

interface EnrichmentResult {
  company_fields_updated: number;
  contact_fields_updated: number;
  predictive_scores_updated: number;
  errors: string[];
}

export async function runCompanyEnrichment(
  tenantId: string,
  companyId: string,
  triggeredBy: 'creation' | 'manual' = 'manual'
): Promise<EnrichmentResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const errors: string[] = [];
  let companyFieldsUpdated = 0;
  let contactFieldsUpdated = 0;
  let predictiveScoresUpdated = 0;

  const { data: job } = await supabaseAdmin
    .from('enrichment_jobs')
    .insert({
      tenant_id: tenantId,
      scope: 'company',
      company_id: companyId,
      job_type: triggeredBy === 'creation' ? 'auto_creation' : 'manual_reenrich',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  try {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('tenant_id', tenantId)
      .single();

    if (!company) throw new Error('Company not found');

    const { data: contacts } = await supabaseAdmin
      .from('company_contacts')
      .select('*')
      .eq('company_id', companyId)
      .eq('tenant_id', tenantId);

    const { data: existingResearch } = await supabaseAdmin
      .from('research')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('scope', 'company')
      .eq('company_id', companyId);

    const lockedFieldKeys = new Set(
      (existingResearch ?? [])
        .filter(r => r.locked || r.source === 'manual')
        .map(r => r.field_name)
    );

    const existingValues: Record<string, string> = {};
    for (const r of existingResearch ?? []) {
      if (r.field_value) existingValues[r.field_name] = r.field_value;
    }

    const contextLines: string[] = [
      `Company name: ${company.name}`,
      company.industry ? `Industry: ${company.industry}` : null,
      company.location ? `Location: ${company.location}` : null,
      company.website ? `Website: ${company.website}` : null,
      existingValues.domain ? `Domain: ${existingValues.domain}` : null,
      contacts && contacts.length > 0 ? `Known contacts: ${contacts.map(c => `${c.contact_name ?? c.contact_id} (${c.role ?? 'unknown'})`).join(', ')}` : null,
    ].filter(Boolean) as string[];

    const existingBlock = Object.keys(existingValues).length > 0
      ? `\n\nExisting research data:\n${Object.entries(existingValues).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`
      : '';

    const lockedNote = lockedFieldKeys.size > 0
      ? `\n\nIMPORTANT: These fields are locked. Return null for them: ${Array.from(lockedFieldKeys).join(', ')}`
      : '';

    const prompt = `You are enriching a B2B company profile for a sales CRM. Research this company deeply using web search and your knowledge.

${contextLines.join('\n')}${existingBlock}${lockedNote}

Fill in as many catalog fields as possible with accurate information. Use web search for recent info. Return null for fields you can't confidently determine.

Return ONLY a JSON object matching this schema (no commentary, no markdown):

${buildCompanyEnrichmentSchema()}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      tools: [{ type: 'web_search_20250305' as 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlocks = response.content.filter(b => b.type === 'text');
    const fullText = textBlocks.map(b => (b as { type: 'text'; text: string }).text).join('\n');
    const enrichment = extractJsonFromText(fullText);
    if (!enrichment) throw new Error('No JSON in Claude response');

    for (const [fieldKey, fieldValue] of Object.entries(enrichment)) {
      if (lockedFieldKeys.has(fieldKey)) continue;
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') continue;

      const valueStr = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);

      const { error: upsertError } = await supabaseAdmin
        .from('research')
        .upsert({
          tenant_id: tenantId,
          scope: 'company',
          company_id: companyId,
          contact_id: null,
          section: findSectionForField(fieldKey, 'company'),
          field_name: fieldKey,
          field_value: valueStr,
          source: 'ai',
          last_verified_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id,company_id,field_name' });

      if (!upsertError) companyFieldsUpdated++;
      else errors.push(`${fieldKey}: ${upsertError.message}`);
    }

    // Predictive scores
    const predictivePrompt = `Based on this enriched company profile, calculate predictive scores. Return ONLY JSON.

Company: ${company.name}
${Object.entries(enrichment).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`).join('\n')}

Schema:
${buildCompanyPredictiveSchema()}`;

    const predictiveResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: predictivePrompt }],
    });

    const predictiveText = predictiveResponse.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('\n');
    const predictive = extractJsonFromText(predictiveText);

    if (predictive) {
      for (const [scoreName, scoreValue] of Object.entries(predictive)) {
        await supabaseAdmin
          .from('predictive_scores')
          .upsert({
            tenant_id: tenantId,
            scope: 'company',
            company_id: companyId,
            contact_id: null,
            score_name: scoreName,
            score_value: typeof scoreValue === 'number' ? scoreValue : null,
            score_label: typeof scoreValue === 'string' ? scoreValue : null,
            model_version: MODEL,
            computed_at: new Date().toISOString(),
          }, { onConflict: 'tenant_id,scope,company_id,contact_id,score_name' });
        predictiveScoresUpdated++;
      }
    }

    // Enrich each contact
    for (const contact of contacts ?? []) {
      const result = await runContactEnrichment(tenantId, contact.contact_id, companyId, contact.contact_name, contact.role, contact.contact_email);
      contactFieldsUpdated += result.fields_updated;
    }

    await supabaseAdmin
      .from('enrichment_jobs')
      .update({ status: 'complete', fields_updated: companyFieldsUpdated + contactFieldsUpdated, completed_at: new Date().toISOString() })
      .eq('id', job!.id);

    return { company_fields_updated: companyFieldsUpdated, contact_fields_updated: contactFieldsUpdated, predictive_scores_updated: predictiveScoresUpdated, errors };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await supabaseAdmin
      .from('enrichment_jobs')
      .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
      .eq('id', job!.id);
    throw e;
  }
}

async function runContactEnrichment(tenantId: string, contactId: string, companyId: string, contactName: string | null, role: string | null, email: string | null) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { data: existingResearch } = await supabaseAdmin
    .from('research')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scope', 'contact')
    .eq('contact_id', contactId);

  const lockedFieldKeys = new Set(
    (existingResearch ?? [])
      .filter(r => r.locked || r.source === 'manual')
      .map(r => r.field_name)
  );

  const prompt = `You are enriching a contact profile for a sales CRM. Research this person using web search.

Contact: ${contactName ?? contactId}
Email: ${email ?? 'unknown'}
Role: ${role ?? 'unknown'}

Use web search for LinkedIn, recent posts, career history. Return null for fields you can't fill.

${lockedFieldKeys.size > 0 ? `Locked fields (return null): ${Array.from(lockedFieldKeys).join(', ')}` : ''}

Return ONLY JSON matching this schema:

${buildContactEnrichmentSchema()}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [{ type: 'web_search_20250305' as 'web_search_20250305', name: 'web_search', max_uses: 3 }],
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlocks = response.content.filter(b => b.type === 'text');
  const fullText = textBlocks.map(b => (b as { type: 'text'; text: string }).text).join('\n');
  const enrichment = extractJsonFromText(fullText);
  if (!enrichment) return { fields_updated: 0 };

  let fieldsUpdated = 0;

  for (const [fieldKey, fieldValue] of Object.entries(enrichment)) {
    if (lockedFieldKeys.has(fieldKey)) continue;
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') continue;

    const valueStr = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);

    const { error } = await supabaseAdmin
      .from('research')
      .upsert({
        tenant_id: tenantId,
        scope: 'contact',
        company_id: null,
        contact_id: contactId,
        section: findSectionForField(fieldKey, 'contact'),
        field_name: fieldKey,
        field_value: valueStr,
        source: 'ai',
        last_verified_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,contact_id,field_name' });

    if (!error) fieldsUpdated++;
  }

  return { fields_updated: fieldsUpdated };
}
