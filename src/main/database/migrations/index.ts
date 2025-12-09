/**
 * Migration runner for Constellation database
 */

import type Database from 'better-sqlite3';
import * as migration001 from './001_initial';

export interface MigrationDefinition {
  name: string;
  up: string;
  down: string;
}

// List of all migrations in order
const migrations: MigrationDefinition[] = [
  {
    name: '001_initial',
    up: migration001.up,
    down: migration001.down,
  },
];

/**
 * Initialize the migrations tracking table
 */
function initMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Get list of applied migrations
 */
function getAppliedMigrations(db: Database.Database): Set<string> {
  const rows = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
  return new Set(rows.map(row => row.name));
}

/**
 * Record a migration as applied
 */
function recordMigration(db: Database.Database, name: string): void {
  db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
}

/**
 * Run all pending migrations
 */
export function runMigrations(db: Database.Database): void {
  console.log('[Migrations] Starting migration process...');

  // Initialize migrations tracking table
  initMigrationsTable(db);

  // Get already applied migrations
  const applied = getAppliedMigrations(db);
  console.log(`[Migrations] ${applied.size} migration(s) already applied`);

  // Find and run pending migrations
  let pendingCount = 0;

  for (const migration of migrations) {
    if (applied.has(migration.name)) {
      console.log(`[Migrations] Skipping ${migration.name} (already applied)`);
      continue;
    }

    console.log(`[Migrations] Applying ${migration.name}...`);

    try {
      // Run migration in a transaction
      db.transaction(() => {
        db.exec(migration.up);
        recordMigration(db, migration.name);
      })();

      console.log(`[Migrations] Successfully applied ${migration.name}`);
      pendingCount++;
    } catch (error) {
      console.error(`[Migrations] Failed to apply ${migration.name}:`, error);
      throw new Error(`Migration ${migration.name} failed: ${error}`);
    }
  }

  if (pendingCount === 0) {
    console.log('[Migrations] Database is up to date');
  } else {
    console.log(`[Migrations] Applied ${pendingCount} new migration(s)`);
  }
}

/**
 * Rollback the last migration (use with caution)
 */
export function rollbackLastMigration(db: Database.Database): void {
  const applied = db.prepare('SELECT name FROM _migrations ORDER BY id DESC LIMIT 1').get() as { name: string } | undefined;

  if (!applied) {
    console.log('[Migrations] No migrations to rollback');
    return;
  }

  const migration = migrations.find(m => m.name === applied.name);
  if (!migration) {
    throw new Error(`Migration ${applied.name} not found in migration list`);
  }

  console.log(`[Migrations] Rolling back ${migration.name}...`);

  try {
    db.transaction(() => {
      db.exec(migration.down);
      db.prepare('DELETE FROM _migrations WHERE name = ?').run(migration.name);
    })();

    console.log(`[Migrations] Successfully rolled back ${migration.name}`);
  } catch (error) {
    console.error(`[Migrations] Failed to rollback ${migration.name}:`, error);
    throw new Error(`Rollback of ${migration.name} failed: ${error}`);
  }
}

/**
 * Get migration status
 */
export function getMigrationStatus(db: Database.Database): { total: number; applied: number; pending: string[] } {
  initMigrationsTable(db);
  const applied = getAppliedMigrations(db);
  const pending = migrations.filter(m => !applied.has(m.name)).map(m => m.name);

  return {
    total: migrations.length,
    applied: applied.size,
    pending,
  };
}
