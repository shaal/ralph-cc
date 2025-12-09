/**
 * Default configuration for Constellation
 */

/**
 * Application-wide settings
 */
export interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoUpdate: boolean;
  telemetry: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Agent default settings
 */
export interface AgentConfig {
  defaultModel: string;
  maxTokens: number;
  maxIterations: number;
  maxSubagentDepth: number;
  tools: string[];
  temperature?: number;
}

/**
 * Circuit breaker settings
 */
export interface CircuitBreakerConfig {
  maxConsecutiveFailures: number;
  maxConsecutiveCompletions: number;
  timeoutMinutes: number;
  cooldownMinutes?: number;
}

/**
 * Budget settings
 */
export interface BudgetConfig {
  defaultLimit: number; // USD
  warningThreshold: number; // Percentage (0-1)
  hardLimit: boolean;
}

/**
 * Sandbox security settings
 */
export interface SandboxConfig {
  enabled: boolean;
  allowedPaths: string[];
  deniedCommands: string[];
  maxExecutionTimeSeconds: number;
  maxMemoryMB: number;
}

/**
 * Safety settings
 */
export interface SafetyConfig {
  circuitBreaker: CircuitBreakerConfig;
  budget: BudgetConfig;
  sandbox: SandboxConfig;
}

/**
 * Graph visualization settings
 */
export interface GraphConfig {
  physicsEnabled: boolean;
  animationSpeed: number; // 0.5 - 2.0
  nodeSize: number; // pixels
  showLabels: boolean;
  fitViewOnLoad: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

/**
 * Inspector panel settings
 */
export interface InspectorConfig {
  defaultView: 'overview' | 'history' | 'outputs' | 'config' | 'stream';
  autoScroll: boolean;
  maxHistoryItems: number;
  syntaxHighlighting: boolean;
}

/**
 * UI settings
 */
export interface UIConfig {
  graph: GraphConfig;
  inspector: InspectorConfig;
  sidebarWidth: number;
  inspectorWidth: number;
}

/**
 * Complete configuration interface
 */
export interface ConstellationConfig {
  app: AppConfig;
  agent: AgentConfig;
  safety: SafetyConfig;
  ui: UIConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ConstellationConfig = {
  app: {
    theme: 'dark',
    language: 'en',
    autoUpdate: true,
    telemetry: false,
    logLevel: 'info',
  },

  agent: {
    defaultModel: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    maxIterations: 1000,
    maxSubagentDepth: 3,
    tools: ['bash', 'read', 'write', 'edit', 'glob', 'grep'],
    temperature: 1.0,
  },

  safety: {
    circuitBreaker: {
      maxConsecutiveFailures: 5,
      maxConsecutiveCompletions: 3,
      timeoutMinutes: 120,
      cooldownMinutes: 5,
    },

    budget: {
      defaultLimit: 100, // $100 USD
      warningThreshold: 0.8, // 80%
      hardLimit: true,
    },

    sandbox: {
      enabled: true,
      allowedPaths: ['./'],
      deniedCommands: [
        'rm -rf /',
        'rm -rf ~',
        'rm -rf *',
        'sudo',
        'su',
        'chmod 777',
        'curl | bash',
        'curl | sh',
        'wget | bash',
        'wget | sh',
        'mkfs',
        'dd if=',
        ':(){:|:&};:', // Fork bomb
      ],
      maxExecutionTimeSeconds: 300, // 5 minutes
      maxMemoryMB: 1024, // 1GB
    },
  },

  ui: {
    graph: {
      physicsEnabled: true,
      animationSpeed: 1.0,
      nodeSize: 50,
      showLabels: true,
      fitViewOnLoad: true,
      snapToGrid: false,
      gridSize: 20,
    },

    inspector: {
      defaultView: 'overview',
      autoScroll: true,
      maxHistoryItems: 1000,
      syntaxHighlighting: true,
    },

    sidebarWidth: 280,
    inspectorWidth: 400,
  },
};

/**
 * Claude model pricing (as of Jan 2025)
 * Prices in USD per million tokens
 */
export interface ModelPricing {
  input: number;  // Per 1M input tokens
  output: number; // Per 1M output tokens
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-20250514': {
    input: 15.00,
    output: 75.00,
  },
  'claude-opus-4-5-20251101': {
    input: 15.00,
    output: 75.00,
  },
  'claude-sonnet-4-20250514': {
    input: 3.00,
    output: 15.00,
  },
  'claude-sonnet-4-5-20250929': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-5-sonnet-20240620': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-opus-20240229': {
    input: 15.00,
    output: 75.00,
  },
  'claude-3-sonnet-20240229': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
  },
};

/**
 * Get pricing for a model (with fallback to Sonnet pricing)
 */
export function getModelPricing(model: string): ModelPricing {
  return MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-20250514'];
}
