# SPARC Phase 3: Architecture

## Ralph-as-a-Service (RaaS) - "Constellation"

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONSTELLATION APP                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     RENDERER PROCESS (React)                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   Project    │  │    Agent     │  │    Cost      │               │   │
│  │  │   Manager    │  │    Graph     │  │  Dashboard   │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   Agent      │  │    Task      │  │   Prompt     │               │   │
│  │  │  Inspector   │  │   Pipeline   │  │   Editor     │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                    STATE MANAGEMENT (Zustand)                │    │   │
│  │  │  projects[] │ agents[] │ graph{} │ ui{} │ config{}          │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                              IPC Bridge                                     │
│                           (contextBridge)                                   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      MAIN PROCESS (Node.js)                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   Project    │  │    Agent     │  │    Event     │               │   │
│  │  │   Service    │  │  Orchestrator│  │     Bus      │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   Database   │  │    Config    │  │   Keychain   │               │   │
│  │  │   (SQLite)   │  │   Manager    │  │   Service    │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                 RALPH ENGINE                                  │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │   │
│  │  │  │ Ralph Loop  │  │  Tool       │  │  Circuit    │          │    │   │
│  │  │  │ Controller  │  │  Executor   │  │  Breaker    │          │    │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘          │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐
            │   Anthropic   │ │   Local     │ │   Remote    │
            │     API       │ │ Filesystem  │ │   Agents    │
            │  (Claude)     │ │             │ │   (MCP)     │
            └───────────────┘ └─────────────┘ └─────────────┘
