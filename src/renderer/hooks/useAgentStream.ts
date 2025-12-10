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
    console.log(`[useAgentStream] addChunk called with:`, chunk);
    setChunks(prev => {
      const newChunks = [...prev, chunk];
      console.log(`[useAgentStream] State updating: ${prev.length} → ${newChunks.length} chunks`);
      return newChunks;
    });
  }, []);

  // Subscribe to output chunks
  useEffect(() => {
    if (!agentId) {
      setChunks([]);
      setIsStreaming(false);
      return;
    }

    // Safety check: window.api is only available in Electron
    if (!window.api?.onEvent) {
      console.warn('[useAgentStream] window.api.onEvent not available (not running in Electron)');
      return;
    }

    console.log(`[useAgentStream] Subscribing to events for agent: ${agentId}`);

    const unsubscribeOutput = window.api.onEvent('agent_output_chunk', (event: any) => {
      console.log('[useAgentStream] Received agent_output_chunk event:', event);
      console.log(`[useAgentStream] Comparing agentIds: event.data.agentId="${event.data?.agentId}" vs hook agentId="${agentId}"`);
      // agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId) {
        console.log(`[useAgentStream] ✓ Match! Chunk for our agent: ${event.data.chunk?.substring(0, 50)}...`);
        const newChunk: OutputChunk = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          chunk: event.data.chunk,
          type: 'output'
        };
        addChunk(newChunk);
        setIsStreaming(true);
      } else {
        console.log(`[useAgentStream] ✗ No match - skipping chunk`);
      }
    });

    return () => {
      console.log(`[useAgentStream] Unsubscribing from events for agent: ${agentId}`);
      unsubscribeOutput();
    };
  }, [agentId, addChunk]);

  // Subscribe to tool calls
  useEffect(() => {
    if (!agentId || !window.api?.onEvent) return;

    const unsubscribeToolCall = window.api.onEvent('agent_tool_call', (event: any) => {
      console.log('[useAgentStream] Received agent_tool_call event:', event);
      // agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId) {
        console.log(`[useAgentStream] Tool call for our agent: ${event.data.tool_name}`);
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
    if (!agentId || !window.api?.onEvent) return;

    const unsubscribeError = window.api.onEvent('agent_error', (event: any) => {
      // agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId) {
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
    if (!agentId || !window.api?.onEvent) return;

    const unsubscribeStart = window.api.onEvent('agent_iteration_start', (event: any) => {
      // agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId) {
        setIsStreaming(true);
      }
    });

    const unsubscribeEnd = window.api.onEvent('agent_iteration_end', (event: any) => {
      // agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId) {
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
