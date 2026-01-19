-- สร้างข้อมูล Warehouses (คลังสินค้า)
-- แต่ละคลังแยกข้อมูลของตัวเอง

INSERT INTO warehouses (id, wh_code, wh_name, branch_code, status, created_at, updated_at) VALUES
(1, 'WH01', 'คลังสินค้าหลัก', 'HQ', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'WH02', 'คลังสินค้ารอง', 'HQ', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '42G1', 'คลัง 42G1', '001', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Admin User สามารถเข้าถึงทุก warehouse
-- branch_code เป็นแค่ข้อมูลเสริม (ไม่ได้จำกัดการเข้าถึง warehouse)

SELECT 'Warehouses created successfully!' AS status;
SELECT * FROM warehouses;
