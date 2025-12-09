/**
 * IPC Module Exports
 * Centralizes all IPC-related exports for easier importing
 */

export {
  initializeIpcHandlers,
  setMainWindow,
  broadcastEvent,
  cleanupIpcHandlers,
} from './handlers';

export { registerProjectHandlers, setProjectService } from './projectHandlers';
export { registerAgentHandlers, setAgentService } from './agentHandlers';
export { registerConfigHandlers, setConfigService, setKeychainService } from './configHandlers';
