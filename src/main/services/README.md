# Constellation Services

This directory contains the core services for the Constellation application. All services follow the singleton pattern and are designed to work together to provide a robust AI agent orchestration platform.

## Architecture Overview

```
services/
├── events/          # Event bus and event types
├── config/          # Configuration management
├── security/        # API key storage
├── cost/            # Cost tracking and budget enforcement
└── project/         # Project lifecycle management
```

## Services

### Event Services

#### EventTypes.ts
Defines all event types used throughout the application:
- Project lifecycle events (created, started, paused, stopped, completed, failed)
- Agent lifecycle events (created, status_changed, output_chunk, tool_call, etc.)
- Cost and budget events (cost_updated, budget_warning, budget_exceeded)
- Circuit breaker events
- Error events
- File operation events

#### EventBus.ts
Central event bus for type-safe event emission and subscription:
```typescript
import { getEventBus } from './services';

const eventBus = getEventBus();

// Emit an event
eventBus.emit({
  type: 'project_created',
  projectId: 'abc123',
  data: { projectId: 'abc123', name: 'My Project' }
});

// Subscribe to events
const unsubscribe = eventBus.on('project_created', (event) => {
  console.log('Project created:', event.data.name);
});

// Unsubscribe when done
unsubscribe();
```

Features:
- Type-safe event emission with TypeScript generics
- Event persistence to database
- IPC broadcast to renderer process
- Listener management with unsubscribe functions

#### ThrottledEventBus.ts
Performance-optimized event bus that extends EventBus:
- Batches non-critical events at ~60fps (16ms intervals)
- Immediately emits critical events (errors, budget exceeded)
- Merges consecutive `agent_output_chunk` events to reduce IPC overhead

```typescript
import { getThrottledEventBus } from './services';

const eventBus = getThrottledEventBus();

// Critical events are emitted immediately
eventBus.emit({ type: 'error', data: { ... } });

// Non-critical events are batched
eventBus.emit({ type: 'agent_output_chunk', data: { chunk: 'Hello' } });
eventBus.emit({ type: 'agent_output_chunk', data: { chunk: ' World' } });
// These will be merged and emitted together
```

### Configuration Services

#### defaults.ts
Default configuration values for the application:
```typescript
import { DEFAULT_CONFIG, MODEL_PRICING, getModelPricing } from './services';

// Access default config
const defaultModel = DEFAULT_CONFIG.agent.defaultModel; // 'claude-sonnet-4-20250514'

// Get pricing for a model
const pricing = getModelPricing('claude-opus-4-20250514');
console.log(`Input: $${pricing.input}/M tokens, Output: $${pricing.output}/M tokens`);
```

Configuration sections:
- `app`: Theme, language, auto-update, telemetry
- `agent`: Default model, max tokens, max iterations, tools
- `safety`: Circuit breaker, budget, sandbox settings
- `ui`: Graph visualization, inspector settings

#### ConfigManager.ts
Configuration management with automatic persistence:
```typescript
import { getConfigManager } from './services';

const config = getConfigManager();

// Get config values
const theme = config.get('app.theme'); // Dot notation
const agentConfig = config.get('agent');

// Set config values (auto-saves)
config.set('app.theme', 'dark');
config.set('agent.maxTokens', 16384);

// Update multiple values
config.update({
  app: { theme: 'light' },
  agent: { maxTokens: 8192 }
});

// Reset to defaults
config.reset();
config.resetSection('agent');

// Validate configuration
const { valid, errors } = config.validate();
```

Stores configuration in `~/.constellation/config.json`.

### Security Services

#### KeychainService.ts
Secure API key storage using OS keychain:
```typescript
import { getKeychainService } from './services';

const keychain = getKeychainService();

// Store API key
await keychain.setApiKey('sk-ant-api03-...', 'anthropic');

// Retrieve API key
const apiKey = await keychain.getApiKey('anthropic');

// Check if API key exists
const hasKey = await keychain.hasApiKey('anthropic');

// Delete API key
await keychain.deleteApiKey('anthropic');

// List all stored accounts
const accounts = await keychain.listAccounts();
```

Platform-specific storage:
- **macOS**: Keychain Services
- **Windows**: Credential Manager (DPAPI)
- **Linux**: libsecret/Secret Service

Uses Electron's `safeStorage` API for encryption. Falls back to base64 obfuscation if encryption is unavailable (with warning).

### Cost Services

#### CostTracker.ts
Real-time cost tracking and budget enforcement:
```typescript
import { getCostTracker } from './services';

const costTracker = getCostTracker();

// Initialize project tracking
costTracker.initializeProject('project-123', 100); // $100 budget

// Track cost for an iteration
costTracker.trackCost(
  'project-123',
  'agent-456',
  { inputTokens: 1000, outputTokens: 500 },
  'claude-sonnet-4-20250514',
  100 // budget limit
);

// Check budget status
const status = costTracker.checkBudget('project-123', 100, 0.8);
console.log(`Used: ${status.percentageUsed * 100}%`);
console.log(`Remaining: ${costTracker.formatCost(status.remaining)}`);

// Get cost summary
const summary = costTracker.getProjectCost('project-123');
console.log(`Total: ${costTracker.formatCost(summary.totalCost)}`);
console.log(`Tokens: ${costTracker.formatTokens(summary.totalInputTokens)}`);

// Get cost breakdown by model
const breakdown = summary.costByModel['claude-sonnet-4-20250514'];
console.log(`Model cost: ${costTracker.formatCost(breakdown.totalCost)}`);
```

