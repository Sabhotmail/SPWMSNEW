-- สร้างข้อมูลสาขาเริ่มต้น
INSERT INTO branches (id, branch_code, branch_name, status, created_at, updated_at) VALUES
(1, 'HQ', 'สำนักงานใหญ่', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '001', 'สาขา 1', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '002', 'สาขา 2', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- สร้าง Admin User (ไม่จำกัดสาขา)
-- Password: admin123
INSERT INTO users (
  id,
  user_id,
  username,
  password,
  email,
  role,
  branch_code,
  status,
  password_date,
  created_at,
  updated_at
) VALUES (
  1,
  'admin',
  'Administrator',
  '$2a$10$rO5J8vH9nQjH5L8F5kVXZhqQGHuYj8VxQX5YxqW0nQJZ8vH9nQjH5',
  'admin@spwms.com',
  1,  -- ADMIN role
  'ALL',  -- เข้าถึงได้ทุกสาขา
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ตัวอย่าง User ที่สังกัดสาขา
INSERT INTO users (
  id,
  user_id,
  username,
  password,
  email,
  role,
  branch_code,
  status,
  password_date,
  created_at,
  updated_at
) VALUES (
  2,
  'user001',
  'User สาขา 1',
  '$2a$10$rO5J8vH9nQjH5L8F5kVXZhqQGHuYj8VxQX5YxqW0nQJZ8vH9nQjH5',
  'user001@spwms.com',
  3,  -- USER role
  '001',  -- สังกัดสาขา 001
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
