import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import * as fs from 'fs';

// Database
import DatabaseManager from './database/Database';
import { ProjectRepository } from './database/repositories/ProjectRepository';
import { AgentRepository } from './database/repositories/AgentRepository';
import { HistoryRepository } from './database/repositories/HistoryRepository';

// Services
import { ClaudeClient } from './claude/ClaudeClient';
import { RalphEngine } from './services/ralph/RalphEngine';
import { getEventBus, type Event, type EventType } from './services/EventBus';

let mainWindow: BrowserWindow | null = null;

// Service instances (initialized after database)
let projectRepo: ProjectRepository;
let agentRepo: AgentRepository;
let historyRepo: HistoryRepository;
let claudeClient: ClaudeClient;
let ralphEngine: RalphEngine;

// Config stored in memory (could be persisted to DB later)
const config: Record<string, any> = {
  theme: 'dark',
  defaultModel: 'claude-sonnet-4',
  defaultTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
  defaultBudgetLimit: 10,
  defaultMaxIterations: 100,
  circuitBreakerThreshold: 5,
  completionThreshold: 3,
  eventThrottleMs: 16,
  maxRecentEvents: 100,
  proxy: {
    enabled: false,
    url: 'http://localhost:8317',
    apiKey: 'your-api-key-1', // API key from CLIProxyAPI's config.yaml api-keys list
  },
};

let hasApiKey = false;
let storedApiKey: string | null = null;

/**
 * Initialize database and services
 */
function initializeServices(): void {
  console.log('[Main] Initializing services...');

  // Initialize database
  DatabaseManager.init();
  console.log('[Main] Database initialized at:', DatabaseManager.getPath());

  // Create repositories
  projectRepo = new ProjectRepository();
  agentRepo = new AgentRepository();
  historyRepo = new HistoryRepository();

  // Create Claude client (will be initialized with API key later)
  claudeClient = new ClaudeClient();

  // Create Ralph engine
  ralphEngine = new RalphEngine(claudeClient, {
    maxConcurrentLoops: 10,
    defaultModel: config.defaultModel,
    defaultMaxTokens: 8192,
    defaultMaxIterations: config.defaultMaxIterations,
  });

  console.log('[Main] Services initialized');
}

/**
 * Forward EventBus events to renderer via IPC
 */
function setupEventForwarding(): void {
  const eventBus = getEventBus();

  // Subscribe to all events and forward to renderer
  eventBus.subscribeAll((event: Event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('event', {
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
        id: event.id,
      });
    }
  });

  console.log('[Main] Event forwarding configured');
}

/**
 * Register all IPC handlers
 */
