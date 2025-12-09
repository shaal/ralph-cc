/**
 * Example usage of the Ralph Engine and Claude SDK integration
 * This demonstrates how to initialize and use the core components
 */

import { ClaudeClient } from '../claude';
import { RalphEngine } from '../services/ralph';
import { AgentOrchestrator } from '../services/agent';
import { getEventBus } from '../services/EventBus';
import type { Project, Agent } from '../services/ralph/RalphLoop';

/**
 * Example 1: Basic Ralph Loop Setup
 */
async function basicRalphLoop() {
  // 1. Initialize components
  const eventBus = getEventBus();
  const claudeClient = new ClaudeClient();

  // Initialize Claude with API key (in production, get from keychain)
  const apiKey = process.env.ANTHROPIC_API_KEY || 'sk-ant-...';
  await claudeClient.initialize(apiKey);

  // 2. Create orchestrator
  const defaultConfig = {
    model: 'claude-sonnet-4',
    maxTokens: 8192,
    temperature: 0.7,
    maxIterations: 1000,
    circuitBreaker: {
      maxConsecutiveFailures: 5,
      maxConsecutiveCompletions: 3,
      timeoutMinutes: 120,
    },
    budget: {
      limit: 100, // $100 USD
      warningThreshold: 0.8,
    },
    sandbox: {
      enabled: true,
      allowedPaths: ['/home/user/projects/my-project'],
      deniedCommands: ['rm -rf', 'sudo', 'format', 'mkfs'],
      maxExecutionTimeMs: 120000,
    },
    enabledTools: ['bash', 'read', 'write', 'edit', 'glob', 'grep'],
    systemPrompt: 'You are a helpful coding assistant.',
  };

  const orchestrator = new AgentOrchestrator(defaultConfig, eventBus);

  // 3. Create Ralph Engine
  const engine = new RalphEngine(claudeClient, {
    maxConcurrentLoops: 10,
    defaultModel: 'claude-sonnet-4',
    defaultMaxTokens: 8192,
    defaultMaxIterations: 1000,
  }, eventBus);

  // 4. Subscribe to events
  eventBus.subscribe('agent_output_chunk', (event) => {
    console.log('[Output]', event.data.chunk);
  });

  eventBus.subscribe('iteration_complete', (event) => {
    console.log('[Iteration]', event.data.iteration, 'complete');
    console.log('[Cost]', `$${(event.data.costState as any).totalCost.toFixed(4)}`);
  });

  eventBus.subscribe('circuit_breaker_triggered', (event) => {
    console.log('[Circuit Breaker]', event.data.reason);
  });

  eventBus.subscribe('budget_exceeded', (event) => {
    console.log('[Budget]', 'Exceeded:', event.data.current, '/', event.data.limit);
  });

  eventBus.subscribe('project_completed', (event) => {
    console.log('[Project]', 'Completed:', event.data.reason);
  });

  // 5. Create project and agent
  const project: Project = {
    id: 'proj-001',
    name: 'My Coding Project',
    promptPath: '/home/user/projects/my-project/PROMPT.md',
    workingDirectory: '/home/user/projects/my-project',
    status: 'created',
    settings: {
      model: 'claude-sonnet-4',
      maxTokens: 8192,
      enabledTools: ['bash', 'read', 'write', 'edit', 'glob', 'grep'],
    },
  };

  const agent = await orchestrator.createAgent({
    projectId: project.id,
    name: 'Main Agent',
  });

  // 6. Start the Ralph loop
  console.log('Starting Ralph loop...');
  await engine.startLoop(project, agent);

  // 7. Monitor progress
  setInterval(() => {
    const info = engine.getLoopInfo(project.id);
    if (info) {
      console.log(`[Status] ${info.status} | Iteration: ${info.iteration} | Cost: $${info.costTotal.toFixed(4)}`);
    }
  }, 5000);

  // 8. Cleanup on exit
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await engine.shutdown();
    process.exit(0);
  });
}

/**
 * Example 2: Multiple Projects (Agent Swarm)
 */
