# Constellation Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RENDERER PROCESS (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Graph View  │  │  Inspector   │  │  Dashboard   │              │
│  │  (React Flow)│  │  (Agent)     │  │  (Metrics)   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┴─────────────────┘                        │
│                           │                                          │
│                    Zustand Stores                                    │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │ IPC Bridge (contextBridge)
┌───────────────────────────┼──────────────────────────────────────────┐
│                           │                                          │
│                    IPC Handlers                                      │
│                           │                                          │
│  ┌────────────────────────┴────────────────────────────┐            │
│  │              MAIN PROCESS (Node.js)                 │            │
│  │                                                      │            │
│  │  ┌──────────────────────────────────────────────┐  │            │
│  │  │           Ralph Engine                       │  │            │
│  │  │  ┌──────────────────────────────────────┐   │  │            │
│  │  │  │  RalphLoop 1  │  RalphLoop 2  │ ... │   │  │            │
│  │  │  └──────────────────────────────────────┘   │  │            │
│  │  │           ▲                                  │  │            │
│  │  │           │ manages                          │  │            │
│  │  │           ▼                                  │  │            │
│  │  │  ┌──────────────────────────────────────┐   │  │            │
│  │  │  │  Agent Orchestrator                  │   │  │            │
│  │  │  └──────────────────────────────────────┘   │  │            │
│  │  └──────────────────────────────────────────────┘  │            │
│  │                      │                              │            │
│  │                      │ uses                         │            │
│  │                      ▼                              │            │
│  │  ┌──────────────────────────────────────────────┐  │            │
│  │  │           Claude Client                      │  │            │
│  │  │  (Streaming API + Cost Calculation)          │  │            │
│  │  └──────────────┬───────────────────────────────┘  │            │
│  │                 │                                   │            │
│  │                 │ calls                             │            │
│  │                 ▼                                   │            │
│  │  ┌──────────────────────────────────────────────┐  │            │
│  │  │     Anthropic Claude API                     │  │            │
│  │  │     (@anthropic-ai/sdk)                      │  │            │
│  │  └──────────────────────────────────────────────┘  │            │
│  │                                                      │            │
│  └──────────────────────────────────────────────────────┘            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       Support Services                        │  │
│  │                                                                │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ Circuit Breaker│  │  Cost Tracker  │  │  Tool Executor │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │                                                                │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │  Tool Registry │  │   Event Bus    │  │    Database    │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Ralph Loop Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      RALPH LOOP ITERATION                         │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  Load PROMPT.md │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │  Check Circuit Breaker      │  ──── Too many failures? ──→ PAUSE
    │  - Consecutive failures      │
    │  - Consecutive completions   │
    │  - Timeout                   │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │  Check Budget               │  ──── Limit exceeded? ──→ PAUSE
    │  - Current cost vs limit    │
    │  - Warning threshold        │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │  Execute Claude Iteration   │
    │  - Build message context    │
    │  - Stream API call          │
    │  - Emit output chunks       │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │  Process Result             │
    │  - Completion?              │
    │  - Tool calls?              │
    └────────┬────────────────────┘
             │
             ├─────────────────────────────────┐
             │                                 │
             ▼                                 ▼
    ┌─────────────────┐            ┌─────────────────────┐
    │  No Tool Calls  │            │   Execute Tools     │
    │  (Completion)   │            │   - Bash            │
    │                 │            │   - Read/Write/Edit │
    │  Increment      │            │   - Glob/Grep       │
    │  completion     │            │                     │
    │  counter        │            │  Feed Results       │
    └────────┬────────┘            │  Back to Agent      │
             │                     └──────────┬──────────┘
             │                                │
             └────────────┬───────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Record Cost    │
                 │  Update Metrics │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Emit Event:    │
                 │  iteration_     │
                 │  complete       │
                 └────────┬────────┘
                          │
                          ▼
                    Loop Again
```

## Component Dependencies

```
RalphEngine
    ├── uses → ClaudeClient
    ├── uses → AgentOrchestrator
    ├── uses → EventBus
    └── manages → RalphLoop[]
                      ├── uses → ClaudeClient
                      ├── uses → CircuitBreaker
                      ├── uses → CostTracker
                      ├── uses → ToolExecutor
                      ├── uses → ToolRegistry
                      └── emits → EventBus

ClaudeClient
    ├── uses → @anthropic-ai/sdk
    └── calculates → token costs

ToolExecutor
    ├── uses → ToolRegistry
    └── executes → bash, read, write, edit, glob, grep

EventBus
    └── emits to → Renderer (via IPC)
```

## Data Flow: Agent Iteration

```
1. User Action (Start Project)
        ↓
2. IPC → Main Process
        ↓
3. RalphEngine.startLoop()
        ↓
4. Create RalphLoop instance
        ↓
5. RalphLoop.start()
        ↓