Features:
- Automatic cost calculation based on token usage
- Budget limit checking with warning thresholds
- Cost breakdown by model and agent
- Event emission for budget warnings and exceeded limits
- In-memory caching for performance

### Project Services

#### ProjectService.ts
Project lifecycle management and business logic:
```typescript
import { getProjectService } from './services';

const projectService = getProjectService();

// Create a project
const project = await projectService.create({
  name: 'My AI Project',
  description: 'Automated code review',
  promptContent: 'Review the codebase and suggest improvements',
  settings: {
    model: 'claude-sonnet-4-20250514',
    budgetLimit: 50,
    maxIterations: 100,
  }
});

// Start the project
await projectService.start(project.id);

// Pause the project
await projectService.pause(project.id, 'User requested pause');

// Resume the project
await projectService.resume(project.id);

// Stop the project
await projectService.stop(project.id);

// Get project details
const projectData = await projectService.get(project.id);

// List all projects
const projects = await projectService.list();

// Update project
await projectService.update(project.id, {
  name: 'Updated Project Name',
  settings: { budgetLimit: 100 }
});

// Get project statistics
const stats = await projectService.getStatistics(project.id);
console.log(`Agents: ${stats.agentCount}`);
console.log(`Cost: ${stats.costSummary.totalCost}`);

// Delete project
await projectService.delete(project.id);
```

Features:
- State transition validation (prevents invalid state changes)
- Event emission for all lifecycle changes
- Integration with CostTracker and EventBus
- Repository pattern for database access
- Iteration and cost tracking

## Integration Example

Here's how the services work together:

```typescript
import {
  getEventBus,
  getConfigManager,
  getKeychainService,
  getCostTracker,
  getProjectService,
} from './services';

// Setup services
const eventBus = getEventBus();
const config = getConfigManager();
const keychain = getKeychainService();
const costTracker = getCostTracker();
const projectService = getProjectService();

// Subscribe to events
eventBus.on('project_created', (event) => {
  console.log('Project created:', event.data.projectId);
});

eventBus.on('budget_warning', (event) => {
  console.log('Budget warning:', event.data.percentageUsed);
});

// Get API key
const apiKey = await keychain.getApiKey('anthropic');

// Create and start project
const project = await projectService.create({
  name: 'AI Assistant',
  promptContent: 'Help me write code',
  settings: {
    model: config.get('agent.defaultModel'),
    budgetLimit: config.get('safety.budget.defaultLimit'),
  }
});

await projectService.start(project.id);

// Track costs (would be called during agent execution)
costTracker.trackCost(
  project.id,
  'agent-1',
  { inputTokens: 1000, outputTokens: 500 },
  config.get('agent.defaultModel')
);

// Check budget
const budgetStatus = costTracker.checkBudget(
  project.id,
  config.get('safety.budget.defaultLimit'),
  config.get('safety.budget.warningThreshold')
);

if (budgetStatus.isExceeded) {
  await projectService.pause(project.id, 'Budget exceeded');
}
```

## Dependency Injection

Services use dependency injection for repository access:

```typescript
import { getProjectService } from './services';
import { ProjectRepository, AgentRepository } from '../database/repositories';

const projectService = getProjectService();
const projectRepo = new ProjectRepository(database);
const agentRepo = new AgentRepository(database);

// Inject repositories
projectService.setProjectRepository(projectRepo);
projectService.setAgentRepository(agentRepo);
```

## Testing

All services support singleton reset for testing:

```typescript
import { EventBus, ConfigManager, resetCostTracker, resetProjectService } from './services';

// In test setup
beforeEach(() => {
  EventBus.resetInstance();
  ConfigManager.resetInstance();
  resetCostTracker();
  resetProjectService();
});
```

## Best Practices

1. **Always use getter functions**: Use `getEventBus()`, `getConfigManager()`, etc. instead of accessing singletons directly.

2. **Event-driven architecture**: Emit events for all significant state changes. This allows loose coupling between services.

3. **Type safety**: All services are fully typed. Use TypeScript's type inference to catch errors at compile time.

4. **Error handling**: Services throw errors for invalid operations. Always wrap service calls in try-catch blocks.

5. **Repository injection**: Inject repositories before using ProjectService to enable database operations.

6. **Configuration validation**: Call `config.validate()` after importing user configuration to ensure data integrity.

7. **Budget checking**: Check budget status regularly during agent execution to prevent cost overruns.

8. **Secure storage**: Always use KeychainService for API keys. Never store keys in config files or logs.
