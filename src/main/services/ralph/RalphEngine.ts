/**
 * RalphEngine - Orchestrates multiple Ralph loops
 * Manages the lifecycle of agent swarms across projects
 */

import { ClaudeClient } from '../../claude/ClaudeClient';
import { RalphLoop, type Project, type Agent, type RalphLoopConfig, type LoopStatus } from './RalphLoop';
import { EventBus, getEventBus } from '../EventBus';

export interface RalphEngineConfig {
  maxConcurrentLoops?: number;
  defaultModel?: string;
  defaultMaxTokens?: number;
  defaultMaxIterations?: number;
}

export interface LoopInfo {
  projectId: string;
  agentId: string;
  status: LoopStatus;
  iteration: number;
  costTotal: number;
}

export class RalphEngine {
  private runningLoops: Map<string, RalphLoop> = new Map();
  private claudeClient: ClaudeClient;
  private eventBus: EventBus;
  private config: RalphEngineConfig;

  constructor(
    claudeClient: ClaudeClient,
    config: RalphEngineConfig = {},
    eventBus?: EventBus
  ) {
    this.claudeClient = claudeClient;
    this.config = {
      maxConcurrentLoops: 10,
      defaultModel: 'claude-sonnet-4',
      defaultMaxTokens: 8192,
      defaultMaxIterations: 1000,
      ...config,
    };
    this.eventBus = eventBus || getEventBus();
  }

  /**
   * Start a Ralph loop for a project
   */
  async startLoop(project: Project, rootAgent: Agent): Promise<void> {
    // Check if loop already exists
    if (this.runningLoops.has(project.id)) {
      throw new Error(`Loop already running for project: ${project.id}`);
    }

    // Check concurrent limit
    if (this.runningLoops.size >= (this.config.maxConcurrentLoops || 10)) {
      throw new Error(`Maximum concurrent loops reached: ${this.config.maxConcurrentLoops}`);
    }

    // Create loop config from project settings
    const loopConfig = this.createLoopConfig(project);

    // Create and start loop
    const loop = new RalphLoop(
      project,
      rootAgent,
      loopConfig,
      this.claudeClient,
      this.eventBus
    );

    this.runningLoops.set(project.id, loop);

    // Start loop asynchronously
    loop.start().catch(error => {
      console.error(`Loop error for project ${project.id}:`, error);
      this.runningLoops.delete(project.id);
    });

    this.eventBus.emit('project_started', {
      projectId: project.id,
      agentId: rootAgent.id,
    });
  }

  /**
   * Pause a running loop
   */
  async pauseLoop(projectId: string): Promise<void> {
    const loop = this.runningLoops.get(projectId);
    if (!loop) {
      throw new Error(`No loop found for project: ${projectId}`);
    }

    await loop.pause();

    this.eventBus.emit('project_paused', {
      projectId,
    });
  }

  /**
   * Resume a paused loop
   */
  async resumeLoop(projectId: string): Promise<void> {
    const loop = this.runningLoops.get(projectId);
    if (!loop) {
      throw new Error(`No loop found for project: ${projectId}`);
    }

    await loop.resume();
  }

  /**
   * Stop a running loop
   */
  async stopLoop(projectId: string): Promise<void> {
    const loop = this.runningLoops.get(projectId);
    if (!loop) {
      throw new Error(`No loop found for project: ${projectId}`);
    }

    await loop.stop();
    this.runningLoops.delete(projectId);

    this.eventBus.emit('project_stopped', {
      projectId,
    });
  }

  /**
   * Stop all running loops
   */
  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.runningLoops.keys()).map(projectId =>
      this.stopLoop(projectId).catch(error => {
        console.error(`Error stopping loop ${projectId}:`, error);
      })
    );

    await Promise.all(stopPromises);
  }

  /**
   * Get a specific loop
   */
  getLoop(projectId: string): RalphLoop | undefined {
    return this.runningLoops.get(projectId);
  }

  /**
   * Get all running loops
   */
  getAllLoops(): RalphLoop[] {
    return Array.from(this.runningLoops.values());
  }

  /**
   * Get loop status information
   */
  getLoopInfo(projectId: string): LoopInfo | undefined {
    const loop = this.runningLoops.get(projectId);
    if (!loop) {
      return undefined;
    }

    const costState = loop.getCostState();

    return {
      projectId,
      agentId: '', // Would need to track this
      status: loop.getStatus(),
      iteration: loop.getIteration(),
      costTotal: costState.totalCost,
    };
  }

  /**
   * Get all loop information
   */
  getAllLoopInfo(): LoopInfo[] {
    return Array.from(this.runningLoops.keys())
      .map(projectId => this.getLoopInfo(projectId))
      .filter((info): info is LoopInfo => info !== undefined);
  }

  /**
   * Check if a loop is running
   */
  isRunning(projectId: string): boolean {
    const loop = this.runningLoops.get(projectId);
    return loop !== undefined && loop.getStatus() === 'running';
  }

  /**
   * Get running loop count
   */
  getRunningCount(): number {
    return this.runningLoops.size;
  }

  /**
   * Create loop configuration from project settings
   */
  private createLoopConfig(project: Project): RalphLoopConfig {
    const settings = project.settings || {};

    return {
      model: settings.model || this.config.defaultModel || 'claude-sonnet-4',
      maxTokens: settings.maxTokens || this.config.defaultMaxTokens || 8192,
      temperature: settings.temperature || 0.7,
      maxIterations: settings.maxIterations || this.config.defaultMaxIterations || 1000,
      circuitBreaker: settings.circuitBreaker || {
        maxConsecutiveFailures: 5,
        maxConsecutiveCompletions: 3,
        timeoutMinutes: 120,
      },
      budget: {
        limit: settings.budgetLimit,
        warningThreshold: 0.8,
      },
      sandbox: settings.sandbox || {
        enabled: true,
        allowedPaths: [project.workingDirectory],
        deniedCommands: ['rm -rf', 'sudo', 'format', 'mkfs'],
        maxExecutionTimeMs: 120000,
      },
      enabledTools: settings.enabledTools || [
        'bash',
        'read',
        'write',
        'edit',
        'glob',
        'grep',
      ],
      systemPrompt: `You are an AI coding assistant working on project "${project.name}".
Your working directory is: ${project.workingDirectory}

You have access to the following tools:
- bash: Execute bash commands
- read: Read file contents
- write: Write files
- edit: Edit files with exact string replacement
- glob: Find files using glob patterns
- grep: Search file contents with regex

Your goal is to complete the task described in the prompt file.
Work iteratively, making progress step by step.
Use tools to examine the codebase, make changes, and verify your work.`,
    };
  }

  /**
   * Update engine configuration
   */
  updateConfig(config: Partial<RalphEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RalphEngineConfig {
    return { ...this.config };
  }

  /**
   * Get event bus instance
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down RalphEngine...');
    await this.stopAll();
    console.log('RalphEngine shutdown complete');
  }
}
