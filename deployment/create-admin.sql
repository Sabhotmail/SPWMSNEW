-- Create Admin User Script
-- Password: admin123 (bcrypt hashed)

INSERT INTO "users" (
  "id", 
  "userId", 
  "userName", 
  "password", 
  "role", 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  1,
  'admin',
  'Administrator',
  '$2a$10$rOzJQjH5L8F5kVXZhqQGHuYj8VxQX5YxqW0nQJZ8vH9nQjH5L8F5k',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
