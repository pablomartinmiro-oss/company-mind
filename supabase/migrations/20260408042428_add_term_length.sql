-- Add term_length column to companies (contract term in months, nullable)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS term_length integer;
