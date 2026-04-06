import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local — check worktree, then main repo root
const candidates = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../..', '.env.local'), // main repo from worktree
];
const envPath = candidates.find((p) => {
  try { readFileSync(p); return true; } catch { return false; }
});
if (!envPath) {
  console.error('No .env.local found. Checked:', candidates.join(', '));
  console.error('Create .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  let val = trimmed.slice(eqIdx + 1);
  // Strip surrounding quotes and trailing \n literals from Vercel env pull
  val = val.replace(/^["']|["']$/g, '').replace(/\\n$/g, '').trim();
  process.env[key] = val;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixSeedData() {
  console.log('Fixing seed data...\n');

  // Step 1 — Fix call_type values
  console.log('Step 1: Fixing call_type...');
  const callTypeUpdates = [
    { pattern: '%Sarah Chen%', call_type: 'closing' },
    { pattern: '%David Kim%', call_type: 'qualification' },
    { pattern: '%Marcus Thompson%', call_type: 'qualification' },
    { pattern: '%Lisa Patel%', call_type: 'follow_up' },
    { pattern: '%Jake%', call_type: 'cold_call' },
  ];

  for (const { pattern, call_type } of callTypeUpdates) {
    const { error, count } = await supabaseAdmin
      .from('calls')
      .update({ call_type })
      .ilike('contact_name', pattern);
    if (error) console.error(`  Error updating call_type for ${pattern}:`, error.message);
    else console.log(`  ${pattern} → call_type=${call_type} (${count ?? '?'} rows)`);
  }

  // Step 2 — Fix outcome values
  console.log('\nStep 2: Fixing outcome...');
  const outcomeUpdates = [
    { pattern: '%Sarah Chen%', outcome: 'closed_won' },
    { pattern: '%David Kim%', outcome: 'follow_up_scheduled' },
    { pattern: '%Marcus Thompson%', outcome: 'follow_up_scheduled' },
    { pattern: '%Lisa Patel%', outcome: 'follow_up_scheduled' },
    { pattern: '%Jake%', outcome: null },
  ];

  for (const { pattern, outcome } of outcomeUpdates) {
    const { error, count } = await supabaseAdmin
      .from('calls')
      .update({ outcome })
      .ilike('contact_name', pattern);
    if (error) console.error(`  Error updating outcome for ${pattern}:`, error.message);
    else console.log(`  ${pattern} → outcome=${outcome} (${count ?? '?'} rows)`);
  }

  // Step 3 — Stagger stage_entered_at
  console.log('\nStep 3: Staggering stage_entered_at...');
  const stageUpdates = [
    { contact_id: 'demo-contact-004', days: 0 },
    { contact_id: 'demo-contact-003', days: 2 },
    { contact_id: 'demo-contact-002', days: 4 },
    { contact_id: 'demo-contact-001', days: 7 },
    { contact_id: 'demo-contact-005', days: 1 },
  ];

  const now = new Date();
  for (const { contact_id, days } of stageUpdates) {
    const stageEnteredAt = new Date(now.getTime() - days * 86400000).toISOString();
    const { error, count } = await supabaseAdmin
      .from('pipeline_contacts')
      .update({ stage_entered_at: stageEnteredAt })
      .eq('contact_id', contact_id);
    if (error) console.error(`  Error updating ${contact_id}:`, error.message);
    else console.log(`  ${contact_id} → ${days} days ago (${count ?? '?'} rows)`);
  }

  // Step 4 — Sync task pipeline_stage to match contact's actual stage
  console.log('\nStep 4: Syncing task pipeline_stage...');
  // Fetch pipeline_contacts to get current stages
  const { data: pipelineContacts, error: pcError } = await supabaseAdmin
    .from('pipeline_contacts')
    .select('contact_id, tenant_id, stage');

  if (pcError) {
    console.error('  Error fetching pipeline_contacts:', pcError.message);
  } else if (pipelineContacts) {
    let synced = 0;
    for (const pc of pipelineContacts) {
      const { error, count } = await supabaseAdmin
        .from('tasks')
        .update({ pipeline_stage: pc.stage })
        .eq('contact_id', pc.contact_id)
        .eq('tenant_id', pc.tenant_id)
        .neq('pipeline_stage', pc.stage);
      if (error) {
        console.error(`  Error syncing tasks for ${pc.contact_id}:`, error.message);
      } else {
        synced += (count ?? 0);
      }
    }
    // Also update tasks where pipeline_stage is null
    for (const pc of pipelineContacts) {
      const { error, count } = await supabaseAdmin
        .from('tasks')
        .update({ pipeline_stage: pc.stage })
        .eq('contact_id', pc.contact_id)
        .eq('tenant_id', pc.tenant_id)
        .is('pipeline_stage', null);
      if (error) {
        console.error(`  Error syncing null stages for ${pc.contact_id}:`, error.message);
      } else {
        synced += (count ?? 0);
      }
    }
    console.log(`  Synced ${synced} task rows`);
  }

  // Verify
  console.log('\n--- Verification ---');
  const { data: calls } = await supabaseAdmin
    .from('calls')
    .select('contact_name, call_type, outcome');
  console.log('\nCalls:');
  for (const c of calls ?? []) {
    console.log(`  ${c.contact_name}: call_type=${c.call_type}, outcome=${c.outcome}`);
  }

  const { data: contacts } = await supabaseAdmin
    .from('pipeline_contacts')
    .select('contact_id, stage, stage_entered_at');
  console.log('\nPipeline contacts:');
  for (const pc of contacts ?? []) {
    console.log(`  ${pc.contact_id}: stage=${pc.stage}, entered=${pc.stage_entered_at}`);
  }

  console.log('\nDone!');
}

fixSeedData().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
