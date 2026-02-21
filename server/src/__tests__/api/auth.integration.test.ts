import request from 'supertest';
import app from '../../index.js';
import {
  resetTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
  seedTestUser,
} from '../../test/testDb.js';

const validUser = {
  name: 'Auth Tester',
  email: 'authtest@example.com',
  password: 'Test123!@',
};

describe('Auth API integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  // ---- Registration ----

  describe('POST /api/auth/register', () => {
    it('creates a new user and returns an access token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.name).toBe(validUser.name);
      // password hash should never be returned
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('rejects duplicate email registration', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
    });

    it('rejects weak passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'weak@example.com', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ---- Login ----

  describe('POST /api/auth/login', () => {
    it('authenticates with valid credentials and returns tokens', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('returns 401 for invalid password', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword1!' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'Test123!@' });

      expect(res.status).toBe(401);
    });
  });

  // ---- Current user ----

  describe('GET /api/auth/me', () => {
    it('returns user profile with valid token', async () => {
      const { token, email } = await seedTestUser({
        email: 'me@example.com',
        name: 'Me User',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(email);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('returns 403 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.status).toBe(403);
    });
  });

  // ---- Refresh token ----

  describe('POST /api/auth/refresh', () => {
    it('issues a new access token from a valid refresh token', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });
  });

  // ---- Logout ----

  describe('POST /api/auth/logout', () => {
    it('logs out successfully with valid token', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ refreshToken: loginRes.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logout');
    });
  });
});
