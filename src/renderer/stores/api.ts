/**
 * API Helper for Stores
 * Provides a unified API interface that works in both Electron and browser
 */

/**
 * Check if we're running in Electron (with window.api available)
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && typeof window.api !== 'undefined';
};

/**
 * Mock API for browser development
 * Returns data directly (not wrapped in { success, data }) to match store expectations
 */
const mockApi = {
  project: {
    list: async () => [],
    get: async (_id: string) => null,
    create: async (data: any) => ({
      id: `mock-${Date.now()}`,
      ...data,
      status: 'created',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cost_total: 0,
      iteration_count: 0,
    }),
    update: async (_id: string, _data: any) => {},
    delete: async (_id: string) => {},
    start: async (_id: string) => {},
    pause: async (_id: string) => {},
    resume: async (_id: string) => {},
    stop: async (_id: string) => {},
  },
  agent: {
    list: async (_projectId?: string) => [],
    get: async (_id: string) => null,
    history: async (_id: string) => [],
    pause: async (_id: string) => {},
    resume: async (_id: string) => {},
  },
  config: {
    get: async () => ({
      theme: 'dark' as const,
      defaultModel: 'claude-opus-4-5-20251101',
      defaultTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
      defaultBudgetLimit: 10,
      defaultMaxIterations: 100,
      circuitBreakerThreshold: 5,
      completionThreshold: 3,
      eventThrottleMs: 16,
      maxRecentEvents: 100,
    }),
    set: async (_config: any) => {},
    update: async (_key: string, _value: any) => {},
  },
  keychain: {
    setApiKey: async (_key: string) => {},
    hasApiKey: async () => true, // Pretend we have API key in browser
    getApiKey: async () => 'mock-api-key',
  },
  on: (_channel: string, _callback: (data: any) => void) => {
    // No-op for browser
    return () => {};
  },
  onEvent: (_eventType: string, _callback: (event: any) => void) => {
    // No-op for browser
    return () => {};
  },
};

/**
 * Get the API (real or mock)
 */
export const getApi = (): typeof mockApi => {
  if (isElectron()) {
    return window.api as any;
  }
  console.warn('Running in browser mode with mock API');
  return mockApi;
};
