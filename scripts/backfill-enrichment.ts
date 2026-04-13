// Must load env BEFORE any imports that use process.env
import { config } from 'dotenv';
config({ path: '.env.local' });

// Now safe to import modules that read env at module scope
async function main() {
  const { runCompanyEnrichment } = await import('../src/lib/ai/enrichment');
  const { createClient } = await import('@supabase/supabase-js');

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  const sb = createClient(url, key);

  const tenantId = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

  const { data: companies } = await sb
    .from('companies')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .not('website', 'is', null)
    .not('location', 'is', null)
    .not('industry', 'is', null)
    .not('lead_source', 'is', null);

  if (!companies?.length) {
    console.log('No companies with all 4 fields filled.');
    return;
  }

  for (const c of companies) {
    const { count } = await sb
      .from('research')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', c.id)
      .eq('scope', 'company');

    if ((count ?? 0) > 0) {
      console.log(`SKIP: ${c.name} — already has ${count} research fields`);
      continue;
    }

    console.log(`ENRICHING: ${c.name}...`);
    try {
      const result = await runCompanyEnrichment(tenantId, c.id, 'manual');
      console.log(`  OK — company: ${result.company_fields_updated}, contact: ${result.contact_fields_updated}, predictive: ${result.predictive_scores_updated}, errors: ${result.errors.length}`);
    } catch (err) {
      console.log(`  FAIL — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\nDone.');
}

main();
