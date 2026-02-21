import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/test/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'json', 'html'],
  setupFiles: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config;
