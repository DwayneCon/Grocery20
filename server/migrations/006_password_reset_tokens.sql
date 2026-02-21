-- Migration: Add password reset tokens table
-- Date: 2025-11-26
-- Description: Creates password_reset_tokens table for forgot password functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(36) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for efficient cleanup of expired tokens
CREATE EVENT IF NOT EXISTS cleanup_expired_reset_tokens
ON SCHEDULE EVERY 1 HOUR
DO
  DELETE FROM password_reset_tokens WHERE expires_at < NOW();