function registerIpcHandlers(): void {
  // ========================================
  // Config handlers
  // ========================================
  ipcMain.handle('config:get', async () => {
    return config;
  });

  ipcMain.handle('config:set', async (_event, newConfig: any) => {
    Object.assign(config, newConfig);
    console.log('[Config] Updated:', Object.keys(newConfig));
  });

  ipcMain.handle('config:update', async (_event, key: string, value: any) => {
    config[key] = value;
    console.log(`[Config] Updated: ${key} =`, value);

    // If proxy is being enabled, initialize Claude client with proxy
    if (key === 'proxy' && value?.enabled && value?.url) {
      try {
        const proxyApiKey = value.apiKey || config.proxy?.apiKey || 'your-api-key-1';
        await claudeClient.initialize({
          apiKey: proxyApiKey,
          proxy: { enabled: true, url: value.url },
        });
        console.log('[ClaudeClient] Initialized with proxy after config update');
      } catch (error) {
        console.error('[ClaudeClient] Failed to initialize with proxy:', error);
      }
    }
  });

  // ========================================
  // Keychain handlers
  // ========================================
  ipcMain.handle('keychain:setApiKey', async (_event, key: string) => {
    // In production, use electron-keychain or similar
    storedApiKey = key;
    hasApiKey = true;
    console.log('[Keychain] API key stored');

    // Initialize Claude client with the key
    try {
      await claudeClient.initialize({
        apiKey: key,
        proxy: config.proxy,
      });
      console.log('[ClaudeClient] Initialized with API key');
    } catch (error) {
      console.error('[ClaudeClient] Failed to initialize:', error);
    }
  });

  ipcMain.handle('keychain:hasApiKey', async () => {
    // If proxy is enabled, we don't need an API key
    if (config.proxy?.enabled) {
      return true;
    }
    return hasApiKey;
  });

  ipcMain.handle('keychain:getApiKey', async () => {
    return hasApiKey ? 'sk-***' : null;
  });

  ipcMain.handle('keychain:deleteApiKey', async () => {
    storedApiKey = null;
    hasApiKey = false;
    console.log('[Keychain] API key deleted');
  });

  // ========================================
  // Proxy handlers
  // ========================================

  /**
   * Enhanced proxy health check that verifies both connectivity AND authentication
   * Returns detailed status so UI can guide the user appropriately
   */
  ipcMain.handle('proxy:checkHealth', async (_event, url: string) => {
    console.log(`[Proxy] Checking health at ${url}...`);

    // Get the configured proxy API key (this is the client access key for CLIProxyAPI)
    const proxyApiKey = config.proxy?.apiKey || 'your-api-key-1';
    console.log(`[Proxy] Using API key: ${proxyApiKey.substring(0, 5)}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // CLIProxyAPI expects the API key as a Bearer token
      const response = await fetch(`${url}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${proxyApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response body for more details
      let body: any = null;
      try {
        body = await response.json();
      } catch {
        // Body might not be JSON
      }

      if (response.ok) {
        // 200 OK - Proxy is running AND authenticated
        console.log('[Proxy] Health check passed - proxy authenticated');

        // Extract model info if available
        const models = body?.data?.map((m: any) => m.id) || [];

        // Initialize Claude client with proxy if enabled
        if (config.proxy?.enabled) {
          try {
            await claudeClient.initialize({
              apiKey: proxyApiKey, // Pass the proxy API key
              proxy: { enabled: true, url },
            });
            console.log('[ClaudeClient] Initialized with proxy');
          } catch (error) {
            console.error('[ClaudeClient] Failed to initialize with proxy:', error);
          }
        }

        return {
          ok: true,
          authenticated: true,
          running: true,
          models,
        };
      } else if (response.status === 401 || response.status === 403) {
        // 401/403 - Proxy is running but API key is invalid
        console.log('[Proxy] Proxy running, got 401/403 - invalid API key');
        console.log('[Proxy] Response:', body);

        return {
          ok: false,
          authenticated: false,
          running: true,
          error: 'Invalid proxy API key. Check your CLIProxyAPI config.yaml api-keys setting.',
          errorCode: 'AUTH_REQUIRED',
        };
      } else {
        console.log(`[Proxy] Returned status ${response.status}:`, body);
        return {
          ok: false,
          authenticated: false,
          running: true,
          error: body?.error || `Proxy returned status ${response.status}`,
          errorCode: 'UNEXPECTED_STATUS',
        };
      }
    } catch (error: any) {
      console.log('[Proxy] Health check failed:', error.message);
      if (error.name === 'AbortError') {
        return {
          ok: false,
          authenticated: false,
          running: false,
          error: 'Connection timed out. Is CLIProxyAPI running?',
          errorCode: 'TIMEOUT',
        };
      }
      if (error.code === 'ECONNREFUSED') {
        return {
          ok: false,
          authenticated: false,
          running: false,
          error: 'Connection refused. CLIProxyAPI is not running on this port.',
          errorCode: 'CONNECTION_REFUSED',
        };
      }
      return {
        ok: false,
        authenticated: false,
        running: false,
        error: error.message || 'Failed to connect to proxy',
        errorCode: 'UNKNOWN',
      };
    }
  });

  // ========================================
  // Project handlers (using real database)
  // Returns data directly to match store expectations
  // ========================================
  ipcMain.handle('project:list', async () => {
    try {
      const projects = projectRepo.findAllWithSettings();

      // Convert database format to renderer format
      const formattedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        prompt: '', // We store prompt_path, not prompt content
        promptPath: p.prompt_path,
        status: p.status,
        settings: p.settings,
        cost_total: p.cost_total,
        iteration_count: p.iteration_count,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      return formattedProjects;
    } catch (error: any) {
      console.error('[Project] List error:', error);
      return [];
    }
  });

  ipcMain.handle('project:get', async (_event, id: string) => {
    try {
      const project = projectRepo.findByIdWithSettings(id);
      if (!project) {
        return null;
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        prompt: '',
        promptPath: project.prompt_path,
        status: project.status,
        settings: project.settings,
        cost_total: project.cost_total,
        iteration_count: project.iteration_count,
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
    } catch (error: any) {
      console.error('[Project] Get error:', error);
      return null;
    }
  });

  ipcMain.handle('project:create', async (_event, data: any) => {
    try {
      // For now, create a temporary prompt file or use inline prompt
      // In production, you'd have proper prompt file management
      const promptPath = data.promptPath || `/tmp/constellation-prompt-${Date.now()}.md`;

      // Write prompt content to file if provided
      if (data.prompt) {
        fs.writeFileSync(promptPath, data.prompt, 'utf-8');
      }

      const project = projectRepo.create({
        name: data.name,
        description: data.description || '',
        prompt_path: promptPath,
        settings: data.settings || {
          model: config.defaultModel,
          maxIterations: config.defaultMaxIterations,
          budgetLimit: config.defaultBudgetLimit,
          enabledTools: config.defaultTools,
        },
      });

      const eventBus = getEventBus();
      eventBus.emit('project_created', {
        projectId: project.id,
        name: project.name,
      });

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        prompt: data.prompt || '',
        promptPath: project.prompt_path,
        status: project.status,
        settings: project.settings,
        cost_total: project.cost_total,
        iteration_count: project.iteration_count,
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
    } catch (error: any) {
      console.error('[Project] Create error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:update', async (_event, id: string, data: any) => {
    try {
      const project = projectRepo.update(id, data);
      return project;
    } catch (error: any) {
      console.error('[Project] Update error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:delete', async (_event, id: string) => {
    try {
      projectRepo.delete(id);
    } catch (error: any) {
      console.error('[Project] Delete error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:start', async (_event, id: string) => {
    try {
      const project = projectRepo.findByIdWithSettings(id);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check if Claude client is initialized
      if (!claudeClient.isInitialized()) {
        const eventBus = getEventBus();
        eventBus.emit('api_key_required', { projectId: id });
        throw new Error('API key or proxy not configured');
      }

      // If using proxy mode, verify proxy is reachable before starting
      if (config.proxy?.enabled && config.proxy?.url) {
        console.log('[Project] Checking proxy connectivity before start...');
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`${config.proxy.url}/v1/models`, {
            method: 'GET',
            headers: { 'X-Api-Key': 'connectivity-check' },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Any response (even 401) means proxy is running - that's good enough
          // Authentication will be verified on actual API calls
          console.log(`[Project] Proxy responded with status ${response.status} - proceeding`);
        } catch (connectError: any) {
          if (connectError.name === 'AbortError') {
            throw new Error('Proxy connection timed out. Is CLIProxyAPI running?');
          }
          if (connectError.code === 'ECONNREFUSED') {
            throw new Error('Cannot connect to proxy. Please start CLIProxyAPI.');
          }
          throw new Error(`Proxy connection error: ${connectError.message}`);
        }
      }

      // Create root agent for this project
      const agent = agentRepo.create({
        project_id: id,
        name: `${project.name} Agent`,
        config: {
          model: project.settings?.model || config.defaultModel,
          maxTokens: 8192,
          temperature: 0.7,
          maxIterations: project.settings?.maxIterations || config.defaultMaxIterations,
          enabledTools: project.settings?.enabledTools || config.defaultTools,
        },
      });

      // Update project status
      projectRepo.updateStatus(id, 'running');

      // Start the Ralph loop
      await ralphEngine.startLoop(
        {
          id: project.id,
          name: project.name,
          promptPath: project.prompt_path,
          workingDirectory: process.cwd(), // TODO: Use project-specific directory
          status: 'running',
          settings: project.settings || {},
        },
        {
          id: agent.id,
          projectId: id,
          parentId: undefined,
          name: agent.name,
          status: 'running',
          config: agent.config as any,
          history: [],
          outputs: [],
        }
      );

      console.log(`[Project] Started: ${project.name} (${id})`);
    } catch (error: any) {
      console.error('[Project] Start error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:pause', async (_event, id: string) => {
    try {
      // Check if loop exists before trying to pause
      if (ralphEngine.getLoop(id)) {
        await ralphEngine.pauseLoop(id);
      }
      projectRepo.updateStatus(id, 'paused');
      console.log(`[Project] Paused: ${id}`);
    } catch (error: any) {
      console.error('[Project] Pause error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:resume', async (_event, id: string) => {
    try {
      // Check if loop exists - if not, we need to start fresh
      if (ralphEngine.getLoop(id)) {
        await ralphEngine.resumeLoop(id);
      } else {
        // No loop exists, need to restart - same as project:start
        console.log(`[Project] No loop found for resume, will need to start fresh: ${id}`);
      }
      projectRepo.updateStatus(id, 'running');
      console.log(`[Project] Resumed: ${id}`);
    } catch (error: any) {
      console.error('[Project] Resume error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:stop', async (_event, id: string) => {
    try {
      // Check if loop exists before trying to stop
      if (ralphEngine.getLoop(id)) {
        await ralphEngine.stopLoop(id);
      }
      // Always update DB status even if no loop was running
      projectRepo.updateStatus(id, 'stopped');
      console.log(`[Project] Stopped: ${id}`);
    } catch (error: any) {
      console.error('[Project] Stop error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:cost', async (_event, id: string) => {
    try {
      const loopInfo = ralphEngine.getLoopInfo(id);
      if (loopInfo) {
        return { cost: loopInfo.costTotal };
      }

      // Fallback to database
      const project = projectRepo.findById(id);
      return { cost: project?.cost_total || 0 };
    } catch (error: any) {
      console.error('[Project] Cost error:', error);
      return { cost: 0 };
    }
  });

  ipcMain.handle('project:outputs', async (_event, id: string, _options?: any) => {
    try {
      // TODO: Implement outputs repository query
      return [];
    } catch (error: any) {
      console.error('[Project] Outputs error:', error);
      return [];
    }
  });

  // ========================================
  // Agent handlers
  // ========================================
  ipcMain.handle('agent:list', async (_event, projectId: string) => {
    try {
      const agents = agentRepo.findByProjectId(projectId);
      return agents;
    } catch (error: any) {
      console.error('[Agent] List error:', error);
      return [];
    }
  });

  ipcMain.handle('agent:get', async (_event, id: string) => {
    try {
      const agent = agentRepo.findById(id);
      return agent || null;
    } catch (error: any) {
      console.error('[Agent] Get error:', error);
      return null;
    }
  });

  ipcMain.handle('agent:history', async (_event, id: string, options: any) => {
    try {
      const history = historyRepo.findByAgentId(id, options);
      return history;
    } catch (error: any) {
      console.error('[Agent] History error:', error);
      return [];
    }
  });

  ipcMain.handle('agent:pause', async (_event, id: string) => {
    try {
      const agent = agentRepo.findById(id);
      if (agent) {
        await ralphEngine.pauseLoop(agent.project_id);
        agentRepo.updateStatus(id, 'paused');
      }
    } catch (error: any) {
      console.error('[Agent] Pause error:', error);
      throw error;
    }
  });

  ipcMain.handle('agent:resume', async (_event, id: string) => {
    try {
      const agent = agentRepo.findById(id);
      if (agent) {
        await ralphEngine.resumeLoop(agent.project_id);
        agentRepo.updateStatus(id, 'running');
      }
    } catch (error: any) {
      console.error('[Agent] Resume error:', error);
      throw error;
    }
  });

  ipcMain.handle('agent:stop', async (_event, id: string) => {
    try {
      const agent = agentRepo.findById(id);
      if (agent) {
        await ralphEngine.stopLoop(agent.project_id);
        agentRepo.updateStatus(id, 'stopped');
      }
    } catch (error: any) {
      console.error('[Agent] Stop error:', error);
      throw error;
    }
  });

  console.log('[Main] IPC handlers registered');
}

function createWindow(): void {
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
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer based on electron-vite cli
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.constellation.app');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Initialize services BEFORE registering IPC handlers
  initializeServices();

  // Register IPC handlers
  registerIpcHandlers();

  // Setup event forwarding from EventBus to renderer
  setupEventForwarding();

  // Create window
  createWindow();

  app.on('activate', function () {
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
app.on('before-quit', async () => {
  console.log('[Main] Shutting down...');

  // Stop all running Ralph loops
  if (ralphEngine) {
    await ralphEngine.shutdown();
  }

  // Close database connection
  DatabaseManager.close();

  console.log('[Main] Shutdown complete');
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});