```

### 1.2 Process Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELECTRON APPLICATION                          │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    MAIN PROCESS                           │  │
│   │                                                           │  │
│   │  • Application lifecycle management                       │  │
│   │  • Native OS integration (menus, tray, notifications)     │  │
│   │  • Database operations (SQLite via better-sqlite3)        │  │
│   │  • Agent orchestration (Claude Agent SDK)                 │  │
│   │  • File system access                                     │  │
│   │  • Keychain/credential storage                            │  │
│   │  • IPC message handling                                   │  │
│   │                                                           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                     IPC (contextBridge)                         │
│                              │                                   │
│   ┌──────────────────────────▼───────────────────────────────┐  │
│   │                  RENDERER PROCESS                         │  │
│   │                                                           │  │
│   │  • React UI components                                    │  │
│   │  • State management (Zustand)                             │  │
│   │  • React Flow graph visualization                         │  │
│   │  • User interactions                                      │  │
│   │  • Real-time updates via event subscriptions              │  │
│   │                                                           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              AGENT WORKER PROCESSES (Optional)            │  │
│   │                                                           │  │
│   │  • Isolated agent execution for heavy workloads           │  │
│   │  • Sandboxed tool execution                               │  │
│   │  • One worker per project (optional scaling)              │  │
│   │                                                           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Components (React)

```
src/renderer/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Main layout wrapper
│   │   ├── Sidebar.tsx               # Project list sidebar
│   │   ├── Header.tsx                # Top bar with actions
│   │   └── StatusBar.tsx             # Bottom status bar
│   │
│   ├── projects/
│   │   ├── ProjectList.tsx           # List of all projects
│   │   ├── ProjectCard.tsx           # Individual project card
│   │   ├── ProjectDetail.tsx         # Project detail view
│   │   ├── ProjectSettings.tsx       # Project configuration
│   │   └── NewProjectDialog.tsx      # Create project modal
│   │
│   ├── graph/
│   │   ├── AgentGraph.tsx            # Main React Flow canvas
│   │   ├── AgentNode.tsx             # Custom agent node component
│   │   ├── ToolNode.tsx              # Tool execution node
│   │   ├── ConnectionEdge.tsx        # Custom edge with animations
│   │   ├── GraphControls.tsx         # Zoom, filter, layout controls
│   │   └── MiniMap.tsx               # Graph minimap
│   │
│   ├── inspector/
│   │   ├── AgentInspector.tsx        # Agent detail panel
│   │   ├── InspectorTabs.tsx         # Tab navigation
│   │   ├── OverviewTab.tsx           # Agent overview
│   │   ├── HistoryTab.tsx            # Conversation history
│   │   ├── OutputsTab.tsx            # Generated files
│   │   ├── ConfigTab.tsx             # Agent configuration
│   │   └── LiveStream.tsx            # Real-time output stream
│   │
│   ├── pipeline/
│   │   ├── TaskPipeline.tsx          # Task board view
│   │   ├── TaskCard.tsx              # Individual task
│   │   ├── TaskDependencyGraph.tsx   # DAG view of tasks
│   │   └── TaskDetail.tsx            # Task detail panel
│   │
│   ├── dashboard/
│   │   ├── CostDashboard.tsx         # Cost overview
│   │   ├── CostChart.tsx             # Cost over time
│   │   ├── TokenMetrics.tsx          # Token usage stats
│   │   └── BudgetAlert.tsx           # Budget warning component
│   │
│   ├── editor/
│   │   ├── PromptEditor.tsx          # PROMPT.md editor
│   │   ├── PromptPreview.tsx         # Variable interpolation preview
│   │   └── PromptHistory.tsx         # Version history
│   │
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Dialog.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       ├── Tabs.tsx
│       └── ...
│
├── hooks/
│   ├── useProject.ts                 # Project data hook
│   ├── useAgent.ts                   # Agent data hook
│   ├── useAgentGraph.ts              # Graph state hook
│   ├── useEventSubscription.ts       # IPC event subscription
│   ├── useCost.ts                    # Cost tracking hook
│   └── useConfig.ts                  # Configuration hook
│
├── stores/
│   ├── projectStore.ts               # Zustand project store
│   ├── agentStore.ts                 # Zustand agent store
│   ├── graphStore.ts                 # Graph visualization state
│   ├── uiStore.ts                    # UI state (panels, modals)
│   └── configStore.ts                # App configuration
│
├── services/
│   ├── ipc.ts                        # IPC bridge wrapper
│   └── api.ts                        # Type-safe API calls
│
└── App.tsx                           # Root component
```

### 2.2 Backend Services (Node.js/Main Process)

```
src/main/
├── index.ts                          # Main process entry
├── window.ts                         # Window management
├── menu.ts                           # Application menu
├── tray.ts                           # System tray
│
├── services/
│   ├── project/
│   │   ├── ProjectService.ts         # Project CRUD operations
│   │   ├── ProjectRepository.ts      # Database access layer
│   │   └── types.ts                  # Project types
│   │
│   ├── agent/
│   │   ├── AgentOrchestrator.ts      # Agent lifecycle management
│   │   ├── AgentFactory.ts           # Agent creation
│   │   ├── AgentRepository.ts        # Database access layer
│   │   └── types.ts                  # Agent types
│   │
│   ├── ralph/
│   │   ├── RalphEngine.ts            # Core Ralph loop logic
│   │   ├── RalphController.ts        # Start/stop/pause control
│   │   ├── IterationManager.ts       # Iteration tracking
│   │   └── CompletionDetector.ts     # Exit condition detection
│   │
│   ├── tools/
│   │   ├── ToolExecutor.ts           # Tool execution handler
│   │   ├── ToolRegistry.ts           # Available tools
│   │   ├── SandboxedExecutor.ts      # Sandboxed execution
│   │   └── tools/
│   │       ├── BashTool.ts
│   │       ├── ReadTool.ts
│   │       ├── WriteTool.ts
│   │       ├── EditTool.ts
│   │       └── ...
│   │
│   ├── cost/
│   │   ├── CostTracker.ts            # Real-time cost tracking
│   │   ├── BudgetEnforcer.ts         # Budget limits
│   │   └── CostRepository.ts         # Cost history
│   │
│   ├── events/
│   │   ├── EventBus.ts               # Central event bus
│   │   ├── EventTypes.ts             # Event type definitions
│   │   └── EventPersistence.ts       # Event logging
│   │
│   ├── config/
│   │   ├── ConfigManager.ts          # Configuration loading/saving
│   │   └── defaults.ts               # Default configuration
│   │
│   └── security/
│       ├── KeychainService.ts        # OS keychain integration
│       ├── PermissionManager.ts      # File/command permissions
│       └── Sandbox.ts                # Execution sandbox
│
├── database/
│   ├── Database.ts                   # SQLite connection
│   ├── migrations/                   # Schema migrations
│   │   ├── 001_initial.ts
│   │   └── ...
│   └── repositories/
│       ├── BaseRepository.ts
│       ├── ProjectRepository.ts
│       ├── AgentRepository.ts
│       ├── HistoryRepository.ts
│       └── EventRepository.ts
│
├── ipc/
│   ├── handlers.ts                   # IPC handler registration
│   ├── projectHandlers.ts            # Project IPC handlers
│   ├── agentHandlers.ts              # Agent IPC handlers
│   └── configHandlers.ts             # Config IPC handlers
│
└── claude/
    ├── ClaudeClient.ts               # Claude Agent SDK wrapper
    ├── StreamHandler.ts              # Streaming response handler
    └── types.ts                      # Claude types
