import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger.js';

/**
 * Shape of an activity entry stored in the in-memory log.
 */
export interface ActivityEntry {
  type: string;
  userName: string;
  description: string;
  timestamp: string;
}

/**
 * Maximum number of activity entries kept per household.
 */
const MAX_ACTIVITY_ENTRIES = 50;

/**
 * In-memory activity log keyed by householdId.
 *
 * NOTE: This is intentionally kept in memory for low-latency reads.
 * Activity data is ephemeral and non-critical -- if the server restarts
 * the log resets. For persistence, entries should also be written to the
 * database via a separate service.
 */
const activityLogs = new Map<string, ActivityEntry[]>();

/**
 * Push an activity entry into the household's in-memory log,
 * capping the list at MAX_ACTIVITY_ENTRIES.
 */
export function pushActivity(householdId: string, entry: ActivityEntry): void {
  let log = activityLogs.get(householdId);
  if (!log) {
    log = [];
    activityLogs.set(householdId, log);
  }

  log.unshift(entry); // newest first

  if (log.length > MAX_ACTIVITY_ENTRIES) {
    log.length = MAX_ACTIVITY_ENTRIES; // trim oldest
  }
}

/**
 * Retrieve the recent activity log for a household.
 */
export function getRecentActivity(householdId: string): ActivityEntry[] {
  return activityLogs.get(householdId) ?? [];
}

/**
 * Register activity-feed event handlers on the given socket.
 *
 * Listens on:
 * - `activity:new`        -- record a new activity and broadcast it
 * - `activity:get-recent` -- return the last 50 activity entries for the household
 */
export function setupActivityHandlers(io: Server, socket: Socket): void {
  const householdId: string | undefined = socket.data.householdId;

  // -------------------------------------------------------------------
  // activity:new -- record an activity entry and broadcast
  // -------------------------------------------------------------------
  socket.on('activity:new', (entry: ActivityEntry) => {
    if (!householdId) return;

    const enrichedEntry: ActivityEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    pushActivity(householdId, enrichedEntry);

    logger.debug(`Activity recorded for household ${householdId}: ${enrichedEntry.description}`);

    // Broadcast to every member in the household room (including sender)
    io.to(`household:${householdId}`).emit('activity:new', enrichedEntry);
  });

  // -------------------------------------------------------------------
  // activity:get-recent -- return the stored activity log
  // -------------------------------------------------------------------
  socket.on('activity:get-recent', (callback?: (entries: ActivityEntry[]) => void) => {
    if (!householdId) {
      if (typeof callback === 'function') callback([]);
      return;
    }

    const entries = getRecentActivity(householdId);

    logger.debug(`Returning ${entries.length} activity entries for household ${householdId}`);

    if (typeof callback === 'function') {
      callback(entries);
    } else {
      // Fallback: emit back to the requesting socket
      socket.emit('activity:recent', entries);
    }
  });
}
