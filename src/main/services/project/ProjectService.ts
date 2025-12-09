/**
 * ProjectService - Project business logic and lifecycle management
 *
 * Features:
 * - CRUD operations for projects
 * - Project lifecycle management (create, start, pause, resume, stop)
 * - State transition validation
 * - Event emission for all state changes
 * - Integration with EventBus and repositories
 */

import { randomUUID } from 'crypto';
import { getEventBus } from '../events/EventBus';
import { getCostTracker } from '../cost/CostTracker';

/**
 * Project status enum
 */
export type ProjectStatus =
  | 'created'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'stopped';

/**
 * Project interface
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  promptPath: string;
  settings: ProjectSettings;
  costTotal: number;
  iterationCount: number;
  createdAt: Date;
  updatedAt?: Date;
  endedAt?: Date;
}

/**
 * Project settings
 */
export interface ProjectSettings {
  model?: string;
  maxTokens?: number;
  maxIterations?: number;
  budgetLimit?: number;
  enabledTools?: string[];
  circuitBreaker?: {
    maxConsecutiveFailures?: number;
    maxConsecutiveCompletions?: number;
    timeoutMinutes?: number;
  };
  workingDirectory?: string;
  permissions?: 'readonly' | 'readwrite' | 'execute' | 'full';
}

/**
 * Create project DTO
 */
export interface CreateProjectDTO {
  name: string;
  description?: string;
  promptContent: string;
  settings?: Partial<ProjectSettings>;
}

/**
 * Update project DTO
 */
export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  created: ['running'],
  running: ['paused', 'stopped', 'completed', 'failed'],
  paused: ['running', 'stopped'],
  completed: [],
  failed: [],
  stopped: [],
};

/**
 * ProjectService class
 */
export class ProjectService {
  private eventBus = getEventBus();
  private costTracker = getCostTracker();
  private projectRepository: any = null; // Will be injected
  private agentRepository: any = null; // Will be injected

  constructor() {}

  /**
   * Set the project repository
   */
  public setProjectRepository(repository: any): void {
    this.projectRepository = repository;
  }

  /**
   * Set the agent repository
   */
  public setAgentRepository(repository: any): void {
    this.agentRepository = repository;
  }

  /**
   * Create a new project
   *
   * @param data - Project creation data
   * @returns Created project
   */
  public async create(data: CreateProjectDTO): Promise<Project> {
    if (!this.projectRepository) {
      throw new Error('ProjectRepository not initialized');
    }

    const projectId = randomUUID();

    // Create project object
    const project: Project = {
      id: projectId,
      name: data.name,
      description: data.description,
      status: 'created',
      promptPath: '', // Will be set after saving prompt file
      settings: data.settings || {},
      costTotal: 0,
      iterationCount: 0,
      createdAt: new Date(),
    };

    // Save project to database
    await this.projectRepository.create(project);

    // Initialize cost tracking
    this.costTracker.initializeProject(projectId, project.settings.budgetLimit);

    // Emit event
    this.eventBus.emit({
      type: 'project_created',
      projectId,
      data: {
        projectId,
        name: project.name,
        description: project.description,
      },
    });

    return project;
  }

  /**
   * Get project by ID
   *
   * @param id - Project ID
   * @returns Project or null if not found
   */
  public async get(id: string): Promise<Project | null> {
    if (!this.projectRepository) {
      throw new Error('ProjectRepository not initialized');
    }

    return await this.projectRepository.findById(id);
  }

  /**
   * List all projects
   *
   * @returns Array of projects
   */
  public async list(): Promise<Project[]> {
    if (!this.projectRepository) {
      throw new Error('ProjectRepository not initialized');
    }

    return await this.projectRepository.findAll();
  }

  /**
   * Update project
   *
   * @param id - Project ID
   * @param data - Update data
   * @returns Updated project
   */
  public async update(id: string, data: UpdateProjectDTO): Promise<Project> {
    if (!this.projectRepository) {
      throw new Error('ProjectRepository not initialized');
    }

    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Update fields
    if (data.name !== undefined) {
      project.name = data.name;
    }

    if (data.description !== undefined) {
      project.description = data.description;
    }

    if (data.settings !== undefined) {
      project.settings = { ...project.settings, ...data.settings };

      // Update budget limit in cost tracker
      if (data.settings.budgetLimit !== undefined) {
        this.costTracker.updateBudgetLimit(id, data.settings.budgetLimit);
      }
    }

    project.updatedAt = new Date();

    // Save to database
    await this.projectRepository.update(id, project);

    return project;
  }

  /**
   * Delete project
   *
   * @param id - Project ID
   */
  public async delete(id: string): Promise<void> {
    if (!this.projectRepository) {
      throw new Error('ProjectRepository not initialized');
    }

    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Cannot delete running projects
    if (project.status === 'running') {
      throw new Error('Cannot delete a running project. Stop it first.');
    }

    // Delete from database (cascade deletes agents, history, etc.)
    await this.projectRepository.delete(id);

    // Reset cost tracking
    this.costTracker.resetProject(id);
  }