```

---

## 3. Data Flow Architecture

### 3.1 Agent Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT EXECUTION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │  User    │
     │  Action  │
     └────┬─────┘
          │
          ▼
┌─────────────────────┐
│   Start Project     │
│   (Renderer)        │
└─────────┬───────────┘
          │ IPC: project:start
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│   ProjectService    │────▶│   Load PROMPT.md    │
│   (Main)            │     │   & Settings        │
└─────────┬───────────┘     └─────────────────────┘
          │
          ▼
┌─────────────────────┐
│   AgentOrchestrator │
│   Create Root Agent │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐         ┌─────────────────────┐
│   RalphEngine       │────────▶│   Event: agent_     │
│   Start Loop        │         │   created           │
└─────────┬───────────┘         └──────────┬──────────┘
          │                                 │
          │                                 ▼
          │                     ┌─────────────────────┐
          │                     │   EventBus          │
          │                     │   Broadcast         │
          │                     └──────────┬──────────┘
          │                                 │
          │                                 ▼
          │                     ┌─────────────────────┐
          │                     │   Renderer          │
          │                     │   Update Graph      │
          │                     └─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│                    RALPH LOOP                        │
│  ┌───────────────────────────────────────────────┐  │
│  │  WHILE project.status == "running":           │  │
│  │                                               │  │
│  │    ┌─────────────────────┐                   │  │
│  │    │  Check Circuit      │                   │  │
│  │    │  Breaker            │◀──────┐           │  │
│  │    └─────────┬───────────┘       │           │  │
│  │              │                    │           │  │
│  │              ▼                    │           │  │
│  │    ┌─────────────────────┐       │           │  │
│  │    │  Check Budget       │       │           │  │
│  │    │  Limit              │       │           │  │
│  │    └─────────┬───────────┘       │           │  │
│  │              │                    │           │  │
│  │              ▼                    │           │  │
│  │    ┌─────────────────────┐       │           │  │
│  │    │  Load Current       │       │           │  │
│  │    │  PROMPT.md          │       │           │  │
│  │    └─────────┬───────────┘       │           │  │
│  │              │                    │           │  │
│  │              ▼                    │           │  │
│  │    ┌─────────────────────┐       │           │  │
│  │    │  Call Claude API    │───────┼───────────┼──┼──▶ Anthropic API
│  │    │  (Streaming)        │◀──────┼───────────┼──┼──
│  │    └─────────┬───────────┘       │           │  │
│  │              │                    │           │  │
│  │              │ Stream chunks     │           │  │
│  │              ▼                    │           │  │
│  │    ┌─────────────────────┐       │           │  │
│  │    │  Event: agent_      │───────┼──▶ UI     │  │
│  │    │  output_chunk       │       │           │  │
│  │    └─────────┬───────────┘       │           │  │
│  │              │                    │           │  │
│  │              ▼                    │           │  │
│  │    ┌─────────────────────┐       │           │  │
│  │    │  Tool Calls?        │       │           │  │
│  │    └────┬──────────┬─────┘       │           │  │
│  │         │ Yes      │ No          │           │  │
│  │         ▼          ▼             │           │  │
│  │    ┌─────────┐  ┌─────────┐     │           │  │
│  │    │ Execute │  │ Check   │     │           │  │
│  │    │ Tools   │  │Complete │     │           │  │
│  │    └────┬────┘  └────┬────┘     │           │  │
│  │         │            │           │           │  │
│  │         │            ▼           │           │  │
│  │         │       ┌─────────┐     │           │  │
│  │         │       │Complete?│     │           │  │
│  │         │       └────┬────┘     │           │  │
│  │         │            │ No       │           │  │
│  │         └────────────┴──────────┘           │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 3.2 Event Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EVENT FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                    MAIN PROCESS                         RENDERER PROCESS
                    ────────────                         ────────────────

    ┌───────────────────────────┐
    │     Event Sources         │
    │  • RalphEngine            │
    │  • ToolExecutor           │
    │  • CostTracker            │
    │  • AgentOrchestrator      │
    └───────────┬───────────────┘
                │
                │ emit(event)
                ▼
    ┌───────────────────────────┐
    │       EventBus            │
    │  • Type validation        │
    │  • Timestamp injection    │
    │  • Persistence (SQLite)   │
    └───────────┬───────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌───────────────┐ ┌─────────────────────────────────┐
│  Persist to   │ │      IPC Broadcast               │
│  Database     │ │  mainWindow.webContents.send()   │
└───────────────┘ └───────────────┬─────────────────┘
                                  │
                                  │ "event" channel
                                  │
                  ────────────────┼────────────────────
                                  │
                                  ▼
                  ┌───────────────────────────────────┐
                  │     useEventSubscription Hook     │
                  │  • Filter by event type           │
                  │  • Filter by project/agent ID     │
                  └───────────────┬───────────────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
                  ▼               ▼               ▼
          ┌───────────┐   ┌───────────┐   ┌───────────┐
          │  Zustand  │   │  Zustand  │   │  Zustand  │
          │  Project  │   │   Agent   │   │   Graph   │
          │   Store   │   │   Store   │   │   Store   │
          └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │   React       │
                        │   Components  │
                        │   Re-render   │
                        └───────────────┘
```

