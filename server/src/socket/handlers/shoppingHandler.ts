import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger.js';

/**
 * Payload shapes for shopping-list related socket events.
 */
interface ItemToggledPayload {
  itemId: string;
  itemName: string;
  checked: boolean;
  userName: string;
}

interface ItemAddedPayload {
  itemId: string;
  itemName: string;
  quantity?: number;
  unit?: string;
  userName: string;
}

interface ItemRemovedPayload {
  itemId: string;
  itemName: string;
  userName: string;
}

/**
 * Register shopping-list event handlers on the given socket.
 *
 * All events are broadcast to the household room for real-time sync
 * between household members viewing the same shopping list.
 */
export function setupShoppingHandlers(_io: Server, socket: Socket): void {
  const householdId: string | undefined = socket.data.householdId;

  function broadcastToHousehold(event: string, data: unknown): void {
    if (!householdId) return;
    socket.to(`household:${householdId}`).emit(event, data);
  }

  // -------------------------------------------------------------------
  // shopping:item-toggled -- an item was checked/unchecked
  // -------------------------------------------------------------------
  socket.on('shopping:item-toggled', (payload: ItemToggledPayload) => {
    logger.debug(`Shopping item toggled: ${payload.itemName} -> ${payload.checked}`, {
      metadata: { itemId: payload.itemId, householdId },
    });

    broadcastToHousehold('shopping:item-toggled', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    broadcastToHousehold('activity:new', {
      type: 'shopping_item_toggled',
      userName: payload.userName,
      description: `${payload.userName} ${payload.checked ? 'checked off' : 'unchecked'} "${payload.itemName}"`,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------------
  // shopping:item-added -- a new item was added to the list
  // -------------------------------------------------------------------
  socket.on('shopping:item-added', (payload: ItemAddedPayload) => {
    logger.info(`Shopping item added: ${payload.itemName} by ${payload.userName}`, {
      metadata: { itemId: payload.itemId, householdId },
    });

    broadcastToHousehold('shopping:item-added', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    broadcastToHousehold('activity:new', {
      type: 'shopping_item_added',
      userName: payload.userName,
      description: `${payload.userName} added "${payload.itemName}" to the shopping list`,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------------
  // shopping:item-removed -- an item was removed from the list
  // -------------------------------------------------------------------
  socket.on('shopping:item-removed', (payload: ItemRemovedPayload) => {
    logger.info(`Shopping item removed: ${payload.itemName} by ${payload.userName}`, {
      metadata: { itemId: payload.itemId, householdId },
    });

    broadcastToHousehold('shopping:item-removed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    broadcastToHousehold('activity:new', {
      type: 'shopping_item_removed',
      userName: payload.userName,
      description: `${payload.userName} removed "${payload.itemName}" from the shopping list`,
      timestamp: new Date().toISOString(),
    });
  });
}
