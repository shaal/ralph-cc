/**
 * AgentOrchestrator - Manages agent lifecycle and state
 * Handles agent creation, persistence, and hierarchy
 */

import type { Agent, AgentLoopConfig } from '../ralph/RalphLoop';
import type { Message } from '../../claude/types';
import { EventBus, getEventBus } from '../EventBus';
import { v4 as uuidv4 } from 'uuid';
import { AgentRepository } from '../../database/repositories/AgentRepository';

export interface CreateAgentParams {
  projectId: string;
  name?: string;
  parentId?: string;
  config?: Partial<AgentLoopConfig>;
}

export interface AgentState {
  id: string;
  projectId: string;
  parentId?: string;
  name: string;
  status: 'created' | 'running' | 'paused' | 'stopped' | 'error' | 'completed';
  config: AgentLoopConfig;
  history: Message[];
  outputs: unknown[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    totalTokens: number;
    totalCost: number;
    iterationCount: number;
  };
}

export class AgentOrchestrator {
  private agents: Map<string, AgentState> = new Map();
  private eventBus: EventBus;
  private defaultConfig: AgentLoopConfig;
  private agentRepo: AgentRepository;

  constructor(
    defaultConfig: AgentLoopConfig,
    eventBus?: EventBus
  ) {
    this.defaultConfig = defaultConfig;
    this.eventBus = eventBus || getEventBus();
    this.agentRepo = new AgentRepository();

    // Subscribe to agent events to update state
    this.subscribeToEvents();
  }

  /**
   * Create a new agent
   */
  async createAgent(params: CreateAgentParams): Promise<Agent> {
    const agentId = uuidv4();

    const agentState: AgentState = {
      id: agentId,
      projectId: params.projectId,
      parentId: params.parentId,
      name: params.name || `Agent-${agentId.slice(0, 8)}`,
      status: 'created',
      config: {
        ...this.defaultConfig,
        ...params.config,
      },
      history: [],
      outputs: [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalTokens: 0,
        totalCost: 0,
        iterationCount: 0,
      },
    };

    this.agents.set(agentId, agentState);

    // Emit event
    this.eventBus.emit('agent_created', {
      agentId,
      projectId: params.projectId,
      parentId: params.parentId,
    });

    return this.toAgent(agentState);
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    const state = this.agents.get(agentId);
    return state ? this.toAgent(state) : undefined;
  }

