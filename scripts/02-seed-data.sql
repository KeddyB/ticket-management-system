-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Technical Support', 'Technical issues and troubleshooting'),
('Billing', 'Billing and payment related inquiries'),
('General', 'General questions and support'),
('Feature Request', 'Requests for new features or improvements'),
('Bug Report', 'Report bugs and issues with the product')
ON CONFLICT DO NOTHING;

-- Insert sample admin users (password is 'admin123' hashed with bcrypt)
INSERT INTO admins (name, email, password_hash, role) VALUES
('John Smith', 'john@company.com', '$2a$10$rOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQ', 'admin'),
('Sarah Johnson', 'sarah@company.com', '$2a$10$rOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQ', 'admin'),
('Mike Wilson', 'mike@company.com', '$2a$10$rOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQ', 'admin'),
('Tech Support', 'tech@company.com', '$2a$10$rOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQXQqQXQqOzJqQXQqQXQqQ', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tickets
INSERT INTO tickets (title, description, status, priority, category_id, customer_name, customer_email, assigned_admin_id) VALUES
('Cannot login to my account', 'I am unable to login to my account. I keep getting an error message saying invalid credentials.', 'open', 'high', 1, 'Alice Cooper', 'alice@example.com', 1),
('Billing question about my subscription', 'I was charged twice this month and need clarification on my billing.', 'in_progress', 'medium', 2, 'Bob Johnson', 'bob@example.com', 2),
('Feature request: Dark mode', 'Would love to see a dark mode option in the application.', 'open', 'low', 4, 'Charlie Brown', 'charlie@example.com', NULL),
('Bug: Page not loading', 'The dashboard page is not loading properly. It shows a blank screen.', 'resolved', 'urgent', 5, 'Diana Prince', 'diana@example.com', 3),
('How to export data?', 'I need help understanding how to export my data from the platform.', 'open', 'medium', 3, 'Eve Adams', 'eve@example.com', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample comments
INSERT INTO comments (ticket_id, admin_id, comment) VALUES
(1, 1, 'Hi Alice, I can help you with this login issue. Can you please try clearing your browser cache and cookies?'),
(2, 2, 'Hi Bob, I see the duplicate charge on your account. I have initiated a refund for the extra charge. You should see it in 3-5 business days.'),
(4, 3, 'Hi Diana, this issue has been fixed in our latest update. Please refresh your browser and try again.')
ON CONFLICT DO NOTHING;
