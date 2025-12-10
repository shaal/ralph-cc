/**
 * Shared type definitions for Zustand stores
 */

// Project types
export interface Project {
  id: string;
  name: string;
  prompt: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  settings: ProjectSettings;
  costTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  model?: string;
  maxIterations?: number;
  budgetLimit?: number;
  circuitBreakerThreshold?: number;
  completionThreshold?: number;
  tools?: string[];
  workingDirectory?: string;
  permissionLevel?: 'readonly' | 'readwrite' | 'execute' | 'full';
}

export interface CreateProjectDTO {
  name: string;
  prompt: string;
  settings?: Partial<ProjectSettings>;
}

// Agent types
export interface Agent {
  id: string;
  projectId: string;
  parentId: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'thinking';
  depth: number;
  config: AgentConfig;
  costTotal: number;
  iterationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfig {
  model: string;
  tools: string[];
  maxTokens?: number;
  temperature?: number;
}

// Graph types
export interface NodeData {
  agentId: string;
  label: string;
  status: Agent['status'];
  cost: number;
  iterations: number;
}

export interface Node {
  id: string;
  type: string;
  data: NodeData;
  position: { x: number; y: number };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// UI types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  title?: string;
  duration?: number;
  timestamp: string;
}

// Config types
export interface Config {
  theme: 'dark' | 'light';
  defaultModel: string;
  defaultTools: string[];
  defaultBudgetLimit: number;
  defaultMaxIterations: number;
  circuitBreakerThreshold: number;
  completionThreshold: number;
  eventThrottleMs: number;
  maxRecentEvents: number;
  // Proxy configuration for using Claude subscription
  proxy: ProxyConfig;
}

export interface ProxyConfig {
  enabled: boolean;
  url: string; // e.g., "http://localhost:8317"
  apiKey?: string; // API key configured in CLIProxyAPI's config.yaml api-keys list
}

// Event types
export interface AppEvent {
  id: string;
  type: EventType;
  data: any;
  timestamp: string;
}

export type EventType =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_status_changed'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_status_changed'
  | 'agent_output_chunk'
  | 'agent_completed'
  | 'agent_failed'
  | 'cost_updated'
  | 'iteration_completed'
  | 'circuit_breaker_triggered'
  | 'budget_limit_reached';

// API window type (for window.api)
declare global {
  interface Window {
    api: {
      project: {
        list: () => Promise<Project[]>;
        create: (data: CreateProjectDTO) => Promise<Project>;
        update: (id: string, data: Partial<Project>) => Promise<void>;
        delete: (id: string) => Promise<void>;
        start: (id: string) => Promise<void>;
        pause: (id: string) => Promise<void>;
        resume: (id: string) => Promise<void>;
        stop: (id: string) => Promise<void>;
      };
      agent: {
        list: (projectId: string) => Promise<Agent[]>;
        get: (id: string) => Promise<Agent>;
        pause: (id: string) => Promise<void>;
        resume: (id: string) => Promise<void>;
      };
      config: {
        get: () => Promise<Config>;
        update: (key: string, value: any) => Promise<void>;
      };
      keychain: {
        hasApiKey: () => Promise<boolean>;
        setApiKey: (key: string) => Promise<void>;
      };
      on: (channel: string, callback: (data: any) => void) => () => void;
    };
  }
}
