-- Create categories table with default data
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(32) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
('Technical Support', 'Technical issues and troubleshooting', '#3B82F6'),
('Billing', 'Billing and payment related inquiries', '#10B981'),
('General', 'General questions and support', '#6B7280'),
('Feature Request', 'Requests for new features or improvements', '#8B5CF6'),
('Bug Report', 'Report bugs and issues with the product', '#EF4444')
ON CONFLICT DO NOTHING;
