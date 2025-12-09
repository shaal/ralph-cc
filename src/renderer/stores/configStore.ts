import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { Config } from './types';
import { getApi } from './api';

interface ConfigState {
  config: Config | null;
  hasApiKey: boolean;
  loading: boolean;
  error: Error | null;

  // Actions
  fetchConfig: () => Promise<void>;
  updateConfig: (key: keyof Config, value: any) => Promise<void>;
  updateMultipleConfig: (updates: Partial<Config>) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  checkApiKey: () => Promise<boolean>;
  resetConfig: () => Promise<void>;

  // Selectors
  getConfigValue: <K extends keyof Config>(key: K) => Config[K] | undefined;
  isConfigLoaded: () => boolean;
}

const DEFAULT_CONFIG: Config = {
  theme: 'dark',
  defaultModel: 'claude-opus-4-5-20251101',
  defaultTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
  defaultBudgetLimit: 10,
  defaultMaxIterations: 100,
  circuitBreakerThreshold: 5,
  completionThreshold: 3,
  eventThrottleMs: 16, // ~60fps
  maxRecentEvents: 100,
};

export const useConfigStore = create<ConfigState>()(
  devtools(
    immer((set, get) => ({
      config: null,
      hasApiKey: false,
      loading: false,
      error: null,

      fetchConfig: async () => {
        set({ loading: true, error: null });
        try {
          const config = await getApi().config.get();
          set({ config, loading: false });
        } catch (error) {
          console.error('Failed to fetch config:', error);
          // Use default config on error
          set({ config: DEFAULT_CONFIG, loading: false, error: error as Error });
        }
      },

      updateConfig: async (key, value) => {
        try {
          await getApi().config.update(key, value);
          set((state) => {
            if (state.config) {
              state.config[key] = value;
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      updateMultipleConfig: async (updates) => {
        try {
          // Update each config value
          await Promise.all(
            Object.entries(updates).map(([key, value]) =>
              getApi().config.update(key, value)
            )
          );

          set((state) => {
            if (state.config) {
              Object.assign(state.config, updates);
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      setApiKey: async (key) => {
        try {
          await getApi().keychain.setApiKey(key);
          set({ hasApiKey: true });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      checkApiKey: async () => {
        try {
          const hasKey = await getApi().keychain.hasApiKey();
          set({ hasApiKey: hasKey });
          return hasKey;
        } catch (error) {
          console.error('Failed to check API key:', error);
          set({ hasApiKey: false, error: error as Error });
          return false;
        }
      },

      resetConfig: async () => {
        try {
          // Reset to default config
          await Promise.all(
            Object.entries(DEFAULT_CONFIG).map(([key, value]) =>
              getApi().config.update(key, value)
            )
          );

          set({ config: DEFAULT_CONFIG });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      // Selectors
      getConfigValue: (key) => {
        const { config } = get();
        return config?.[key];
      },

      isConfigLoaded: () => {
        return get().config !== null;
      },
    })),
    { name: 'ConfigStore' }
  )
);
