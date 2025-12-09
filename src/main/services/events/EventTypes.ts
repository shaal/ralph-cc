/**
 * Event type definitions for Constellation
 * All events flow through the EventBus and are persisted to the database
 */

/**
 * Base event interface with common fields
 */
export interface BaseEvent {
  id: string;
  timestamp: Date;
  projectId?: string;
  agentId?: string;
}

/**
 * Project lifecycle events
 */
export interface ProjectCreatedEvent extends BaseEvent {
  type: 'project_created';
  data: {
    projectId: string;
    name: string;
    description?: string;
  };
}

export interface ProjectStartedEvent extends BaseEvent {
  type: 'project_started';
  data: {
    projectId: string;
  };
}

export interface ProjectPausedEvent extends BaseEvent {
  type: 'project_paused';
  data: {
    projectId: string;
    reason?: string;
  };
}

export interface ProjectResumedEvent extends BaseEvent {
  type: 'project_resumed';
  data: {
    projectId: string;
  };
}

export interface ProjectStoppedEvent extends BaseEvent {
  type: 'project_stopped';
  data: {
    projectId: string;
    reason?: string;
  };
}

export interface ProjectCompletedEvent extends BaseEvent {
  type: 'project_completed';
  data: {
    projectId: string;
    totalIterations: number;
    totalCost: number;
    duration: number;
  };
}

export interface ProjectFailedEvent extends BaseEvent {
  type: 'project_failed';
  data: {
    projectId: string;
    error: string;
    errorStack?: string;
  };
}

/**
 * Agent lifecycle events
 */
export interface AgentCreatedEvent extends BaseEvent {
  type: 'agent_created';
  data: {
    agentId: string;
    projectId: string;
    parentId?: string;
    name?: string;
    depth: number;
  };
}

export interface AgentStatusChangedEvent extends BaseEvent {
  type: 'agent_status_changed';
  data: {
    agentId: string;
    previousStatus: string;
    newStatus: string;
  };
}

export interface AgentOutputChunkEvent extends BaseEvent {
  type: 'agent_output_chunk';
  data: {
    agentId: string;
    chunk: string;
    chunkIndex: number;
  };
}

export interface AgentToolCallEvent extends BaseEvent {
  type: 'agent_tool_call';
  data: {
    agentId: string;
    toolName: string;
    toolInput: any;
    toolCallId: string;
  };
}

export interface AgentToolResultEvent extends BaseEvent {
  type: 'agent_tool_result';
  data: {
    agentId: string;
    toolCallId: string;
    result: any;
    success: boolean;
    error?: string;
  };
}

export interface AgentIterationCompleteEvent extends BaseEvent {
  type: 'agent_iteration_complete';
  data: {
    agentId: string;
    iteration: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    duration: number;
  };
}

/**
 * Cost and budget events
 */
export interface CostUpdatedEvent extends BaseEvent {
  type: 'cost_updated';
  data: {
    projectId: string;
    agentId?: string;
    incrementalCost: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
  };
}

export interface BudgetWarningEvent extends BaseEvent {
  type: 'budget_warning';
  data: {
    projectId: string;
    currentCost: number;
    budgetLimit: number;
    percentageUsed: number;
  };
}

export interface BudgetExceededEvent extends BaseEvent {
  type: 'budget_exceeded';
  data: {
    projectId: string;
    currentCost: number;
    budgetLimit: number;
  };
}

/**
 * Circuit breaker events
 */
export interface CircuitBreakerTriggeredEvent extends BaseEvent {
  type: 'circuit_breaker_triggered';
  data: {
    projectId: string;
    reason: 'max_consecutive_failures' | 'max_consecutive_completions' | 'timeout' | 'custom';
    details: string;
    consecutiveFailures?: number;
    consecutiveCompletions?: number;
  };
}

/**
 * Error events
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  data: {
    source: string;
    error: string;
    errorStack?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
  };
}

/**
 * File operation events
 */
export interface FileCreatedEvent extends BaseEvent {
  type: 'file_created';
  data: {
    agentId: string;
    path: string;
    size: number;
  };
}

export interface FileModifiedEvent extends BaseEvent {
  type: 'file_modified';
  data: {
    agentId: string;
    path: string;
    previousSize: number;
    newSize: number;
  };
}

export interface FileDeletedEvent extends BaseEvent {
  type: 'file_deleted';
  data: {
    agentId: string;
    path: string;
  };
}

/**
 * Union type of all events
 */
export type AppEvent =
  | ProjectCreatedEvent
  | ProjectStartedEvent
  | ProjectPausedEvent
  | ProjectResumedEvent
  | ProjectStoppedEvent
  | ProjectCompletedEvent
  | ProjectFailedEvent
  | AgentCreatedEvent
  | AgentStatusChangedEvent
  | AgentOutputChunkEvent
  | AgentToolCallEvent
  | AgentToolResultEvent
  | AgentIterationCompleteEvent
  | CostUpdatedEvent
  | BudgetWarningEvent
  | BudgetExceededEvent
  | CircuitBreakerTriggeredEvent
  | ErrorEvent
  | FileCreatedEvent
  | FileModifiedEvent
  | FileDeletedEvent;

/**
 * Event type string literal union
 */
export type EventType = AppEvent['type'];

/**
 * Helper type to extract event data type from event type string
 */
export type EventDataForType<T extends EventType> = Extract<AppEvent, { type: T }>['data'];

/**
 * Critical events that should never be throttled
 */
export const CRITICAL_EVENT_TYPES: EventType[] = [
  'error',
  'budget_exceeded',
  'circuit_breaker_triggered',
  'project_failed',
];

/**
 * Events that can be safely batched/throttled
 */
export const THROTTLEABLE_EVENT_TYPES: EventType[] = [
  'agent_output_chunk',
  'cost_updated',
];
