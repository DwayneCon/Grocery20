// Test environment setup - runs before each test suite
// Sets critical environment variables that must be present before any
// module-level code (e.g. config/env.ts, index.ts) evaluates.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-long-enough';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'grocery_planner_test';
process.env.SESSION_SECRET = 'test-session-secret-long-enough-here';
process.env.ENCRYPTION_KEY = 'test-encryption-key-long-enough-here';
// Disable Sentry in tests
process.env.SENTRY_DSN = '';
