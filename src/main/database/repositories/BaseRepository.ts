/**
 * Base repository class with common CRUD operations
 */

import type Database from 'better-sqlite3';
import DatabaseManager from '../Database';

/**
 * Base repository providing common database operations
 * Uses lazy initialization to avoid accessing DB before it's ready
 */
export abstract class BaseRepository<T> {
  private _db: Database.Database | null = null;
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Lazy getter for database connection
   * Automatically initializes the database if not already done
   */
  protected get db(): Database.Database {
    if (!this._db) {
      // Initialize database if not already done
      if (!DatabaseManager.isInitialized()) {
        DatabaseManager.init();
      }
      this._db = DatabaseManager.getDb();
    }
    return this._db;
  }

  /**
   * Execute a SELECT query and return all results
   */
  protected all<R = T>(sql: string, params: any[] = []): R[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as R[];
  }

  /**
   * Execute a SELECT query and return a single result
   */
  protected get<R = T>(sql: string, params: any[] = []): R | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as R | undefined;
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE query
   */
  protected run(sql: string, params: any[] = []): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }

  /**
   * Execute a transaction
   */
  protected transaction<R>(fn: () => R): R {
    const txn = this.db.transaction(fn);
    return txn();
  }

  /**
   * Find a record by ID
   */
  public findById(id: string): T | undefined {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return this.get<T>(sql, [id]);
  }

  /**
   * Find all records
   */
  public findAll(): T[] {
    const sql = `SELECT * FROM ${this.tableName}`;
    return this.all<T>(sql);
  }

  /**
   * Delete a record by ID
   */
  public delete(id: string): boolean {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = this.run(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Count all records
   */
  public count(): number {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = this.get<{ count: number }>(sql);
    return result?.count ?? 0;
  }

  /**
   * Check if a record exists
   */
  public exists(id: string): boolean {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = this.get(sql, [id]);
    return result !== undefined;
  }

  /**
   * Serialize a JSON field for storage
   */
  protected serializeJson(data: any): string {
    if (data === null || data === undefined) {
      return '{}';
    }
    return typeof data === 'string' ? data : JSON.stringify(data);
  }

  /**
   * Parse a JSON field from storage
   */
  protected parseJson<R = any>(data: string | null): R | null {
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as R;
    } catch (error) {
      console.error(`[BaseRepository] Failed to parse JSON:`, error);
      return null;
    }
  }

  /**
   * Get current timestamp in ISO format
   */
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Build WHERE clause from conditions
   */
  protected buildWhereClause(conditions: Record<string, any>): { clause: string; params: any[] } {
    const keys = Object.keys(conditions);

    if (keys.length === 0) {
      return { clause: '', params: [] };
    }

    const clauses = keys.map(key => `${key} = ?`);
    const params = keys.map(key => conditions[key]);

    return {
      clause: `WHERE ${clauses.join(' AND ')}`,
      params,
    };
  }

  /**
   * Build pagination clause
   */
  protected buildPaginationClause(options?: { limit?: number; offset?: number }): { clause: string; params: any[] } {
    const parts: string[] = [];
    const params: any[] = [];

    if (options?.limit !== undefined) {
      parts.push('LIMIT ?');
      params.push(options.limit);
    }

    if (options?.offset !== undefined) {
      parts.push('OFFSET ?');
      params.push(options.offset);
    }

    return {
      clause: parts.join(' '),
      params,
    };
  }
}
