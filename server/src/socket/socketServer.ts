import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { setupMealPlanHandlers } from './handlers/mealPlanHandler.js';
import { setupShoppingHandlers } from './handlers/shoppingHandler.js';
import { setupActivityHandlers } from './handlers/activityHandler.js';

/**
 * Socket.IO server factory.
 *
 * Creates and configures a Socket.IO server with:
 * - JWT authentication middleware
 * - Automatic household room joining
 * - Meal plan, shopping list, and activity event handlers
 */
export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.allowedOrigins,
      credentials: true,
    },
    // Ping every 25 seconds, timeout after 20 seconds of no pong
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ----------------------------------------------------------------
  // Authentication middleware -- verify JWT on every new connection
  // ----------------------------------------------------------------
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        householdId?: string;
        [key: string]: unknown;
      };

      socket.data.userId = decoded.userId;
      socket.data.householdId = decoded.householdId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ----------------------------------------------------------------
  // Connection handler
  // ----------------------------------------------------------------
  io.on('connection', (socket: Socket) => {
    const { userId, householdId } = socket.data;

    logger.info(`Socket connected: ${socket.id} (user: ${userId}, household: ${householdId})`);

    // Auto-join the household room so all members receive broadcasts
    if (householdId) {
      socket.join(`household:${householdId}`);
    }

    // Register domain-specific event handlers
    setupMealPlanHandlers(io, socket);
    setupShoppingHandlers(io, socket);
    setupActivityHandlers(io, socket);

    // Handle graceful disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    });

    // Handle errors on the socket itself
    socket.on('error', (err) => {
      logger.error(`Socket error on ${socket.id}`, err);
    });
  });

  return io;
}