  /**
   * Start a project
   *
   * @param id - Project ID
   */
  public async start(id: string): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Validate state transition
    this.validateTransition(project.status, 'running');

    // Update status
    project.status = 'running';
    project.updatedAt = new Date();

    await this.projectRepository.update(id, project);

    // Emit event
    this.eventBus.emit({
      type: 'project_started',
      projectId: id,
      data: {
        projectId: id,
      },
    });
  }

  /**
   * Pause a project
   *
   * @param id - Project ID
   * @param reason - Optional reason for pausing
   */
  public async pause(id: string, reason?: string): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Validate state transition
    this.validateTransition(project.status, 'paused');

    // Update status
    project.status = 'paused';
    project.updatedAt = new Date();

    await this.projectRepository.update(id, project);

    // Emit event
    this.eventBus.emit({
      type: 'project_paused',
      projectId: id,
      data: {
        projectId: id,
        reason,
      },
    });
  }

  /**
   * Resume a paused project
   *
   * @param id - Project ID
   */
  public async resume(id: string): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Validate state transition
    this.validateTransition(project.status, 'running');

    // Update status
    project.status = 'running';
    project.updatedAt = new Date();

    await this.projectRepository.update(id, project);

    // Emit event
    this.eventBus.emit({
      type: 'project_resumed',
      projectId: id,
      data: {
        projectId: id,
      },
    });
  }

  /**
   * Stop a project
   *
   * @param id - Project ID
   * @param reason - Optional reason for stopping
   */
  public async stop(id: string, reason?: string): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Validate state transition
    this.validateTransition(project.status, 'stopped');

    // Update status
    project.status = 'stopped';
    project.updatedAt = new Date();
    project.endedAt = new Date();

    await this.projectRepository.update(id, project);

    // Emit event
    this.eventBus.emit({
      type: 'project_stopped',
      projectId: id,
      data: {
        projectId: id,
        reason,
      },
    });
  }

  /**
   * Mark project as completed
   *
   * @param id - Project ID
   */
  public async complete(id: string): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Validate state transition
    this.validateTransition(project.status, 'completed');

    // Update status
    project.status = 'completed';
    project.updatedAt = new Date();
    project.endedAt = new Date();

    await this.projectRepository.update(id, project);

    // Calculate duration
    const duration = project.endedAt.getTime() - project.createdAt.getTime();

    // Emit event
    this.eventBus.emit({
      type: 'project_completed',
      projectId: id,
      data: {
        projectId: id,
        totalIterations: project.iterationCount,
        totalCost: project.costTotal,
        duration,
      },
    });
  }

  /**
   * Mark project as failed
   *
   * @param id - Project ID
   * @param error - Error message
   */
  public async fail(id: string, error: string): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Validate state transition
    this.validateTransition(project.status, 'failed');

    // Update status
    project.status = 'failed';
    project.updatedAt = new Date();
    project.endedAt = new Date();

    await this.projectRepository.update(id, project);

    // Emit event
    this.eventBus.emit({
      type: 'project_failed',
      projectId: id,
      data: {
        projectId: id,
        error,
      },
    });
  }

  /**
   * Validate state transition
   *
   * @param currentStatus - Current project status
   * @param newStatus - Desired new status
   * @throws Error if transition is invalid
   */
  private validateTransition(
    currentStatus: ProjectStatus,
    newStatus: ProjectStatus
  ): void {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid state transition: ${currentStatus} -> ${newStatus}`
      );
    }
  }

  /**
   * Increment project iteration count
   *
   * @param id - Project ID
   */
  public async incrementIteration(id: string): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    project.iterationCount += 1;
    project.updatedAt = new Date();

    await this.projectRepository.update(id, project);
  }

  /**
   * Update project cost
   *
   * @param id - Project ID
   * @param cost - Cost to add
   */
  public async updateCost(id: string, cost: number): Promise<void> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    project.costTotal += cost;
    project.updatedAt = new Date();

    await this.projectRepository.update(id, project);
  }

  /**
   * Get project statistics
   *
   * @param id - Project ID
   * @returns Project statistics
   */
  public async getStatistics(id: string): Promise<{
    project: Project;
    agentCount: number;
    costSummary: any;
  }> {
    const project = await this.get(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    // Get agent count
    let agentCount = 0;
    if (this.agentRepository) {
      const agents = await this.agentRepository.findByProjectId(id);
      agentCount = agents.length;
    }

    // Get cost summary
    const costSummary = this.costTracker.getProjectCost(id);

    return {
      project,
      agentCount,
      costSummary,
    };
  }
}

/**
 * Export singleton instance
 */
let projectServiceInstance: ProjectService | null = null;

export function getProjectService(): ProjectService {
  if (!projectServiceInstance) {
    projectServiceInstance = new ProjectService();
  }
  return projectServiceInstance;
}

export function resetProjectService(): void {
  projectServiceInstance = null;
}
