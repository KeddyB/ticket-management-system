-- 10-add-is-active-column.sql
-- Adds an `is_active` column to the admins table.
-- Run AFTER 01-create-tables.sql (and any earlier migrations).

ALTER TABLE admins
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Optional: back-fill NULL values (if any) to TRUE so all current
-- accounts remain active.
UPDATE admins SET is_active = TRUE WHERE is_active IS NULL;

-- Helpful index if you frequently filter by active status.
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
