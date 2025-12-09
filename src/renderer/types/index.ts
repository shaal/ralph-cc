/**
 * Frontend types for Constellation renderer process
 */

import {
  Project as DBProject,
  Agent as DBAgent,
  ProjectStatus,
  AgentStatus,
  OutputType
} from '../../main/database/types';

// Re-export types from database
export { ProjectStatus, AgentStatus, OutputType };
export type { DBProject, DBAgent };

// Extended types with parsed JSON fields for renderer use
export interface ProjectSettings {
  model: string;
  budgetLimit: number;
  maxIterations: number;
  circuitBreaker: {
    enabled: boolean;
    maxConsecutiveFailures: number;
    maxConsecutiveCompletions: number;
  };
  allowedTools: string[];
  temperature?: number;
  maxTokens?: number;
}

export interface Project extends Omit<DBProject, 'settings'> {
  settings: ProjectSettings;
  agentCount?: number;
  duration?: number; // in seconds
}

export interface AgentConfig {
  model: string;
  tools: string[];
  temperature?: number;
  maxTokens?: number;
}

export interface Agent extends Omit<DBAgent, 'config'> {
  config: AgentConfig;
  children?: Agent[];
}

// UI State types
export interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onDelete: () => void;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  prompt: string;
  settings: ProjectSettings;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  prompt?: string;
  settings?: Partial<ProjectSettings>;
}

// Tab types
export type ProjectTab = 'graph' | 'inspector' | 'outputs' | 'settings';

// Event types for subscriptions
export interface ProjectEvent {
  type: 'project_created' | 'project_updated' | 'project_deleted' | 'project_status_changed';
  projectId: string;
  data: any;
}

export interface AgentEvent {
  type: 'agent_created' | 'agent_updated' | 'agent_status_changed' | 'agent_output_chunk';
  agentId: string;
  projectId: string;
  data: any;
}

// Window API types (for preload bridge)
export interface ProjectAPI {
  create: (input: CreateProjectInput) => Promise<Project>;
  get: (id: string) => Promise<Project | null>;
  list: () => Promise<Project[]>;
  update: (id: string, input: UpdateProjectInput) => Promise<void>;
  delete: (id: string) => Promise<void>;
  start: (id: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  stop: (id: string) => Promise<void>;
}

export interface AgentAPI {
  get: (id: string) => Promise<Agent | null>;
  listByProject: (projectId: string) => Promise<Agent[]>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
}

declare global {
  interface Window {
    api: {
      project: ProjectAPI;
      agent: AgentAPI;
      onEvent: (eventType: string, callback: (event: any) => void) => () => void;
    };
  }
}
