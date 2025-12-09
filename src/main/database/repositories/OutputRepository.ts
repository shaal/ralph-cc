/**
 * Repository for managing outputs (files, artifacts, logs)
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './BaseRepository';
import type {
  Output,
  CreateOutputDTO,
  OutputType,
  PaginationOptions,
} from '../types';

/**
 * OutputRepository handles all database operations for outputs
 */
export class OutputRepository extends BaseRepository<Output> {
  constructor() {
    super('outputs');
  }

  /**
   * Create a new output
   */
  public create(data: CreateOutputDTO): Output {
    const id = uuidv4();
    const now = this.getCurrentTimestamp();

    const sql = `
      INSERT INTO outputs (
        id, project_id, agent_id, type, path, content, previous_content, checksum, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.run(sql, [
      id,
      data.project_id,
      data.agent_id ?? null,
      data.type,
      data.path ?? null,
      data.content ?? null,
      data.previous_content ?? null,
      data.checksum ?? null,
      now,
    ]);

    const output = this.findById(id);
    if (!output) {
      throw new Error('Failed to create output');
    }

    return output;
  }

  /**
   * Find outputs by project ID
   */
  public findByProjectId(projectId: string, options?: PaginationOptions): Output[] {
    const pagination = this.buildPaginationClause(options);

    const sql = `
      SELECT * FROM outputs
      WHERE project_id = ?
      ORDER BY created_at DESC
      ${pagination.clause}
    `;

    return this.all<Output>(sql, [projectId, ...pagination.params]);
  }

  /**
   * Find outputs by agent ID
   */
  public findByAgentId(agentId: string, options?: PaginationOptions): Output[] {
    const pagination = this.buildPaginationClause(options);

    const sql = `
      SELECT * FROM outputs
      WHERE agent_id = ?
      ORDER BY created_at DESC
      ${pagination.clause}
    `;

    return this.all<Output>(sql, [agentId, ...pagination.params]);
  }

  /**
   * Find outputs by type
   */
  public findByType(type: OutputType, options?: PaginationOptions): Output[] {
    const pagination = this.buildPaginationClause(options);

    const sql = `
      SELECT * FROM outputs
      WHERE type = ?
      ORDER BY created_at DESC
      ${pagination.clause}
    `;

    return this.all<Output>(sql, [type, ...pagination.params]);
  }

  /**
   * Find outputs by project and type
   */
  public findByProjectAndType(projectId: string, type: OutputType, options?: PaginationOptions): Output[] {
    const pagination = this.buildPaginationClause(options);

    const sql = `
      SELECT * FROM outputs
      WHERE project_id = ? AND type = ?
      ORDER BY created_at DESC
      ${pagination.clause}
    `;

    return this.all<Output>(sql, [projectId, type, ...pagination.params]);
  }

  /**
   * Find output by path
   */
  public findByPath(projectId: string, path: string): Output | undefined {
    const sql = `
      SELECT * FROM outputs
      WHERE project_id = ? AND path = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return this.get<Output>(sql, [projectId, path]);
  }

  /**
   * Get all outputs for a specific file path (history)
   */
  public findHistoryByPath(projectId: string, path: string, options?: PaginationOptions): Output[] {
    const pagination = this.buildPaginationClause(options);

    const sql = `
      SELECT * FROM outputs
      WHERE project_id = ? AND path = ?
      ORDER BY created_at DESC
      ${pagination.clause}
    `;

    return this.all<Output>(sql, [projectId, path, ...pagination.params]);
  }

  /**
   * Count outputs by project
   */
  public countByProject(projectId: string, type?: OutputType): number {
    let sql = `SELECT COUNT(*) as count FROM outputs WHERE project_id = ?`;
    const params: any[] = [projectId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    const result = this.get<{ count: number }>(sql, params);
    return result?.count ?? 0;
  }

  /**
   * Count outputs by agent
   */
  public countByAgent(agentId: string, type?: OutputType): number {
    let sql = `SELECT COUNT(*) as count FROM outputs WHERE agent_id = ?`;
    const params: any[] = [agentId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    const result = this.get<{ count: number }>(sql, params);
    return result?.count ?? 0;
  }

  /**
   * Get output statistics for a project
   */
  public getProjectStats(projectId: string): {
    total: number;
    byType: Record<OutputType, number>;
    uniquePaths: number;
  } {
    const total = this.countByProject(projectId);

    // Count by type
    const typeCounts = this.all<{ type: OutputType; count: number }>(
      'SELECT type, COUNT(*) as count FROM outputs WHERE project_id = ? GROUP BY type',
      [projectId]
    );

    const byType: Record<OutputType, number> = {
      file: 0,
      artifact: 0,
      log: 0,
    };

    typeCounts.forEach(row => {
      byType[row.type] = row.count;
    });

    // Count unique paths
    const uniquePaths = this.get<{ count: number }>(
      'SELECT COUNT(DISTINCT path) as count FROM outputs WHERE project_id = ? AND path IS NOT NULL',
      [projectId]
    );

    return {
      total,
      byType,
      uniquePaths: uniquePaths?.count ?? 0,
    };
  }

  /**
   * Get recent outputs across all projects
   */
  public getRecent(limit: number = 50): Output[] {
    const sql = `
      SELECT * FROM outputs
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return this.all<Output>(sql, [limit]);
  }

  /**
   * Find outputs within a date range
   */
  public findByDateRange(startDate: string, endDate: string, options?: PaginationOptions): Output[] {
    const pagination = this.buildPaginationClause(options);

    const sql = `
      SELECT * FROM outputs
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
      ${pagination.clause}
    `;

    return this.all<Output>(sql, [startDate, endDate, ...pagination.params]);
  }

  /**
   * Get all unique file paths for a project
   */
  public getUniquePaths(projectId: string, type?: OutputType): string[] {
    let sql = `
      SELECT DISTINCT path FROM outputs
      WHERE project_id = ? AND path IS NOT NULL
    `;

    const params: any[] = [projectId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY path ASC`;

    const results = this.all<{ path: string }>(sql, params);
    return results.map(r => r.path);
  }

  /**
   * Search outputs by content
   */
  public searchByContent(projectId: string, searchTerm: string, options?: PaginationOptions): Output[] {
    const pagination = this.buildPaginationClause(options);

    const sql = `
      SELECT * FROM outputs
      WHERE project_id = ? AND content LIKE ?
      ORDER BY created_at DESC
      ${pagination.clause}
    `;

    return this.all<Output>(sql, [projectId, `%${searchTerm}%`, ...pagination.params]);
  }

  /**
   * Delete outputs by project ID
   */
  public deleteByProjectId(projectId: string): number {
    const sql = `DELETE FROM outputs WHERE project_id = ?`;
    const result = this.run(sql, [projectId]);
    return result.changes;
  }

  /**
   * Delete outputs by agent ID
   */
  public deleteByAgentId(agentId: string): number {
    const sql = `DELETE FROM outputs WHERE agent_id = ?`;
    const result = this.run(sql, [agentId]);
    return result.changes;
  }

  /**
   * Delete old outputs (for cleanup)
   */
  public deleteOlderThan(date: string): number {
    const sql = `DELETE FROM outputs WHERE created_at < ?`;
    const result = this.run(sql, [date]);
    return result.changes;
  }
}

// Export singleton instance
export default new OutputRepository();
