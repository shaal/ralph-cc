/**
 * Repository for managing system events
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './BaseRepository';
import type {
  Event,
  CreateEventDTO,
  FindEventsOptions,
  EventWithData,
} from '../types';

/**
 * EventRepository handles all database operations for system events
 */
export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super('events');
  }

  /**
   * Create a new event
   */
  public create(data: CreateEventDTO): Event {
    const id = uuidv4();
    const now = this.getCurrentTimestamp();

    const sql = `
      INSERT INTO events (
        id, project_id, agent_id, type, data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    this.run(sql, [
      id,
      data.project_id ?? null,
      data.agent_id ?? null,
      data.type,
      data.data ? this.serializeJson(data.data) : null,
      now,
    ]);

    const event = this.findById(id);
    if (!event) {
      throw new Error('Failed to create event');
    }

    return event;
  }

  /**
   * Find events by project ID with pagination
   */
  public findByProjectId(projectId: string, options?: FindEventsOptions): Event[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    let sql = `
      SELECT * FROM events
      WHERE project_id = ?
    `;

    const params: any[] = [projectId];

    // Add type filter if specified
    if (options?.type) {
      sql += ` AND type = ?`;
      params.push(options.type);
    }

    sql += ` ORDER BY created_at ${order} ${pagination.clause}`;
    params.push(...pagination.params);

    return this.all<Event>(sql, params);
  }

  /**
   * Find events by agent ID with pagination
   */
  public findByAgentId(agentId: string, options?: FindEventsOptions): Event[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    let sql = `
      SELECT * FROM events
      WHERE agent_id = ?
    `;

    const params: any[] = [agentId];

    // Add type filter if specified
    if (options?.type) {
      sql += ` AND type = ?`;
      params.push(options.type);
    }

    sql += ` ORDER BY created_at ${order} ${pagination.clause}`;
    params.push(...pagination.params);

    return this.all<Event>(sql, params);
  }

  /**
   * Find events by type with pagination
   */
  public findByType(type: string, options?: FindEventsOptions): Event[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    const sql = `
      SELECT * FROM events
      WHERE type = ?
      ORDER BY created_at ${order}
      ${pagination.clause}
    `;

    return this.all<Event>(sql, [type, ...pagination.params]);
  }

  /**
   * Get recent events across all projects
   */
  public getRecent(limit: number = 100): Event[] {
    const sql = `
      SELECT * FROM events
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return this.all<Event>(sql, [limit]);
  }

  /**
   * Find events by project ID with parsed data
   */
  public findByProjectIdWithData(projectId: string, options?: FindEventsOptions): EventWithData[] {
    const events = this.findByProjectId(projectId, options);
    return events.map(event => this.parseEventData(event));
  }

  /**
   * Find events by agent ID with parsed data
   */
  public findByAgentIdWithData(agentId: string, options?: FindEventsOptions): EventWithData[] {
    const events = this.findByAgentId(agentId, options);
    return events.map(event => this.parseEventData(event));
  }

  /**
   * Get recent events with parsed data
   */
  public getRecentWithData(limit: number = 100): EventWithData[] {
    const events = this.getRecent(limit);
    return events.map(event => this.parseEventData(event));
  }

  /**
   * Parse JSON data field in an event
   */
  private parseEventData(event: Event): EventWithData {
    return {
      ...event,
      data: event.data ? this.parseJson(event.data) : null,
    };
  }

  /**
   * Count events by project
   */
  public countByProject(projectId: string, type?: string): number {
    let sql = `SELECT COUNT(*) as count FROM events WHERE project_id = ?`;
    const params: any[] = [projectId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    const result = this.get<{ count: number }>(sql, params);
    return result?.count ?? 0;
  }

  /**
   * Count events by agent
   */
  public countByAgent(agentId: string, type?: string): number {
    let sql = `SELECT COUNT(*) as count FROM events WHERE agent_id = ?`;
    const params: any[] = [agentId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    const result = this.get<{ count: number }>(sql, params);
    return result?.count ?? 0;
  }

  /**
   * Count events by type
   */
  public countByType(type: string): number {
    const sql = `SELECT COUNT(*) as count FROM events WHERE type = ?`;
    const result = this.get<{ count: number }>(sql, [type]);
    return result?.count ?? 0;
  }

  /**
   * Get event statistics for a project
   */
  public getProjectStats(projectId: string): {
    total: number;
    byType: Record<string, number>;
    firstEvent: string | null;
    lastEvent: string | null;
  } {
    const total = this.countByProject(projectId);

    // Count by type
    const typeCounts = this.all<{ type: string; count: number }>(
      'SELECT type, COUNT(*) as count FROM events WHERE project_id = ? GROUP BY type',
      [projectId]
    );

    const byType: Record<string, number> = {};
    typeCounts.forEach(row => {
      byType[row.type] = row.count;
    });

    // First and last event timestamps
    const first = this.get<{ created_at: string }>(
      'SELECT created_at FROM events WHERE project_id = ? ORDER BY created_at ASC LIMIT 1',
      [projectId]
    );

    const last = this.get<{ created_at: string }>(
      'SELECT created_at FROM events WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
      [projectId]
    );

    return {
      total,
      byType,
      firstEvent: first?.created_at ?? null,
      lastEvent: last?.created_at ?? null,
    };
  }

  /**
   * Get event statistics for an agent
   */
  public getAgentStats(agentId: string): {
    total: number;
    byType: Record<string, number>;
    firstEvent: string | null;
    lastEvent: string | null;
  } {
    const total = this.countByAgent(agentId);

    // Count by type
    const typeCounts = this.all<{ type: string; count: number }>(
      'SELECT type, COUNT(*) as count FROM events WHERE agent_id = ? GROUP BY type',
      [agentId]
    );

    const byType: Record<string, number> = {};
    typeCounts.forEach(row => {
      byType[row.type] = row.count;
    });

    // First and last event timestamps
    const first = this.get<{ created_at: string }>(
      'SELECT created_at FROM events WHERE agent_id = ? ORDER BY created_at ASC LIMIT 1',
      [agentId]
    );

    const last = this.get<{ created_at: string }>(
      'SELECT created_at FROM events WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1',
      [agentId]
    );

    return {
      total,
      byType,
      firstEvent: first?.created_at ?? null,
      lastEvent: last?.created_at ?? null,
    };
  }

  /**
   * Get global event statistics
   */
  public getGlobalStats(): {
    total: number;
    byType: Record<string, number>;
    firstEvent: string | null;
    lastEvent: string | null;
  } {
    const total = this.count();

    // Count by type
    const typeCounts = this.all<{ type: string; count: number }>(
      'SELECT type, COUNT(*) as count FROM events GROUP BY type'
    );

    const byType: Record<string, number> = {};
    typeCounts.forEach(row => {
      byType[row.type] = row.count;
    });

    // First and last event timestamps
    const first = this.get<{ created_at: string }>(
      'SELECT created_at FROM events ORDER BY created_at ASC LIMIT 1'
    );

    const last = this.get<{ created_at: string }>(
      'SELECT created_at FROM events ORDER BY created_at DESC LIMIT 1'
    );

    return {
      total,
      byType,
      firstEvent: first?.created_at ?? null,
      lastEvent: last?.created_at ?? null,
    };
  }

  /**
   * Find events within a date range
   */
  public findByDateRange(startDate: string, endDate: string, options?: FindEventsOptions): Event[] {
    const order = options?.order === 'asc' ? 'ASC' : 'DESC';
    const pagination = this.buildPaginationClause({
      limit: options?.limit,
      offset: options?.offset,
    });

    let sql = `
      SELECT * FROM events
      WHERE created_at >= ? AND created_at <= ?
    `;

    const params: any[] = [startDate, endDate];

    // Add type filter if specified
    if (options?.type) {
      sql += ` AND type = ?`;
      params.push(options.type);
    }

    sql += ` ORDER BY created_at ${order} ${pagination.clause}`;
    params.push(...pagination.params);

    return this.all<Event>(sql, params);
  }

  /**
   * Delete events by project ID
   */
  public deleteByProjectId(projectId: string): number {
    const sql = `DELETE FROM events WHERE project_id = ?`;
    const result = this.run(sql, [projectId]);
    return result.changes;
  }

  /**
   * Delete events by agent ID
   */
  public deleteByAgentId(agentId: string): number {
    const sql = `DELETE FROM events WHERE agent_id = ?`;
    const result = this.run(sql, [agentId]);
    return result.changes;
  }

  /**
   * Delete old events (for cleanup/archival)
   */
  public deleteOlderThan(date: string): number {
    const sql = `DELETE FROM events WHERE created_at < ?`;
    const result = this.run(sql, [date]);
    return result.changes;
  }

  /**
   * Delete events by type
   */
  public deleteByType(type: string): number {
    const sql = `DELETE FROM events WHERE type = ?`;
    const result = this.run(sql, [type]);
    return result.changes;
  }
}

// Export singleton instance
export default new EventRepository();
