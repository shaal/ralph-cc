/**
 * Hook for live agent output streaming
 */
import { useState, useEffect, useCallback } from 'react';

export interface OutputChunk {
  id: string;
  timestamp: string;
  chunk: string;
  type: 'output' | 'tool_call' | 'error';
}

export interface UseAgentStreamResult {
  chunks: OutputChunk[];
  isStreaming: boolean;
  clear: () => void;
  addChunk: (chunk: OutputChunk) => void;
}

export const useAgentStream = (agentId: string | null): UseAgentStreamResult => {
  const [chunks, setChunks] = useState<OutputChunk[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const clear = useCallback(() => {
    setChunks([]);
  }, []);

  const addChunk = useCallback((chunk: OutputChunk) => {
    setChunks(prev => [...prev, chunk]);
  }, []);

  // Subscribe to output chunks
  useEffect(() => {
    if (!agentId) {
      setChunks([]);
      setIsStreaming(false);
      return;
    }

    const unsubscribeOutput = window.api.onEvent('agent_output_chunk', (event) => {
      if (event.agentId === agentId) {
        const newChunk: OutputChunk = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          chunk: event.data.chunk,
          type: 'output'
        };
        addChunk(newChunk);
        setIsStreaming(true);
      }
    });

    return unsubscribeOutput;
  }, [agentId, addChunk]);

  // Subscribe to tool calls
  useEffect(() => {
    if (!agentId) return;

    const unsubscribeToolCall = window.api.onEvent('agent_tool_call', (event) => {
      if (event.agentId === agentId) {
        const toolCallText = `[Tool Call: ${event.data.tool_name}]\n${JSON.stringify(event.data.input, null, 2)}`;
        const newChunk: OutputChunk = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          chunk: toolCallText,
          type: 'tool_call'
        };
        addChunk(newChunk);
      }
    });

    return unsubscribeToolCall;
  }, [agentId, addChunk]);

  // Subscribe to errors
  useEffect(() => {
    if (!agentId) return;

    const unsubscribeError = window.api.onEvent('agent_error', (event) => {
      if (event.agentId === agentId) {
        const newChunk: OutputChunk = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          chunk: `[Error] ${event.data.message}`,
          type: 'error'
        };
        addChunk(newChunk);
        setIsStreaming(false);
      }
    });

    return unsubscribeError;
  }, [agentId, addChunk]);

  // Track streaming status
  useEffect(() => {
    if (!agentId) return;

    const unsubscribeStart = window.api.onEvent('agent_iteration_start', (event) => {
      if (event.agentId === agentId) {
        setIsStreaming(true);
      }
    });

    const unsubscribeEnd = window.api.onEvent('agent_iteration_end', (event) => {
      if (event.agentId === agentId) {
        setIsStreaming(false);
      }
    });

    return () => {
      unsubscribeStart();
      unsubscribeEnd();
    };
  }, [agentId]);

  return {
    chunks,
    isStreaming,
    clear,
    addChunk
  };
};
