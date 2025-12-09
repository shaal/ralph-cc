/**
 * Repository for managing agent conversation history
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './BaseRepository';
import type {
  AgentHistory,
  CreateAgentHistoryDTO,
  FindHistoryOptions,
  AgentHistoryWithParsed,
  MessageRole,
} from '../types';

/**
 * HistoryRepository handles all database operations for agent conversation history
 */
export class HistoryRepository extends BaseRepository<AgentHistory> {
  constructor() {
    super('agent_history');
  }

  /**
   * Create a new history entry
   */
  public create(data: CreateAgentHistoryDTO): AgentHistory {
    const id = uuidv4();
    const now = this.getCurrentTimestamp();

    const sql = `
      INSERT INTO agent_history (
        id, agent_id, role, content, tool_calls, tool_results, usage, cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.run(sql, [
      id,
      data.agent_id,
      data.role,
      data.content ?? null,
      data.tool_calls ? this.serializeJson(data.tool_calls) : null,
      data.tool_results ? this.serializeJson(data.tool_results) : null,
      data.usage ? this.serializeJson(data.usage) : null,
      data.cost ?? null,
      now,
    ]);

    const entry = this.findById(id);
    if (!entry) {
      throw new Error('Failed to create history entry');
    }

    return entry;
  }

  /**
   * Find history entries by agent ID with pagination
   */
  public findByAgentId(agentId: string, options?: FindHistoryOptions): AgentHistory[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    const sql = `
      SELECT * FROM agent_history
      WHERE agent_id = ?
      ORDER BY created_at ${order}
      ${pagination.clause}
    `;

    return this.all<AgentHistory>(sql, [agentId, ...pagination.params]);
  }

  /**
   * Get the latest history entry for an agent
   */
  public getLatest(agentId: string): AgentHistory | undefined {
    const sql = `
      SELECT * FROM agent_history
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return this.get<AgentHistory>(sql, [agentId]);
  }

  /**
   * Get the first history entry for an agent
   */
  public getFirst(agentId: string): AgentHistory | undefined {
    const sql = `
      SELECT * FROM agent_history
      WHERE agent_id = ?
      ORDER BY created_at ASC
      LIMIT 1
    `;

    return this.get<AgentHistory>(sql, [agentId]);
  }

  /**
   * Find history entries by agent ID with parsed JSON fields
   */
  public findByAgentIdWithParsed(agentId: string, options?: FindHistoryOptions): AgentHistoryWithParsed[] {
    const entries = this.findByAgentId(agentId, options);
    return entries.map(entry => this.parseHistoryEntry(entry));
  }

  /**
   * Get latest history entry with parsed JSON fields
   */
  public getLatestWithParsed(agentId: string): AgentHistoryWithParsed | undefined {
    const entry = this.getLatest(agentId);
    if (!entry) {
      return undefined;
    }
    return this.parseHistoryEntry(entry);
  }

  /**
   * Parse JSON fields in a history entry
   */
  private parseHistoryEntry(entry: AgentHistory): AgentHistoryWithParsed {
    return {
      ...entry,
      tool_calls: entry.tool_calls ? this.parseJson(entry.tool_calls) : null,
      tool_results: entry.tool_results ? this.parseJson(entry.tool_results) : null,
      usage: entry.usage ? this.parseJson(entry.usage) : null,
    };
  }

  /**
   * Count history entries for an agent
   */
  public countByAgent(agentId: string): number {
    const sql = `SELECT COUNT(*) as count FROM agent_history WHERE agent_id = ?`;
    const result = this.get<{ count: number }>(sql, [agentId]);
    return result?.count ?? 0;
  }

  /**
   * Find history entries by role
   */
  public findByAgentAndRole(agentId: string, role: MessageRole, options?: FindHistoryOptions): AgentHistory[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    const sql = `
      SELECT * FROM agent_history
      WHERE agent_id = ? AND role = ?
      ORDER BY created_at ${order}
      ${pagination.clause}
    `;

    return this.all<AgentHistory>(sql, [agentId, role, ...pagination.params]);
  }

  /**
   * Get total cost for an agent from history
   */
  public getTotalCostByAgent(agentId: string): number {
    const sql = `
      SELECT SUM(cost) as total
      FROM agent_history
      WHERE agent_id = ? AND cost IS NOT NULL
    `;
    const result = this.get<{ total: number | null }>(sql, [agentId]);
    return result?.total ?? 0;
  }

  /**
   * Get conversation history for an agent (formatted for display)
   */
  public getConversation(agentId: string, options?: FindHistoryOptions): AgentHistoryWithParsed[] {
    return this.findByAgentIdWithParsed(agentId, {
      ...options,
      order: 'asc', // Always chronological for conversation view
    });
  }

  /**
   * Get recent history entries across all agents
   */
  public getRecent(limit: number = 50): AgentHistory[] {
    const sql = `
      SELECT * FROM agent_history
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return this.all<AgentHistory>(sql, [limit]);
  }

  /**
   * Get history statistics for an agent
   */
  public getAgentStats(agentId: string): {
    total: number;
    byRole: Record<MessageRole, number>;
    totalCost: number;
    firstMessage: string | null;
    lastMessage: string | null;
  } {
    const total = this.countByAgent(agentId);

    // Count by role
    const roleCounts = this.all<{ role: MessageRole; count: number }>(
      'SELECT role, COUNT(*) as count FROM agent_history WHERE agent_id = ? GROUP BY role',
      [agentId]
    );

    const byRole: Record<MessageRole, number> = {
      user: 0,
      assistant: 0,
      tool: 0,
    };

    roleCounts.forEach(row => {
      byRole[row.role] = row.count;
    });

    // Total cost
    const totalCost = this.getTotalCostByAgent(agentId);

    // First and last message timestamps
    const first = this.getFirst(agentId);
    const last = this.getLatest(agentId);

    return {
      total,
      byRole,
      totalCost,
      firstMessage: first?.created_at ?? null,
      lastMessage: last?.created_at ?? null,
    };
  }

  /**
   * Delete all history for an agent
   */
  public deleteByAgentId(agentId: string): number {
    const sql = `DELETE FROM agent_history WHERE agent_id = ?`;
    const result = this.run(sql, [agentId]);
    return result.changes;
  }

  /**
   * Delete old history entries (for cleanup/archival)
   */
  public deleteOlderThan(date: string): number {
    const sql = `DELETE FROM agent_history WHERE created_at < ?`;
    const result = this.run(sql, [date]);
    return result.changes;
  }

  /**
   * Get history entries with tool calls
   */
  public findWithToolCalls(agentId: string, options?: FindHistoryOptions): AgentHistoryWithParsed[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    const sql = `
      SELECT * FROM agent_history
      WHERE agent_id = ? AND tool_calls IS NOT NULL
      ORDER BY created_at ${order}
      ${pagination.clause}
    `;

    const entries = this.all<AgentHistory>(sql, [agentId, ...pagination.params]);
    return entries.map(entry => this.parseHistoryEntry(entry));
  }

  /**
   * Search history by content
   */
  public searchByContent(agentId: string, searchTerm: string, options?: FindHistoryOptions): AgentHistory[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    const sql = `
      SELECT * FROM agent_history
      WHERE agent_id = ? AND content LIKE ?
      ORDER BY created_at ${order}
      ${pagination.clause}
    `;

    return this.all<AgentHistory>(sql, [agentId, `%${searchTerm}%`, ...pagination.params]);
  }
}

// Export singleton instance
export default new HistoryRepository();