### 3.3 State Synchronization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE SYNCHRONIZATION                                │
└─────────────────────────────────────────────────────────────────────────────┘

    SOURCE OF TRUTH                    DERIVED STATE
    ───────────────                    ─────────────

    ┌───────────────┐                  ┌───────────────────────────┐
    │   SQLite      │                  │   Zustand Stores          │
    │   Database    │                  │   (Renderer Process)      │
    │               │                  │                           │
    │  • projects   │  ──────────────▶ │  • projectStore           │
    │  • agents     │   Initial Load   │  • agentStore             │
    │  • history    │   on App Start   │  • graphStore             │
    │  • events     │                  │                           │
    │  • outputs    │                  └───────────────────────────┘
    │               │                              │
    └───────┬───────┘                              │
            │                                      │
            │                                      │
            │  Real-time                           │ User Actions
            │  Updates via                         │ (create, update, delete)
            │  EventBus                            │
            │                                      ▼
            │                          ┌───────────────────────────┐
            │                          │   IPC Mutation            │
            │                          │   • project:create        │
            │                          │   • project:update        │
            │                          │   • agent:pause           │
            │                          └───────────┬───────────────┘
            │                                      │
            │                                      ▼
            │                          ┌───────────────────────────┐
            │                          │   Main Process Handler    │
            │                          │   • Validate              │
            │                          │   • Persist to SQLite     │
            │                          │   • Emit Event            │
            │                          └───────────┬───────────────┘
            │                                      │
            └──────────────────────────────────────┘
                        Event triggers UI update
