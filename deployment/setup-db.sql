-- Production Database Setup Script
-- This creates the production database on the same PostgreSQL instance

-- Create production database
CREATE DATABASE spwms_production;

-- Optional: Create dedicated user for production (recommended for actual deployment)
-- CREATE USER spwms_prod WITH ENCRYPTED PASSWORD 'your-secure-password';
-- GRANT ALL PRIVILEGES ON DATABASE spwms_production TO spwms_prod;

-- Connect to the new database and verify
\c spwms_production
SELECT 'Production database created successfully!' AS status;
