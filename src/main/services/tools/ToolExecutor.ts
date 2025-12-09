/**
 * Tool Executor - Executes tool calls from Claude agents
 * Implements sandboxing and security restrictions
 */

import type { ToolCall, ToolResult } from '../../claude/types';
import type { ToolContext } from './ToolRegistry';
import { getToolRegistry } from './ToolRegistry';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SandboxConfig {
  enabled: boolean;
  allowedPaths: string[];
  deniedCommands: string[];
  maxExecutionTimeMs?: number;
}

export class ToolExecutor {
  private registry = getToolRegistry();
  private sandboxConfig: SandboxConfig;

  constructor(sandboxConfig: SandboxConfig) {
    this.sandboxConfig = sandboxConfig;
  }

  /**
   * Execute a tool call
   */
  async execute(toolCall: ToolCall, context: ToolContext): Promise<ToolResult> {
    const tool = this.registry.get(toolCall.name);

    if (!tool) {
      return this.createErrorResult(
        toolCall.id,
        `Unknown tool: ${toolCall.name}`
      );
    }

    try {
      // Check sandbox restrictions
      if (this.sandboxConfig.enabled) {
        const securityCheck = this.checkSecurity(toolCall, context);
        if (!securityCheck.allowed) {
          return this.createErrorResult(toolCall.id, securityCheck.reason || 'Security check failed');
        }
      }

      // Execute the tool
      let result: string;
      if (tool.handler) {
        result = await tool.handler(toolCall.input, context);
      } else {
        result = await this.executeBuiltinTool(toolCall, context);
      }

      return {
        id: this.generateResultId(),
        tool_use_id: toolCall.id,
        content: result,
        is_error: false,
      };
    } catch (error) {
      return this.createErrorResult(
        toolCall.id,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Execute built-in tools
   */
  private async executeBuiltinTool(toolCall: ToolCall, context: ToolContext): Promise<string> {
    switch (toolCall.name) {
      case 'bash':
        return await this.executeBash(toolCall.input, context);
      case 'read':
        return await this.executeRead(toolCall.input, context);
      case 'write':
        return await this.executeWrite(toolCall.input, context);
      case 'edit':
        return await this.executeEdit(toolCall.input, context);
      case 'glob':
        return await this.executeGlob(toolCall.input, context);
      case 'grep':
        return await this.executeGrep(toolCall.input, context);
      default:
        throw new Error(`No handler implemented for tool: ${toolCall.name}`);
    }
  }

  /**
   * Execute bash command
   */
  private async executeBash(input: Record<string, unknown>, context: ToolContext): Promise<string> {
    const command = input.command as string;
    const timeout = (input.timeout as number) || 120000;

    // Check denied commands
    if (this.sandboxConfig.enabled) {
      for (const denied of this.sandboxConfig.deniedCommands) {
        if (command.includes(denied)) {
          throw new Error(`Command contains denied pattern: ${denied}`);
        }
      }
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: context.workingDirectory,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return stdout + (stderr ? `\n[stderr]\n${stderr}` : '');
    } catch (error: any) {
      if (error.killed) {
        throw new Error(`Command timed out after ${timeout}ms`);
      }
      throw new Error(`Command failed: ${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`);
    }
  }

  /**
   * Execute read file
   */
  private async executeRead(input: Record<string, unknown>, context: ToolContext): Promise<string> {
    const filePath = input.file_path as string;
    const limit = input.limit as number | undefined;
    const offset = input.offset as number | undefined;

    // Resolve absolute path
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(context.workingDirectory, filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check if it's a file
    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`Not a file: ${filePath}`);
    }

    // Read file
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split('\n');

    // Apply offset and limit
    const startLine = offset || 0;
    const endLine = limit ? startLine + limit : lines.length;
    const selectedLines = lines.slice(startLine, endLine);

    // Format with line numbers (1-indexed)
    const formatted = selectedLines
      .map((line, idx) => `${startLine + idx + 1}→${line}`)
      .join('\n');

    return formatted;
  }

  /**
   * Execute write file
   */
  private async executeWrite(input: Record<string, unknown>, context: ToolContext): Promise<string> {
    const filePath = input.file_path as string;
    const content = input.content as string;

    // Resolve absolute path
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(context.workingDirectory, filePath);

    // Ensure directory exists
    const directory = path.dirname(absolutePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write file
    fs.writeFileSync(absolutePath, content, 'utf-8');

    return `File written successfully: ${filePath}`;
  }

  /**
   * Execute edit file
   */
  private async executeEdit(input: Record<string, unknown>, context: ToolContext): Promise<string> {
    const filePath = input.file_path as string;
    const oldString = input.old_string as string;
    const newString = input.new_string as string;
    const replaceAll = (input.replace_all as boolean) || false;

    // Resolve absolute path
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(context.workingDirectory, filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file
    let content = fs.readFileSync(absolutePath, 'utf-8');

    // Check if old_string exists
    if (!content.includes(oldString)) {
      throw new Error(`String not found in file: "${oldString}"`);
    }

    // Replace
    if (replaceAll) {
      content = content.split(oldString).join(newString);
    } else {
      // Replace only first occurrence
      const index = content.indexOf(oldString);
      if (index === -1) {
        throw new Error(`String not found in file: "${oldString}"`);
      }
      content = content.substring(0, index) + newString + content.substring(index + oldString.length);
    }

    // Write back
    fs.writeFileSync(absolutePath, content, 'utf-8');

    return `File edited successfully: ${filePath}`;
  }

  /**
   * Execute glob search
   */
  private async executeGlob(input: Record<string, unknown>, context: ToolContext): Promise<string> {
    const pattern = input.pattern as string;
    const searchPath = (input.path as string) || context.workingDirectory;

    // This is a simplified implementation - in production, use a proper glob library
    // For now, return a placeholder
    return `Glob search not fully implemented yet. Pattern: ${pattern}, Path: ${searchPath}`;
  }

  /**
   * Execute grep search
   */
  private async executeGrep(input: Record<string, unknown>, context: ToolContext): Promise<string> {
    const pattern = input.pattern as string;
    const searchPath = (input.path as string) || context.workingDirectory;

    // This is a simplified implementation - in production, use ripgrep or similar
    // For now, return a placeholder
    return `Grep search not fully implemented yet. Pattern: ${pattern}, Path: ${searchPath}`;
  }

  /**
   * Check security restrictions
   */
  private checkSecurity(toolCall: ToolCall, context: ToolContext): { allowed: boolean; reason?: string } {
    // Check file path restrictions for file operations
    if (['read', 'write', 'edit'].includes(toolCall.name)) {
      const filePath = toolCall.input.file_path as string;
      if (filePath) {
        const absolutePath = path.isAbsolute(filePath)
          ? filePath
          : path.join(context.workingDirectory, filePath);

        // Check if path is within allowed paths
        const isAllowed = this.sandboxConfig.allowedPaths.some(allowedPath => {
          const resolvedAllowed = path.resolve(allowedPath);
          const resolvedFile = path.resolve(absolutePath);
          return resolvedFile.startsWith(resolvedAllowed);
        });

        if (!isAllowed) {
          return {
            allowed: false,
            reason: `File path not allowed: ${filePath}. Must be within: ${this.sandboxConfig.allowedPaths.join(', ')}`,
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Create error result
   */
  private createErrorResult(toolCallId: string, errorMessage: string): ToolResult {
    return {
      id: this.generateResultId(),
      tool_use_id: toolCallId,
      content: `Error: ${errorMessage}`,
      is_error: true,
    };
  }

  /**
   * Generate unique result ID
   */
  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Update sandbox configuration
   */
  updateSandboxConfig(config: Partial<SandboxConfig>): void {
    this.sandboxConfig = { ...this.sandboxConfig, ...config };
  }

  /**
   * Get current sandbox configuration
   */
  getSandboxConfig(): SandboxConfig {
    return { ...this.sandboxConfig };
  }
}