```

---

## 4. Technology Stack

### 4.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Electron | 30.x | Desktop app framework |
| **Language** | TypeScript | 5.x | Type safety |
| **UI Framework** | React | 18.x | Component library |
| **Build Tool** | Vite | 5.x | Fast builds, HMR |
| **State Management** | Zustand | 4.x | Lightweight, hooks-based |
| **Graph Visualization** | React Flow | 11.x | Node-based UI |
| **Database** | better-sqlite3 | 9.x | Synchronous SQLite |
| **AI SDK** | @anthropic-ai/claude-agent-sdk | 1.x | Agent orchestration |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Icons** | Lucide React | latest | Icon library |

### 4.2 Development Tools

| Tool | Purpose |
|------|---------|
| **electron-builder** | App packaging and distribution |
| **electron-vite** | Vite integration for Electron |
| **Prisma** | Database ORM (optional, for migrations) |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |

### 4.3 Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEPENDENCY GRAPH                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                                 ┌─────────────────┐
                                 │   Electron      │
                                 │   (Runtime)     │
                                 └────────┬────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
          │   Main Process  │   │ Preload Script  │   │ Renderer Process│
          │   Dependencies  │   │   (Bridge)      │   │   Dependencies  │
          └────────┬────────┘   └─────────────────┘   └────────┬────────┘
                   │                                            │
       ┌───────────┴───────────┐                    ┌───────────┴───────────┐
       │                       │                    │                       │
       ▼                       ▼                    ▼                       ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Claude      │      │ better-     │      │   React     │      │ React Flow  │
│ Agent SDK   │      │ sqlite3     │      │   18.x      │      │   11.x      │
└─────────────┘      └─────────────┘      └──────┬──────┘      └─────────────┘
       │                    │                    │
       │                    │                    ▼
       │                    │             ┌─────────────┐
       │                    │             │  Zustand    │
       │                    │             │    4.x      │
       │                    │             └─────────────┘
       ▼                    │
┌─────────────┐             │
│ @anthropic- │             │
│ ai/sdk      │             │
└─────────────┘             │
                            ▼
                    ┌─────────────┐
                    │   SQLite    │
                    │  (Native)   │
                    └─────────────┘
```

---

## 5. Database Schema (Detailed)

### 5.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ERD                                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐          ┌─────────────────────┐
    │      PROJECTS       │          │       AGENTS        │
    ├─────────────────────┤          ├─────────────────────┤
    │ PK id              │◀────────┐│ PK id               │
    │    name            │         ││ FK project_id       │───┐
    │    description     │         │└─FK parent_id        │   │
    │    status          │         │ │    name            │◀──┘
    │    prompt_path     │         │ │    status          │    (self-ref)
    │    settings (JSON) │         │ │    config (JSON)   │
    │    cost_total      │         │ │    total_tokens    │
    │    created_at      │         │ │    total_cost      │
    │    updated_at      │         │ │    iteration_count │
    │    ended_at        │         │ │    created_at      │
    └─────────────────────┘         │ │    updated_at      │
              │                      │ └─────────────────────┘
              │ 1:N                  │           │
              │                      │           │ 1:N
              ▼                      │           ▼
    ┌─────────────────────┐         │ ┌─────────────────────┐
    │      OUTPUTS        │         │ │   AGENT_HISTORY     │
    ├─────────────────────┤         │ ├─────────────────────┤
    │ PK id              │         │ │ PK id               │
    │ FK project_id      │─────────┘ │ FK agent_id         │
    │ FK agent_id        │───────────│    role             │
    │    type            │           │    content          │
    │    path            │           │    tool_calls (JSON)│
    │    content         │           │    usage (JSON)     │
    │    previous_content│           │    cost             │
    │    created_at      │           │    created_at       │
    └─────────────────────┘           └─────────────────────┘

    ┌─────────────────────┐
    │       EVENTS        │
    ├─────────────────────┤
    │ PK id              │
    │ FK project_id      │
    │ FK agent_id        │ (nullable)
    │    type            │
    │    data (JSON)     │
    │    created_at      │
    └─────────────────────┘

    INDEX: events(project_id, created_at)
    INDEX: agents(project_id)
    INDEX: agent_history(agent_id, created_at)
    INDEX: outputs(project_id, agent_id)
```

### 5.2 Full Schema SQL

```sql
-- projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'running', 'paused', 'completed', 'failed', 'stopped')),
    prompt_path TEXT NOT NULL,
    settings TEXT DEFAULT '{}',  -- JSON
    cost_total REAL DEFAULT 0,
    iteration_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    ended_at DATETIME
);

