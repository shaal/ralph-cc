/**
 * Config IPC Handlers
 * Handles all configuration-related IPC communications between renderer and main process
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type { Config, ApiResponse } from '../database/types';

// These will be injected when services are implemented
interface ConfigService {
  get(): Promise<Config>;
  set(key: string, value: unknown): Promise<Config>;
  setTheme(theme: 'light' | 'dark' | 'system'): Promise<Config>;
  reset(): Promise<Config>;
}

interface KeychainService {
  setApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  hasApiKey(): Promise<boolean>;
  deleteApiKey(): Promise<void>;
}

// Service instances (will be initialized by handlers.ts)
let configService: ConfigService;
let keychainService: KeychainService;

export function setConfigService(service: ConfigService): void {
  configService = service;
}

export function setKeychainService(service: KeychainService): void {
  keychainService = service;
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
 * Register all config-related IPC handlers
 */
export function registerConfigHandlers(): void {
  // Get full config
  ipcMain.handle(
    'config:get',
    async (_event: IpcMainInvokeEvent): Promise<ApiResponse<Config>> => {
      try {
        if (!configService) {
          throw new Error('ConfigService not initialized');
        }
        const config = await configService.get();
        return wrapResponse(config);
      } catch (error) {
        console.error('Error getting config:', error);
        return wrapError(error);
      }
    }
  );

  // Set config value
  ipcMain.handle(
    'config:set',
    async (
      _event: IpcMainInvokeEvent,
      key: string,
      value: unknown
    ): Promise<ApiResponse<Config>> => {
      try {
        if (!configService) {
          throw new Error('ConfigService not initialized');
        }
        const config = await configService.set(key, value);
        return wrapResponse(config);
      } catch (error) {
        console.error('Error setting config:', error);
        return wrapError(error);
      }
    }
  );

  // Set theme
  ipcMain.handle(
    'config:setTheme',
    async (
      _event: IpcMainInvokeEvent,
      theme: 'light' | 'dark' | 'system'
    ): Promise<ApiResponse<Config>> => {
      try {
        if (!configService) {
          throw new Error('ConfigService not initialized');
        }
        const config = await configService.setTheme(theme);
        return wrapResponse(config);
      } catch (error) {
        console.error('Error setting theme:', error);
        return wrapError(error);
      }
    }
  );

  // Reset config to defaults
  ipcMain.handle(
    'config:reset',
    async (_event: IpcMainInvokeEvent): Promise<ApiResponse<Config>> => {
      try {
        if (!configService) {
          throw new Error('ConfigService not initialized');
        }
        const config = await configService.reset();
        return wrapResponse(config);
      } catch (error) {
        console.error('Error resetting config:', error);
        return wrapError(error);
      }
    }
  );

  // Set API key (uses KeychainService)
  ipcMain.handle(
    'config:setApiKey',
    async (_event: IpcMainInvokeEvent, key: string): Promise<ApiResponse<void>> => {
      try {
        if (!keychainService) {
          throw new Error('KeychainService not initialized');
        }
        await keychainService.setApiKey(key);
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error setting API key:', error);
        return wrapError(error);
      }
    }
  );

  // Get API key
  ipcMain.handle(
    'config:getApiKey',
    async (_event: IpcMainInvokeEvent): Promise<ApiResponse<string | null>> => {
      try {
        if (!keychainService) {
          throw new Error('KeychainService not initialized');
        }
        const key = await keychainService.getApiKey();
        return wrapResponse(key);
      } catch (error) {
        console.error('Error getting API key:', error);
        return wrapError(error);
      }
    }
  );

  // Check if API key exists
  ipcMain.handle(
    'config:hasApiKey',
    async (_event: IpcMainInvokeEvent): Promise<ApiResponse<boolean>> => {
      try {
        if (!keychainService) {
          throw new Error('KeychainService not initialized');
        }
        const hasKey = await keychainService.hasApiKey();
        return wrapResponse(hasKey);
      } catch (error) {
        console.error('Error checking API key:', error);
        return wrapError(error);
      }
    }
  );

  // Delete API key
  ipcMain.handle(
    'config:deleteApiKey',
    async (_event: IpcMainInvokeEvent): Promise<ApiResponse<void>> => {
      try {
        if (!keychainService) {
          throw new Error('KeychainService not initialized');
        }
        await keychainService.deleteApiKey();
        return wrapResponse(undefined);
      } catch (error) {
        console.error('Error deleting API key:', error);
        return wrapError(error);
      }
    }
  );
}
