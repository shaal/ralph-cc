/**
 * IPC Handlers Registration
 * Central module for registering all IPC handlers on app startup
 */

import { BrowserWindow } from 'electron';
import {
  registerProjectHandlers,
  setProjectService,
  setAgentOrchestrator as setProjectAgentOrchestrator,
} from './projectHandlers';
import {
  registerAgentHandlers,
  setAgentService,
  setAgentOrchestrator as setAgentAgentOrchestrator,
} from './agentHandlers';
import {
  registerConfigHandlers,
  setConfigService,
  setKeychainService,
} from './configHandlers';

// Service interface types
// These will be implemented in separate service modules
interface Services {
  projectService?: any;
  agentService?: any;
  configService?: any;
  keychainService?: any;
  agentOrchestrator?: any;
  eventBus?: EventBus;
}

interface EventBus {
  on(event: string, handler: (data: any) => void): () => void;
  emit(event: string, data: any): void;
}

// Global reference to the main window
let mainWindow: BrowserWindow | null = null;

/**
 * Set the main window reference for event broadcasting
 */
export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window;
}

/**
 * Broadcast an event to the renderer process
 */
export function broadcastEvent(eventType: string, data: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('event', {
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
    });
  }
}

/**
 * Initialize all IPC handlers
 * This should be called once during app startup, after services are initialized
 */
export function initializeIpcHandlers(services: Services = {}): void {
  console.log('Initializing IPC handlers...');

  // Inject services into handlers
  if (services.projectService) {
    setProjectService(services.projectService);
  }

  if (services.agentService) {
    setAgentService(services.agentService);
  }

  if (services.configService) {
    setConfigService(services.configService);
  }

  if (services.keychainService) {
    setKeychainService(services.keychainService);
  }

  if (services.agentOrchestrator) {
    setProjectAgentOrchestrator(services.agentOrchestrator);
    setAgentAgentOrchestrator(services.agentOrchestrator);
  }

  // Register all handler modules
  registerProjectHandlers();
  registerAgentHandlers();
  registerConfigHandlers();

  // Set up event bus subscription to broadcast events to renderer
  if (services.eventBus) {
    setupEventBusForwarding(services.eventBus);
  }

  console.log('IPC handlers initialized successfully');
}

/**
 * Set up event bus to forward events to the renderer process
 */
function setupEventBusForwarding(eventBus: EventBus): void {
  // Subscribe to all events and forward them to the renderer
  const eventTypes = [
    // Project events
    'project_created',
    'project_started',
    'project_paused',
    'project_resumed',
    'project_stopped',
    'project_completed',
    'project_updated',
    'project_deleted',

    // Agent events
    'agent_created',
    'agent_output_chunk',
    'agent_tool_call',
    'agent_status_changed',
    'subagent_spawned',

    // Iteration events
    'iteration_complete',
    'iteration_error',

    // Tool events
    'tool_executed',

    // Circuit breaker events
    'circuit_breaker_triggered',

    // Budget events
    'budget_exceeded',
    'budget_warning',

    // API events
    'api_key_required',

    // Error events
    'agent_error',
  ];

  eventTypes.forEach((eventType) => {
    eventBus.on(eventType, (data) => {
      broadcastEvent(eventType, data);
    });
  });

  console.log(`Forwarding ${eventTypes.length} event types to renderer`);
}

/**
 * Cleanup function to be called on app shutdown
 */
export function cleanupIpcHandlers(): void {
  console.log('Cleaning up IPC handlers...');
  mainWindow = null;
  // Note: ipcMain handlers are automatically cleaned up when the app quits
}
