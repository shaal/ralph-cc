# Constellation

**AI Agent Swarm Orchestrator** - A desktop application for visualizing and orchestrating multiple AI coding agents in parallel.

## Overview

Constellation implements Geoffrey Huntley's "Ralph" technique at scale, transforming the simple `while :; do cat PROMPT.md | agent ; done` pattern into a visual, multi-project orchestration platform.

### Key Features

- Real-time force-directed graph visualization of agent swarms
- Click-to-inspect agent internals and streaming output
- Cost tracking, budget enforcement, and circuit breakers
- State persistence and session recovery
- Multi-project parallel execution

## Technology Stack

- **Runtime**: Electron 30.x
- **Frontend**: React 18.x + TypeScript 5.x
- **Visualization**: React Flow 12.x
- **State Management**: Zustand 4.x
- **Database**: SQLite via better-sqlite3
- **AI Integration**: Anthropic Claude SDK
- **Styling**: Tailwind CSS 3.x

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm format
```

### Building

```bash
# Build for production
npm run build

# Package for current platform
npm run package

# Package for specific platforms
npm run package:mac
npm run package:win
npm run package:linux
```

## Project Structure

```
constellation/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # IPC bridge
│   └── renderer/       # React frontend
├── resources/          # App icons and assets
├── docs/               # Documentation
└── release/            # Built packages
```

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation and development guidelines.

## License

MIT

## Author

Shaal
