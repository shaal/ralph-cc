/**
 * Preload Type Declarations
 * Defines the window.api interface available in the renderer process
 */

import type {
  Project,
  Agent,
  AgentHistory,
  Output,
  Config,
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectCostSummary,
  FindHistoryOptions,
  ApiResponse,
} from '../main/database/types';

// ========================================
// Event Types
// ========================================

export interface AppEvent {
  type: string;
  timestamp: string;
  data: any;
}

export interface ProjectCreatedEvent extends AppEvent {
  type: 'project_created';
  data: {
    project: Project;
  };
}

export interface ProjectStartedEvent extends AppEvent {
  type: 'project_started';
  data: {
    projectId: string;
  };
}

export interface ProjectPausedEvent extends AppEvent {
  type: 'project_paused';
  data: {
    projectId: string;
  };
}

export interface ProjectResumedEvent extends AppEvent {
  type: 'project_resumed';
  data: {
    projectId: string;
  };
}

export interface ProjectStoppedEvent extends AppEvent {
  type: 'project_stopped';
  data: {
    projectId: string;
  };
}

export interface ProjectCompletedEvent extends AppEvent {
  type: 'project_completed';
  data: {
    projectId: string;
  };
}

export interface AgentOutputChunkEvent extends AppEvent {
  type: 'agent_output_chunk';
  data: {
    agentId: string;
    chunk: string;
  };
}

export interface AgentToolCallEvent extends AppEvent {
  type: 'agent_tool_call';
  data: {
    agentId: string;
    toolCall: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    };
  };
}

export interface AgentStatusChangedEvent extends AppEvent {
  type: 'agent_status_changed';
  data: {
    agentId: string;
    status: string;
    previousStatus: string;
  };
}

export interface SubagentSpawnedEvent extends AppEvent {
  type: 'subagent_spawned';
  data: {
    projectId: string;
    parentId: string;
    agent: Agent;
  };
}

export interface IterationCompleteEvent extends AppEvent {
  type: 'iteration_complete';
  data: {
    projectId: string;
    agentId: string;
    iteration: number;
    result: {
      type: 'completion' | 'tool_calls';
      output: string;
      cost: number;
      usage: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
    };
  };
}

export interface CircuitBreakerTriggeredEvent extends AppEvent {
  type: 'circuit_breaker_triggered';
  data: {
    projectId: string;
    reason: string;
  };
}

export interface BudgetExceededEvent extends AppEvent {
  type: 'budget_exceeded';
  data: {
    projectId: string;
    current: number;
    limit: number;
  };
}

export interface BudgetWarningEvent extends AppEvent {
  type: 'budget_warning';
  data: {
    projectId: string;
    current: number;
    limit: number;
    percentage: number;
  };
}

// ========================================
// API Response Helpers
// ========================================

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type IpcResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ========================================
// Agent History Response
// ========================================

export interface AgentHistoryResponse {
  history: AgentHistory[];
  total: number;
  hasMore: boolean;
}

// ========================================
// Window API Interface
// ========================================

declare global {
  interface Window {
    api: {
      // ========================================
      // Project APIs
      // ========================================
      project: {
        create: (data: CreateProjectDTO) => Promise<ApiResponse<Project>>;
        get: (id: string) => Promise<ApiResponse<Project | null>>;
        list: () => Promise<ApiResponse<Project[]>>;
        update: (id: string, data: UpdateProjectDTO) => Promise<ApiResponse<Project>>;
        delete: (id: string) => Promise<ApiResponse<void>>;
        start: (id: string) => Promise<ApiResponse<void>>;
        pause: (id: string) => Promise<ApiResponse<void>>;
        resume: (id: string) => Promise<ApiResponse<void>>;
        stop: (id: string) => Promise<ApiResponse<void>>;
        getCost: (id: string) => Promise<ApiResponse<ProjectCostSummary>>;
        getOutputs: (
          id: string,
          options?: { limit?: number; offset?: number }
        ) => Promise<ApiResponse<Output[]>>;
      };

      // ========================================
      // Agent APIs
      // ========================================
      agent: {
        get: (id: string) => Promise<ApiResponse<Agent | null>>;
        list: (projectId: string) => Promise<ApiResponse<Agent[]>>;
        history: (
          id: string,
          options?: FindHistoryOptions
        ) => Promise<ApiResponse<AgentHistoryResponse>>;
        pause: (id: string) => Promise<ApiResponse<void>>;
        resume: (id: string) => Promise<ApiResponse<void>>;
        stop: (id: string) => Promise<ApiResponse<void>>;
      };

      // ========================================
      // Config APIs
      // ========================================
      config: {
        get: () => Promise<ApiResponse<Config>>;
        set: (key: string, value: unknown) => Promise<ApiResponse<Config>>;
        setTheme: (theme: 'light' | 'dark' | 'system') => Promise<ApiResponse<Config>>;
        reset: () => Promise<ApiResponse<Config>>;
        setApiKey: (key: string) => Promise<ApiResponse<void>>;
        getApiKey: () => Promise<ApiResponse<string | null>>;
        hasApiKey: () => Promise<ApiResponse<boolean>>;
        deleteApiKey: () => Promise<ApiResponse<void>>;
      };

      // ========================================
      // Event Subscription
      // ========================================
      /**
       * Subscribe to any event channel
       * @returns Unsubscribe function
       */
      on: (channel: string, callback: (data: unknown) => void) => () => void;

      /**
       * Subscribe to specific event type
       * @returns Unsubscribe function
       */
      onEvent: (eventType: string, callback: (event: AppEvent) => void) => () => void;

      /**
       * Subscribe to all events
       * @returns Unsubscribe function
       */
      onAnyEvent: (callback: (event: AppEvent) => void) => () => void;

      /**
       * Unsubscribe from event channel
       */
      off: (channel: string, callback: (data: unknown) => void) => void;
    };
  }
}

export {};
