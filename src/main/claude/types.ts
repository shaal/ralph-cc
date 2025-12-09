/**
 * Type definitions for Claude API integration
 */

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | unknown;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
}

export interface IterationResult {
  type: 'completion' | 'tool_calls';
  output: string;
  toolCalls: ToolCall[];
  usage: Usage;
  cost: number;
}

export interface AgentConfig {
  model: string;
  maxTokens: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: Tool[];
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface StreamChunk {
  type: 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_start' | 'message_delta' | 'message_stop';
  index?: number;
  content_block?: ContentBlock;
  delta?: {
    type: string;
    text?: string;
    partial_json?: string;
  };
  message?: {
    id: string;
    type: string;
    role: string;
    content: ContentBlock[];
    model: string;
    stop_reason?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeRequestParams {
  model: string;
  messages: Message[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  tools?: Tool[];
  stream?: boolean;
}

export interface ClaudeIterationCallbacks {
  onChunk: (chunk: string) => void;
  onToolCall: (toolCall: ToolCall) => void;
  onUsage?: (usage: Usage) => void;
}
