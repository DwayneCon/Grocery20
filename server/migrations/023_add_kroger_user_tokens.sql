-- 023_add_kroger_user_tokens.sql
-- Store per-user Kroger OAuth tokens for cart operations

ALTER TABLE users ADD COLUMN kroger_access_token TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN kroger_refresh_token TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN kroger_token_expires_at TIMESTAMP DEFAULT NULL;
ALTER TABLE users ADD COLUMN kroger_location_id VARCHAR(36) DEFAULT NULL;
