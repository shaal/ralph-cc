# Constellation - Quick Start Guide

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Electron and electron-vite for the app framework
- React and TypeScript for the UI
- Tailwind CSS for styling
- React Flow for graph visualization
- Zustand for state management
- SQLite for data persistence
- Anthropic SDK for AI integration

### 2. Run Development Server

```bash
npm run dev
```

This will:
- Start the Electron main process
- Launch the React dev server with hot reload
- Open the application window
- Enable DevTools automatically in development mode

### 3. Build for Production

```bash
# Build the app
npm run build

# Package for your platform
npm run package

# Or package for specific platforms
npm run package:mac    # macOS (arm64 + x64)
npm run package:win    # Windows
npm run package:linux  # Linux (AppImage, deb, rpm)
```

## Project Structure

```
cc-exp/
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   ├── index.ts       # Main entry point with window creation
│   │   ├── services/      # Business logic (orchestrator, ralph engine)
│   │   ├── database/      # SQLite setup and repositories
│   │   └── ipc/           # IPC handlers for renderer communication
│   │
│   ├── preload/           # Secure IPC bridge
│   │   └── index.ts       # contextBridge API exposure
│   │
│   └── renderer/          # React frontend (browser)
│       ├── components/    # UI components
│       ├── hooks/         # Custom React hooks
│       ├── stores/        # Zustand state stores
│       ├── styles/        # Global CSS and Tailwind
│       ├── index.html     # HTML entry point
│       ├── main.tsx       # React entry point
│       └── App.tsx        # Root React component
│
├── resources/             # App icons and build assets
├── docs/                  # Documentation and PRD
│
├── package.json           # Dependencies and scripts
├── electron.vite.config.ts   # Build configuration
├── electron-builder.yml   # Packaging configuration
├── tailwind.config.js     # Theme and styling
└── tsconfig*.json         # TypeScript configs
```

## Key Features of the Foundation

### 1. Secure Electron Setup
- **Context Isolation**: Renderer has no direct Node.js access
- **Preload Script**: Safe IPC bridge via `window.api`
- **Security Policies**: CSP headers, no external navigation
- **Process Separation**: Main (Node.js) and Renderer (Browser) are isolated

### 2. Beautiful Dark UI
- Custom Tailwind theme with:
  - Electric blue primary (#3B82F6)
  - Purple secondary (#8B5CF6)
  - Near-black background (#0A0A0F)
  - Starfield gradient effects
- Smooth animations with Framer Motion
- Glassmorphism cards and effects
- Responsive and accessible components

### 3. Developer Experience
- **Hot Reload**: Changes reflect instantly during development
- **TypeScript**: Full type safety across main and renderer
- **Path Aliases**: Clean imports with `@/`, `@main/`, `@preload/`
- **Linting**: ESLint + Prettier for code quality
- **Testing**: Vitest (unit) + Playwright (E2E)

### 4. Ready for Extension
- Component library structure ready
- Store setup with Zustand
- Database schema defined (to be implemented)
- Event bus architecture planned
- IPC handlers stubbed for future APIs

## Development Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run preview          # Preview production build

# Building
npm run build           # Build for production
npm run typecheck       # Type-check without emitting

# Code Quality
npm run lint            # Check for linting errors
npm run format          # Format code with Prettier
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode

# Packaging
npm run package         # Package for current platform
npm run package:mac     # macOS universal (arm64 + x64)
npm run package:win     # Windows installer
npm run package:linux   # Linux (AppImage, deb, rpm)
```

## What's Next?

The foundation is complete. Next steps according to the SPARC methodology:

1. **Database Layer**: Implement SQLite schemas and repositories
2. **Event Bus**: Build the throttled pub/sub system
3. **Ralph Engine**: Create the continuous agent loop with circuit breaker
4. **Agent Orchestrator**: Manage agent lifecycle and spawning
5. **IPC Handlers**: Wire up renderer-to-main communication
6. **UI Components**: Build out the graph, inspector, and dashboard views
7. **State Management**: Implement Zustand stores with event subscriptions
8. **Testing**: Add unit and E2E tests

See `docs/plan/prd/` for the complete implementation plan.

## Troubleshooting

### Port Already in Use
If you see "port already in use" error:
```bash
# Kill the process on port 5173 (Vite default)
lsof -ti:5173 | xargs kill -9
```

### Native Dependencies Build Issues
If better-sqlite3 fails to build:
```bash
npm run rebuild-native
# or
npm rebuild better-sqlite3
```

### TypeScript Errors
Ensure all configs are in sync:
```bash
npm run typecheck
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [React Flow Documentation](https://reactflow.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)

## License

MIT - See LICENSE file for details
