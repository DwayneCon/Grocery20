import { Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { RowDataPacket } from 'mysql2';
import emailService from '../../services/emailService.js';
import { logger } from '../../utils/logger.js';

interface User extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  household_id?: string;
  created_at: Date;
}

// Register new user
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUsers = await query<User[]>(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingUsers.length > 0) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const userId = uuidv4();
  await query(
    'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
    [userId, name, email, passwordHash]
  );

  // Generate tokens
  const accessToken = generateAccessToken({ id: userId, email });
  const refreshTokenValue = generateRefreshToken({ id: userId });

  // Store refresh token
  await query(
    'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
    [userId, refreshTokenValue]
  );

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: userId,
      name,
      email,
    },
    accessToken,
    refreshToken: refreshTokenValue,
  });
});

// Login user
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Find user
  const users = await query<User[]>(
    'SELECT id, name, email, password_hash, household_id FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = users[0];

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    householdId: user.household_id,
  });
  const refreshTokenValue = generateRefreshToken({ id: user.id });

  // Store refresh token
  await query(
    'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
    [user.id, refreshTokenValue]
  );

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      householdId: user.household_id,
    },
    accessToken,
    refreshToken: refreshTokenValue,
  });
});

// Refresh access token (with refresh token rotation)
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  // Verify refresh token exists in database
  const tokens = await query<RowDataPacket[]>(
    'SELECT user_id FROM refresh_tokens WHERE token = ?',
    [refreshToken]
  );

  if (tokens.length === 0) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Verify and decode token
  const decoded = verifyRefreshToken(refreshToken);

  // Get user data
  const users = await query<User[]>(
    'SELECT id, email, household_id FROM users WHERE id = ?',
    [decoded.id]
  );

  if (users.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = users[0];

  // REFRESH TOKEN ROTATION: Delete old refresh token
  await query(
    'DELETE FROM refresh_tokens WHERE token = ?',
    [refreshToken]
  );

  // Generate new access token
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    householdId: user.household_id,
  });

  // REFRESH TOKEN ROTATION: Generate new refresh token
  const newRefreshToken = generateRefreshToken({ id: user.id });

  // Store new refresh token in database
  await query(
    'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
    [user.id, newRefreshToken]
  );

  // Return both new tokens
  res.json({
    accessToken,
    refreshToken: newRefreshToken,
  });
});

// Logout user
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove refresh token from database
    await query(
      'DELETE FROM refresh_tokens WHERE token = ?',
      [refreshToken]
    );
  }

  res.json({
    message: 'Logout successful',
  });
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const users = await query<User[]>(
    'SELECT id, name, email, household_id, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (users.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({
    user: users[0],
  });
});

// Forgot password - Request reset token
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  // Find user by email
  const users = await query<User[]>(
    'SELECT id, name, email FROM users WHERE email = ?',
    [email]
  );

  // Always return success to prevent email enumeration attacks
  if (users.length === 0) {
    res.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
    return;
  }

  const user = users[0];

  // Generate reset token (expires in 1 hour)
  const resetToken = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Store reset token in database
  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?',
    [user.id, resetToken, expiresAt, resetToken, expiresAt]
  );

  // Send password reset email (non-blocking -- don't let email failure affect response)
  try {
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (emailError) {
    logger.error('Failed to send password reset email:', emailError);
  }

  res.json({
    message: 'If an account exists with that email, a password reset link has been sent.',
  });
});

// Reset password with token
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }

  // Find valid reset token
  const tokens = await query<RowDataPacket[]>(
    'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
    [token]
  );

  if (tokens.length === 0) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const userId = tokens[0].user_id;

  // Hash new password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update user password
  await query(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, userId]
  );

  // Delete used reset token
  await query(
    'DELETE FROM password_reset_tokens WHERE token = ?',
    [token]
  );

  // Invalidate all refresh tokens for this user (for security)
  await query(
    'DELETE FROM refresh_tokens WHERE user_id = ?',
    [userId]
  );

  res.json({
    message: 'Password reset successful. Please login with your new password.',
  });
});
