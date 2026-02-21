import { Request, Response, NextFunction } from 'express';

/**
 * Create a mock Express Request object with optional overrides.
 */
export function mockRequest(overrides: Partial<Request> = {}): Request {
  const req: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {},
    get: jest.fn(),
    ...overrides,
  };
  return req as Request;
}

/**
 * Create a mock Express Response object with chainable methods.
 */
export function mockResponse(): Response {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

/**
 * Create a mock Express NextFunction.
 */
export function mockNext(): NextFunction {
  return jest.fn() as NextFunction;
}
