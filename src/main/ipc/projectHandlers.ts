/**
 * Project IPC Handlers
 * Handles all project-related IPC communications between renderer and main process
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type {
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectCostSummary,
  Output,
  ApiResponse,
} from '../database/types';

// These will be injected when services are implemented
// For now, we'll define the interface that services must implement
interface ProjectService {
  create(data: CreateProjectDTO): Promise<Project>;
  get(id: string): Promise<Project | null>;
  list(): Promise<Project[]>;
  update(id: string, data: UpdateProjectDTO): Promise<Project>;
  delete(id: string): Promise<void>;
  getCostSummary(id: string): Promise<ProjectCostSummary>;
  getOutputs(id: string, options?: { limit?: number; offset?: number }): Promise<Output[]>;
}

interface AgentOrchestrator {
  startProject(projectId: string): Promise<void>;
  pauseProject(projectId: string): Promise<void>;
  resumeProject(projectId: string): Promise<void>;
  stopProject(projectId: string): Promise<void>;
}

// Service instances (will be initialized by handlers.ts)
let projectService: ProjectService;
let agentOrchestrator: AgentOrchestrator;

export function setProjectService(service: ProjectService): void {
  projectService = service;
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
 * Register all project-related IPC handlers
 */
export function registerProjectHandlers(): void {
  // Create new project
  ipcMain.handle(
    'project:create',
    async (_event: IpcMainInvokeEvent, data: CreateProjectDTO): Promise<ApiResponse<Project>> => {
      try {
        if (!projectService) {
          throw new Error('ProjectService not initialized');
        }
        const project = await projectService.create(data);
        return wrapResponse(project);
      } catch (error) {
        console.error('Error creating project:', error);
        return wrapError(error);
      }
    }
  );

  // Get project by ID
  ipcMain.handle(
    'project:get',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<Project | null>> => {
      try {
        if (!projectService) {
          throw new Error('ProjectService not initialized');
        }
        const project = await projectService.get(id);
        return wrapResponse(project);
      } catch (error) {
        console.error('Error getting project:', error);
        return wrapError(error);
      }
    }
  );

  // List all projects
  ipcMain.handle(
    'project:list',
    async (_event: IpcMainInvokeEvent): Promise<ApiResponse<Project[]>> => {
      try {
        if (!projectService) {
          throw new Error('ProjectService not initialized');
        }
        const projects = await projectService.list();
        return wrapResponse(projects);
      } catch (error) {
        console.error('Error listing projects:', error);
        return wrapError(error);
      }
    }
  );

  // Update project
  ipcMain.handle(
    'project:update',
    async (
      _event: IpcMainInvokeEvent,
      id: string,
      data: UpdateProjectDTO
    ): Promise<ApiResponse<Project>> => {
      try {
        if (!projectService) {
          throw new Error('ProjectService not initialized');
        }
        const project = await projectService.update(id, data);
        return wrapResponse(project);
      } catch (error) {
        console.error('Error updating project:', error);
        return wrapError(error);
      }
    }
  );

  // Delete project
  ipcMain.handle(
    'project:delete',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!projectService) {
          throw new Error('ProjectService not initialized');
        }
        await projectService.delete(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error deleting project:', error);
        return wrapError(error);
      }
    }
  );

  // Start project (Ralph loop)
  ipcMain.handle(
    'project:start',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!agentOrchestrator) {
          throw new Error('AgentOrchestrator not initialized');
        }
        await agentOrchestrator.startProject(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error starting project:', error);
        return wrapError(error);
      }
    }
  );

  // Pause project
  ipcMain.handle(
    'project:pause',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!agentOrchestrator) {
          throw new Error('AgentOrchestrator not initialized');
        }
        await agentOrchestrator.pauseProject(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error pausing project:', error);
        return wrapError(error);
      }
    }
  );

  // Resume project
  ipcMain.handle(
    'project:resume',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!agentOrchestrator) {
          throw new Error('AgentOrchestrator not initialized');
        }
        await agentOrchestrator.resumeProject(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error resuming project:', error);
        return wrapError(error);
      }
    }
  );

  // Stop project
  ipcMain.handle(
    'project:stop',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<void>> => {
      try {
        if (!agentOrchestrator) {
          throw new Error('AgentOrchestrator not initialized');
        }
        await agentOrchestrator.stopProject(id);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error stopping project:', error);
        return wrapError(error);
      }
    }
  );

  // Get project cost summary
  ipcMain.handle(
    'project:cost',
    async (_event: IpcMainInvokeEvent, id: string): Promise<ApiResponse<ProjectCostSummary>> => {
      try {
        if (!projectService) {
          throw new Error('ProjectService not initialized');
        }
        const costSummary = await projectService.getCostSummary(id);
        return wrapResponse(costSummary);
      } catch (error) {
        console.error('Error getting project cost:', error);
        return wrapError(error);
      }
    }
  );

  // Get project outputs
  ipcMain.handle(
    'project:outputs',
    async (
      _event: IpcMainInvokeEvent,
      id: string,
      options?: { limit?: number; offset?: number }
    ): Promise<ApiResponse<Output[]>> => {
      try {
        if (!projectService) {
          throw new Error('ProjectService not initialized');
        }
        const outputs = await projectService.getOutputs(id, options);
        return wrapResponse(outputs);
      } catch (error) {
        console.error('Error getting project outputs:', error);
        return wrapError(error);
      }
    }
  );
}
