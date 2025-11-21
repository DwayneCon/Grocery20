import { Response } from 'express';
import { AuthRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';

/**
 * Add item to household inventory
 * POST /api/inventory
 */
export const addInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId, ingredientId, name, quantity, unit, purchaseDate, expirationDate, location } = req.body;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const membership: any[] = await query(
      'SELECT role FROM household_members WHERE household_id = ? AND user_id = ?',
      [householdId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Create inventory item
    const itemId = uuidv4();
    await query(
      `INSERT INTO inventory_items
       (id, household_id, ingredient_id, name, quantity, unit, purchase_date, expiration_date, location, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        householdId,
        ingredientId || null,
        name,
        quantity,
        unit,
        purchaseDate || null,
        expirationDate || null,
        location || 'Pantry',
        'fresh',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      itemId,
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add inventory item',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get household inventory
 * GET /api/inventory/household/:householdId
 */
export const getHouseholdInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { location, status } = req.query;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const membership: any[] = await query(
      'SELECT role FROM household_members WHERE household_id = ? AND user_id = ?',
      [householdId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Build query with optional filters
    let sql = `
      SELECT
        id,
        ingredient_id as ingredientId,
        name,
        quantity,
        unit,
        purchase_date as purchaseDate,
        expiration_date as expirationDate,
        location,
        status,
        created_at as createdAt,
        updated_at as updatedAt,
        DATEDIFF(expiration_date, CURDATE()) as daysUntilExpiration
      FROM inventory_items
      WHERE household_id = ?
    `;
    const params: any[] = [householdId];

    if (location) {
      sql += ' AND location = ?';
      params.push(location);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY expiration_date ASC, name ASC';

    const items = await query(sql, params);

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error getting household inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get household inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get items expiring soon
 * GET /api/inventory/household/:householdId/expiring-soon
 */
export const getExpiringSoon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { days = 3 } = req.query;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const membership: any[] = await query(
      'SELECT role FROM household_members WHERE household_id = ? AND user_id = ?',
      [householdId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Get items expiring within the specified days
    const items: any[] = await query(
      `SELECT
        id,
        ingredient_id as ingredientId,
        name,
        quantity,
        unit,
        purchase_date as purchaseDate,
        expiration_date as expirationDate,
        location,
        status,
        DATEDIFF(expiration_date, CURDATE()) as daysUntilExpiration
      FROM inventory_items
      WHERE household_id = ?
        AND expiration_date IS NOT NULL
        AND expiration_date >= CURDATE()
        AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND status != 'expired'
      ORDER BY expiration_date ASC`,
      [householdId, Number(days)]
    );

    return res.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error getting expiring items:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get expiring items',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Update inventory item
 * PATCH /api/inventory/:itemId
 */
export const updateInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  const { quantity, unit, expirationDate, location, status } = req.body;
  const userId = req.user!.id;

  try {
    // Verify user has access to this item
    const items: any[] = await query(
      `SELECT ii.household_id
       FROM inventory_items ii
       JOIN household_members hm ON ii.household_id = hm.household_id
       WHERE ii.id = ? AND hm.user_id = ?`,
      [itemId, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or access denied',
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (unit) {
      updates.push('unit = ?');
      params.push(unit);
    }
    if (expirationDate) {
      updates.push('expiration_date = ?');
      params.push(expirationDate);
    }
    if (location) {
      updates.push('location = ?');
      params.push(location);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(itemId);

    await query(
      `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated item
    const updated: any[] = await query(
      `SELECT
        id,
        ingredient_id as ingredientId,
        name,
        quantity,
        unit,
        purchase_date as purchaseDate,
        expiration_date as expirationDate,
        location,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM inventory_items
      WHERE id = ?`,
      [itemId]
    );

    return res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete inventory item
 * DELETE /api/inventory/:itemId
 */
export const deleteInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user has access
    const items: any[] = await query(
      `SELECT ii.household_id
       FROM inventory_items ii
       JOIN household_members hm ON ii.household_id = hm.household_id
       WHERE ii.id = ? AND hm.user_id = ?`,
      [itemId, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or access denied',
      });
    }

    await query('DELETE FROM inventory_items WHERE id = ?', [itemId]);

    return res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get inventory statistics
 * GET /api/inventory/household/:householdId/stats
 */
export const getInventoryStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const membership: any[] = await query(
      'SELECT role FROM household_members WHERE household_id = ? AND user_id = ?',
      [householdId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Get statistics
    const stats: any[] = await query(
      `SELECT
        COUNT(*) as totalItems,
        SUM(CASE WHEN status = 'fresh' THEN 1 ELSE 0 END) as freshItems,
        SUM(CASE WHEN status = 'expiring_soon' THEN 1 ELSE 0 END) as expiringSoon,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expiredItems,
        COUNT(DISTINCT location) as locationCount
      FROM inventory_items
      WHERE household_id = ?`,
      [householdId]
    );

    // Get items by location
    const byLocation: any[] = await query(
      `SELECT
        location,
        COUNT(*) as itemCount,
        SUM(CASE WHEN status = 'fresh' THEN 1 ELSE 0 END) as freshCount,
        SUM(CASE WHEN status = 'expiring_soon' THEN 1 ELSE 0 END) as expiringCount
      FROM inventory_items
      WHERE household_id = ?
      GROUP BY location
      ORDER BY itemCount DESC`,
      [householdId]
    );

    return res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalItems: 0,
          freshItems: 0,
          expiringSoon: 0,
          expiredItems: 0,
          locationCount: 0,
        },
        byLocation,
      },
    });
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get inventory statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Mark expired items automatically
 * POST /api/inventory/household/:householdId/mark-expired
 */
export const markExpiredItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const membership: any[] = await query(
      'SELECT role FROM household_members WHERE household_id = ? AND user_id = ?',
      [householdId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Mark items as expired
    const result: any = await query(
      `UPDATE inventory_items
       SET status = 'expired'
       WHERE household_id = ?
         AND expiration_date < CURDATE()
         AND status != 'expired'`,
      [householdId]
    );

    // Mark items as expiring soon (within 3 days)
    await query(
      `UPDATE inventory_items
       SET status = 'expiring_soon'
       WHERE household_id = ?
         AND expiration_date >= CURDATE()
         AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
         AND status = 'fresh'`,
      [householdId]
    );

    return res.json({
      success: true,
      message: 'Inventory statuses updated',
      markedExpired: result.affectedRows || 0,
    });
  } catch (error) {
    console.error('Error marking expired items:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark expired items',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
