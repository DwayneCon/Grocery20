import React, { createContext, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';

/**
 * Shape of the value exposed by SocketContext.
 */
interface SocketContextValue {
  /** Emit an event to the server. */
  emit: (event: string, data?: unknown) => void;
  /** Subscribe to a server event. Returns an unsubscribe function. */
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
  /** Whether the socket is currently connected. */
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Provides a Socket.IO connection to the component tree.
 *
 * The socket is only established when the user is authenticated (i.e. a JWT
 * token exists in the Redux auth state).  All children can access the socket
 * via the {@link useSocketContext} hook.
 *
 * Place this provider inside the Redux `<Provider>` so that the underlying
 * `useSocket` hook can read the auth token from the store.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { emit, on, isConnected } = useSocket();

  return (
    <SocketContext.Provider value={{ emit, on, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Consume the socket context.  Must be used inside a `<SocketProvider>`.
 *
 * @example
 * ```tsx
 * const { emit, on, isConnected } = useSocketContext();
 *
 * useEffect(() => {
 *   const unsub = on('shopping:item-added', (item) => { ... });
 *   return unsub;
 * }, [on]);
 * ```
 */
export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocketContext must be used within a <SocketProvider>');
  }
  return ctx;
}
