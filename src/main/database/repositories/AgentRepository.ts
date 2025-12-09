/**
 * Repository for managing agents
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './BaseRepository';
import type {
  Agent,
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentStatus,
  AgentWithConfig,
} from '../types';

/**
 * AgentRepository handles all database operations for agents
 */
export class AgentRepository extends BaseRepository<Agent> {
  constructor() {
    super('agents');
  }

  /**
   * Create a new agent
   */
  public create(data: CreateAgentDTO): Agent {
    const id = uuidv4();
    const now = this.getCurrentTimestamp();

    const sql = `
      INSERT INTO agents (
        id, project_id, parent_id, name, config, depth, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    this.run(sql, [
      id,
      data.project_id,
      data.parent_id ?? null,
      data.name ?? null,
      this.serializeJson(data.config ?? {}),
      data.depth ?? 0,
      now,
    ]);

    const agent = this.findById(id);
    if (!agent) {
      throw new Error('Failed to create agent');
    }

    return agent;
  }

  /**
   * Update an agent
   */
  public update(id: string, data: UpdateAgentDTO): Agent {
    const now = this.getCurrentTimestamp();
    const updates: string[] = [];
    const params: any[] = [];

    // Build dynamic UPDATE query based on provided fields
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.config !== undefined) {
      updates.push('config = ?');
      params.push(this.serializeJson(data.config));
    }

    if (data.current_task !== undefined) {
      updates.push('current_task = ?');
      params.push(data.current_task);
    }

    if (data.total_tokens !== undefined) {
      updates.push('total_tokens = ?');
      params.push(data.total_tokens);
    }

    if (data.total_cost !== undefined) {
      updates.push('total_cost = ?');
      params.push(data.total_cost);
    }

    if (data.iteration_count !== undefined) {
      updates.push('iteration_count = ?');
      params.push(data.iteration_count);
    }

    if (updates.length === 0) {
      // No updates, just return current state
      const agent = this.findById(id);
      if (!agent) {
        throw new Error(`Agent not found: ${id}`);
      }
      return agent;
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = ?');
    params.push(now);

    // Add id to params for WHERE clause
    params.push(id);

    const sql = `UPDATE agents SET ${updates.join(', ')} WHERE id = ?`;
    this.run(sql, params);

    const agent = this.findById(id);
    if (!agent) {
      throw new Error(`Agent not found after update: ${id}`);
    }

    return agent;
  }

  /**
   * Update agent status
   */
  public updateStatus(id: string, status: AgentStatus): Agent {
    const now = this.getCurrentTimestamp();

    const sql = `
      UPDATE agents
      SET status = ?, updated_at = ?
      WHERE id = ?
    `;

    this.run(sql, [status, now, id]);

    const agent = this.findById(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    return agent;
  }

  /**
   * Add tokens and cost to an agent
   */
  public addTokens(id: string, tokens: number, cost: number): Agent {
    const now = this.getCurrentTimestamp();

    const sql = `
      UPDATE agents
      SET total_tokens = total_tokens + ?,
          total_cost = total_cost + ?,
          updated_at = ?
      WHERE id = ?
    `;

    this.run(sql, [tokens, cost, now, id]);

    const agent = this.findById(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    return agent;
  }

  /**
   * Increment agent iteration count
   */
  public incrementIterationCount(id: string): Agent {
    const now = this.getCurrentTimestamp();

    const sql = `
      UPDATE agents
      SET iteration_count = iteration_count + 1, updated_at = ?
      WHERE id = ?
    `;

    this.run(sql, [now, id]);

    const agent = this.findById(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    return agent;
  }

  /**
   * Update current task
   */
  public updateCurrentTask(id: string, task: string | null): Agent {
    const now = this.getCurrentTimestamp();

    const sql = `
      UPDATE agents
      SET current_task = ?, updated_at = ?
      WHERE id = ?
    `;

    this.run(sql, [task, now, id]);

    const agent = this.findById(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    return agent;
  }

  /**
   * Find all agents for a project
   */
  public findByProjectId(projectId: string): Agent[] {
    const sql = `
      SELECT * FROM agents
      WHERE project_id = ?
      ORDER BY created_at ASC
    `;
    return this.all<Agent>(sql, [projectId]);
  }

  /**
   * Find child agents of a parent agent
   */
  public findByParentId(parentId: string): Agent[] {
    const sql = `
      SELECT * FROM agents
      WHERE parent_id = ?
      ORDER BY created_at ASC
    `;
    return this.all<Agent>(sql, [parentId]);
  }

  /**
   * Find agents by status
   */
  public findByStatus(status: AgentStatus): Agent[] {
    const sql = `
      SELECT * FROM agents
      WHERE status = ?
      ORDER BY created_at DESC
    `;
    return this.all<Agent>(sql, [status]);
  }

  /**
   * Find agents by project and status
   */
  public findByProjectAndStatus(projectId: string, status: AgentStatus): Agent[] {
    const sql = `
      SELECT * FROM agents
      WHERE project_id = ? AND status = ?
      ORDER BY created_at ASC
    `;
    return this.all<Agent>(sql, [projectId, status]);
  }

  /**
   * Get agent with parsed config
   */
  public findByIdWithConfig(id: string): AgentWithConfig | undefined {
    const agent = this.findById(id);
    if (!agent) {
      return undefined;
    }

    return {
      ...agent,
      config: this.parseJson(agent.config) ?? {},
    };
  }

  /**
   * Get all agents for a project with parsed config
   */
  public findByProjectIdWithConfig(projectId: string): AgentWithConfig[] {
    const agents = this.findByProjectId(projectId);
    return agents.map(agent => ({
      ...agent,
      config: this.parseJson(agent.config) ?? {},
    }));
  }

  /**
   * Get root agents (agents with no parent) for a project
   */
  public findRootAgentsByProject(projectId: string): Agent[] {
    const sql = `
      SELECT * FROM agents
      WHERE project_id = ? AND parent_id IS NULL
      ORDER BY created_at ASC
    `;
    return this.all<Agent>(sql, [projectId]);
  }

  /**
   * Get agent hierarchy (agent and all descendants)
   */
  public getAgentHierarchy(agentId: string): Agent[] {
    // Use recursive CTE to get all descendants
    const sql = `
      WITH RECURSIVE agent_tree AS (
        -- Base case: the specified agent
        SELECT * FROM agents WHERE id = ?
        UNION ALL
        -- Recursive case: children of agents in agent_tree
        SELECT a.* FROM agents a
        INNER JOIN agent_tree at ON a.parent_id = at.id
      )
      SELECT * FROM agent_tree
      ORDER BY depth ASC, created_at ASC
    `;
    return this.all<Agent>(sql, [agentId]);
  }

  /**
   * Count agents by project
   */
  public countByProject(projectId: string): number {
    const sql = `SELECT COUNT(*) as count FROM agents WHERE project_id = ?`;
    const result = this.get<{ count: number }>(sql, [projectId]);
    return result?.count ?? 0;
  }

  /**
   * Get agent statistics for a project
   */
  public getProjectStats(projectId: string): {
    total: number;
    byStatus: Record<AgentStatus, number>;
    totalTokens: number;
    totalCost: number;
    totalIterations: number;
    maxDepth: number;
  } {
    const total = this.countByProject(projectId);

    // Count by status
    const statusCounts = this.all<{ status: AgentStatus; count: number }>(
      'SELECT status, COUNT(*) as count FROM agents WHERE project_id = ? GROUP BY status',
      [projectId]
    );

    const byStatus: Record<AgentStatus, number> = {
      created: 0,
      idle: 0,
      working: 0,
      paused: 0,
      completed: 0,
      failed: 0,
    };

    statusCounts.forEach(row => {
      byStatus[row.status] = row.count;
    });

    // Total tokens, cost, iterations, and max depth
    const totals = this.get<{
      total_tokens: number;
      total_cost: number;
      total_iterations: number;
      max_depth: number;
    }>(
      `SELECT
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost,
        SUM(iteration_count) as total_iterations,
        MAX(depth) as max_depth
      FROM agents
      WHERE project_id = ?`,
      [projectId]
    );

    return {
      total,
      byStatus,
      totalTokens: totals?.total_tokens ?? 0,
      totalCost: totals?.total_cost ?? 0,
      totalIterations: totals?.total_iterations ?? 0,
      maxDepth: totals?.max_depth ?? 0,
    };
  }

  /**
   * Delete all agents for a project
   */
  public deleteByProjectId(projectId: string): number {
    const sql = `DELETE FROM agents WHERE project_id = ?`;
    const result = this.run(sql, [projectId]);
    return result.changes;
  }
}

// Export singleton instance
export default new AgentRepository();
