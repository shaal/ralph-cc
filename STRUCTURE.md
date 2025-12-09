# Constellation - Complete Project Structure

This document provides a comprehensive overview of all files and directories in the Constellation project foundation.

## Root Directory

```
cc-exp/
├── package.json                    # Project dependencies and scripts
├── electron.vite.config.ts         # Vite build configuration for Electron
├── electron-builder.yml            # Packaging configuration for distribution
├── tsconfig.json                   # Root TypeScript configuration
├── tsconfig.node.json              # TypeScript config for main/preload processes
├── tsconfig.web.json               # TypeScript config for renderer process
├── tailwind.config.js              # Tailwind CSS theme and plugin configuration
├── postcss.config.js               # PostCSS configuration for Tailwind
├── vitest.config.ts                # Vitest test runner configuration
├── .eslintrc.json                  # ESLint linting rules
├── .prettierrc.json                # Prettier code formatting rules
├── .gitignore                      # Git ignore patterns
├── README.md                       # Project overview and documentation
├── QUICKSTART.md                   # Quick start guide for developers
├── CLAUDE.md                       # AI assistant context and guidelines
└── STRUCTURE.md                    # This file - complete structure reference
```

## Source Directory Structure

### Main Process (Node.js)

```
src/main/
├── index.ts                        # Main process entry point
│                                   # - Creates BrowserWindow with security settings
│                                   # - Configures preload script
│                                   # - Handles app lifecycle events
│                                   # - Window: 1400x900, minSize: 1000x700
│                                   # - Dark frame, hiddenInset titleBar on macOS
│
├── database/                       # SQLite database layer
│   ├── Database.ts                 # Database connection and migration runner
│   ├── types.ts                    # Database type definitions
│   ├── migrations/                 # Schema migration files
│   │   ├── index.ts                # Migration registry
│   │   └── 001_initial.ts          # Initial schema (projects, agents, etc.)
│   └── repositories/               # Data access layer
│       ├── BaseRepository.ts       # Base repository with common operations
│       ├── ProjectRepository.ts    # Project CRUD operations
│       └── AgentRepository.ts      # Agent CRUD operations
│
├── services/                       # Business logic layer
│   ├── EventBus.ts                 # Simple event pub/sub
│   ├── events/                     # Event system
│   │   ├── EventBus.ts             # Core event bus implementation
│   │   ├── ThrottledEventBus.ts   # Throttled event dispatcher (~60fps)
│   │   └── EventTypes.ts           # Event type definitions
│   │
│   ├── ralph/                      # Ralph loop implementation
│   │   ├── CircuitBreaker.ts      # Circuit breaker for failure handling
│   │   └── CostTracker.ts         # Budget tracking and enforcement
│   │
│   ├── config/                     # Configuration management
│   │   ├── ConfigManager.ts       # App settings persistence
│   │   └── defaults.ts            # Default configuration values
│   │
│   ├── security/                   # Security services
│   │   └── KeychainService.ts     # OS keychain integration for API keys
│   │
│   ├── project/                    # Project management (to be implemented)
│   └── cost/                       # Cost calculation (to be implemented)
│
├── claude/                         # Anthropic Claude SDK integration
│   ├── ClaudeClient.ts             # Claude API wrapper
│   └── types.ts                    # Claude-specific types
│
└── ipc/                            # IPC handlers for renderer communication
    ├── projectHandlers.ts          # Project-related IPC handlers
    ├── agentHandlers.ts            # Agent-related IPC handlers
    └── configHandlers.ts           # Config-related IPC handlers
```

### Preload Script (Secure Bridge)

```
src/preload/
└── index.ts                        # contextBridge API exposure
                                    # Provides type-safe window.api interface
                                    # Currently stubbed for future implementation
```

### Renderer Process (React)

```
src/renderer/
├── index.html                      # HTML entry point with CSP headers
├── main.tsx                        # React entry point (ReactDOM.render)
├── App.tsx                         # Root React component
│                                   # Displays stunning starfield UI with:
│                                   # - Animated stars (50 particles)
│                                   # - Gradient background (blue/purple)
│                                   # - Rotating Sparkles icon
│                                   # - Pulsing concentric rings
│                                   # - "Constellation" gradient text
│
├── styles/
│   └── globals.css                 # Tailwind imports + custom styles
│                                   # - Custom scrollbar styling
│                                   # - Glassmorphism effects
│                                   # - Button/card/input components
│                                   # - Badge variants
│                                   # - Animation utilities
│                                   # - Typography enhancements
│
├── components/                     # React UI components (pre-created)
│   ├── common/                     # Reusable UI primitives
│   │   ├── Badge.tsx               # Status badges
│   │   ├── Button.tsx              # Button variants
│   │   ├── Card.tsx                # Card container
│   │   ├── Dialog.tsx              # Modal dialogs
│   │   ├── Dropdown.tsx            # Dropdown menus
│   │   ├── Input.tsx               # Form inputs
│   │   ├── Progress.tsx            # Progress bars
│   │   ├── ScrollArea.tsx          # Custom scrollable areas
│   │   ├── Tabs.tsx                # Tab navigation
│   │   ├── Toast.tsx               # Toast notifications
│   │   └── Tooltip.tsx             # Tooltips
│   │
│   ├── graph/                      # React Flow graph components
│   │   ├── AgentNode.tsx           # Agent node visualization
│   │   └── ToolNode.tsx            # Tool call node visualization
│   │
│   ├── inspector/                  # Agent inspector components
│   │   ├── InspectorHeader.tsx    # Inspector header with controls
│   │   └── InspectorTabs.tsx      # Tabbed inspector content
│   │
│   ├── dashboard/                  # Dashboard components
│   │   ├── SimpleLineChart.tsx    # Cost/usage charts
│   │   └── SummaryCards.tsx       # Summary statistics cards
│   │
│   └── projects/                   # Project list components
│       └── ProjectCard.tsx         # Project card with status
│
├── hooks/                          # Custom React hooks
│   ├── useProject.ts               # Single project state
│   ├── useProjects.ts              # Project list state
│   ├── useAgent.ts                 # Single agent state
│   ├── useAgentGraph.ts            # Agent graph data
│   ├── useAgentStream.ts           # Agent output streaming
│   ├── useCostData.ts              # Cost tracking data
│   └── useBudgetAlert.ts           # Budget alert system
│
├── stores/                         # Zustand state stores
│   ├── types.ts                    # Store type definitions
│   ├── projectStore.ts             # Project state management
│   ├── agentStore.ts               # Agent state management
│   ├── graphStore.ts               # Graph visualization state
│   ├── uiStore.ts                  # UI state (sidebar, modals, etc.)
│   └── configStore.ts              # App configuration state
│
├── types/
│   └── index.ts                    # Shared type definitions
│
└── utils/                          # Utility functions (to be added)
```

