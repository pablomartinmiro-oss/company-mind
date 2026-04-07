ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'follow_up';

-- Seed varied task types so the UI pills are visible
UPDATE tasks SET task_type = 'follow_up'  WHERE title ILIKE '%follow%';
UPDATE tasks SET task_type = 'new_lead'   WHERE title ILIKE '%re-engage%' OR title ILIKE '%new lead%';
UPDATE tasks SET task_type = 'admin'      WHERE title ILIKE '%proposal%' OR title ILIKE '%agreement%' OR title ILIKE '%doc%';
UPDATE tasks SET task_type = 'scheduling' WHERE title ILIKE '%schedule%' OR title ILIKE '%book%';
