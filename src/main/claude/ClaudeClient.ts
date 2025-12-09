/**
 * Wrapper around @anthropic-ai/sdk for agent iteration execution
 *
 * NOTE: The claude-agent-sdk is not yet available, so we use the base SDK
 * and implement agent-like behavior ourselves.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  Message,
  ToolCall,
  IterationResult,
  AgentConfig,
  ClaudeIterationCallbacks,
  Tool,
  StreamChunk,
  ContentBlock,
  Usage,
} from './types';

export interface CostRates {
  input: number;  // Cost per 1M tokens
  output: number; // Cost per 1M tokens
}

export interface ModelPricing {
  [model: string]: CostRates;
}

// Pricing per 1M tokens (as of 2025)
const DEFAULT_PRICING: ModelPricing = {
  'claude-opus-4': { input: 15.00, output: 75.00 },
  'claude-opus-4.5': { input: 15.00, output: 75.00 },
  'claude-sonnet-4': { input: 3.00, output: 15.00 },
  'claude-sonnet-3.5': { input: 3.00, output: 15.00 },
  'claude-haiku-3.5': { input: 0.80, output: 4.00 },
};

export class ClaudeClient {
  private client: Anthropic | null = null;
  private pricing: ModelPricing;

  constructor(pricing: ModelPricing = DEFAULT_PRICING) {
    this.pricing = pricing;
  }

  /**
   * Initialize the Claude client with an API key
   */
  async initialize(apiKey: string): Promise<void> {
    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * Run a single agent iteration
   */
  async runIteration(
    agentId: string,
    systemPrompt: string,
    messages: Message[],
    tools: Tool[],
    config: AgentConfig,
    callbacks: ClaudeIterationCallbacks
  ): Promise<IterationResult> {
    if (!this.client) {
      throw new Error('ClaudeClient not initialized. Call initialize() first.');
    }

    const requestParams: Anthropic.MessageCreateParams = {
      model: config.model,
      max_tokens: config.maxTokens,
      messages: this.convertMessages(messages),
      system: systemPrompt,
      stream: true,
    };

    if (config.temperature !== undefined) {
      requestParams.temperature = config.temperature;
    }

    if (tools && tools.length > 0) {
      requestParams.tools = tools as Anthropic.Tool[];
    }

    let accumulatedOutput = '';
    const toolCalls: ToolCall[] = [];
    let usage: Usage = { inputTokens: 0, outputTokens: 0 };
    let stopReason: string | null = null;

    try {
      const stream = await this.client.messages.create(requestParams);

      for await (const event of stream) {
        await this.handleStreamEvent(event, callbacks, (text) => {
          accumulatedOutput += text;
        }, (toolCall) => {
          toolCalls.push(toolCall);
        }, (usageData) => {
          usage = usageData;
        }, (reason) => {
          stopReason = reason;
        });
      }
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Calculate cost
    const cost = this.calculateCost(usage, config.model);

    // Determine result type
    const type = toolCalls.length > 0 ? 'tool_calls' : 'completion';

    // Notify usage if callback provided
    if (callbacks.onUsage) {
      callbacks.onUsage(usage);
    }

    return {
      type,
      output: accumulatedOutput,
      toolCalls,
      usage,
      cost,
    };
  }

  /**
   * Handle individual stream events
   */
  private async handleStreamEvent(
    event: Anthropic.MessageStreamEvent,
    callbacks: ClaudeIterationCallbacks,
    onText: (text: string) => void,
    onTool: (toolCall: ToolCall) => void,
    onUsage: (usage: Usage) => void,
    onStopReason: (reason: string) => void
  ): Promise<void> {
    switch (event.type) {
      case 'content_block_start':
        // Content block starting, check if it's a tool use
        if (event.content_block?.type === 'tool_use') {
          // Tool use will be accumulated in deltas
        }
        break;

      case 'content_block_delta':
        if (event.delta.type === 'text_delta') {
          const text = event.delta.text || '';
          onText(text);
          callbacks.onChunk(text);
        } else if (event.delta.type === 'input_json_delta') {
          // Tool input is being streamed, we'll handle it at block stop
        }
        break;

      case 'content_block_stop':
        // If this was a tool use block, extract the tool call
        // Note: We need to reconstruct this from the message
        break;

      case 'message_delta':
        if (event.usage) {
          onUsage({
            inputTokens: 0,
            outputTokens: event.usage.output_tokens || 0,
          });
        }
        if (event.delta?.stop_reason) {
          onStopReason(event.delta.stop_reason);
        }
        break;

      case 'message_start':
        if (event.message?.usage) {
          onUsage({
            inputTokens: event.message.usage.input_tokens || 0,
            outputTokens: event.message.usage.output_tokens || 0,
          });
        }
        break;

      case 'message_stop':
        // Message complete
        break;
    }
  }

  /**
   * Calculate cost based on token usage and model
   */
  calculateCost(usage: Usage, model: string): number {
    const rates = this.pricing[model];
    if (!rates) {
      console.warn(`No pricing information for model: ${model}. Using default rates.`);
      // Use Sonnet pricing as default
      const defaultRates = this.pricing['claude-sonnet-4'];
      const inputCost = (usage.inputTokens / 1_000_000) * defaultRates.input;
      const outputCost = (usage.outputTokens / 1_000_000) * defaultRates.output;
      return inputCost + outputCost;
    }

    const inputCost = (usage.inputTokens / 1_000_000) * rates.input;
    const outputCost = (usage.outputTokens / 1_000_000) * rates.output;
    return inputCost + outputCost;
  }

  /**
   * Convert our Message format to Anthropic's format
   */
  private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
    return messages.map(msg => {
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content,
        };
      } else {
        return {
          role: msg.role,
          content: msg.content as Anthropic.ContentBlock[],
        };
      }
    });
  }

  /**
   * Update pricing for a specific model
   */
  updatePricing(model: string, rates: CostRates): void {
    this.pricing[model] = rates;
  }

  /**
   * Get pricing for a specific model
   */
  getPricing(model: string): CostRates | undefined {
    return this.pricing[model];
  }
}