## Resources Directory

```
resources/
├── icon.png                        # App icon (placeholder 1x1 pixel)
├── dmg-background.png              # macOS DMG background (to be added)
└── entitlements.mac.plist          # macOS entitlements (to be added)
```

## Documentation

```
docs/
└── plan/
    └── prd/                        # Product Requirements (SPARC methodology)
        ├── 00-overview.md          # Project overview
        ├── 01-specification.md     # Requirements and user scenarios
        ├── 02-pseudocode.md        # Algorithmic design
        ├── 03-architecture.md      # System design
        ├── 04-refinement.md        # Testing and optimization
        └── 05-completion.md        # Deployment and documentation
```

## VSCode Configuration

```
.vscode/
├── settings.json                   # Workspace settings
│                                   # - Format on save with Prettier
│                                   # - ESLint auto-fix
│                                   # - TypeScript SDK path
│                                   # - File exclusions
│                                   # - Tailwind CSS support
└── extensions.json                 # Recommended extensions
                                    # - ESLint
                                    # - Prettier
                                    # - Tailwind CSS IntelliSense
                                    # - Playwright
```

## Build Outputs (Generated)

```
dist-electron/                      # Built files (gitignored)
├── main/                           # Compiled main process
├── preload/                        # Compiled preload script
└── renderer/                       # Built renderer assets

release/                            # Packaged apps (gitignored)
└── [version]/
    ├── *.dmg                       # macOS disk image
    ├── *.exe                       # Windows installer
    ├── *.AppImage                  # Linux AppImage
    ├── *.deb                       # Debian package
    └── *.rpm                       # Red Hat package

node_modules/                       # Dependencies (gitignored)
```

## Key File Purposes

### Configuration Files

- **package.json**: Defines all dependencies, scripts, and project metadata
- **electron.vite.config.ts**: Configures Vite for multi-process Electron build
- **electron-builder.yml**: Packaging settings for all platforms
- **tsconfig.*.json**: TypeScript settings for different environments
- **tailwind.config.js**: Custom theme with dark colors and animations
- **vitest.config.ts**: Test runner configuration

### Security & Quality

- **.eslintrc.json**: Code linting rules for TypeScript/React
- **.prettierrc.json**: Code formatting standards
- **.gitignore**: Excludes build artifacts and sensitive files

### Documentation

- **README.md**: High-level project overview
- **QUICKSTART.md**: Step-by-step setup guide
- **CLAUDE.md**: AI assistant instructions and architecture
- **STRUCTURE.md**: This file - complete structure reference

## Technology Stack Summary

### Runtime & Build
- **Electron 30.x**: Desktop app framework
- **Vite 5.x**: Fast build tool with HMR
- **TypeScript 5.x**: Type-safe JavaScript
- **electron-vite 2.x**: Electron-specific Vite config

### Frontend
- **React 18.x**: UI library
- **React Flow 12.x**: Graph visualization
- **Framer Motion 11.x**: Animation library
- **Tailwind CSS 3.x**: Utility-first CSS
- **Lucide React**: Icon library

### State & Data
- **Zustand 4.x**: Lightweight state management
- **better-sqlite3 11.x**: Local SQLite database

### AI Integration
- **@anthropic-ai/sdk 0.26.x**: Claude API client

### Development Tools
- **Vitest**: Unit testing
- **Playwright**: E2E testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **electron-builder**: App packaging

## Next Implementation Steps

See QUICKSTART.md for immediate setup instructions and CLAUDE.md for the complete architecture and implementation roadmap.

The foundation is complete and ready for:
1. Database implementation
2. Event bus activation
3. Ralph engine development
4. UI component wiring
5. IPC handler implementation
6. State management integration

---

**Foundation Status**: ✅ Complete and ready for development
**Last Updated**: 2025-12-09
