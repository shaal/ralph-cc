/**
 * Cost tracking and budget enforcement for Ralph loops
 */

export interface BudgetConfig {
  limit?: number; // USD limit, undefined = no limit
  warningThreshold?: number; // Percentage (0-1) at which to warn
}

export interface CostState {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  iterationCount: number;
  averageCostPerIteration: number;
}

export interface BudgetCheckResult {
  ok: boolean;
  reason?: string;
  current: number;
  limit?: number;
  remaining?: number;
  percentUsed?: number;
}

export interface CostSummary extends CostState {
  estimatedTotalCost?: number;
  estimatedRemainingIterations?: number;
  confidence?: number;
}

export class CostTracker {
  private budgetConfig: BudgetConfig;

  constructor(budgetConfig: BudgetConfig = {}) {
    this.budgetConfig = {
      warningThreshold: 0.8,
      ...budgetConfig,
    };
  }

  /**
   * Create initial cost state
   */
  createState(): CostState {
    return {
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      iterationCount: 0,
      averageCostPerIteration: 0,
    };
  }

  /**
   * Record cost from an iteration
   */
  recordCost(state: CostState, cost: number, inputTokens: number, outputTokens: number): void {
    state.totalCost += cost;
    state.totalInputTokens += inputTokens;
    state.totalOutputTokens += outputTokens;
    state.iterationCount++;

    // Update running average
    state.averageCostPerIteration = state.totalCost / state.iterationCount;
  }

  /**
   * Check if budget limit has been exceeded
   */
  checkBudget(state: CostState): BudgetCheckResult {
    const current = state.totalCost;

    // No limit set
    if (this.budgetConfig.limit === undefined || this.budgetConfig.limit === null) {
      return {
        ok: true,
        current,
      };
    }

    const limit = this.budgetConfig.limit;
    const remaining = limit - current;
    const percentUsed = current / limit;

    // Budget exceeded
    if (current >= limit) {
      return {
        ok: false,
        reason: `Budget exceeded: $${current.toFixed(4)} / $${limit.toFixed(2)}`,
        current,
        limit,
        remaining: 0,
        percentUsed,
      };
    }

    // Budget warning threshold
    const warningThreshold = this.budgetConfig.warningThreshold || 0.8;
    if (percentUsed >= warningThreshold) {
      return {
        ok: true,
        reason: `Budget warning: ${(percentUsed * 100).toFixed(1)}% used ($${current.toFixed(4)} / $${limit.toFixed(2)})`,
        current,
        limit,
        remaining,
        percentUsed,
      };
    }

    // All good
    return {
      ok: true,
      current,
      limit,
      remaining,
      percentUsed,
    };
  }

  /**
   * Estimate completion cost based on historical data
   */
  estimateCompletion(state: CostState, estimatedRemainingIterations: number): CostSummary {
    const estimatedCost = state.averageCostPerIteration * estimatedRemainingIterations;
    const estimatedTotal = state.totalCost + estimatedCost;

    // Calculate confidence based on sample size
    // More iterations = higher confidence
    const confidence = Math.min(state.iterationCount / 10, 1);

    return {
      ...state,
      estimatedTotalCost: estimatedTotal,
      estimatedRemainingIterations,
      confidence,
    };
  }

  /**
   * Get cost summary with estimates
   */
  getSummary(state: CostState, estimatedRemainingIterations?: number): CostSummary {
    if (estimatedRemainingIterations !== undefined) {
      return this.estimateCompletion(state, estimatedRemainingIterations);
    }

    return {
      ...state,
    };
  }

  /**
   * Format cost as currency string
   */
  formatCost(cost: number): string {
    if (cost < 0.01) {
      return `$${cost.toFixed(6)}`;
    } else if (cost < 1) {
      return `$${cost.toFixed(4)}`;
    } else {
      return `$${cost.toFixed(2)}`;
    }
  }

  /**
   * Format token count with K/M suffixes
   */
  formatTokens(tokens: number): string {
    if (tokens < 1000) {
      return tokens.toString();
    } else if (tokens < 1_000_000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    } else {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
    }
  }

  /**
   * Update budget configuration
   */
  updateBudget(config: Partial<BudgetConfig>): void {
    this.budgetConfig = { ...this.budgetConfig, ...config };
  }

  /**
   * Get current budget configuration
   */
  getBudgetConfig(): BudgetConfig {
    return { ...this.budgetConfig };
  }

  /**
   * Check if we're approaching the budget limit
   */
  isApproachingLimit(state: CostState): boolean {
    if (!this.budgetConfig.limit) {
      return false;
    }

    const percentUsed = state.totalCost / this.budgetConfig.limit;
    const warningThreshold = this.budgetConfig.warningThreshold || 0.8;

    return percentUsed >= warningThreshold;
  }

  /**
   * Calculate cost per 1K tokens for analysis
   */
  calculateCostPer1KTokens(state: CostState): number {
    const totalTokens = state.totalInputTokens + state.totalOutputTokens;
    if (totalTokens === 0) {
      return 0;
    }
    return (state.totalCost / totalTokens) * 1000;
  }

  /**
   * Reset cost state
   */
  reset(state: CostState): void {
    state.totalCost = 0;
    state.totalInputTokens = 0;
    state.totalOutputTokens = 0;
    state.iterationCount = 0;
    state.averageCostPerIteration = 0;
  }
}
