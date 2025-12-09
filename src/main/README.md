# Constellation Main Process

This directory contains the Electron main process implementation for Constellation, including the core Ralph Engine and Claude SDK integration.

## Architecture Overview

```
src/main/
├── claude/              # Claude API integration
│   ├── ClaudeClient.ts  # Wrapper around @anthropic-ai/sdk
│   └── types.ts         # TypeScript type definitions
├── services/
│   ├── EventBus.ts      # Pub/sub event system with throttling
│   ├── agent/           # Agent lifecycle management
│   │   └── AgentOrchestrator.ts
│   ├── ralph/           # Ralph Engine implementation
│   │   ├── RalphEngine.ts     # Multi-loop orchestrator
│   │   ├── RalphLoop.ts       # Individual Ralph loop
│   │   ├── CircuitBreaker.ts  # Failure & completion detection
│   │   └── CostTracker.ts     # Budget enforcement
│   └── tools/           # Tool execution
│       ├── ToolRegistry.ts    # Available tools catalog
│       └── ToolExecutor.ts    # Sandboxed execution
├── database/            # SQLite persistence (pre-existing)
└── ipc/                 # IPC handlers (pre-existing)
```

## Core Components

### 1. Claude Client (`claude/ClaudeClient.ts`)

Wrapper around the Anthropic SDK that handles:
- API initialization with key management
- Streaming agent iterations with callbacks
- Token usage tracking and cost calculation
- Configurable model pricing

**Usage:**
```typescript
import { ClaudeClient } from './claude';

const client = new ClaudeClient();
await client.initialize(apiKey);

const result = await client.runIteration(
  agentId,
  systemPrompt,
  messages,
  tools,
  config,
  {
    onChunk: (chunk) => console.log(chunk),
    onToolCall: (toolCall) => console.log(toolCall),
  }
);
```

### 2. Ralph Engine (`services/ralph/RalphEngine.ts`)

Orchestrates multiple Ralph loops across projects:
- Start/stop/pause/resume operations
- Concurrent loop management with limits
- Configuration management
- Integration with EventBus for real-time updates

**Usage:**
```typescript
import { RalphEngine } from './services/ralph';

const engine = new RalphEngine(claudeClient, config);
await engine.startLoop(project, rootAgent);
await engine.pauseLoop(projectId);
await engine.resumeLoop(projectId);
await engine.stopLoop(projectId);
```

### 3. Ralph Loop (`services/ralph/RalphLoop.ts`)

Implements the core "while :; do cat PROMPT.md | agent ; done" pattern:
- Continuous iteration with configurable limits
- Circuit breaker integration (stops on repeated failures/completions)
- Budget enforcement (pauses when limit reached)
- Tool execution with result feedback
- Streaming output via EventBus

**Loop Flow:**
1. Load prompt from file
2. Execute Claude iteration with tools
3. Process result (completion or tool calls)
4. Execute tools if needed
5. Feed results back to agent
6. Check circuit breaker and budget
7. Repeat

### 4. Circuit Breaker (`services/ralph/CircuitBreaker.ts`)

Protects against infinite loops:
- Tracks consecutive failures (default: 5 max)
- Tracks consecutive completions (default: 3 max, indicates task done)
- Timeout detection (default: 120 minutes)
- Exponential backoff calculation for retries

### 5. Cost Tracker (`services/ralph/CostTracker.ts`)

Enforces budget limits:
- Real-time cost accumulation
- Budget warning thresholds (default: 80%)
- Token usage statistics
- Cost estimation based on historical data
- Formatted output for UI display

### 6. Tool Registry (`services/tools/ToolRegistry.ts`)

Manages available tools for agents:
- Default tools: bash, read, write, edit, glob, grep
- Permission levels: readonly, readwrite, execute, full
- Claude-compatible tool definitions
- Extensible for custom tools

### 7. Tool Executor (`services/tools/ToolExecutor.ts`)

Executes tool calls with sandboxing:
- File path restrictions (allowedPaths)
- Command deny list (dangerous commands)
- Execution timeouts
- Error handling and result formatting

**Security Features:**
- All file operations restricted to allowed paths
- Denied commands (rm -rf, sudo, etc.)
- Configurable execution timeouts
- Safe error handling

### 8. Agent Orchestrator (`services/agent/AgentOrchestrator.ts`)

Manages agent lifecycle:
- Agent creation with hierarchy support (sub-agents)
- Status management (created, running, paused, stopped, completed, error)
- Conversation history tracking
- Metadata (tokens, cost, iterations)
- Event-driven state updates

### 9. Event Bus (`services/EventBus.ts`)

Pub/sub system for real-time updates:
- Throttled events for high-frequency updates (~60fps)
- Critical events bypass throttling
- Type-safe event system
- Global and filtered subscriptions

**Event Types:**
- Project: created, started, paused, stopped, completed
- Agent: created, started, paused, stopped, status_changed
- Iteration: complete, error
- Output: chunk, tool_call, tool_executed
- Safety: circuit_breaker_triggered, budget_exceeded, budget_warning

## Integration Example

Here's how all components work together:

```typescript
import { ClaudeClient } from './claude';
import { RalphEngine } from './services/ralph';
import { AgentOrchestrator } from './services/agent';
import { getEventBus } from './services/EventBus';

// Initialize
const eventBus = getEventBus();
const claudeClient = new ClaudeClient();
await claudeClient.initialize(apiKey);

const orchestrator = new AgentOrchestrator(defaultConfig, eventBus);
const engine = new RalphEngine(claudeClient, engineConfig, eventBus);

// Subscribe to events
eventBus.subscribe('agent_output_chunk', (event) => {
  console.log('Agent output:', event.data.chunk);
});

eventBus.subscribe('circuit_breaker_triggered', (event) => {
  console.log('Circuit breaker:', event.data.reason);
});

// Create and start
const agent = await orchestrator.createAgent({
  projectId: project.id,
  name: 'Main Agent',
});

await engine.startLoop(project, agent);

// Monitor
const info = engine.getLoopInfo(project.id);
console.log('Status:', info.status);
console.log('Cost:', info.costTotal);
```

## Configuration

Default configuration is set in `RalphEngine` and can be overridden per-project:

```typescript
{
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
    limit: 100, // USD
    warningThreshold: 0.8,
  },
  sandbox: {
    enabled: true,
    allowedPaths: ['./project-directory'],
    deniedCommands: ['rm -rf', 'sudo', 'format', 'mkfs'],
  },
  enabledTools: ['bash', 'read', 'write', 'edit', 'glob', 'grep'],
}
```

## Next Steps

To complete the implementation:

1. **Database Integration**: Wire up AgentOrchestrator to persist state
2. **IPC Handlers**: Connect Ralph Engine to renderer process
3. **Error Recovery**: Implement retry strategies and error classification
4. **Sub-agent Support**: Implement recursive Ralph loops for agent swarms
5. **Tool Extensions**: Add more specialized tools (git, npm, docker, etc.)
6. **Monitoring**: Add metrics collection and performance tracking

## Dependencies

Required packages (add to package.json):
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.x.x",
    "uuid": "^9.x.x"
  },
  "devDependencies": {
    "@types/uuid": "^9.x.x"
  }
}
```

## Testing

Unit tests should cover:
- CircuitBreaker state transitions
- CostTracker budget calculations
- ToolExecutor security checks
- EventBus throttling behavior
- RalphLoop iteration logic

Integration tests should verify:
- End-to-end Ralph loop execution
- Multi-agent orchestration
- Event flow from engine to UI
- Database persistence and recovery
