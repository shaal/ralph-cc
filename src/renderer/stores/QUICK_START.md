# Zustand Stores - Quick Start Guide

## Installation

```bash
npm install zustand immer
```

## 5-Minute Setup

### 1. Initialize in App.tsx

```typescript
import { useStoreInitializer } from './stores';

function App() {
  const { isInitialized, error } = useStoreInitializer();

  if (error) return <ErrorScreen error={error} />;
  if (!isInitialized) return <LoadingScreen />;

  return <YourApp />;
}
```

### 2. Use in Components

```typescript
import { useProjectStore, useUIStore } from './stores';

function MyComponent() {
  // Get state
  const projects = useProjectStore((state) => state.projects);

  // Get actions
  const createProject = useProjectStore((state) => state.createProject);

  // Get selector
  const selectedProject = useProjectStore((state) => state.getSelectedProject());

  // Multiple stores
  const theme = useUIStore((state) => state.theme);

  return (
    <div className={theme}>
      {projects.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

## Common Patterns

### Creating a Project

```typescript
const createProject = useProjectStore((state) => state.createProject);
const addNotification = useUIStore((state) => state.addNotification);

const handleCreate = async () => {
  try {
    const project = await createProject({
      name: 'My Project',
      prompt: 'Build a feature...',
      settings: { budgetLimit: 10 }
    });

    addNotification({
      type: 'success',
      message: 'Project created!'
    });
  } catch (error) {
    addNotification({
      type: 'error',
      message: 'Failed to create project'
    });
  }
};
```

### Displaying Agents

```typescript
const agents = useAgentStore((state) => state.getAgentsByProject(projectId));
const selectAgent = useAgentStore((state) => state.selectAgent);

return (
  <div>
    {agents.map(agent => (
      <div key={agent.id} onClick={() => selectAgent(agent.id)}>
        {agent.status} - ${agent.costTotal}
      </div>
    ))}
  </div>
);
```

### Graph Controls

```typescript
const applyLayout = useGraphStore((state) => state.applyLayout);
const nodes = useGraphStore((state) => state.nodes);

return (
  <div>
    <button onClick={() => applyLayout('hierarchical')}>Tree</button>
    <button onClick={() => applyLayout('radial')}>Radial</button>
    <button onClick={() => applyLayout('force')}>Force</button>
    <p>{nodes.length} nodes</p>
  </div>
);
```

### Notifications

```typescript
const addNotification = useUIStore((state) => state.addNotification);

// Success
addNotification({
  type: 'success',
  title: 'Success!',
  message: 'Operation completed',
  duration: 3000 // Auto-dismiss after 3 seconds
});

// Error
addNotification({
  type: 'error',
  message: 'Something went wrong',
  duration: 0 // Don't auto-dismiss
});
```

### Theme Toggle

```typescript
const theme = useUIStore((state) => state.theme);
const toggleTheme = useUIStore((state) => state.toggleTheme);

return (
  <button onClick={toggleTheme}>
    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
  </button>
);
```

### Settings

```typescript
const config = useConfigStore((state) => state.config);
const updateConfig = useConfigStore((state) => state.updateConfig);

return (
  <input
    type="number"
    value={config?.defaultBudgetLimit}
    onChange={(e) => updateConfig('defaultBudgetLimit', Number(e.target.value))}
  />
);
```

### Event Log

```typescript
const recentEvents = useEventStore((state) => state.getRecentEvents(10));

return (
  <ul>
    {recentEvents.map(event => (
      <li key={event.id}>{event.type} at {event.timestamp}</li>
    ))}
  </ul>
);
```

## Store Overview

| Store | Purpose | Key Actions |
|-------|---------|-------------|
| **projectStore** | Project management | create, start, pause, delete |
| **agentStore** | Agent tracking | fetch, update, pause, resume |
| **graphStore** | Graph visualization | addNode, applyLayout, selectNode |
| **uiStore** | UI preferences | toggleTheme, addNotification |
| **configStore** | App configuration | updateConfig, setApiKey |
| **eventStore** | Event routing | initialize, getRecentEvents |

## Performance Tips

### ✅ DO: Use shallow selectors
```typescript
const name = useProjectStore((state) => state.projects[0]?.name);
```

### ❌ DON'T: Select entire arrays
```typescript
const projects = useProjectStore((state) => state.projects);
const name = projects[0]?.name; // Re-renders on ANY project change
```

### ✅ DO: Use built-in selectors
```typescript
const project = useProjectStore((state) => state.getProjectById(id));
```

### ❌ DON'T: Filter in component
```typescript
const projects = useProjectStore((state) => state.projects);
const project = projects.find(p => p.id === id); // Not memoized
```

## Debugging

### Redux DevTools
All stores are connected to Redux DevTools. Open in browser to:
- Inspect state
- Time-travel debug
- Track actions
- Export/import state

### Console Access
```typescript
// Get current state
const state = useProjectStore.getState();

// Call action
useProjectStore.getState().selectProject('project-1');

// Subscribe to changes
const unsub = useProjectStore.subscribe((state) => {
  console.log('Projects:', state.projects);
});
```

## Testing

```typescript
import { useProjectStore } from './stores';

describe('ProjectStore', () => {
  beforeEach(() => {
    // Reset store
    useProjectStore.setState({
      projects: [],
      selectedProjectId: null,
      loading: false,
      error: null,
    });
  });

  it('should select project', () => {
    const { selectProject, selectedProjectId } = useProjectStore.getState();
    selectProject('project-1');
    expect(useProjectStore.getState().selectedProjectId).toBe('project-1');
  });
});
```

## File Structure

```
src/renderer/stores/
├── index.ts              # Main exports & initialization
├── types.ts              # TypeScript types
├── projectStore.ts       # Project management
├── agentStore.ts         # Agent tracking
├── graphStore.ts         # Graph visualization
├── uiStore.ts            # UI state
├── configStore.ts        # Configuration
├── eventStore.ts         # Event routing
├── examples.tsx          # 15+ working examples
├── README.md             # Full documentation
├── QUICK_START.md        # This file
└── IMPLEMENTATION_SUMMARY.md  # Implementation details
```

## Next Steps

1. See `examples.tsx` for 15+ working component examples
2. Read `README.md` for complete documentation
3. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
4. Implement the IPC bridge (`window.api`) in preload script
5. Set up main process event emitters

## Need Help?

- Full docs: `README.md`
- Examples: `examples.tsx`
- Types: `types.ts`
- Architecture: `IMPLEMENTATION_SUMMARY.md`

## Summary

1. Install: `npm install zustand immer`
2. Initialize: `useStoreInitializer()` in App.tsx
3. Use: Import stores and select state/actions
4. Done! Real-time updates via EventStore

That's it! You're ready to use Zustand stores in Constellation.