  /**
   * Get all agents for a project
   */
  getAgentsByProject(projectId: string): Agent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.projectId === projectId)
      .map(state => this.toAgent(state));
  }

  /**
   * Get child agents
   */
  getChildAgents(parentId: string): Agent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.parentId === parentId)
      .map(state => this.toAgent(state));
  }

  /**
   * Update agent status
   */
  async updateStatus(agentId: string, status: AgentState['status']): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.status = status;
    agent.metadata.updatedAt = Date.now();

    this.eventBus.emit('agent_status_changed', {
      agentId,
      status,
    });
  }

  /**
   * Pause an agent
   */
  async pauseAgent(agentId: string): Promise<void> {
    await this.updateStatus(agentId, 'paused');

    this.eventBus.emit('agent_paused', {
      agentId,
    });
  }

  /**
   * Resume an agent
   */
  async resumeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status !== 'paused') {
      throw new Error(`Agent is not paused: ${agentId}`);
    }

    await this.updateStatus(agentId, 'running');
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId: string): Promise<void> {
    await this.updateStatus(agentId, 'stopped');

    this.eventBus.emit('agent_stopped', {
      agentId,
    });
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Stop if running
    if (agent.status === 'running') {
      await this.stopAgent(agentId);
    }

    this.agents.delete(agentId);
  }

  /**
   * Update agent metadata
   */
  updateMetadata(
    agentId: string,
    updates: Partial<AgentState['metadata']>
  ): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.metadata = {
      ...agent.metadata,
      ...updates,
      updatedAt: Date.now(),
    };
  }

  /**
   * Add message to agent history
   */
  addMessage(agentId: string, message: Message): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.history.push(message);
    agent.metadata.updatedAt = Date.now();
  }

  /**
   * Get agent history
   */
  getHistory(agentId: string): Message[] {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return [...agent.history];
  }

  /**
   * Clear agent history
   */
  clearHistory(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.history = [];
    agent.metadata.updatedAt = Date.now();
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Get agent count by project
   */
  getAgentCountByProject(projectId: string): number {
    return Array.from(this.agents.values())
      .filter(agent => agent.projectId === projectId)
      .length;
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values()).map(state => this.toAgent(state));
  }

  /**
   * Clear all agents
   */
  clearAll(): void {
    this.agents.clear();
  }

  /**
   * Subscribe to events to update agent state
   */
  private subscribeToEvents(): void {
    // Update status when events occur
    this.eventBus.subscribe('agent_started', (event) => {
      const agentId = event.data.agentId as string;
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = 'running';
        agent.metadata.updatedAt = Date.now();
      }
    });

    this.eventBus.subscribe('iteration_complete', (event) => {
      const agentId = event.data.agentId as string;
      const agent = this.agents.get(agentId);
      if (agent && event.data.result) {
        const result = event.data.result as any;
        agent.metadata.iterationCount++;
        agent.metadata.totalCost += result.cost || 0;
        agent.metadata.totalTokens += (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0);
        agent.metadata.updatedAt = Date.now();
      }
    });

    this.eventBus.subscribe('project_completed', (event) => {
      const projectId = event.data.projectId as string;
      // Mark all project agents as completed
      Array.from(this.agents.values())
        .filter(agent => agent.projectId === projectId)
        .forEach(agent => {
          agent.status = 'completed';
          agent.metadata.updatedAt = Date.now();
        });
    });
  }

  /**
   * Convert AgentState to Agent
   */
  private toAgent(state: AgentState): Agent {
    return {
      id: state.id,
      projectId: state.projectId,
      parentId: state.parentId,
      name: state.name,
      status: state.status,
      config: state.config,
      history: state.history,
      outputs: state.outputs,
    };
  }

  /**
   * Save agent state (for persistence)
   * This would integrate with the database service
   */
  async saveState(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Map AgentState status to database AgentStatus
    const statusMap: Record<AgentState['status'], string> = {
      'created': 'created',
      'running': 'working',
      'paused': 'paused',
      'stopped': 'idle',
      'error': 'failed',
      'completed': 'completed',
    };

    // Update the agent in the database
    this.agentRepo.update(agentId, {
      name: agent.name,
      status: statusMap[agent.status] as any,
      config: agent.config,
      current_task: agent.history.length > 0 ? 'Processing' : null,
      total_tokens: agent.metadata.totalTokens,
      total_cost: agent.metadata.totalCost,
      iteration_count: agent.metadata.iterationCount,
    });
  }

  /**
   * Restore agent state (from persistence)
   */
  async restoreState(agentId: string): Promise<Agent> {
    const dbAgent = this.agentRepo.findByIdWithConfig(agentId);
    if (!dbAgent) {
      throw new Error(`Agent not found in database: ${agentId}`);
    }

    // Map database AgentStatus to AgentState status
    const statusMap: Record<string, AgentState['status']> = {
      'created': 'created',
      'idle': 'stopped',
      'working': 'running',
      'paused': 'paused',
      'completed': 'completed',
      'failed': 'error',
    };

    const agentState: AgentState = {
      id: dbAgent.id,
      projectId: dbAgent.project_id,
      parentId: dbAgent.parent_id || undefined,
      name: dbAgent.name || `Agent-${dbAgent.id.slice(0, 8)}`,
      status: statusMap[dbAgent.status] || 'created',
      config: dbAgent.config as AgentLoopConfig,
      history: [], // History will be loaded separately if needed
      outputs: [],
      metadata: {
        createdAt: new Date(dbAgent.created_at).getTime(),
        updatedAt: dbAgent.updated_at ? new Date(dbAgent.updated_at).getTime() : Date.now(),
        totalTokens: dbAgent.total_tokens,
        totalCost: dbAgent.total_cost,
        iterationCount: dbAgent.iteration_count,
      },
    };

    this.agents.set(agentId, agentState);
    return this.toAgent(agentState);
  }
}
