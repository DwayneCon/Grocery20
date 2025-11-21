import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';

export interface ConversationMessage {
  id?: string;
  userId: string;
  householdId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensUsed?: number;
  model?: string;
  createdAt?: Date;
}

/**
 * Save a conversation message to the database
 */
export async function saveConversationMessage(message: ConversationMessage): Promise<void> {
  const messageId = message.id || uuidv4();

  await query(
    `INSERT INTO conversation_history
    (id, user_id, household_id, role, content, tokens_used, model, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      messageId,
      message.userId,
      message.householdId || null,
      message.role,
      message.content,
      message.tokensUsed || 0,
      message.model || null,
    ]
  );
}

/**
 * Get recent conversation history for a user
 * @param userId - User ID
 * @param limit - Maximum number of messages to retrieve (default: 20)
 * @param householdId - Optional household ID to filter by household context
 */
export async function getConversationHistory(
  userId: string,
  limit: number = 20,
  householdId?: string
): Promise<ConversationMessage[]> {
  let sql = `
    SELECT id, user_id as userId, household_id as householdId,
           role, content, tokens_used as tokensUsed, model, created_at as createdAt
    FROM conversation_history
    WHERE user_id = ?
  `;

  const params: any[] = [userId];

  // If householdId is provided, filter by it OR messages without household context
  if (householdId) {
    sql += ` AND (household_id = ? OR household_id IS NULL)`;
    params.push(householdId);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const messages = await query(sql, params);

  // Reverse to get chronological order (oldest first)
  return messages.reverse().map((msg: any) => ({
    id: msg.id,
    userId: msg.userId,
    householdId: msg.householdId,
    role: msg.role,
    content: msg.content,
    tokensUsed: msg.tokensUsed,
    model: msg.model,
    createdAt: msg.createdAt,
  }));
}

/**
 * Delete old conversation history to manage storage
 * @param userId - User ID
 * @param daysToKeep - Number of days to keep (default: 30)
 */
export async function cleanupOldHistory(userId: string, daysToKeep: number = 30): Promise<number> {
  const result: any = await query(
    `DELETE FROM conversation_history
     WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [userId, daysToKeep]
  );

  return result.affectedRows || 0;
}

/**
 * Get conversation statistics for a user
 */
export async function getConversationStats(userId: string): Promise<{
  totalMessages: number;
  totalTokensUsed: number;
  firstMessageDate: Date | null;
  lastMessageDate: Date | null;
}> {
  const stats: any[] = await query(
    `SELECT
      COUNT(*) as totalMessages,
      SUM(tokens_used) as totalTokensUsed,
      MIN(created_at) as firstMessageDate,
      MAX(created_at) as lastMessageDate
    FROM conversation_history
    WHERE user_id = ?`,
    [userId]
  );

  return {
    totalMessages: stats[0]?.totalMessages || 0,
    totalTokensUsed: stats[0]?.totalTokensUsed || 0,
    firstMessageDate: stats[0]?.firstMessageDate || null,
    lastMessageDate: stats[0]?.lastMessageDate || null,
  };
}

/**
 * Clear all conversation history for a user
 */
export async function clearUserHistory(userId: string): Promise<number> {
  const result: any = await query(
    `DELETE FROM conversation_history WHERE user_id = ?`,
    [userId]
  );

  return result.affectedRows || 0;
}
