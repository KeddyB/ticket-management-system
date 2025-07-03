-- Add customer fields to ticket_comments table for customer messages
ALTER TABLE ticket_comments 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_comments_customer ON ticket_comments(customer_email);
