-- Add customer_name and customer_email to ticket_comments
ALTER TABLE ticket_comments
ADD COLUMN IF NOT EXISTS customer_name  VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Helpful index for searching / filtering by customer email
CREATE INDEX IF NOT EXISTS idx_ticket_comments_customer_email
  ON ticket_comments(customer_email);
