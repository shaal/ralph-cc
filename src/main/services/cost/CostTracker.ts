/**
 * CostTracker - Real-time cost tracking and budget enforcement
 *
 * Features:
 * - Calculate cost from token usage
 * - Track project and agent costs
 * - Budget limit checking
 * - Warning threshold notifications
 * - Cost breakdown by model
 */

import { getModelPricing, ModelPricing } from '../config/defaults';
import { getEventBus } from '../events/EventBus';

/**
 * Token usage interface
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Cost breakdown interface
 */
export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

/**
 * Project cost summary
 */
export interface ProjectCostSummary {
  projectId: string;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  budgetLimit?: number;
  budgetUsedPercentage: number;
  costByModel: Record<string, CostBreakdown>;
  agentCosts: Record<string, number>;
}

/**
 * Budget status
 */
export interface BudgetStatus {
  projectId: string;
  currentCost: number;
  budgetLimit: number;
  remaining: number;
  percentageUsed: number;
  isAtWarning: boolean;
  isExceeded: boolean;
}

/**
 * CostTracker class
 */
export class CostTracker {
  private eventBus = getEventBus();

  // In-memory cache of project costs
  private projectCosts: Map<string, ProjectCostSummary> = new Map();

  constructor() {}

  /**
   * Calculate cost from token usage
   *
   * @param usage - Token usage (input and output)
   * @param model - Model name
   * @returns Cost in USD
   */
  public calculateCost(usage: TokenUsage, model: string): number {
    const pricing = getModelPricing(model);

    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Calculate detailed cost breakdown
   *
   * @param usage - Token usage
   * @param model - Model name
   * @returns Detailed cost breakdown
   */
  public calculateCostBreakdown(usage: TokenUsage, model: string): CostBreakdown {
    const pricing = getModelPricing(model);

    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

    return {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      model,
    };
  }

  /**
   * Track cost for a project iteration
   *
   * @param projectId - Project ID
   * @param agentId - Agent ID
   * @param usage - Token usage
   * @param model - Model name
   * @param budgetLimit - Optional budget limit
   */
  public trackCost(
    projectId: string,
    agentId: string,
    usage: TokenUsage,
    model: string,
    budgetLimit?: number
  ): void {
    const cost = this.calculateCost(usage, model);

    // Get or create project cost summary
    let summary = this.projectCosts.get(projectId);

    if (!summary) {
      summary = {
        projectId,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        budgetLimit,
        budgetUsedPercentage: 0,
        costByModel: {},
        agentCosts: {},
      };
      this.projectCosts.set(projectId, summary);
    }

    // Update totals
    summary.totalCost += cost;
    summary.totalInputTokens += usage.inputTokens;
    summary.totalOutputTokens += usage.outputTokens;

    // Update budget limit if provided
    if (budgetLimit !== undefined) {
      summary.budgetLimit = budgetLimit;
    }

    // Calculate budget percentage
    if (summary.budgetLimit && summary.budgetLimit > 0) {
      summary.budgetUsedPercentage = summary.totalCost / summary.budgetLimit;
    }

    // Update cost by model
    if (!summary.costByModel[model]) {
      summary.costByModel[model] = {
        inputTokens: 0,
        outputTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        model,
      };
    }

    const breakdown = this.calculateCostBreakdown(usage, model);
    summary.costByModel[model].inputTokens += breakdown.inputTokens;
    summary.costByModel[model].outputTokens += breakdown.outputTokens;
    summary.costByModel[model].inputCost += breakdown.inputCost;
    summary.costByModel[model].outputCost += breakdown.outputCost;
    summary.costByModel[model].totalCost += breakdown.totalCost;

    // Update agent cost
    if (!summary.agentCosts[agentId]) {
      summary.agentCosts[agentId] = 0;
    }
    summary.agentCosts[agentId] += cost;

    // Emit cost updated event
    this.eventBus.emit({
      type: 'cost_updated',
      projectId,
      agentId,
      data: {
        projectId,
        agentId,
        incrementalCost: cost,
        totalCost: summary.totalCost,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    });
  }

  /**
   * Check budget status for a project
   *
   * @param projectId - Project ID
   * @param budgetLimit - Budget limit in USD
   * @param warningThreshold - Warning threshold (0-1, default 0.8)
   * @returns Budget status
   */
  public checkBudget(
    projectId: string,
    budgetLimit: number,
    warningThreshold: number = 0.8
  ): BudgetStatus {
    const summary = this.projectCosts.get(projectId);

    if (!summary) {
      return {
        projectId,
        currentCost: 0,
        budgetLimit,
        remaining: budgetLimit,
        percentageUsed: 0,
        isAtWarning: false,
        isExceeded: false,
      };
    }

    const remaining = budgetLimit - summary.totalCost;
    const percentageUsed = summary.totalCost / budgetLimit;
    const isAtWarning = percentageUsed >= warningThreshold;
    const isExceeded = summary.totalCost >= budgetLimit;

    // Emit warning event if at threshold
    if (isAtWarning && !isExceeded) {
      this.eventBus.emit({
        type: 'budget_warning',
        projectId,
        data: {
          projectId,
          currentCost: summary.totalCost,
          budgetLimit,
          percentageUsed,
        },
      });
    }

    // Emit exceeded event if over budget
    if (isExceeded) {
      this.eventBus.emit({
        type: 'budget_exceeded',
        projectId,
        data: {
          projectId,
          currentCost: summary.totalCost,
          budgetLimit,
        },
      });
    }

    return {
      projectId,
      currentCost: summary.totalCost,
      budgetLimit,
      remaining,
      percentageUsed,
      isAtWarning,
      isExceeded,
    };
  }

  /**
   * Get project cost summary
   *
   * @param projectId - Project ID
   * @returns Project cost summary or null if not found
   */
  public getProjectCost(projectId: string): ProjectCostSummary | null {
    return this.projectCosts.get(projectId) || null;
  }

  /**
   * Get agent cost within a project
   *
   * @param projectId - Project ID
   * @param agentId - Agent ID
   * @returns Agent cost or 0 if not found
   */
  public getAgentCost(projectId: string, agentId: string): number {
    const summary = this.projectCosts.get(projectId);
    return summary?.agentCosts[agentId] || 0;
  }

  /**
   * Initialize project cost tracking
   *
   * @param projectId - Project ID
   * @param budgetLimit - Budget limit in USD
   */
  public initializeProject(projectId: string, budgetLimit?: number): void {
    if (!this.projectCosts.has(projectId)) {
      this.projectCosts.set(projectId, {
        projectId,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        budgetLimit,
        budgetUsedPercentage: 0,
        costByModel: {},
        agentCosts: {},
      });
    }
  }

  /**
   * Update project budget limit
   *
   * @param projectId - Project ID
   * @param budgetLimit - New budget limit
   */
  public updateBudgetLimit(projectId: string, budgetLimit: number): void {
    const summary = this.projectCosts.get(projectId);

    if (summary) {
      summary.budgetLimit = budgetLimit;
      summary.budgetUsedPercentage =
        budgetLimit > 0 ? summary.totalCost / budgetLimit : 0;
    }
  }

  /**
   * Reset project cost tracking
   *
   * @param projectId - Project ID
   */
  public resetProject(projectId: string): void {
    this.projectCosts.delete(projectId);
  }

  /**
   * Get all project costs
   *
   * @returns Map of project IDs to cost summaries
   */
  public getAllProjectCosts(): Map<string, ProjectCostSummary> {
    return new Map(this.projectCosts);
  }

  /**
   * Estimate cost for a given token count
   *
   * @param tokens - Number of tokens
   * @param model - Model name
   * @param type - Token type ('input' or 'output')
   * @returns Estimated cost in USD
   */
  public estimateCost(
    tokens: number,
    model: string,
    type: 'input' | 'output' = 'input'
  ): number {
    const pricing = getModelPricing(model);
    const rate = type === 'input' ? pricing.input : pricing.output;
    return (tokens / 1_000_000) * rate;
  }

  /**
   * Format cost as currency string
   *
   * @param cost - Cost in USD
   * @returns Formatted currency string
   */
  public formatCost(cost: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);
  }

  /**
   * Format token count with thousands separator
   *
   * @param tokens - Token count
   * @returns Formatted token count
   */
  public formatTokens(tokens: number): string {
    return new Intl.NumberFormat('en-US').format(tokens);
  }

  /**
   * Clear all cost tracking data
   */
  public clearAll(): void {
    this.projectCosts.clear();
  }
}

/**
 * Export singleton instance
 */
let costTrackerInstance: CostTracker | null = null;

export function getCostTracker(): CostTracker {
  if (!costTrackerInstance) {
    costTrackerInstance = new CostTracker();
  }
  return costTrackerInstance;
}

export function resetCostTracker(): void {
  costTrackerInstance = null;
}
