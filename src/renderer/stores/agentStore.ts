import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { Agent } from './types';
import { getApi } from './api';

interface AgentState {
  agents: Map<string, Agent[]>; // projectId -> agents
  selectedAgentId: string | null;
  loading: boolean;
  error: Error | null;

  // Actions
  fetchAgents: (projectId: string) => Promise<void>;
  updateAgent: (agentId: string, data: Partial<Agent>) => void;
  addAgent: (agent: Agent) => void;
  selectAgent: (id: string | null) => void;
  pauseAgent: (agentId: string) => Promise<void>;
  resumeAgent: (agentId: string) => Promise<void>;
  clearAgents: (projectId: string) => void;

  // Selectors
  getAgentsByProject: (projectId: string) => Agent[];
  getSelectedAgent: () => Agent | null;
  getAgentById: (id: string) => Agent | undefined;
  getRootAgents: (projectId: string) => Agent[];
  getChildAgents: (parentId: string) => Agent[];
  getAgentTree: (projectId: string) => Agent[];
}

export const useAgentStore = create<AgentState>()(
  devtools(
    immer((set, get) => ({
      agents: new Map(),
      selectedAgentId: null,
      loading: false,
      error: null,

      fetchAgents: async (projectId) => {
        set({ loading: true, error: null });
        try {
          const agents = await getApi().agent.list(projectId);
          set((state) => {
            state.agents.set(projectId, agents);
            state.loading = false;
          });
        } catch (error) {
          set({ error: error as Error, loading: false });
          throw error;
        }
      },

      updateAgent: (agentId, data) => {
        set((state) => {
          // Find the agent in any project
          for (const [projectId, agents] of state.agents.entries()) {
            const index = agents.findIndex((a) => a.id === agentId);
            if (index !== -1) {
              const updatedAgents = [...agents];
              updatedAgents[index] = { ...updatedAgents[index], ...data };
              state.agents.set(projectId, updatedAgents);
              break;
            }
          }
        });
      },

      addAgent: (agent) => {
        set((state) => {
          const agents = state.agents.get(agent.projectId) || [];
          state.agents.set(agent.projectId, [...agents, agent]);
        });
      },

      selectAgent: (id) => {
        set({ selectedAgentId: id });
      },

      pauseAgent: async (agentId) => {
        try {
          await getApi().agent.pause(agentId);
          get().updateAgent(agentId, { status: 'paused' });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      resumeAgent: async (agentId) => {
        try {
          await getApi().agent.resume(agentId);
          get().updateAgent(agentId, { status: 'running' });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      clearAgents: (projectId) => {
        set((state) => {
          state.agents.delete(projectId);
        });
      },

      // Selectors
      getAgentsByProject: (projectId) => {
        const { agents } = get();
        return agents.get(projectId) || [];
      },

      getSelectedAgent: () => {
        const { agents, selectedAgentId } = get();
        if (!selectedAgentId) return null;

        for (const projectAgents of agents.values()) {
          const agent = projectAgents.find((a) => a.id === selectedAgentId);
          if (agent) return agent;
        }
        return null;
      },

      getAgentById: (id) => {
        const { agents } = get();
        for (const projectAgents of agents.values()) {
          const agent = projectAgents.find((a) => a.id === id);
          if (agent) return agent;
        }
        return undefined;
      },

      getRootAgents: (projectId) => {
        const agents = get().getAgentsByProject(projectId);
        return agents.filter((a) => a.parentId === null);
      },

      getChildAgents: (parentId) => {
        const { agents } = get();
        const allAgents: Agent[] = [];
        for (const projectAgents of agents.values()) {
          allAgents.push(...projectAgents);
        }
        return allAgents.filter((a) => a.parentId === parentId);
      },

      getAgentTree: (projectId) => {
        const agents = get().getAgentsByProject(projectId);
        // Sort by depth (parent agents first) for tree visualization
        return [...agents].sort((a, b) => a.depth - b.depth);
      },
    })),
    { name: 'AgentStore' }
  )
);
