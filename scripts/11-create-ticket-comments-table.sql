-- Create ticket_comments table if it doesn't exist
-- This table is referenced in the code but might not exist in all environments

CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES admins(id),
  comment TEXT,
  is_internal BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  customer_name VARCHAR(100),
  customer_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_admin_id ON ticket_comments(admin_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);

-- Add resolved_at column to tickets table if it doesn't exist
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
