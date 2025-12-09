# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Constellation** (codename for Ralph-as-a-Service) is a desktop application that visualizes and orchestrates multiple AI coding agent loops in parallel. It implements Geoffrey Huntley's "Ralph" technique at scale using the Claude Agent SDK.

### Core Concept
Transform the simple `while :; do cat PROMPT.md | agent ; done` pattern into a visual, multi-project orchestration platform with:
- Real-time force-directed graph visualization of agent swarms
- Click-to-inspect agent internals and streaming output
- Cost tracking, budget enforcement, and circuit breakers
- State persistence and session recovery

## Technology Stack

- **Runtime**: Electron 30.x
- **Frontend**: React 18.x + TypeScript 5.x + Vite 5.x
- **State**: Zustand 4.x
- **Visualization**: React Flow 11.x
- **Database**: SQLite via better-sqlite3
- **AI Integration**: @anthropic-ai/claude-agent-sdk
- **Styling**: Tailwind CSS 3.x
- **Testing**: Vitest (unit/integration) + Playwright (E2E)

## Architecture

### Process Model (Electron)
```
Main Process (Node.js)
├── Agent Orchestrator & Ralph Engine
├── SQLite Database
├── Event Bus (pub/sub with throttling)
├── Tool Executor (sandboxed)
└── Keychain Service (API key storage)

     ↕ IPC (contextBridge)

Renderer Process (React)
├── UI Components (graph, inspector, dashboard)
├── Zustand Stores (projects, agents, graph, ui)
└── Event Subscriptions (real-time updates)
```

### Key Directories (planned)
```
src/
├── main/           # Electron main process
│   ├── services/   # ProjectService, AgentOrchestrator, RalphEngine
│   ├── database/   # SQLite, migrations, repositories
│   └── ipc/        # IPC handlers
├── renderer/       # React frontend
│   ├── components/ # layout/, projects/, graph/, inspector/, dashboard/
│   ├── hooks/      # useProject, useAgent, useAgentGraph, useEventSubscription
│   └── stores/     # Zustand stores
└── preload/        # Secure IPC bridge
```

### Core Components
1. **RalphEngine**: Implements the continuous agent loop with circuit breaker, budget enforcement, and completion detection
2. **AgentOrchestrator**: Manages agent lifecycle, sub-agent spawning, and state persistence
3. **EventBus**: Throttled pub/sub system for real-time UI updates (batches non-critical events at ~60fps)
4. **React Flow Graph**: Visualizes agents as nodes with status indicators and animated edges

### Data Flow
- User actions → IPC → Main process handlers → Database + EventBus
- EventBus → IPC broadcast → Zustand stores → React re-renders
- Agent streaming → Throttled events → Live UI updates

## Build Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Run tests
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:e2e           # Playwright E2E tests

# Build for production
npm run build

# Package for distribution
npm run package             # Current platform
npm run package:mac         # macOS (arm64 + x64)
npm run package:win         # Windows
npm run package:linux       # Linux (AppImage, deb, rpm)

# Linting and formatting
npm run lint
npm run format
```

## Database Schema

Five core tables: `projects`, `agents`, `agent_history`, `outputs`, `events`
- Projects track Ralph loops with status, settings (JSON), and cost totals
- Agents have parent_id for sub-agent hierarchies and config (JSON) for model/tools
- agent_history stores conversation messages with tool_calls and usage (JSON)
- events table persists all system events for audit/replay

## Security Model

1. **API keys**: Stored in OS keychain (never in config files or logs)
2. **Process isolation**: Renderer has no direct Node.js access; all sensitive ops via IPC
3. **Sandbox**: File operations restricted to project directory; command denylist enforced
4. **Permission levels**: readonly → readwrite → execute → full

## Key Patterns

### Event-Driven Updates
```typescript
// Main process emits
eventBus.emit({ type: 'agent_output_chunk', data: { agentId, chunk } });

// Renderer subscribes via hook
const { data } = useEventSubscription('agent_output_chunk', agentId);
```

### IPC Type Safety
All IPC calls are typed through `window.api` exposed by preload script:
```typescript
await window.api.project.create({ name, prompt, settings });
await window.api.agent.pause(agentId);
```

### Circuit Breaker
Ralph loop automatically pauses on:
- N consecutive failures (default: 5)
- Budget limit exceeded
- N consecutive completions without tool calls (default: 3)

## SPARC Methodology

This project follows SPARC (Specification, Pseudocode, Architecture, Refinement, Completion). See `docs/plan/prd/` for the complete design documents:
- `01-specification.md`: Requirements and user scenarios
- `02-pseudocode.md`: Algorithmic design and data models
- `03-architecture.md`: System design and component structure
- `04-refinement.md`: Testing strategy and performance optimization
- `05-completion.md`: Deployment and documentation plans
