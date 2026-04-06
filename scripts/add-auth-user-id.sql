-- Migration: Link Supabase Auth users to app users
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
