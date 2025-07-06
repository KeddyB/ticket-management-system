-- Add category_id column to admins table
-- This allows admins to be associated with specific ticket categories

ALTER TABLE admins ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Add foreign key constraint to categories table
ALTER TABLE admins ADD CONSTRAINT IF NOT EXISTS fk_admin_category 
  FOREIGN KEY (category_id) REFERENCES categories(id);

-- Set category_id to NULL for existing admins (they can manage all categories)
UPDATE admins SET category_id = NULL WHERE category_id IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admins' AND column_name = 'category_id';
