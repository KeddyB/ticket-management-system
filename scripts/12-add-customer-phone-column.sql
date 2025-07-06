-- 12-add-customer-phone-column.sql
-- Adds a customer_phone column to the tickets table (if it isn't there yet).

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(40);

-- Optional: create an index if you frequently search / filter by phone
CREATE INDEX IF NOT EXISTS idx_tickets_customer_phone ON tickets(customer_phone);
