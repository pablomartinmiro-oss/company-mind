// src/lib/env-check.ts
// Server-side only, dev only — logs whether required env vars are present

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GHL_CLIENT_ID',
  'GHL_CLIENT_SECRET',
  'ANTHROPIC_API_KEY',
  'ASSEMBLYAI_API_KEY',
] as const;

let checked = false;

export function checkEnvVars(): void {
  if (process.env.NODE_ENV !== 'development' || checked) return;
  checked = true;

  console.log('\n[env-check] Required environment variables:');
  for (const name of REQUIRED_VARS) {
    const present = !!process.env[name];
    console.log(present ? `  ✅ ${name}: present` : `  ❌ ${name}: MISSING`);
  }
  console.log('');
}
