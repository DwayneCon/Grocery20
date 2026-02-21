import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    name: process.env.DB_NAME || 'grocery_planner',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'default-session-secret',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    orgId: process.env.OPENAI_ORG_ID || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    fallbackModel: process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo',
  },

  // Kroger API
  kroger: {
    clientId: process.env.KROGER_CLIENT_ID || '',
    clientSecret: process.env.KROGER_CLIENT_SECRET || '',
    baseUrl: process.env.KROGER_API_BASE_URL || 'https://api.kroger.com/v1',
  },

  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },

  // SMTP
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'nora@grocery20.com',
  },

  // CORS
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'https://grocery.dwaynecon.com'],
  },
};

// Validate required environment variables
export const validateEnv = (): void => {
  const isProduction = config.nodeEnv === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables that must be set
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'DB_PASSWORD',
    'ENCRYPTION_KEY',
  ];

  // Check for missing required variables
  const missing = requiredVars.filter(key => !process.env[key] || process.env[key]?.trim() === '');
  if (missing.length > 0) {
    if (isProduction) {
      errors.push(`Missing required environment variables: ${missing.join(', ')}`);
    } else {
      warnings.push(`Missing environment variables (using defaults): ${missing.join(', ')}`);
    }
  }

  // Weak/default secrets that are security risks
  const weakSecrets = [
    { key: 'JWT_SECRET', weak: ['default-secret-change-in-production', 'secret', 'test'] },
    { key: 'JWT_REFRESH_SECRET', weak: ['default-refresh-secret', 'secret', 'test'] },
    { key: 'SESSION_SECRET', weak: ['default-session-secret', 'secret', 'test'] },
    { key: 'ENCRYPTION_KEY', weak: ['default-encryption-key', 'key', 'test'] },
    { key: 'DB_PASSWORD', weak: ['', 'password', 'admin', 'root', '123456'] },
  ];

  for (const { key, weak } of weakSecrets) {
    const value = process.env[key];
    if (value && weak.includes(value.toLowerCase())) {
      if (isProduction) {
        errors.push(`Weak/default value for ${key}. Must use a strong secret in production.`);
      } else {
        warnings.push(`Weak value for ${key} (acceptable in development).`);
      }
    }
  }

  // Validate secret length (minimum 32 characters in production)
  const secretVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY'];
  for (const key of secretVars) {
    const value = process.env[key];
    if (value && value.length < 32) {
      if (isProduction) {
        errors.push(`${key} must be at least 32 characters long in production (current: ${value.length}).`);
      } else {
        warnings.push(`${key} is shorter than recommended 32 characters (current: ${value.length}).`);
      }
    }
  }

  // Check for OpenAI API key in production
  if (isProduction && !process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required for AI features in production.');
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('\nEnvironment Configuration Warnings:');
    warnings.forEach(warning => logger.warn(`   - ${warning}`));
    logger.warn('');
  }

  // Throw errors in production to prevent startup
  if (errors.length > 0) {
    logger.error('\nEnvironment Configuration Errors:');
    errors.forEach(error => logger.error(`   - ${error}`));
    logger.error('\nProduction deployment requires all secrets to be set and strong.');
    logger.error('   Please update your .env file or environment variables.\n');

    if (isProduction) {
      throw new Error('Invalid environment configuration. Server cannot start in production with weak/missing secrets.');
    }
  }

  // Success message
  if (isProduction && errors.length === 0) {
    logger.info('Environment configuration validated successfully.');
  }
};

export default config;
