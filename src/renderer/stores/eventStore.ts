import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppEvent } from './types';
import { useProjectStore } from './projectStore';
import { useAgentStore } from './agentStore';
import { useGraphStore } from './graphStore';
import { useUIStore } from './uiStore';
import { getApi } from './api';

interface EventState {
  recentEvents: AppEvent[];
  isInitialized: boolean;

  // Actions
  initialize: () => () => void; // Returns cleanup function
  addEvent: (event: AppEvent) => void;
  clearEvents: () => void;

  // Selectors
  getEventsByType: (type: string) => AppEvent[];
  getEventsForProject: (projectId: string) => AppEvent[];
  getEventsForAgent: (agentId: string) => AppEvent[];
  getRecentEvents: (limit?: number) => AppEvent[];
}

export const useEventStore = create<EventState>()(
  devtools(
    (set, get) => ({
      recentEvents: [],
      isInitialized: false,

      initialize: () => {
        if (get().isInitialized) {
          console.warn('EventStore already initialized');
          return () => {};
        }

        console.log('Initializing EventStore...');

        const api = getApi();
        const unsubscribe = api.on('event', (event: AppEvent) => {
          // Add to recent events (keep last 100)
          set((state) => ({
            recentEvents: [event, ...state.recentEvents].slice(0, 100),
          }));

          // Route to appropriate store based on event type
          try {
            switch (event.type) {
              case 'project_created': {
                const project = event.data;
                useProjectStore.getState().updateProject(project.id, project);
                useUIStore.getState().addNotification({
                  type: 'success',
                  title: 'Project Created',
                  message: `Project "${project.name}" has been created.`,
                });
                break;
              }

              case 'project_updated': {
                const { id, ...updates } = event.data;
                useProjectStore.getState().updateProject(id, updates);
                break;
              }

              case 'project_deleted': {
                const { id } = event.data;
                useProjectStore.getState().deleteProject(id);
                useUIStore.getState().addNotification({
                  type: 'info',
                  message: 'Project has been deleted.',
                });
                break;
              }

              case 'project_status_changed': {
                const { id, status, previousStatus } = event.data;
                useProjectStore.getState().updateProject(id, { status });

                // Show notification for important status changes
                if (status === 'completed') {
                  useUIStore.getState().addNotification({
                    type: 'success',
                    title: 'Project Completed',
                    message: `Project has finished successfully.`,
                  });
                } else if (status === 'failed') {
                  useUIStore.getState().addNotification({
                    type: 'error',
                    title: 'Project Failed',
                    message: `Project encountered an error.`,
                  });
                }
                break;
              }

              case 'agent_created': {
                const agent = event.data;
                useAgentStore.getState().addAgent(agent);

                // Add node to graph
                const graphStore = useGraphStore.getState();
                graphStore.addNode({
                  id: agent.id,
                  type: 'agent',
                  data: {
                    agentId: agent.id,
                    label: `Agent ${agent.depth}`,
                    status: agent.status,
                    cost: agent.costTotal,
                    iterations: agent.iterationCount,
                  },
                  position: { x: 0, y: 0 }, // Layout will position it
                });

                // Add edge if it has a parent
                if (agent.parentId) {
                  graphStore.setEdges([
                    ...graphStore.edges,
                    {
                      id: `${agent.parentId}-${agent.id}`,
                      source: agent.parentId,
                      target: agent.id,
                      animated: true,
                    },
                  ]);
                }
                break;
              }

              case 'agent_updated':
              case 'agent_status_changed': {
                const { id, ...updates } = event.data;
                useAgentStore.getState().updateAgent(id, updates);

                // Update graph node
                useGraphStore.getState().updateNode(id, {
                  status: updates.status,
                  cost: updates.costTotal,
                  iterations: updates.iterationCount,
                });
                break;
              }

              case 'agent_output_chunk': {
                // This would be handled by a separate output stream store
                // or directly by components subscribing to agent output
                break;
              }

              case 'agent_completed': {
                const { id } = event.data;
                useAgentStore.getState().updateAgent(id, { status: 'completed' });
                useGraphStore.getState().updateNode(id, { status: 'completed' });
                break;
              }

              case 'agent_failed': {
                const { id, error } = event.data;
                useAgentStore.getState().updateAgent(id, { status: 'failed' });
                useGraphStore.getState().updateNode(id, { status: 'failed' });
                useUIStore.getState().addNotification({
                  type: 'error',
                  title: 'Agent Failed',
                  message: error || 'An agent encountered an error.',
                });
                break;
              }

              case 'cost_updated': {
                const { projectId, agentId, costTotal } = event.data;
                if (projectId) {
                  useProjectStore.getState().updateProject(projectId, {
                    costTotal,
                  });
                }
                if (agentId) {
                  useAgentStore.getState().updateAgent(agentId, { costTotal });
                  useGraphStore.getState().updateNode(agentId, { cost: costTotal });
                }
                break;
              }

              case 'iteration_completed': {
                const { agentId, iterationCount } = event.data;
                useAgentStore.getState().updateAgent(agentId, { iterationCount });
                useGraphStore.getState().updateNode(agentId, {
                  iterations: iterationCount,
                });
                break;
              }

              case 'circuit_breaker_triggered': {
                const { projectId, reason } = event.data;
                useProjectStore.getState().updateProject(projectId, {
                  status: 'paused',
                });
                useUIStore.getState().addNotification({
                  type: 'warning',
                  title: 'Circuit Breaker Triggered',
                  message: reason || 'Project paused due to repeated failures.',
                  duration: 10000,
                });
                break;
              }

              case 'budget_limit_reached': {
                const { projectId, budgetLimit, costTotal } = event.data;
                useProjectStore.getState().updateProject(projectId, {
                  status: 'paused',
                });
                useUIStore.getState().addNotification({
                  type: 'warning',
                  title: 'Budget Limit Reached',
                  message: `Project paused: cost ($${costTotal.toFixed(2)}) exceeded limit ($${budgetLimit.toFixed(2)}).`,
                  duration: 10000,
                });
                break;
              }

              default:
                console.log('Unhandled event type:', event.type);
            }
          } catch (error) {
            console.error('Error handling event:', event.type, error);
          }
        });

        set({ isInitialized: true });
        console.log('EventStore initialized');

        return () => {
          unsubscribe();
          set({ isInitialized: false });
          console.log('EventStore cleanup');
        };
      },

      addEvent: (event) => {
        set((state) => ({
          recentEvents: [event, ...state.recentEvents].slice(0, 100),
        }));
      },

      clearEvents: () => {
        set({ recentEvents: [] });
      },

      // Selectors
      getEventsByType: (type) => {
        const { recentEvents } = get();
        return recentEvents.filter((e) => e.type === type);
      },

      getEventsForProject: (projectId) => {
        const { recentEvents } = get();
        return recentEvents.filter((e) => e.data?.projectId === projectId);
      },

      getEventsForAgent: (agentId) => {
        const { recentEvents } = get();
        return recentEvents.filter(
          (e) => e.data?.agentId === agentId || e.data?.id === agentId
        );
      },

      getRecentEvents: (limit = 10) => {
        const { recentEvents } = get();
        return recentEvents.slice(0, limit);
      },
    }),
    { name: 'EventStore' }
  )
);
