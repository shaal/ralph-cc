/**
 * Database entity types and DTOs for Constellation
 */

// Enums
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

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool'
}

export enum OutputType {
  FILE = 'file',
  ARTIFACT = 'artifact',
  LOG = 'log'
}

// Core entity interfaces
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  prompt_path: string;
  settings: string; // JSON string
  cost_total: number;
  iteration_count: number;
  created_at: string;
  updated_at: string | null;
  ended_at: string | null;
}

export interface Agent {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string | null;
  status: AgentStatus;
  config: string; // JSON string
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
  tool_calls: string | null; // JSON string
  tool_results: string | null; // JSON string
  usage: string | null; // JSON string
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

export interface Event {
  id: string;
  project_id: string | null;
  agent_id: string | null;
  type: string;
  data: string | null; // JSON string
  created_at: string;
}

// Parsed versions of entities (with JSON fields parsed)
export interface ProjectWithSettings extends Omit<Project, 'settings'> {
  settings: Record<string, any>;
}

export interface AgentWithConfig extends Omit<Agent, 'config'> {
  config: Record<string, any>;
}

export interface AgentHistoryWithParsed extends Omit<AgentHistory, 'tool_calls' | 'tool_results' | 'usage'> {
  tool_calls: any[] | null;
  tool_results: any[] | null;
  usage: Record<string, any> | null;
}

export interface EventWithData extends Omit<Event, 'data'> {
  data: Record<string, any> | null;
}

// DTOs for creation
export interface CreateProjectDTO {
  name: string;
  description?: string;
  prompt_path: string;
  settings?: Record<string, any>;
}

export interface CreateAgentDTO {
  project_id: string;
  parent_id?: string | null;
  name?: string;
  config?: Record<string, any>;
  depth?: number;
}

export interface CreateAgentHistoryDTO {
  agent_id: string;
  role: MessageRole;
  content?: string | null;
  tool_calls?: any[] | null;
  tool_results?: any[] | null;
  usage?: Record<string, any> | null;
  cost?: number | null;
}

export interface CreateOutputDTO {
  project_id: string;
  agent_id?: string | null;
  type: OutputType;
  path?: string | null;
  content?: string | null;
  previous_content?: string | null;
  checksum?: string | null;
}

export interface CreateEventDTO {
  project_id?: string | null;
  agent_id?: string | null;
  type: string;
  data?: Record<string, any> | null;
}

// DTOs for updates
export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  prompt_path?: string;
  settings?: Record<string, any>;
  cost_total?: number;
  iteration_count?: number;
  ended_at?: string | null;
}

export interface UpdateAgentDTO {
  name?: string | null;
  status?: AgentStatus;
  config?: Record<string, any>;
  current_task?: string | null;
  total_tokens?: number;
  total_cost?: number;
  iteration_count?: number;
}

// Query options
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface FindHistoryOptions extends PaginationOptions {
  order?: 'asc' | 'desc';
}

export interface FindEventsOptions extends PaginationOptions {
  type?: string;
  order?: 'asc' | 'desc';
}

// Migration tracking
export interface Migration {
  id: number;
  name: string;
  applied_at: string;
}

// Configuration types
export interface Config {
  app: AppSettings;
  agent: AgentDefaults;
  safety: SafetySettings;
  api: ApiSettings;
  ui: UiSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  auto_update: boolean;
  telemetry: boolean;
}

export interface AgentDefaults {
  default_model: string;
  max_tokens: number;
  temperature: number;
  max_iterations: number;
  max_subagent_depth: number;
  tools: string[];
}

export interface SafetySettings {
  circuit_breaker: CircuitBreakerSettings;
  budget: BudgetSettings;
  sandbox: SandboxSettings;
}

export interface CircuitBreakerSettings {
  max_consecutive_failures: number;
  max_consecutive_completions: number;
  timeout_minutes: number;
}

export interface BudgetSettings {
  default_limit: number;
  warning_threshold: number;
}

export interface SandboxSettings {
  enabled: boolean;
  allowed_paths: string[];
  denied_commands: string[];
}

export interface ApiSettings {
  anthropic_api_key?: string;
  base_url: string;
  timeout: number;
}

export interface UiSettings {
  graph: GraphSettings;
  inspector: InspectorSettings;
}

export interface GraphSettings {
  physics_enabled: boolean;
  animation_speed: number;
  node_size: number;
  show_labels: boolean;
}

export interface InspectorSettings {
  default_view: 'overview' | 'history' | 'config' | 'outputs';
  auto_scroll: boolean;
}

// Cost tracking types
export interface ProjectCostSummary {
  total_cost: number;
  total_input_tokens: number;
  total_output_tokens: number;
  agent_count: number;
  message_count: number;
}

// Response wrapper types
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

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
