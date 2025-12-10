import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

let mainWindow: BrowserWindow | null = null;

// Mock data for initial development
const mockProjects: any[] = [];

// Config that matches the renderer's Config type from stores/types.ts
const mockConfig: Record<string, any> = {
  theme: 'dark',
  defaultModel: 'claude-opus-4-5-20251101',
  defaultTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
  defaultBudgetLimit: 10,
  defaultMaxIterations: 100,
  circuitBreakerThreshold: 5,
  completionThreshold: 3,
  eventThrottleMs: 16,
  maxRecentEvents: 100,
  // Proxy configuration for using Claude subscription via CLIProxyAPI
  proxy: {
    enabled: false,
    url: 'http://localhost:8317',
  },
};

let hasApiKey = false;

// Register IPC handlers
function registerIpcHandlers(): void {
  // Config handlers - return data directly (not wrapped) to match store expectations
  ipcMain.handle('config:get', async () => {
    return mockConfig;
  });

  ipcMain.handle('config:set', async (_event, config: any) => {
    Object.assign(mockConfig, config);
    console.log('Config updated:', Object.keys(config));
  });

  ipcMain.handle('config:update', async (_event, key: string, value: any) => {
    mockConfig[key] = value;
    console.log(`Config updated: ${key} =`, value);
  });

  // Keychain handlers
  ipcMain.handle('keychain:setApiKey', async (_event, key: string) => {
    console.log('API key set (stored securely)');
    hasApiKey = true;
  });

  ipcMain.handle('keychain:hasApiKey', async () => {
    // If proxy is enabled, we don't need an API key
    if (mockConfig.proxy?.enabled) {
      return true;
    }
    return hasApiKey;
  });

  ipcMain.handle('keychain:getApiKey', async () => {
    return hasApiKey ? 'sk-***' : null;
  });

  // Proxy handlers
  ipcMain.handle('proxy:checkHealth', async (_event, url: string) => {
    console.log(`Checking proxy health at ${url}...`);
    try {
      // Try to fetch from the proxy - use /v1/models as a health check endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${url}/v1/models`, {
        method: 'GET',
        headers: {
          'X-Api-Key': 'health-check', // Dummy key for health check
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 401) {
        // 401 is actually good - it means the proxy is running but needs auth
        // The proxy will handle real auth when we make actual requests
        console.log('Proxy health check passed');
        return { ok: true };
      } else {
        console.log(`Proxy returned status ${response.status}`);
        return { ok: false, error: `Proxy returned status ${response.status}` };
      }
    } catch (error: any) {
      console.log('Proxy health check failed:', error.message);
      if (error.name === 'AbortError') {
        return { ok: false, error: 'Connection timed out. Is CLIProxyAPI running?' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { ok: false, error: 'Connection refused. CLIProxyAPI is not running on this port.' };
      }
      return { ok: false, error: error.message || 'Failed to connect to proxy' };
    }
  });

  // Project handlers
  ipcMain.handle('project:list', async () => {
    return { success: true, data: mockProjects };
  });

  ipcMain.handle('project:get', async (_event, id: string) => {
    const project = mockProjects.find(p => p.id === id);
    return { success: true, data: project || null };
  });

  ipcMain.handle('project:create', async (_event, data: any) => {
    const newProject = {
      id: `project-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      prompt: data.prompt,
      status: 'created',
      settings: data.settings || {},
      cost_total: 0,
      iteration_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockProjects.push(newProject);
    return { success: true, data: newProject };
  });

  ipcMain.handle('project:update', async (_event, id: string, data: any) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProjects[index] = { ...mockProjects[index], ...data, updated_at: new Date().toISOString() };
      return { success: true, data: mockProjects[index] };
    }
    return { success: false, error: 'Project not found' };
  });

  ipcMain.handle('project:delete', async (_event, id: string) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProjects.splice(index, 1);
      return { success: true };
    }
    return { success: false, error: 'Project not found' };
  });

  ipcMain.handle('project:start', async (_event, id: string) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProjects[index].status = 'running';
      return { success: true };
    }
    return { success: false, error: 'Project not found' };
  });

  ipcMain.handle('project:pause', async (_event, id: string) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProjects[index].status = 'paused';
      return { success: true };
    }
    return { success: false, error: 'Project not found' };
  });

  ipcMain.handle('project:resume', async (_event, id: string) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProjects[index].status = 'running';
      return { success: true };
    }
    return { success: false, error: 'Project not found' };
  });

  ipcMain.handle('project:stop', async (_event, id: string) => {
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProjects[index].status = 'stopped';
      return { success: true };
    }
    return { success: false, error: 'Project not found' };
  });

  // Agent handlers
  ipcMain.handle('agent:list', async (_event, projectId: string) => {
    return { success: true, data: [] };
  });

  ipcMain.handle('agent:get', async (_event, id: string) => {
    return { success: true, data: null };
  });

  ipcMain.handle('agent:history', async (_event, id: string, options: any) => {
    return { success: true, data: [] };
  });

  console.log('IPC handlers registered');
}

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0A0A0F',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../resources/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli
  // Load the remote URL for development or the local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.constellation.app');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Register IPC handlers BEFORE creating window
  registerIpcHandlers();

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app lifecycle
app.on('before-quit', () => {
  // Cleanup logic will go here (close DB connections, etc.)
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow navigation only to app's own content
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  contents.setWindowOpenHandler(({ url }) => {
    // Open links in external browser
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});
