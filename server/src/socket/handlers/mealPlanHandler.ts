import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger.js';

/**
 * Payload shapes for meal-plan related socket events.
 */
interface MealAcceptedPayload {
  mealId: string;
  mealName: string;
  userName: string;
}

interface MealRejectedPayload {
  mealId: string;
  mealName: string;
  userName: string;
  reason?: string;
}

interface MealModifiedPayload {
  mealId: string;
  mealName: string;
  userName: string;
  changes: string;
}

interface PlanApprovedPayload {
  planId: string;
  userName: string;
  weekStart: string;
}

/**
 * Register meal-plan event handlers on the given socket.
 *
 * All events are broadcast to the household room so every connected
 * household member receives real-time updates.
 */
export function setupMealPlanHandlers(_io: Server, socket: Socket): void {
  const householdId: string | undefined = socket.data.householdId;

  // Helper: emit to the household room (excluding sender)
  function broadcastToHousehold(event: string, data: unknown): void {
    if (!householdId) return;
    socket.to(`household:${householdId}`).emit(event, data);
  }

  // -------------------------------------------------------------------
  // meal:accepted -- a household member accepted a suggested meal
  // -------------------------------------------------------------------
  socket.on('meal:accepted', (payload: MealAcceptedPayload) => {
    logger.info(`Meal accepted: ${payload.mealName} by ${payload.userName}`, {
      metadata: { mealId: payload.mealId, householdId },
    });

    broadcastToHousehold('meal:accepted', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    // Also emit an activity event for the activity feed
    broadcastToHousehold('activity:new', {
      type: 'meal_accepted',
      userName: payload.userName,
      description: `${payload.userName} accepted "${payload.mealName}"`,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------------
  // meal:rejected -- a household member rejected a suggested meal
  // -------------------------------------------------------------------
  socket.on('meal:rejected', (payload: MealRejectedPayload) => {
    logger.info(`Meal rejected: ${payload.mealName} by ${payload.userName}`, {
      metadata: { mealId: payload.mealId, householdId, reason: payload.reason },
    });

    broadcastToHousehold('meal:rejected', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    broadcastToHousehold('activity:new', {
      type: 'meal_rejected',
      userName: payload.userName,
      description: `${payload.userName} rejected "${payload.mealName}"${payload.reason ? `: ${payload.reason}` : ''}`,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------------
  // meal:modified -- a household member modified a meal
  // -------------------------------------------------------------------
  socket.on('meal:modified', (payload: MealModifiedPayload) => {
    logger.info(`Meal modified: ${payload.mealName} by ${payload.userName}`, {
      metadata: { mealId: payload.mealId, householdId, changes: payload.changes },
    });

    broadcastToHousehold('meal:modified', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    broadcastToHousehold('activity:new', {
      type: 'meal_modified',
      userName: payload.userName,
      description: `${payload.userName} modified "${payload.mealName}": ${payload.changes}`,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------------
  // plan:approved -- the meal plan for a week has been approved
  // -------------------------------------------------------------------
  socket.on('plan:approved', (payload: PlanApprovedPayload) => {
    logger.info(`Plan approved by ${payload.userName}`, {
      metadata: { planId: payload.planId, householdId, weekStart: payload.weekStart },
    });

    broadcastToHousehold('plan:approved', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    broadcastToHousehold('activity:new', {
      type: 'plan_approved',
      userName: payload.userName,
      description: `${payload.userName} approved the meal plan for week of ${payload.weekStart}`,
      timestamp: new Date().toISOString(),
    });
  });
}