-- agents table
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    name TEXT,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'idle', 'working', 'paused', 'completed', 'failed')),
    config TEXT DEFAULT '{}',  -- JSON
    current_task TEXT,
    total_tokens INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    iteration_count INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE INDEX idx_agents_project ON agents(project_id);
CREATE INDEX idx_agents_parent ON agents(parent_id);

-- agent_history table
CREATE TABLE agent_history (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content TEXT,
    tool_calls TEXT,  -- JSON array
    tool_results TEXT,  -- JSON array
    usage TEXT,  -- JSON { input_tokens, output_tokens }
    cost REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_agent ON agent_history(agent_id);
CREATE INDEX idx_history_agent_time ON agent_history(agent_id, created_at);

-- outputs table
CREATE TABLE outputs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('file', 'artifact', 'log')),
    path TEXT,
    content TEXT,
    previous_content TEXT,
    checksum TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_outputs_project ON outputs(project_id);
CREATE INDEX idx_outputs_agent ON outputs(agent_id);

-- events table
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    data TEXT,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_project_time ON events(project_id, created_at);
CREATE INDEX idx_events_type ON events(type);

-- configuration table (key-value store for app settings)
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. API Design

### 6.1 IPC API (Main ↔ Renderer)

```typescript
// Type definitions for IPC API

interface ProjectAPI {
  // CRUD
  'project:create': (data: CreateProjectDTO) => Promise<Project>;
  'project:get': (id: string) => Promise<Project>;
  'project:list': () => Promise<Project[]>;
  'project:update': (id: string, data: UpdateProjectDTO) => Promise<Project>;
  'project:delete': (id: string) => Promise<void>;

  // Lifecycle
  'project:start': (id: string) => Promise<void>;
  'project:pause': (id: string) => Promise<void>;
  'project:resume': (id: string) => Promise<void>;
  'project:stop': (id: string) => Promise<void>;

  // Queries
  'project:cost': (id: string) => Promise<CostSummary>;
  'project:outputs': (id: string) => Promise<Output[]>;
}

interface AgentAPI {
  'agent:get': (id: string) => Promise<Agent>;
  'agent:list': (projectId: string) => Promise<Agent[]>;
  'agent:history': (id: string, limit?: number) => Promise<HistoryEntry[]>;
  'agent:pause': (id: string) => Promise<void>;
  'agent:resume': (id: string) => Promise<void>;
  'agent:stop': (id: string) => Promise<void>;
}

interface ConfigAPI {
  'config:get': () => Promise<Config>;
  'config:set': (key: string, value: any) => Promise<void>;
  'config:reset': () => Promise<void>;
}

// Event types (Main → Renderer)
type EventTypes = {
  'project:status_changed': { projectId: string; status: ProjectStatus };
  'agent:created': { agent: Agent };
  'agent:status_changed': { agentId: string; status: AgentStatus };
  'agent:output_chunk': { agentId: string; chunk: string };
  'agent:tool_call': { agentId: string; tool: ToolCall };
  'agent:iteration_complete': { agentId: string; result: IterationResult };
  'cost:updated': { projectId: string; cost: number; total: number };
  'budget:warning': { projectId: string; current: number; limit: number };
  'circuit_breaker:triggered': { projectId: string; reason: string };
  'error': { source: string; error: ErrorInfo };
};
```

### 6.2 Claude Agent SDK Integration

