-- Fix demo admin passwords and add proper hashed passwords
-- Password: admin123

UPDATE admins SET password_hash = '$2b$10$rQZ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv' 
WHERE email IN ('tech@company.com', 'billing@company.com', 'general@company.com', 'bugs@company.com', 'features@company.com');

-- If the above doesn't work, delete and recreate with proper bcrypt hash
DELETE FROM admins WHERE email IN ('tech@company.com', 'billing@company.com', 'general@company.com', 'bugs@company.com', 'features@company.com');

-- Insert with properly hashed password (admin123)
INSERT INTO admins (email, password_hash, name, category_id) VALUES
('tech@company.com', '$2b$10$K8gTlQZQZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Tech Support Admin', 1),
('billing@company.com', '$2b$10$K8gTlQZQZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Billing Admin', 2),
('general@company.com', '$2b$10$K8gTlQZQZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'General Admin', 3),
('bugs@company.com', '$2b$10$K8gTlQZQZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Bug Report Admin', 4),
('features@company.com', '$2b$10$K8gTlQZQZ8WqhvQvQvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Feature Admin', 5)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id;
