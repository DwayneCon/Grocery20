-- 021_add_household_zipcode.sql
-- Add zip_code column for store location lookups

ALTER TABLE households ADD COLUMN zip_code VARCHAR(10) DEFAULT NULL;
ALTER TABLE households ADD COLUMN preferred_store_location VARCHAR(36) DEFAULT NULL;
