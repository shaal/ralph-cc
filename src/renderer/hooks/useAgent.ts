/**
 * Hook for fetching and subscribing to agent data
 */
import { useState, useEffect } from 'react';
import type { Agent, AgentHistory, AgentWithConfig, AgentHistoryWithParsed } from '../../main/database/types';

export interface UseAgentResult {
  agent: AgentWithConfig | null;
  history: AgentHistoryWithParsed[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAgent = (agentId: string | null): UseAgentResult => {
  const [agent, setAgent] = useState<AgentWithConfig | null>(null);
  const [history, setHistory] = useState<AgentHistoryWithParsed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentData = async () => {
    if (!agentId) {
      setAgent(null);
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch agent data
      const agentData = await window.api.agent.get(agentId);

      if (agentData) {
        // Parse config if it's a string
        const parsedAgent: AgentWithConfig = {
          ...agentData,
          config: typeof agentData.config === 'string'
            ? JSON.parse(agentData.config)
            : agentData.config
        };
        setAgent(parsedAgent);

        // Fetch agent history
        const historyData = await window.api.agent.getHistory(agentId, {
          order: 'asc',
          limit: 100
        });

        // Parse JSON fields in history
        const parsedHistory: AgentHistoryWithParsed[] = historyData.map(item => ({
          ...item,
          tool_calls: item.tool_calls ? JSON.parse(item.tool_calls as string) : null,
          tool_results: item.tool_results ? JSON.parse(item.tool_results as string) : null,
          usage: item.usage ? JSON.parse(item.usage as string) : null
        }));
        setHistory(parsedHistory);
      } else {
        setError('Agent not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent data');
      console.error('Error fetching agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, [agentId]);

  // Subscribe to agent status updates
  useEffect(() => {
    if (!agentId) return;

    const unsubscribe = window.api.onEvent('agent_status_changed', (event) => {
      // Note: agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId && agent) {
        setAgent(prev => prev ? { ...prev, ...event.data } : null);
      }
    });

    return unsubscribe;
  }, [agentId, agent]);

  // Subscribe to new history entries
  useEffect(() => {
    if (!agentId) return;

    const unsubscribe = window.api.onEvent('agent_history_added', (event) => {
      // Note: agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId) {
        const newEntry: AgentHistoryWithParsed = {
          ...event.data,
          tool_calls: event.data.tool_calls || null,
          tool_results: event.data.tool_results || null,
          usage: event.data.usage || null
        };
        setHistory(prev => [...prev, newEntry]);
      }
    });

    return unsubscribe;
  }, [agentId]);

  return {
    agent,
    history,
    loading,
    error,
    refresh: fetchAgentData
  };
};
