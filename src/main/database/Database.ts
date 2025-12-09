/**
 * SQLite database connection manager for Constellation
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { runMigrations } from './migrations';

/**
 * Database singleton class
 */
class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: Database.Database | null = null;
  private dbPath: string;

  private constructor() {
    // Database location: ~/.constellation/constellation.db
    const homeDir = os.homedir();
    const constellationDir = path.join(homeDir, '.constellation');
    this.dbPath = path.join(constellationDir, 'constellation.db');

    // Ensure directory exists
    if (!fs.existsSync(constellationDir)) {
      fs.mkdirSync(constellationDir, { recursive: true });
      console.log(`[Database] Created directory: ${constellationDir}`);
    }
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the database connection
   */
  public init(): Database.Database {
    if (this.db) {
      return this.db;
    }

    console.log(`[Database] Initializing database at: ${this.dbPath}`);

    try {
      // Create database connection
      this.db = new Database(this.dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better concurrent access
      this.db.pragma('journal_mode = WAL');

      // Set synchronous mode to NORMAL for better performance
      this.db.pragma('synchronous = NORMAL');

      // Run migrations
      runMigrations(this.db);

      console.log('[Database] Database initialized successfully');

      return this.db;
    } catch (error) {
      console.error('[Database] Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Get the database instance (throws if not initialized)
   */
  public getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      console.log('[Database] Closing database connection');
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get the database file path
   */
  public getPath(): string {
    return this.dbPath;
  }

  /**
   * Check if database is initialized
   */
  public isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Execute a raw SQL query (use with caution)
   */
  public exec(sql: string): void {
    const db = this.getDb();
    db.exec(sql);
  }

  /**
   * Begin a transaction
   */
  public transaction<T>(fn: () => T): T {
    const db = this.getDb();
    const txn = db.transaction(fn);
    return txn();
  }

  /**
   * Backup the database to a file
   */
  public backup(destinationPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = this.getDb();

      try {
        db.backup(destinationPath)
          .then(() => {
            console.log(`[Database] Backup created at: ${destinationPath}`);
            resolve();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get database statistics
   */
  public getStats(): {
    path: string;
    size: number;
    pageSize: number;
    pageCount: number;
    walEnabled: boolean;
  } {
    const db = this.getDb();

    const stats = fs.statSync(this.dbPath);
    const pageSize = db.pragma('page_size', { simple: true }) as number;
    const pageCount = db.pragma('page_count', { simple: true }) as number;
    const journalMode = db.pragma('journal_mode', { simple: true }) as string;

    return {
      path: this.dbPath,
      size: stats.size,
      pageSize,
      pageCount,
      walEnabled: journalMode.toLowerCase() === 'wal',
    };
  }
}

// Export singleton instance
export default DatabaseManager.getInstance();
