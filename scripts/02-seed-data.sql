-- Seed initial data

-- Insert categories
INSERT INTO categories (name, description, color) VALUES
('Technical Support', 'Hardware and software technical issues', '#EF4444'),
('Billing', 'Payment and billing related inquiries', '#10B981'),
('General Inquiry', 'General questions and information requests', '#3B82F6'),
('Bug Report', 'Software bugs and issues', '#F59E0B'),
('Feature Request', 'New feature suggestions and requests', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- Insert sample admin users (password is 'admin123' hashed)
INSERT INTO admins (email, password_hash, name, category_id) VALUES
('tech@company.com', '$2b$10$rQZ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Tech Support Admin', 1),
('billing@company.com', '$2b$10$rQZ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Billing Admin', 2),
('general@company.com', '$2b$10$rQZ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'General Admin', 3),
('bugs@company.com', '$2b$10$rQZ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Bug Report Admin', 4),
('features@company.com', '$2b$10$rQZ8kHWiZ8WqhvQvQvQvQeJ8kHWiZ8Wqhv', 'Feature Admin', 5)
ON CONFLICT (email) DO NOTHING;

-- Insert sample tickets
INSERT INTO tickets (title, description, customer_name, customer_email, customer_phone, category_id, status, priority) VALUES
('Cannot login to account', 'I am unable to access my account after password reset', 'John Doe', 'john@example.com', '+1234567890', 1, 'open', 'high'),
('Billing discrepancy', 'My last invoice shows incorrect charges', 'Jane Smith', 'jane@example.com', '+1234567891', 2, 'open', 'medium'),
('How to use new feature', 'Need help understanding the new dashboard feature', 'Bob Johnson', 'bob@example.com', '+1234567892', 3, 'open', 'low'),
('App crashes on startup', 'Mobile app crashes immediately after opening', 'Alice Brown', 'alice@example.com', '+1234567893', 4, 'in_progress', 'high'),
('Dark mode request', 'Please add dark mode to the application', 'Charlie Wilson', 'charlie@example.com', '+1234567894', 5, 'open', 'low');
