/**
 * Frontend types for Constellation renderer process
 *
 * Note: These enums are duplicated from main/database/types to avoid
 * cross-process imports which break production builds.
 */

// Enums (duplicated for renderer isolation)
export enum ProjectStatus {
  CREATED = 'created',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STOPPED = 'stopped'
}

export enum AgentStatus {
  CREATED = 'created',
  IDLE = 'idle',
  WORKING = 'working',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum OutputType {
  FILE = 'file',
  ARTIFACT = 'artifact',
  LOG = 'log'
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool'
}

// Database entity types (duplicated for renderer isolation)
export interface DBProject {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  prompt_path: string;
  settings: string;
  cost_total: number;
  iteration_count: number;
  created_at: string;
  updated_at: string | null;
  ended_at: string | null;
}

export interface DBAgent {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string | null;
  status: AgentStatus;
  config: string;
  current_task: string | null;
  total_tokens: number;
  total_cost: number;
  iteration_count: number;
  depth: number;
  created_at: string;
  updated_at: string | null;
}

export interface AgentHistory {
  id: string;
  agent_id: string;
  role: MessageRole;
  content: string | null;
  tool_calls: string | null;
  tool_results: string | null;
  usage: string | null;
  cost: number | null;
  created_at: string;
}

export interface Output {
  id: string;
  project_id: string;
  agent_id: string | null;
  type: OutputType;
  path: string | null;
  content: string | null;
  previous_content: string | null;
  checksum: string | null;
  created_at: string;
}

// Parsed versions of entities (with JSON fields parsed)
export interface AgentWithConfig extends Omit<DBAgent, 'config'> {
  config: Record<string, any>;
}

export interface AgentHistoryWithParsed extends Omit<AgentHistory, 'tool_calls' | 'tool_results' | 'usage'> {
  tool_calls: any[] | null;
  tool_results: any[] | null;
  usage: Record<string, any> | null;
}

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
