-- Add more sample tickets for testing
INSERT INTO tickets (title, description, status, priority, category_id, customer_name, customer_email, assigned_admin_id) VALUES
('Password reset not working', 'I clicked the password reset link but it says the link is invalid or expired.', 'open', 'medium', 1, 'Frank Miller', 'frank@example.com', NULL),
('Refund request', 'I would like to request a refund for my recent purchase. Order #12345.', 'in_progress', 'high', 2, 'Grace Lee', 'grace@example.com', 2),
('Mobile app crashes', 'The mobile app keeps crashing when I try to upload photos.', 'open', 'urgent', 5, 'Henry Davis', 'henry@example.com', 1),
('Account deletion request', 'I want to delete my account and all associated data.', 'open', 'low', 3, 'Ivy Chen', 'ivy@example.com', NULL),
('Integration with third-party service', 'Can you add integration with Slack for notifications?', 'open', 'low', 4, 'Jack Wilson', 'jack@example.com', NULL),
('Data export issue', 'The CSV export is missing some columns that were there before.', 'resolved', 'medium', 5, 'Kate Brown', 'kate@example.com', 3),
('Subscription upgrade', 'I want to upgrade to the premium plan. How do I do this?', 'in_progress', 'medium', 2, 'Liam Johnson', 'liam@example.com', 2),
('API documentation unclear', 'The API documentation for the /users endpoint is confusing.', 'open', 'low', 3, 'Mia Taylor', 'mia@example.com', NULL),
('Performance issues', 'The dashboard is loading very slowly, especially the reports section.', 'open', 'high', 1, 'Noah Anderson', 'noah@example.com', 1),
('Feature suggestion: Bulk actions', 'It would be great to have bulk actions for managing multiple items at once.', 'open', 'medium', 4, 'Olivia Martinez', 'olivia@example.com', NULL)
ON CONFLICT DO NOTHING;

-- Add some comments to existing tickets
INSERT INTO comments (ticket_id, admin_id, comment) VALUES
(5, 1, 'Hi Eve, you can export your data by going to Settings > Data Export. Let me know if you need help with specific formats.'),
(6, 1, 'Hi Frank, I can see the issue with the password reset. Our team is working on a fix. In the meantime, I can manually reset your password.'),
(7, 2, 'Hi Grace, I have processed your refund request. The refund of $99.99 will appear in your account within 5-7 business days.'),
(8, 1, 'Hi Henry, we are aware of this issue with photo uploads on iOS devices. Our development team is working on a fix for the next app update.')
ON CONFLICT DO NOTHING;