```typescript
// ClaudeClient.ts - Wrapper around Claude Agent SDK

import { Agent, AgentConfig } from '@anthropic-ai/claude-agent-sdk';

interface ConstellationAgentConfig extends AgentConfig {
  projectId: string;
  onOutputChunk: (chunk: string) => void;
  onToolCall: (tool: ToolCall) => void;
  onIterationComplete: (result: IterationResult) => void;
}

class ClaudeClient {
  private agents: Map<string, Agent> = new Map();

  async createAgent(config: ConstellationAgentConfig): Promise<string> {
    const agent = new Agent({
      model: config.model ?? 'claude-sonnet-4-20250514',
      systemPrompt: config.systemPrompt,
      tools: config.tools,
      maxTokens: config.maxTokens,
    });

    const agentId = generateUUID();
    this.agents.set(agentId, agent);

    return agentId;
  }

  async runIteration(
    agentId: string,
    prompt: string,
    config: ConstellationAgentConfig
  ): Promise<IterationResult> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    const response = await agent.run(prompt, {
      stream: true,
      onChunk: (chunk) => {
        if (chunk.type === 'text') {
          config.onOutputChunk(chunk.text);
        } else if (chunk.type === 'tool_use') {
          config.onToolCall(chunk.toolUse);
        }
      }
    });

    const result: IterationResult = {
      type: response.toolCalls.length > 0 ? 'tool_calls' : 'completion',
      output: response.content,
      toolCalls: response.toolCalls,
      usage: response.usage,
      cost: this.calculateCost(response.usage, config.model),
    };

    config.onIterationComplete(result);
    return result;
  }

  private calculateCost(usage: Usage, model: string): number {
    const rates = PRICING[model];
    return (
      (usage.inputTokens / 1_000_000) * rates.input +
      (usage.outputTokens / 1_000_000) * rates.output
    );
  }
}
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                         LAYER 1: API KEY SECURITY                    │
    │                                                                      │
    │  • API keys stored in OS keychain (not in config files)             │
    │  • Keychain access requires user authentication                      │
    │  • Keys never exposed to renderer process                            │
    │  • Keys never logged or persisted in event history                   │
    │                                                                      │
    │  Implementation:                                                     │
    │  - macOS: Keychain Services                                          │
    │  - Windows: Credential Manager                                       │
    │  - Linux: libsecret/Secret Service                                   │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                      LAYER 2: PROCESS ISOLATION                      │
    │                                                                      │
    │  • Renderer process has no direct Node.js access                    │
    │  • All sensitive operations go through IPC                          │
    │  • contextBridge exposes minimal API surface                        │
    │  • webSecurity enabled, nodeIntegration disabled                    │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                      LAYER 3: SANDBOX EXECUTION                      │
    │                                                                      │
    │  Tool Execution Sandbox:                                            │
    │  • File operations restricted to project directory                  │
    │  • Command execution filtered against denylist                      │
    │  • Network access logged and rate-limited                          │
    │  • Resource limits (CPU time, memory)                              │
    │                                                                      │
    │  Denied Commands (default):                                         │
    │  - rm -rf /                                                         │
    │  - sudo, su                                                         │
    │  - chmod 777                                                        │
    │  - curl | bash, wget | sh                                          │
    │  - Configurable per project                                         │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                       LAYER 4: PERMISSION MODEL                      │
    │                                                                      │
    │  Default: Read-Only                                                 │
    │  • Agents can read files by default                                 │
    │  • Write operations require explicit project setting                │
    │  • Command execution requires explicit approval                     │
    │                                                                      │
    │  Permission Levels:                                                 │
    │  1. readonly  - Read files only                                     │
    │  2. readwrite - Read and write files in project dir                │
    │  3. execute   - Run approved commands                               │
    │  4. full      - All operations (requires confirmation)              │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                        LAYER 5: AUDIT TRAIL                          │
    │                                                                      │
    │  All agent actions logged:                                          │
    │  • File operations (read, write, delete)                            │
    │  • Command executions (with output)                                 │
    │  • API calls (with token counts)                                    │
    │  • Configuration changes                                            │
    │                                                                      │
    │  Retention: Configurable (default 30 days)                          │
    │  Export: JSON or CSV format                                         │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Preload Script (Security Bridge)

```typescript
// preload.ts - Secure bridge between main and renderer

import { contextBridge, ipcRenderer } from 'electron';

// Expose only specific, safe APIs to renderer
contextBridge.exposeInMainWorld('api', {
  // Project operations
  project: {
    create: (data: CreateProjectDTO) => ipcRenderer.invoke('project:create', data),
    get: (id: string) => ipcRenderer.invoke('project:get', id),
    list: () => ipcRenderer.invoke('project:list'),
    start: (id: string) => ipcRenderer.invoke('project:start', id),
    pause: (id: string) => ipcRenderer.invoke('project:pause', id),
    stop: (id: string) => ipcRenderer.invoke('project:stop', id),
  },

  // Agent operations
  agent: {
    get: (id: string) => ipcRenderer.invoke('agent:get', id),
    history: (id: string) => ipcRenderer.invoke('agent:history', id),
    pause: (id: string) => ipcRenderer.invoke('agent:pause', id),
  },

  // Event subscription
  on: (callback: (event: AppEvent) => void) => {
    const handler = (_: any, event: AppEvent) => callback(event);
    ipcRenderer.on('event', handler);
    return () => ipcRenderer.removeListener('event', handler);
  },

  // Config (limited)
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    setTheme: (theme: string) => ipcRenderer.invoke('config:setTheme', theme),
  },
});

