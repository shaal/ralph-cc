/**
 * Agent IPC Handlers
 * Handles all agent-related IPC communications between renderer and main process
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type {
  Agent,
  AgentHistory,
  FindHistoryOptions,
  ApiResponse,
} from '../database/types';

// These will be injected when services are implemented
interface AgentService {
  get(id: string): Promise<Agent | null>;
  listByProject(projectId: string): Promise<Agent[]>;
  getHistory(agentId: string, options?: FindHistoryOptions): Promise<AgentHistory[]>;
  getHistoryCount(agentId: string): Promise<number>;
}

interface AgentOrchestrator {
  pauseAgent(agentId: string): Promise<void>;
  resumeAgent(agentId: string): Promise<void>;
  stopAgent(agentId: string): Promise<void>;
}

// Service instances (will be initialized by handlers.ts)
let agentService: AgentService;
let agentOrchestrator: AgentOrchestrator;

export function setAgentService(service: AgentService): void {
  agentService = service;
}

export function setAgentOrchestrator(orchestrator: AgentOrchestrator): void {
  agentOrchestrator = orchestrator;
}

/**
 * Helper function to wrap responses in success/error format
 */
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function wrapError(error: unknown): ApiResponse {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  const code = (error as any)?.code;
  return {
    success: false,
    error: {
      message,
      code,
      details: error,
    },
  };
}

/**
 * Register all agent-related IPC handlers
 */
export function registerAgentHandlers(): void {
  // Get agent by ID
  ipcMain.handle(
    'agent:get',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<Agent | null>> => {
      try {
        if (!agentService) {
          throw new Error('AgentService not initialized');
        }
        const agent = await agentService.get(id);
        return wrapResponse(agent);
      } catch (error) {
        console.error('Error getting agent:', error);
        return wrapError(error);
      }
    }
  );

  // List agents by project ID
  ipcMain.handle(
    'agent:list',
    async (_event: IpcMainInvokeEvent, projectId: string): Promise<ApiResponse<Agent[]>> => {
      try {
        if (!agentService) {
          throw new Error('AgentService not initialized');
        }
        const agents = await agentService.listByProject(projectId);
        return wrapResponse(agents);
      } catch (error) {
        console.error('Error listing agents:', error);
        return wrapError(error);
      }
    }
  );

  // Get agent history (paginated)
  ipcMain.handle(
    'agent:history',
    async (
      _event: IpcMainInvokeEvent,
      id: string,
      options?: FindHistoryOptions
    ): Promise<
      ApiResponse<{
        history: AgentHistory[];
        total: number;
        hasMore: boolean;
      }>
    > => {
      try {
        if (!agentService) {
          throw new Error('AgentService not initialized');
        }

        // Get history with pagination
        const history = await agentService.getHistory(id, options);
        const total = await agentService.getHistoryCount(id);

        // Calculate if there are more items
        const offset = options?.offset || 0;
        const limit = options?.limit || 50;
        const hasMore = offset + history.length < total;

        return wrapResponse({
          history,
          total,
          hasMore,
        });
      } catch (error) {
        console.error('Error getting agent history:', error);
        return wrapError(error);
      }
    }
  );

  // Pause agent
  ipcMain.handle(
    'agent:pause',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!agentOrchestrator) {
          throw new Error('AgentOrchestrator not initialized');
        }
        await agentOrchestrator.pauseAgent(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error pausing agent:', error);
        return wrapError(error);
      }
    }
  );

  // Resume agent
  ipcMain.handle(
    'agent:resume',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!agentOrchestrator) {
          throw new Error('AgentOrchestrator not initialized');
        }
        await agentOrchestrator.resumeAgent(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error resuming agent:', error);
        return wrapError(error);
      }
    }
  );

  // Stop agent
  ipcMain.handle(
    'agent:stop',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!agentOrchestrator) {
          throw new Error('AgentOrchestrator not initialized');
        }
        await agentOrchestrator.stopAgent(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error stopping agent:', error);
        return wrapError(error);
      }
    }
  );
}
