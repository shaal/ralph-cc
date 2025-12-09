/**
 * Zustand Store Index
 *
 * Central exports for all application stores.
 * Call initializeStores() in App.tsx to set up event listeners and fetch initial data.
 */

import * as React from 'react';

// Re-export all stores
export { useProjectStore } from './projectStore';
export { useAgentStore } from './agentStore';
export { useGraphStore } from './graphStore';
export { useUIStore } from './uiStore';
export { useConfigStore } from './configStore';
export { useEventStore } from './eventStore';

// Re-export API helper
export { getApi, isElectron } from './api';

// Re-export types
export type {
  Project,
  CreateProjectDTO,
  ProjectSettings,
  Agent,
  AgentConfig,
  Node,
  Edge,
  NodeData,
  Viewport,
  Notification,
  Config,
  AppEvent,
  EventType,
} from './types';

/**
 * Initialize all stores
 *
 * This function should be called once when the app starts (in App.tsx).
 * It sets up event listeners and fetches initial data.
 *
 * @returns Cleanup function to call when unmounting
 */
export const initializeStores = async (): Promise<() => void> => {
  const { isElectron } = await import('./api');

  console.log('Initializing stores...');
  console.log('Running in:', isElectron() ? 'Electron' : 'Browser (mock mode)');

  const cleanupFunctions: Array<() => void> = [];

  try {
    // 1. Initialize event store first (this sets up event listeners)
    const { useEventStore } = await import('./eventStore');
    const cleanupEvents = useEventStore.getState().initialize();
    cleanupFunctions.push(cleanupEvents);

    // 2. Fetch config and check API key
    const { useConfigStore } = await import('./configStore');
    await useConfigStore.getState().fetchConfig();
    await useConfigStore.getState().checkApiKey();

    // 3. Fetch initial projects
    const { useProjectStore } = await import('./projectStore');
    await useProjectStore.getState().fetchProjects();

    // 4. Apply theme from config to UI store
    const { useUIStore } = await import('./uiStore');
    const config = useConfigStore.getState().config;
    if (config?.theme) {
      useUIStore.getState().setTheme(config.theme);
    }

    console.log('Stores initialized successfully');
  } catch (error) {
    console.error('Failed to initialize stores:', error);
    throw error;
  }

  // Return cleanup function
  return () => {
    console.log('Cleaning up stores...');
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
};

/**
 * Hook to initialize stores in a React component
 */
export const useStoreInitializer = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cleanup: (() => void) | undefined;

    initializeStores()
      .then((cleanupFn) => {
        cleanup = cleanupFn;
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error('Store initialization error:', err);
        setError(err);
      });

    return () => {
      cleanup?.();
    };
  }, []);

  return { isInitialized, error };
};
