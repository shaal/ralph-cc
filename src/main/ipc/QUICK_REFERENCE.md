# IPC Quick Reference

## All IPC Channels

### Project Channels

| Channel | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `project:create` | `CreateProjectDTO` | `ApiResponse<Project>` | Create new project |
| `project:get` | `id: string` | `ApiResponse<Project \| null>` | Get project by ID |
| `project:list` | - | `ApiResponse<Project[]>` | Get all projects |
| `project:update` | `id: string, data: UpdateProjectDTO` | `ApiResponse<Project>` | Update project |
| `project:delete` | `id: string` | `ApiResponse<void>` | Delete project |
| `project:start` | `id: string` | `ApiResponse<void>` | Start project (Ralph loop) |
| `project:pause` | `id: string` | `ApiResponse<void>` | Pause project |
| `project:resume` | `id: string` | `ApiResponse<void>` | Resume project |
| `project:stop` | `id: string` | `ApiResponse<void>` | Stop project |
| `project:cost` | `id: string` | `ApiResponse<ProjectCostSummary>` | Get cost summary |
| `project:outputs` | `id: string, options?: PaginationOptions` | `ApiResponse<Output[]>` | Get outputs |

### Agent Channels

| Channel | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `agent:get` | `id: string` | `ApiResponse<Agent \| null>` | Get agent by ID |
| `agent:list` | `projectId: string` | `ApiResponse<Agent[]>` | Get agents by project |
| `agent:history` | `id: string, options?: FindHistoryOptions` | `ApiResponse<AgentHistoryResponse>` | Get agent history |
| `agent:pause` | `id: string` | `ApiResponse<void>` | Pause agent |
| `agent:resume` | `id: string` | `ApiResponse<void>` | Resume agent |
| `agent:stop` | `id: string` | `ApiResponse<void>` | Stop agent |

### Config Channels

| Channel | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `config:get` | - | `ApiResponse<Config>` | Get full config |
| `config:set` | `key: string, value: unknown` | `ApiResponse<Config>` | Set config value |
| `config:setTheme` | `theme: 'light' \| 'dark' \| 'system'` | `ApiResponse<Config>` | Set theme |
| `config:reset` | - | `ApiResponse<Config>` | Reset to defaults |
| `config:setApiKey` | `key: string` | `ApiResponse<void>` | Set API key |
| `config:getApiKey` | - | `ApiResponse<string \| null>` | Get API key |
| `config:hasApiKey` | - | `ApiResponse<boolean>` | Check if API key exists |
| `config:deleteApiKey` | - | `ApiResponse<void>` | Delete API key |

## Event Types

All events are broadcast on the `'event'` channel with the following structure:

```typescript
{
  type: string;
  timestamp: string;
  data: any;
}
```

### Project Events

- `project_created` - New project created
- `project_started` - Project started
- `project_paused` - Project paused
- `project_resumed` - Project resumed
- `project_stopped` - Project stopped
- `project_completed` - Project completed
- `project_updated` - Project updated
- `project_deleted` - Project deleted

### Agent Events

- `agent_created` - New agent created
- `agent_output_chunk` - Agent streaming output chunk
- `agent_tool_call` - Agent tool call
- `agent_status_changed` - Agent status changed
- `subagent_spawned` - Subagent spawned

### Iteration Events

- `iteration_complete` - Iteration completed
- `iteration_error` - Iteration error

### Tool Events

- `tool_executed` - Tool executed

### System Events

- `circuit_breaker_triggered` - Circuit breaker triggered
- `budget_exceeded` - Budget exceeded
- `budget_warning` - Budget warning
- `api_key_required` - API key required
- `agent_error` - Agent error

## Usage Examples

### From Renderer (TypeScript)

```typescript
// Create project
const result = await window.api.project.create({
  name: 'My Project',
  prompt: 'Build something',
});

// Get project
const project = await window.api.project.get('project-id');

// Subscribe to events
const unsubscribe = window.api.onEvent('agent_output_chunk', (event) => {
  console.log(event.data.chunk);
});

// Cleanup
unsubscribe();
```

### From Main Process (TypeScript)

```typescript
import { initializeIpcHandlers, setMainWindow, broadcastEvent } from './ipc';

// Initialize handlers
initializeIpcHandlers({
  projectService,
  agentService,
  configService,
  keychainService,
  agentOrchestrator,
  eventBus,
});

// Set main window
setMainWindow(mainWindow);

// Broadcast event
broadcastEvent('agent_output_chunk', {
  agentId: 'agent-123',
  chunk: 'Hello',
});
```

## Response Format

All IPC handlers return responses in this format:

### Success Response

```typescript
{
  success: true,
  data: T // The actual data
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    message: string,
    code?: string,
    details?: unknown
  }
}
```

## Type Safety

All types are fully defined in:
- `/src/main/database/types.ts` - Database entity types
- `/src/preload/types.d.ts` - Window API types

Use TypeScript's type checking to ensure correct usage:

```typescript
import type { CreateProjectDTO, ApiResponse, Project } from '../main/database/types';

const data: CreateProjectDTO = {
  name: 'My Project',
  prompt: 'Do something',
};

const response: ApiResponse<Project> = await window.api.project.create(data);

if (response.success) {
  console.log(response.data.id); // Type-safe access
}
```
