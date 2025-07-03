-- Add more sample tickets to ensure we have tickets for each category

INSERT INTO tickets (title, description, customer_name, customer_email, customer_phone, category_id, status, priority) VALUES
-- Technical Support tickets (category_id = 1)
('Website not loading', 'The main website is not loading properly on Chrome browser', 'Sarah Johnson', 'sarah@example.com', '+1234567895', 1, 'open', 'high'),
('Password reset not working', 'I cannot reset my password using the forgot password link', 'Mike Davis', 'mike@example.com', '+1234567896', 1, 'open', 'medium'),
('Mobile app crashing', 'The mobile app crashes when I try to upload photos', 'Lisa Chen', 'lisa@example.com', '+1234567897', 1, 'in_progress', 'high'),

-- Billing tickets (category_id = 2)
('Double charged this month', 'I was charged twice for my subscription this month', 'Robert Wilson', 'robert@example.com', '+1234567898', 2, 'open', 'high'),
('Cannot update payment method', 'The payment method update form is not working', 'Emma Thompson', 'emma@example.com', '+1234567899', 2, 'open', 'medium'),
('Refund request', 'I need a refund for the accidental purchase last week', 'David Brown', 'david@example.com', '+1234567800', 2, 'open', 'low'),

-- General Inquiry tickets (category_id = 3)
('How to export data', 'I need help exporting my data from the platform', 'Jennifer Lee', 'jennifer@example.com', '+1234567801', 3, 'open', 'low'),
('Account upgrade question', 'What are the benefits of upgrading to premium?', 'Thomas Anderson', 'thomas@example.com', '+1234567802', 3, 'open', 'low'),
('Integration with third party', 'Can your platform integrate with Salesforce?', 'Maria Garcia', 'maria@example.com', '+1234567803', 3, 'open', 'medium'),

-- Bug Report tickets (category_id = 4)
('Search function broken', 'The search function returns no results even for valid queries', 'Kevin Park', 'kevin@example.com', '+1234567804', 4, 'open', 'high'),
('Dashboard charts not loading', 'The charts on the dashboard are showing as blank', 'Amanda White', 'amanda@example.com', '+1234567805', 4, 'in_progress', 'medium'),
('Export CSV corrupted', 'The exported CSV files contain corrupted data', 'Steven Miller', 'steven@example.com', '+1234567806', 4, 'open', 'high'),

-- Feature Request tickets (category_id = 5)
('Add two-factor authentication', 'Please add 2FA support for better security', 'Rachel Green', 'rachel@example.com', '+1234567807', 5, 'open', 'medium'),
('Bulk operations support', 'Need ability to perform bulk operations on multiple items', 'Daniel Kim', 'daniel@example.com', '+1234567808', 5, 'open', 'low'),
('Mobile notifications', 'Add push notifications to the mobile app', 'Sophie Turner', 'sophie@example.com', '+1234567809', 5, 'open', 'medium');