async function multipleProjects() {
  const eventBus = getEventBus();
  const claudeClient = new ClaudeClient();
  await claudeClient.initialize(process.env.ANTHROPIC_API_KEY!);

  const orchestrator = new AgentOrchestrator({
    model: 'claude-sonnet-4',
    maxTokens: 8192,
    temperature: 0.7,
    maxIterations: 1000,
    circuitBreaker: {
      maxConsecutiveFailures: 5,
      maxConsecutiveCompletions: 3,
    },
    budget: { limit: 50 },
    sandbox: {
      enabled: true,
      allowedPaths: ['/home/user/projects'],
      deniedCommands: ['rm -rf', 'sudo'],
    },
    enabledTools: ['bash', 'read', 'write', 'edit', 'glob', 'grep'],
  }, eventBus);

  const engine = new RalphEngine(claudeClient, {}, eventBus);

  // Create multiple projects
  const projects = [
    {
      id: 'proj-001',
      name: 'Frontend',
      promptPath: '/home/user/projects/frontend/PROMPT.md',
      workingDirectory: '/home/user/projects/frontend',
      status: 'created',
      settings: {},
    },
    {
      id: 'proj-002',
      name: 'Backend',
      promptPath: '/home/user/projects/backend/PROMPT.md',
      workingDirectory: '/home/user/projects/backend',
      status: 'created',
      settings: {},
    },
  ];

  // Start all projects
  for (const project of projects) {
    const agent = await orchestrator.createAgent({
      projectId: project.id,
      name: `${project.name} Agent`,
    });

    await engine.startLoop(project as Project, agent);
    console.log(`Started loop for ${project.name}`);
  }

  // Monitor all loops
  setInterval(() => {
    const allInfo = engine.getAllLoopInfo();
    console.log('\n=== Status ===');
    allInfo.forEach(info => {
      console.log(`${info.projectId}: ${info.status} | Iter: ${info.iteration} | Cost: $${info.costTotal.toFixed(4)}`);
    });
  }, 10000);
}

/**
 * Example 3: Pause/Resume Control
 */
async function pauseResumeControl() {
  const eventBus = getEventBus();
  const claudeClient = new ClaudeClient();
  await claudeClient.initialize(process.env.ANTHROPIC_API_KEY!);

  const orchestrator = new AgentOrchestrator({
    model: 'claude-sonnet-4',
    maxTokens: 8192,
    maxIterations: 1000,
    circuitBreaker: { maxConsecutiveFailures: 5, maxConsecutiveCompletions: 3 },
    budget: {},
    sandbox: { enabled: true, allowedPaths: ['.'], deniedCommands: [] },
    enabledTools: ['bash', 'read', 'write'],
    temperature: 0.7,
  }, eventBus);

  const engine = new RalphEngine(claudeClient, {}, eventBus);

  const project: Project = {
    id: 'proj-001',
    name: 'Test Project',
    promptPath: './PROMPT.md',
    workingDirectory: '.',
    status: 'created',
    settings: {},
  };

  const agent = await orchestrator.createAgent({
    projectId: project.id,
    name: 'Test Agent',
  });

  // Start loop
  await engine.startLoop(project, agent);

  // Pause after 30 seconds
  setTimeout(async () => {
    console.log('Pausing loop...');
    await engine.pauseLoop(project.id);
  }, 30000);

  // Resume after another 10 seconds
  setTimeout(async () => {
    console.log('Resuming loop...');
    await engine.resumeLoop(project.id);
  }, 40000);

  // Stop after 60 seconds
  setTimeout(async () => {
    console.log('Stopping loop...');
    await engine.stopLoop(project.id);
    process.exit(0);
  }, 60000);
}

/**
 * Example 4: Event Monitoring
 */
async function eventMonitoring() {
  const eventBus = getEventBus();

  // Subscribe to all events
  eventBus.subscribeAll((event) => {
    console.log(`[${event.type}]`, JSON.stringify(event.data, null, 2));
  });

  // Subscribe to specific events
  eventBus.subscribe('agent_output_chunk', (event) => {
    process.stdout.write(event.data.chunk as string);
  });

  eventBus.subscribe('tool_executed', (event) => {
    console.log('\n[Tool]', event.data.toolCall);
    console.log('[Result]', event.data.toolResult);
  });

  eventBus.subscribe('budget_warning', (event) => {
    console.warn(`WARNING: Budget at ${((event.data.percentUsed as number) * 100).toFixed(1)}%`);
  });

  // Stats
  let totalChunks = 0;
  let totalIterations = 0;

  eventBus.subscribe('agent_output_chunk', () => {
    totalChunks++;
  });

  eventBus.subscribe('iteration_complete', () => {
    totalIterations++;
  });

  setInterval(() => {
    console.log(`\n=== Stats: ${totalIterations} iterations, ${totalChunks} chunks ===`);
  }, 30000);
}

// Run examples (uncomment to use)
// basicRalphLoop().catch(console.error);
// multipleProjects().catch(console.error);
// pauseResumeControl().catch(console.error);
// eventMonitoring().catch(console.error);

export {
  basicRalphLoop,
  multipleProjects,
  pauseResumeControl,
  eventMonitoring,
};
