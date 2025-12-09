/**
 * RalphLoop - Implements the continuous agent iteration loop
 * The core "while :; do cat PROMPT.md | agent ; done" pattern
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Message, ToolCall } from '../../claude/types';
import { ClaudeClient } from '../../claude/ClaudeClient';
import { CircuitBreaker, type CircuitBreakerState, type CircuitBreakerConfig } from './CircuitBreaker';
import { CostTracker, type CostState, type BudgetConfig } from './CostTracker';
import { ToolExecutor, type SandboxConfig } from '../tools/ToolExecutor';
import { getToolRegistry } from '../tools/ToolRegistry';
import { EventBus, type EventType } from '../EventBus';

export type LoopStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error' | 'completed';

export interface Project {
  id: string;
  name: string;
  promptPath: string;
  workingDirectory: string;
  status: string;
  settings: ProjectSettings;
}

export interface Agent {
  id: string;
  projectId: string;
  parentId?: string;
  name: string;
  status: string;
  config: AgentLoopConfig;
  history: Message[];
  outputs: unknown[];
}

export interface ProjectSettings {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxIterations?: number;
  budgetLimit?: number;
  enabledTools?: string[];
  circuitBreaker?: CircuitBreakerConfig;
  sandbox?: SandboxConfig;
}

export interface AgentLoopConfig {
  model: string;
  maxTokens: number;
  temperature?: number;
  systemPrompt?: string;
  maxIterations: number;
  circuitBreaker: CircuitBreakerConfig;
  budget: BudgetConfig;
  sandbox: SandboxConfig;
  enabledTools: string[];
}

export interface RalphLoopConfig extends AgentLoopConfig {}

export class RalphLoop {
  private project: Project;
  private agent: Agent;
  private config: RalphLoopConfig;
  private status: LoopStatus = 'idle';
  private iteration: number = 0;

  private claudeClient: ClaudeClient;
  private circuitBreaker: CircuitBreaker;
  private costTracker: CostTracker;
  private toolExecutor: ToolExecutor;
  private eventBus: EventBus;
  private toolRegistry = getToolRegistry();

  private circuitBreakerState: CircuitBreakerState;
  private costState: CostState;

  private stopRequested = false;
  private pauseRequested = false;

  constructor(
    project: Project,
    agent: Agent,
    config: RalphLoopConfig,
    claudeClient: ClaudeClient,
    eventBus: EventBus
  ) {
    this.project = project;
    this.agent = agent;
    this.config = config;
    this.claudeClient = claudeClient;
    this.eventBus = eventBus;

    // Initialize services
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.costTracker = new CostTracker(config.budget);
    this.toolExecutor = new ToolExecutor(config.sandbox);

    // Initialize states
    this.circuitBreakerState = this.circuitBreaker.createState();
    this.costState = this.costTracker.createState();
  }

  /**
   * Start the Ralph loop
   */
  async start(): Promise<void> {
    this.status = 'running';
    this.stopRequested = false;
    this.pauseRequested = false;

    this.emit('agent_started', {
      agentId: this.agent.id,
      projectId: this.project.id,
    });

    try {
      await this.runLoop();
    } catch (error) {
      this.status = 'error';
      this.emit('iteration_error', {
        agentId: this.agent.id,
        projectId: this.project.id,
        iteration: this.iteration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Main loop implementation
   */
  private async runLoop(): Promise<void> {
    while (this.status === 'running' && !this.stopRequested) {
      // Check for pause
      if (this.pauseRequested) {
        await this.pause();
        break;
      }

      // Check iteration limit
      if (this.iteration >= this.config.maxIterations) {
        this.emit('project_completed', {
          projectId: this.project.id,
          reason: 'max_iterations_reached',
        });
        this.status = 'completed';
        break;
      }

      // Check circuit breaker
      const circuitCheck = this.circuitBreaker.check(this.circuitBreakerState);
      if (!circuitCheck.ok) {
        this.emit('circuit_breaker_triggered', {
          projectId: this.project.id,
          agentId: this.agent.id,
          reason: circuitCheck.reason,
        });
        await this.pause();
        break;
      }

      // Check budget
      const budgetCheck = this.costTracker.checkBudget(this.costState);
      if (!budgetCheck.ok) {
        this.emit('budget_exceeded', {
          projectId: this.project.id,
          agentId: this.agent.id,
          current: budgetCheck.current,
          limit: budgetCheck.limit,
        });
        await this.pause();
        break;
      }

      // Warn if approaching budget limit
      if (budgetCheck.reason && this.costTracker.isApproachingLimit(this.costState)) {
        this.emit('budget_warning', {
          projectId: this.project.id,
          agentId: this.agent.id,
          current: budgetCheck.current,
          limit: budgetCheck.limit,
          percentUsed: budgetCheck.percentUsed,
        });
      }

      // Execute iteration
      try {
        await this.executeIteration();
      } catch (error) {
        this.circuitBreaker.recordFailure(this.circuitBreakerState);

        const backoffMs = this.circuitBreaker.calculateBackoff(
          this.circuitBreakerState.consecutiveFailures
        );

        this.emit('iteration_error', {
          agentId: this.agent.id,
          projectId: this.project.id,
          iteration: this.iteration,
          error: error instanceof Error ? error.message : String(error),
          backoffMs,
        });

        // Wait before retrying
        await this.sleep(backoffMs);
      }

      this.iteration++;
    }

    // Final status
    if (this.stopRequested) {
      this.status = 'stopped';
      this.emit('agent_stopped', {
        agentId: this.agent.id,
        projectId: this.project.id,
      });
    }
  }

  /**
   * Execute a single iteration
   */
  private async executeIteration(): Promise<void> {
    // Load current prompt
    const prompt = await this.loadPrompt();

    // Get enabled tools
    const tools = this.toolRegistry.getByNames(this.config.enabledTools);
    const claudeTools = tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

    // Execute Claude iteration
    const result = await this.claudeClient.runIteration(
      this.agent.id,
      this.config.systemPrompt || '',
      this.agent.history,
      claudeTools,
      {
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
      {
        onChunk: (chunk: string) => {
          this.emit('agent_output_chunk', {
            agentId: this.agent.id,
            projectId: this.project.id,
            chunk,
          });
        },
        onToolCall: (toolCall: ToolCall) => {
          this.emit('agent_tool_call', {
            agentId: this.agent.id,
            projectId: this.project.id,
            toolCall,
          });
        },
      }
    );

    // Record cost
    this.costTracker.recordCost(
      this.costState,
      result.cost,
      result.usage.inputTokens,
      result.usage.outputTokens
    );

    // Process result
    if (result.type === 'completion') {
      this.circuitBreaker.recordCompletion(this.circuitBreakerState);

      // Add to history
      this.agent.history.push({
        role: 'assistant',
        content: result.output,
      });

      // Check if we should stop due to consecutive completions
      const circuitCheck = this.circuitBreaker.check(this.circuitBreakerState);
      if (!circuitCheck.ok && circuitCheck.reason?.includes('consecutive completions')) {
        this.emit('project_completed', {
          projectId: this.project.id,
          agentId: this.agent.id,
          reason: 'consecutive_completions',
        });
        this.status = 'completed';
      }
    } else if (result.type === 'tool_calls') {
      this.circuitBreaker.recordToolCalls(this.circuitBreakerState);

      // Execute tool calls
      for (const toolCall of result.toolCalls) {
        const toolResult = await this.executeTool(toolCall);

        // Add tool result to conversation
        this.agent.history.push({
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: toolCall.id,
              name: toolCall.name,
              input: toolCall.input,
            },
          ],
        });

        this.agent.history.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: toolResult.content,
            },
          ],
        });

        this.emit('tool_executed', {
          projectId: this.project.id,
          agentId: this.agent.id,
          toolCall,
          toolResult,
        });
      }
    }

    // Emit iteration complete
    this.emit('iteration_complete', {
      projectId: this.project.id,
      agentId: this.agent.id,
      iteration: this.iteration,
      result: {
        type: result.type,
        output: result.output,
        cost: result.cost,
        usage: result.usage,
      },
      costState: this.costState,
    });
  }

  /**
   * Execute a tool call
   */
  private async executeTool(toolCall: ToolCall): Promise<{ content: string; is_error?: boolean }> {
    const result = await this.toolExecutor.execute(toolCall, {
      agentId: this.agent.id,
      projectId: this.project.id,
      workingDirectory: this.project.workingDirectory,
      allowedPaths: this.config.sandbox.allowedPaths,
      deniedCommands: this.config.sandbox.deniedCommands,
    });

    return {
      content: result.content,
      is_error: result.is_error,
    };
  }

  /**
   * Load prompt from file
   */
  private async loadPrompt(): Promise<string> {
    try {
      const content = fs.readFileSync(this.project.promptPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load prompt from ${this.project.promptPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Pause the loop
   */
  async pause(): Promise<void> {
    this.pauseRequested = true;
    this.status = 'paused';

    this.emit('agent_paused', {
      agentId: this.agent.id,
      projectId: this.project.id,
    });
  }

  /**
   * Resume the loop
   */
  async resume(): Promise<void> {
    if (this.status !== 'paused') {
      throw new Error('Loop is not paused');
    }

    this.pauseRequested = false;
    this.status = 'running';

    // Restart the loop
    await this.start();
  }

  /**
   * Stop the loop
   */
  async stop(): Promise<void> {
    this.stopRequested = true;
    this.status = 'stopped';
  }

  /**
   * Get current status
   */
  getStatus(): LoopStatus {
    return this.status;
  }

  /**
   * Get current iteration
   */
  getIteration(): number {
    return this.iteration;
  }

  /**
   * Get cost state
   */
  getCostState(): CostState {
    return { ...this.costState };
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreakerState };
  }

  /**
   * Emit event
   */
  private emit(type: EventType, data: Record<string, unknown>): void {
    this.eventBus.emit(type, data);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
