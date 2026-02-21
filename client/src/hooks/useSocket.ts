import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '../features/store';
import { logger } from '../utils/logger';

/**
 * Custom hook that manages a Socket.IO connection authenticated with the
 * current user's JWT.  The socket connects automatically when a token is
 * present in Redux state, and disconnects when the token is cleared (logout)
 * or when the component unmounts.
 *
 * Returns helpers to emit events, subscribe to events, and check connection
 * status -- all stable across re-renders thanks to useCallback / useRef.
 */
export function useSocket() {
  const token = useSelector((state: RootState) => state.auth.token);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect when the user is authenticated
    if (!token) {
      return;
    }

    const socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      logger.warn('[useSocket] connection error', { message: err.message });
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  /**
   * Emit an event to the server.  No-op if the socket is not connected.
   */
  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  /**
   * Subscribe to a server event.  Returns an unsubscribe function that should
   * be called in a useEffect cleanup or when the listener is no longer needed.
   */
  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.on(event, handler);
      return () => {
        socketRef.current?.off(event, handler);
      };
    },
    [],
  );

  return { emit, on, isConnected, socket: socketRef.current };
}
