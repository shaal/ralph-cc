/**
 * Repository for managing projects
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './BaseRepository';
import type {
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectStatus,
  ProjectWithSettings,
} from '../types';

/**
 * ProjectRepository handles all database operations for projects
 */
export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super('projects');
  }

  /**
   * Create a new project
   */
  public create(data: CreateProjectDTO): Project {
    const id = uuidv4();
    const now = this.getCurrentTimestamp();

    const sql = `
      INSERT INTO projects (
        id, name, description, prompt_path, settings, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    this.run(sql, [
      id,
      data.name,
      data.description ?? null,
      data.prompt_path,
      this.serializeJson(data.settings ?? {}),
      now,
    ]);

    const project = this.findById(id);
    if (!project) {
      throw new Error('Failed to create project');
    }

    return project;
  }

  /**
   * Update a project
   */
  public update(id: string, data: UpdateProjectDTO): Project {
    const now = this.getCurrentTimestamp();
    const updates: string[] = [];
    const params: any[] = [];

    // Build dynamic UPDATE query based on provided fields
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.prompt_path !== undefined) {
      updates.push('prompt_path = ?');
      params.push(data.prompt_path);
    }

    if (data.settings !== undefined) {
      updates.push('settings = ?');
      params.push(this.serializeJson(data.settings));
    }

    if (data.cost_total !== undefined) {
      updates.push('cost_total = ?');
      params.push(data.cost_total);
    }

    if (data.iteration_count !== undefined) {
      updates.push('iteration_count = ?');
      params.push(data.iteration_count);
    }

    if (data.ended_at !== undefined) {
      updates.push('ended_at = ?');
      params.push(data.ended_at);
    }

    if (updates.length === 0) {
      // No updates, just return current state
      const project = this.findById(id);
      if (!project) {
        throw new Error(`Project not found: ${id}`);
      }
      return project;
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = ?');
    params.push(now);

    // Add id to params for WHERE clause
    params.push(id);

    const sql = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
    this.run(sql, params);

    const project = this.findById(id);
    if (!project) {
      throw new Error(`Project not found after update: ${id}`);
    }

    return project;
  }

  /**
   * Update project status
   */
  public updateStatus(id: string, status: ProjectStatus): Project {
    const now = this.getCurrentTimestamp();
    const updates = ['status = ?', 'updated_at = ?'];
    const params: any[] = [status, now];

    // Set ended_at when transitioning to terminal states
    if (['completed', 'failed', 'stopped'].includes(status)) {
      updates.push('ended_at = ?');
      params.push(now);
    }

    params.push(id);

    const sql = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
    this.run(sql, params);

    const project = this.findById(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    return project;
  }

  /**
   * Update project cost
   */
  public updateCost(id: string, cost: number): Project {
    const now = this.getCurrentTimestamp();

    const sql = `
      UPDATE projects
      SET cost_total = cost_total + ?, updated_at = ?
      WHERE id = ?
    `;

    this.run(sql, [cost, now, id]);

    const project = this.findById(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    return project;
  }

  /**
   * Increment project iteration count
   */
  public incrementIterationCount(id: string): Project {
    const now = this.getCurrentTimestamp();

    const sql = `
      UPDATE projects
      SET iteration_count = iteration_count + 1, updated_at = ?
      WHERE id = ?
    `;

    this.run(sql, [now, id]);

    const project = this.findById(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    return project;
  }

  /**
   * Find projects by status
   */
  public findByStatus(status: ProjectStatus): Project[] {
    const sql = `SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC`;
    return this.all<Project>(sql, [status]);
  }

  /**
   * Get project with parsed settings
   */
  public findByIdWithSettings(id: string): ProjectWithSettings | undefined {
    const project = this.findById(id);
    if (!project) {
      return undefined;
    }

    return {
      ...project,
      settings: this.parseJson(project.settings) ?? {},
    };
  }

  /**
   * Get all projects with parsed settings
   */
  public findAllWithSettings(): ProjectWithSettings[] {
    const projects = this.findAll();
    return projects.map(project => ({
      ...project,
      settings: this.parseJson(project.settings) ?? {},
    }));
  }

  /**
   * Find projects created within a date range
   */
  public findByDateRange(startDate: string, endDate: string): Project[] {
    const sql = `
      SELECT * FROM projects
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
    `;
    return this.all<Project>(sql, [startDate, endDate]);
  }

  /**
   * Get total cost across all projects
   */
  public getTotalCost(): number {
    const sql = `SELECT SUM(cost_total) as total FROM projects`;
    const result = this.get<{ total: number | null }>(sql);
    return result?.total ?? 0;
  }

  /**
   * Get project statistics
   */
  public getStats(): {
    total: number;
    byStatus: Record<ProjectStatus, number>;
    totalCost: number;
    totalIterations: number;
  } {
    const total = this.count();

    // Count by status
    const statusCounts = this.all<{ status: ProjectStatus; count: number }>(
      'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
    );

    const byStatus: Record<ProjectStatus, number> = {
      created: 0,
      running: 0,
      paused: 0,
      completed: 0,
      failed: 0,
      stopped: 0,
    };

    statusCounts.forEach(row => {
      byStatus[row.status] = row.count;
    });

    // Total cost and iterations
    const totals = this.get<{ total_cost: number; total_iterations: number }>(
      'SELECT SUM(cost_total) as total_cost, SUM(iteration_count) as total_iterations FROM projects'
    );

    return {
      total,
      byStatus,
      totalCost: totals?.total_cost ?? 0,
      totalIterations: totals?.total_iterations ?? 0,
    };
  }
}

// Export singleton instance
export default new ProjectRepository();
