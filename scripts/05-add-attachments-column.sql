-- Add attachments column to ticket_comments table
ALTER TABLE ticket_comments 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_comments_attachments ON ticket_comments USING GIN (attachments);