┌──── LOOP ────────────────────────────────────────┐
│                                                   │
│  6. Load PROMPT.md                               │
│        ↓                                          │
│  7. ClaudeClient.runIteration()                  │
│        ↓                                          │
│  8. Claude API (streaming)                       │
│        ↓                                          │
│  9. Stream chunks → EventBus                     │
│        ↓                                          │
│  10. IPC → Renderer                              │
│        ↓                                          │
│  11. React updates UI                            │
│        ↓                                          │
│  12. Tool calls? → ToolExecutor                  │
│        ↓                                          │
│  13. Feed results → Agent history                │
│        ↓                                          │
│  14. Record cost → CostTracker                   │
│        ↓                                          │
│  15. Check CircuitBreaker                        │
│        ↓                                          │
│  16. Loop or Stop?                               │
│        ↓                                          │
└───────┘                                          │
```

## Event Flow

```
Main Process Events                    Renderer Process

┌──────────────────┐                  ┌──────────────────┐
│  RalphLoop       │                  │  React App       │
│                  │                  │                  │
│  emit(           │                  │  useEffect(() => {│
│   'agent_output_│  ──────────────→  │   subscribe(...)  │
│    chunk'        │   EventBus +     │  }, [])          │
│  )               │   IPC Bridge     │                  │
│                  │                  │  ↓               │
│  emit(           │                  │  setState(...)   │
│   'iteration_   │  ──────────────→  │                  │
│    complete'     │                  │  ↓               │
│  )               │                  │  UI Re-render    │
│                  │                  │                  │
│  emit(           │                  │  ✓ Graph nodes   │
│   'budget_      │  ──────────────→  │  ✓ Inspector     │
│    warning'      │                  │  ✓ Cost display  │
│  )               │                  │                  │
└──────────────────┘                  └──────────────────┘

Throttling: Non-critical events batched at ~60fps
Critical events: Immediate emission (no throttle)
```

## Security Boundaries

```
┌───────────────────────────────────────────────────┐
│                RENDERER PROCESS                    │
│                (Sandboxed)                         │
│                                                    │
│  - No Node.js access                              │
│  - No filesystem access                           │
│  - No network access                              │
│  - Only IPC communication                         │
└─────────────────────┬─────────────────────────────┘
                      │
                  IPC Bridge
               (contextBridge)
                      │
┌─────────────────────┴─────────────────────────────┐
│                MAIN PROCESS                        │
│              (Full privileges)                     │
│                                                    │
│  Sandboxed Tool Execution:                        │
│  ┌──────────────────────────────────────────┐    │
│  │  • Path restrictions (allowedPaths)      │    │
│  │  • Command deny list                     │    │
│  │  • Execution timeouts                    │    │
│  │  • Error isolation                       │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  API Key Protection:                              │
│  • Stored in OS keychain                          │
│  • Never logged or exposed to renderer            │
│  • Retrieved only in main process                 │
└────────────────────────────────────────────────────┘
```

## File Structure Map

```
src/main/
├── claude/                    # Claude SDK Integration
│   ├── ClaudeClient.ts       # API wrapper (238 lines)
│   ├── types.ts              # Type definitions (109 lines)
│   └── index.ts              # Exports
│
├── services/
│   ├── EventBus.ts           # Event system (219 lines)
│   │
│   ├── ralph/                # Ralph Engine
│   │   ├── RalphEngine.ts   # Multi-loop orchestrator (241 lines)
│   │   ├── RalphLoop.ts     # Individual loop (397 lines)
│   │   ├── CircuitBreaker.ts# Safety mechanism (149 lines)
│   │   ├── CostTracker.ts   # Budget enforcement (196 lines)
│   │   └── index.ts         # Exports
│   │
│   ├── tools/                # Tool System
│   │   ├── ToolRegistry.ts  # Tool catalog (274 lines)
│   │   ├── ToolExecutor.ts  # Execution engine (401 lines)
│   │   └── index.ts         # Exports
│   │
│   └── agent/                # Agent Management
│       ├── AgentOrchestrator.ts # Lifecycle manager (318 lines)
│       └── index.ts         # Exports
│
├── examples/
│   └── usage.example.ts     # Usage examples (268 lines)
│
└── README.md                # Comprehensive docs

Total: ~2,810 lines of production-ready TypeScript
```

## Key Design Patterns

### 1. Event-Driven Architecture
```typescript
// Loose coupling via EventBus
eventBus.emit('agent_output_chunk', { agentId, chunk });

// Subscribers react independently
eventBus.subscribe('agent_output_chunk', (event) => {
  updateUI(event.data);
});
```

### 2. Circuit Breaker Pattern
```typescript
// Automatic failure detection
if (consecutiveFailures >= maxFailures) {
  emit('circuit_breaker_triggered');
  pause();
}
```

### 3. Dependency Injection
```typescript
// Services injected, not hardcoded
constructor(
  claudeClient: ClaudeClient,
  eventBus: EventBus
) {
  this.claudeClient = claudeClient;
  this.eventBus = eventBus;
}
```

### 4. Singleton Pattern (Optional)
```typescript
// Shared instances via factory functions
export function getEventBus(): EventBus {
  if (!instance) instance = new EventBus();
  return instance;
}
```

## Summary

This architecture provides:
- ✓ Scalable agent orchestration
- ✓ Real-time event streaming
- ✓ Budget and safety enforcement
- ✓ Sandboxed tool execution
- ✓ Clean separation of concerns
- ✓ Type-safe throughout
- ✓ Production-ready error handling
