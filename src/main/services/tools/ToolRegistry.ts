/**
 * Registry of available tools for Claude agents
 * Based on the Claude SDK tool definitions
 */

import type { Tool } from '../../claude/types';

export interface ToolDefinition extends Tool {
  handler?: (input: Record<string, unknown>, context: ToolContext) => Promise<string>;
  permissionLevel?: 'readonly' | 'readwrite' | 'execute' | 'full';
}

export interface ToolContext {
  agentId: string;
  projectId: string;
  workingDirectory: string;
  allowedPaths?: string[];
  deniedCommands?: string[];
}

/**
 * Tool Registry - Manages available tools for agents
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register default tools from Claude SDK
   */
  private registerDefaultTools(): void {
    // Bash tool
    this.register({
      name: 'bash',
      description: 'Execute bash commands in a persistent shell session. Use for git, npm, docker, etc. DO NOT use for file operations - use specialized tools instead.',
      input_schema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The bash command to execute',
          },
          description: {
            type: 'string',
            description: 'Clear, concise description of what this command does in 5-10 words',
          },
          timeout: {
            type: 'number',
            description: 'Optional timeout in milliseconds (max 600000)',
          },
        },
        required: ['command'],
      },
      permissionLevel: 'execute',
    });

    // Read tool
    this.register({
      name: 'read',
      description: 'Read file contents from the filesystem. Returns file contents with line numbers.',
      input_schema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to read',
          },
          limit: {
            type: 'number',
            description: 'Number of lines to read (optional)',
          },
          offset: {
            type: 'number',
            description: 'Line number to start reading from (optional)',
          },
        },
        required: ['file_path'],
      },
      permissionLevel: 'readonly',
    });

    // Write tool
    this.register({
      name: 'write',
      description: 'Write content to a file. Will overwrite existing files.',
      input_schema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to write',
          },
          content: {
            type: 'string',
            description: 'The content to write to the file',
          },
        },
        required: ['file_path', 'content'],
      },
      permissionLevel: 'readwrite',
    });

    // Edit tool
    this.register({
      name: 'edit',
      description: 'Perform exact string replacements in files. Must read file first before editing.',
      input_schema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to modify',
          },
          old_string: {
            type: 'string',
            description: 'The exact text to replace',
          },
          new_string: {
            type: 'string',
            description: 'The text to replace it with',
          },
          replace_all: {
            type: 'boolean',
            description: 'Replace all occurrences (default: false)',
          },
        },
        required: ['file_path', 'old_string', 'new_string'],
      },
      permissionLevel: 'readwrite',
    });

    // Glob tool
    this.register({
      name: 'glob',
      description: 'Fast file pattern matching tool. Supports glob patterns like "**/*.js" or "src/**/*.ts".',
      input_schema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The glob pattern to match files against',
          },
          path: {
            type: 'string',
            description: 'The directory to search in (optional, defaults to cwd)',
          },
        },
        required: ['pattern'],
      },
      permissionLevel: 'readonly',
    });

    // Grep tool
    this.register({
      name: 'grep',
      description: 'Search tool built on ripgrep. Supports regex patterns and file filtering.',
      input_schema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The regex pattern to search for',
          },
          path: {
            type: 'string',
            description: 'File or directory to search in (optional)',
          },
          glob: {
            type: 'string',
            description: 'Glob pattern to filter files (e.g., "*.js")',
          },
          type: {
            type: 'string',
            description: 'File type to search (e.g., "js", "py", "rust")',
          },
          output_mode: {
            type: 'string',
            enum: ['content', 'files_with_matches', 'count'],
            description: 'Output mode: content, files_with_matches, or count',
          },
          case_insensitive: {
            type: 'boolean',
            description: 'Case insensitive search',
          },
        },
        required: ['pattern'],
      },
      permissionLevel: 'readonly',
    });
  }

  /**
   * Register a tool
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools as Claude Tool definitions (without handlers)
   */
  getClaudeTools(): Tool[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));
  }

  /**
   * Get tools filtered by permission level
   */
  getByPermissionLevel(level: ToolDefinition['permissionLevel']): ToolDefinition[] {
    const levels = {
      readonly: 1,
      readwrite: 2,
      execute: 3,
      full: 4,
    };

    const requestedLevel = levels[level || 'full'];

    return this.getAll().filter(tool => {
      const toolLevel = levels[tool.permissionLevel || 'full'];
      return toolLevel <= requestedLevel;
    });
  }

  /**
   * Get tools by names
   */
  getByNames(names: string[]): ToolDefinition[] {
    return names
      .map(name => this.tools.get(name))
      .filter((tool): tool is ToolDefinition => tool !== undefined);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get tool count
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Reset to default tools
   */
  reset(): void {
    this.clear();
    this.registerDefaultTools();
  }
}

// Singleton instance
let registryInstance: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registryInstance) {
    registryInstance = new ToolRegistry();
  }
  return registryInstance;
}

export function resetToolRegistry(): void {
  registryInstance = null;
}
