import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local before creating Supabase client
const envPath = resolve(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('ERROR: .env.local not found. Create it with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  let val = trimmed.slice(eqIdx + 1);
  // Strip surrounding quotes and trailing \n literals
  val = val.replace(/^["']|["']$/g, '').replace(/\\n$/g, '').trim();
  process.env[trimmed.slice(0, eqIdx)] = val;
}

// Check for NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '\n⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from .env.local!\n' +
    '   Go to Supabase Dashboard → Settings → API → anon/public key.\n' +
    '   Add it to .env.local:\n' +
    '   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...\n'
  );
} else {
  console.log('✓ NEXT_PUBLIC_SUPABASE_ANON_KEY found in .env.local');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

const AUTH_USERS = [
  { email: 'pablo.martin.miro@gmail.com', password: 'CompanyMind2026!', name: 'Pablo Martin Miro', role: 'owner' as const },
  { email: 'corey@getgunner.ai', password: 'CompanyMind2026!', name: 'Corey', role: 'member' as const },
];

async function ensureAppUser(email: string, name: string, role: string) {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    console.log(`  ✓ App user row exists for ${email}`);
    return;
  }

  const { error } = await supabaseAdmin
    .from('users')
    .insert({ email, name, role, tenant_id: TENANT_ID });

  if (error) {
    console.error(`  ✗ Failed to create app user for ${email}:`, error.message);
  } else {
    console.log(`  ✓ Created app user row for ${email}`);
  }
}

async function linkUser(email: string, authId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ auth_id: authId })
    .eq('email', email);

  if (error) {
    console.error(`  ✗ Failed to link ${email}:`, error.message);
  } else {
    console.log(`  ✓ Linked ${email} → auth_id: ${authId}`);
  }
}

async function main() {
  for (const { email, password, name, role } of AUTH_USERS) {
    console.log(`\nProcessing: ${email}`);

    // Ensure app user row exists
    await ensureAppUser(email, name, role);

    // Create auth user
    console.log('  Creating auth user...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('duplicate')) {
        console.log(`  ⏭  Auth user already exists, fetching existing ID...`);

        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === email);
        if (existing) {
          console.log(`  ✓ Existing auth UID: ${existing.id}`);
          await linkUser(email, existing.id);
        } else {
          console.error(`  ✗ Could not find existing auth user for ${email}`);
        }
        continue;
      }
      console.error(`  ✗ Error creating auth user for ${email}:`, error.message);
      continue;
    }

    const uid = data.user.id;
    console.log(`  ✓ Created auth UID: ${uid}`);
    await linkUser(email, uid);
  }

  // Verify
  console.log('\n--- Verification ---');
  const { data: users, error: verifyErr } = await supabaseAdmin
    .from('users')
    .select('email, auth_id')
    .in('email', AUTH_USERS.map((u) => u.email));

  if (verifyErr) {
    console.error('Verification query failed:', verifyErr.message);
  } else {
    for (const u of users ?? []) {
      const status = u.auth_id ? '✓' : '✗ MISSING';
      console.log(`  ${status} ${u.email} → auth_id: ${u.auth_id ?? 'null'}`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
