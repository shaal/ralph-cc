/**
 * Circuit Breaker implementation for Ralph loops
 * Stops execution when too many failures or completions occur
 */

export interface CircuitBreakerConfig {
  maxConsecutiveFailures: number;
  maxConsecutiveCompletions: number;
  timeoutMinutes?: number;
}

export interface CircuitBreakerState {
  consecutiveFailures: number;
  consecutiveCompletions: number;
  lastSuccessTimestamp: number;
  lastFailureTimestamp: number;
  isTripped: boolean;
  tripReason?: 'max_failures' | 'max_completions' | 'timeout';
}

export interface CircuitBreakerResult {
  ok: boolean;
  reason?: string;
  shouldStop: boolean;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Create initial circuit breaker state
   */
  createState(): CircuitBreakerState {
    return {
      consecutiveFailures: 0,
      consecutiveCompletions: 0,
      lastSuccessTimestamp: Date.now(),
      lastFailureTimestamp: 0,
      isTripped: false,
    };
  }

  /**
   * Check if circuit breaker should trip
   */
  check(state: CircuitBreakerState): CircuitBreakerResult {
    // Check for too many consecutive failures
    if (state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      return {
        ok: false,
        reason: `Circuit breaker tripped: ${state.consecutiveFailures} consecutive failures`,
        shouldStop: true,
      };
    }

    // Check for too many consecutive completions (indicates agent is done)
    if (state.consecutiveCompletions >= this.config.maxConsecutiveCompletions) {
      return {
        ok: false,
        reason: `Circuit breaker tripped: ${state.consecutiveCompletions} consecutive completions (task likely complete)`,
        shouldStop: true,
      };
    }

    // Check for timeout
    if (this.config.timeoutMinutes) {
      const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
      const elapsed = Date.now() - state.lastSuccessTimestamp;
      if (elapsed > timeoutMs) {
        return {
          ok: false,
          reason: `Circuit breaker tripped: timeout after ${this.config.timeoutMinutes} minutes`,
          shouldStop: true,
        };
      }
    }

    return {
      ok: true,
      shouldStop: false,
    };
  }

  /**
   * Record a successful iteration
   */
  recordSuccess(state: CircuitBreakerState): void {
    state.consecutiveFailures = 0;
    state.lastSuccessTimestamp = Date.now();
    state.isTripped = false;
    state.tripReason = undefined;
  }

  /**
   * Record a completion (no tool calls)
   */
  recordCompletion(state: CircuitBreakerState): void {
    state.consecutiveCompletions++;
    state.consecutiveFailures = 0;
    state.lastSuccessTimestamp = Date.now();
  }

  /**
   * Record tool calls (resets completion counter)
   */
  recordToolCalls(state: CircuitBreakerState): void {
    state.consecutiveCompletions = 0;
    state.consecutiveFailures = 0;
    state.lastSuccessTimestamp = Date.now();
  }

  /**
   * Record a failure
   */
  recordFailure(state: CircuitBreakerState): void {
    state.consecutiveFailures++;
    state.consecutiveCompletions = 0;
    state.lastFailureTimestamp = Date.now();
  }

  /**
   * Reset the circuit breaker
   */
  reset(state: CircuitBreakerState): void {
    state.consecutiveFailures = 0;
    state.consecutiveCompletions = 0;
    state.isTripped = false;
    state.tripReason = undefined;
    state.lastSuccessTimestamp = Date.now();
  }

  /**
   * Manually trip the circuit breaker
   */
  trip(state: CircuitBreakerState, reason: CircuitBreakerState['tripReason']): void {
    state.isTripped = true;
    state.tripReason = reason;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  calculateBackoff(failureCount: number, baseDelayMs = 1000, maxDelayMs = 60000): number {
    const delay = Math.min(baseDelayMs * Math.pow(2, failureCount), maxDelayMs);
    const jitter = Math.random() * delay * 0.1; // Add 10% jitter
    return Math.floor(delay + jitter);
  }
}
