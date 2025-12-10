/**
 * Preload Script - Secure Context Bridge
 * Exposes a type-safe API to the renderer process via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer
const api = {
  // ========================================
  // Project APIs
  // ========================================
  project: {
    create: (data: unknown) => ipcRenderer.invoke('project:create', data),
    get: (id: string) => ipcRenderer.invoke('project:get', id),
    list: () => ipcRenderer.invoke('project:list'),
    update: (id: string, data: unknown) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('project:delete', id),
    start: (id: string) => ipcRenderer.invoke('project:start', id),
    pause: (id: string) => ipcRenderer.invoke('project:pause', id),
    resume: (id: string) => ipcRenderer.invoke('project:resume', id),
    stop: (id: string) => ipcRenderer.invoke('project:stop', id),
    getCost: (id: string) => ipcRenderer.invoke('project:cost', id),
    getOutputs: (id: string, options?: unknown) =>
      ipcRenderer.invoke('project:outputs', id, options),
  },

  // ========================================
  // Agent APIs
  // ========================================
  agent: {
    get: (id: string) => ipcRenderer.invoke('agent:get', id),
    list: (projectId: string) => ipcRenderer.invoke('agent:list', projectId),
    history: (id: string, options?: unknown) => ipcRenderer.invoke('agent:history', id, options),
    pause: (id: string) => ipcRenderer.invoke('agent:pause', id),
    resume: (id: string) => ipcRenderer.invoke('agent:resume', id),
    stop: (id: string) => ipcRenderer.invoke('agent:stop', id),
  },

  // ========================================
  // Config APIs
  // ========================================
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (config: unknown) => ipcRenderer.invoke('config:set', config),
    update: (key: string, value: unknown) => ipcRenderer.invoke('config:update', key, value),
    setTheme: (theme: 'light' | 'dark' | 'system') =>
      ipcRenderer.invoke('config:setTheme', theme),
    reset: () => ipcRenderer.invoke('config:reset'),
  },

  // ========================================
  // Keychain APIs (secure API key storage)
  // ========================================
  keychain: {
    setApiKey: (key: string) => ipcRenderer.invoke('keychain:setApiKey', key),
    getApiKey: () => ipcRenderer.invoke('keychain:getApiKey'),
    hasApiKey: () => ipcRenderer.invoke('keychain:hasApiKey'),
    deleteApiKey: () => ipcRenderer.invoke('keychain:deleteApiKey'),
  },

  // ========================================
  // Proxy APIs (CLIProxyAPI for Claude subscription)
  // ========================================
  proxy: {
    /**
     * Check if the proxy is running and healthy
     * @param url - The proxy URL to check (e.g., "http://localhost:8317")
     * @returns { ok: boolean, error?: string }
     */
    checkHealth: (url: string) => ipcRenderer.invoke('proxy:checkHealth', url),
  },

  // ========================================
  // Event Subscription
  // ========================================
  // Generic event listener
  on: (channel: string, callback: (data: unknown) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(channel, subscription);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  // Subscribe to specific event type
  onEvent: (eventType: string, callback: (event: unknown) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: any) => {
      // Filter events by type
      if (data && data.type === eventType) {
        callback(data);
      }
    };
    ipcRenderer.on('event', subscription);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('event', subscription);
    };
  },

  // Subscribe to all events
  onAnyEvent: (callback: (event: unknown) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('event', subscription);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('event', subscription);
    };
  },

  // Remove event listener
  off: (channel: string, callback: (data: unknown) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

// Type-safe API for TypeScript
export type API = typeof api;

// Use contextBridge to safely expose the API to the renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error('Failed to expose API to renderer:', error);
  }
} else {
  // @ts-expect-error - Legacy fallback for non-isolated contexts
  window.api = api;
}
