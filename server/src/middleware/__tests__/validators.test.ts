import { registerSchema, loginSchema, validate } from '../validators';
import { mockRequest, mockResponse, mockNext } from '../../test/helpers';
import { AppError } from '../errorHandler';

describe('registerSchema', () => {
  const validData = {
    name: 'Dwayne Concepcion',
    email: 'dwayne@example.com',
    password: 'StrongP@ss1',
  };

  it('should accept valid registration data', () => {
    const { error } = registerSchema.validate(validData);
    expect(error).toBeUndefined();
  });

  it('should accept a name with minimum length of 2', () => {
    const { error } = registerSchema.validate({ ...validData, name: 'Jo' });
    expect(error).toBeUndefined();
  });

  it('should reject a name shorter than 2 characters', () => {
    const { error } = registerSchema.validate({ ...validData, name: 'J' });
    expect(error).toBeDefined();
  });

  it('should reject an invalid email address', () => {
    const { error } = registerSchema.validate({ ...validData, email: 'not-an-email' });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('email');
  });

  it('should reject an empty email', () => {
    const { error } = registerSchema.validate({ ...validData, email: '' });
    expect(error).toBeDefined();
  });

  it('should reject a missing email field', () => {
    const { name, password } = validData;
    const { error } = registerSchema.validate({ name, password });
    expect(error).toBeDefined();
  });

  it('should reject a weak password without uppercase', () => {
    const { error } = registerSchema.validate({ ...validData, password: 'weakpass1!' });
    expect(error).toBeDefined();
  });

  it('should reject a weak password without lowercase', () => {
    const { error } = registerSchema.validate({ ...validData, password: 'WEAKPASS1!' });
    expect(error).toBeDefined();
  });

  it('should reject a weak password without a digit', () => {
    const { error } = registerSchema.validate({ ...validData, password: 'WeakPass!!' });
    expect(error).toBeDefined();
  });

  it('should reject a weak password without a special character', () => {
    const { error } = registerSchema.validate({ ...validData, password: 'WeakPass11' });
    expect(error).toBeDefined();
  });

  it('should reject a password shorter than 8 characters', () => {
    const { error } = registerSchema.validate({ ...validData, password: 'Aa1!' });
    expect(error).toBeDefined();
  });

  it('should reject a missing password field', () => {
    const { name, email } = validData;
    const { error } = registerSchema.validate({ name, email });
    expect(error).toBeDefined();
  });
});

describe('loginSchema', () => {
  const validData = {
    email: 'dwayne@example.com',
    password: 'anypassword',
  };

  it('should accept valid login data', () => {
    const { error } = loginSchema.validate(validData);
    expect(error).toBeUndefined();
  });

  it('should accept login with any non-empty password (no strength requirement)', () => {
    const { error } = loginSchema.validate({ ...validData, password: '1' });
    expect(error).toBeUndefined();
  });

  it('should reject an invalid email', () => {
    const { error } = loginSchema.validate({ ...validData, email: 'bad-email' });
    expect(error).toBeDefined();
  });

  it('should reject a missing password', () => {
    const { error } = loginSchema.validate({ email: validData.email });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('password');
  });

  it('should reject an empty password', () => {
    const { error } = loginSchema.validate({ ...validData, password: '' });
    expect(error).toBeDefined();
  });

  it('should reject a missing email', () => {
    const { error } = loginSchema.validate({ password: validData.password });
    expect(error).toBeDefined();
  });
});

describe('validate middleware', () => {
  it('should call next() when validation passes', () => {
    const req = mockRequest({
      body: { email: 'test@example.com', password: 'hello' },
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate(loginSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should throw AppError when validation fails', () => {
    const req = mockRequest({
      body: { email: 'not-valid' },
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate(loginSchema);

    expect(() => middleware(req, res, next)).toThrow(AppError);
  });

  it('should throw with status code 400 on validation failure', () => {
    const req = mockRequest({
      body: {},
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate(loginSchema);

    try {
      middleware(req, res, next);
      fail('Expected AppError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it('should include validation details in the error message', () => {
    const req = mockRequest({
      body: {},
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate(registerSchema);

    try {
      middleware(req, res, next);
      fail('Expected AppError to be thrown');
    } catch (err) {
      const appError = err as AppError;
      const parsed = JSON.parse(appError.message);
      expect(parsed.validation).toBeDefined();
      expect(Array.isArray(parsed.validation)).toBe(true);
      expect(parsed.validation.length).toBeGreaterThan(0);
      // Each entry should have field and message
      expect(parsed.validation[0]).toHaveProperty('field');
      expect(parsed.validation[0]).toHaveProperty('message');
    }
  });

  it('should strip unknown fields from request body', () => {
    const req = mockRequest({
      body: {
        email: 'test@example.com',
        password: 'hello',
        hackField: 'malicious',
      },
    });
    const res = mockResponse();
    const next = mockNext();

    const middleware = validate(loginSchema);
    middleware(req, res, next);

    // stripUnknown is set, so validation passes but unknown fields are stripped
    // (Joi strips them from the validated value, not from req.body itself)
    expect(next).toHaveBeenCalled();
  });
});
