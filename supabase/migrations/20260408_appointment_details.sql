-- Update status constraint to include showed/no_show
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('confirmed','pending','showed','no_show','cancelled'));

-- Add organizer and attendee columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organizer text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS attendee_contact_ids text[];