// Type declaration for renderer
declare global {
  interface Window {
    api: typeof api;
  }
}
```

---

## 8. Deployment Architecture

### 8.1 Build & Distribution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUILD PIPELINE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    Source Code
         │
         ▼
    ┌─────────────┐
    │  TypeScript │
    │  Compile    │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐     ┌─────────────┐
    │    Vite     │────▶│   Bundle    │
    │    Build    │     │  Optimize   │
    └──────┬──────┘     └──────┬──────┘
           │                   │
           └─────────┬─────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ electron-builder│
           └────────┬────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌───────┐   ┌───────┐   ┌───────┐
    │ macOS │   │Windows│   │ Linux │
    │ .dmg  │   │ .exe  │   │.AppImage
    │ .app  │   │ .msi  │   │ .deb  │
    └───────┘   └───────┘   └───────┘

    Distribution:
    • GitHub Releases (primary)
    • Auto-update via electron-updater
    • Code signing for macOS/Windows
```

### 8.2 Directory Structure (Installed)

```
macOS:
/Applications/Constellation.app/
├── Contents/
│   ├── MacOS/
│   │   └── Constellation        # Main executable
│   ├── Resources/
│   │   ├── app.asar             # Application bundle
│   │   └── icon.icns
│   └── Info.plist

Windows:
C:\Users\{user}\AppData\Local\Constellation\
├── Constellation.exe
├── resources/
│   └── app.asar
└── ...

User Data:
~/.constellation/                 # Cross-platform
├── config.json                   # User configuration
├── constellation.db              # SQLite database
├── projects/                     # Project files
│   └── {project-id}/
│       ├── PROMPT.md
│       └── outputs/
└── logs/
    └── app.log
```

---

## Reflection

### Architectural Decisions

1. **Electron over Tauri**: Despite Tauri's smaller bundle size, Electron was chosen for:
   - Better Claude Agent SDK compatibility (Node.js native)
   - Mature ecosystem and tooling
   - Team familiarity with JavaScript/TypeScript

2. **SQLite over PostgreSQL/Cloud**:
   - Privacy: User data stays local
   - Simplicity: Zero configuration
   - Performance: Excellent for single-user workloads
   - Offline: Works without internet

3. **Zustand over Redux**:
   - Simpler API for this scale of application
   - Less boilerplate
   - Excellent TypeScript support
   - Easy integration with React hooks

4. **React Flow for visualization**:
   - Purpose-built for node-based UIs
   - Good performance with hundreds of nodes
   - Customizable nodes and edges
   - Active community and maintenance

### Trade-offs Accepted

| Decision | Trade-off | Mitigation |
|----------|-----------|------------|
| Electron | Large bundle (~150MB) | Users expect desktop apps to be larger |
| SQLite | Single-user only | Future: Optional sync layer |
| Local execution | Requires user machine | Lower cost, better privacy |
| TypeScript everywhere | Build complexity | Better long-term maintainability |

### Scalability Considerations

- **100+ agents**: React Flow tested to handle 500+ nodes with optimizations
- **Long-running projects**: SQLite can handle millions of rows; consider archiving old history
- **Multiple projects**: Each project runs in isolated Ralph loop; OS-level parallelism

### Future Extension Points

1. **Plugin System**: Load custom tools via MCP servers
2. **Remote Agents**: MCP-based protocol for distributed execution
3. **Team Features**: Optional cloud sync layer
4. **IDE Integration**: VS Code extension sharing state with desktop app

---

*SPARC Phase 3: Architecture - Complete*
*Next: [04-refinement.md](./04-refinement.md)*
