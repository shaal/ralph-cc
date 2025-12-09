# Zustand Stores

This directory contains all Zustand state management stores for the Constellation application.

## Overview

The application uses Zustand with the following middleware:
- **immer**: For immutable state updates using mutable syntax
- **devtools**: For Redux DevTools integration
- **persist**: For localStorage persistence (UI store only)

## Stores

### 1. Project Store (`projectStore.ts`)
Manages project state and operations.

**State:**
- `projects`: Array of all projects
- `selectedProjectId`: Currently selected project ID
- `loading`: Loading state
- `error`: Error state

**Actions:**
```typescript
fetchProjects()          // Fetch all projects
createProject(data)      // Create new project
updateProject(id, data)  // Update project
deleteProject(id)        // Delete project
selectProject(id)        // Select project
startProject(id)         // Start project Ralph loop
pauseProject(id)         // Pause project
resumeProject(id)        // Resume project
stopProject(id)          // Stop project
```

**Selectors:**
```typescript
getSelectedProject()     // Get selected project
getProjectById(id)       // Get project by ID
getRunningProjects()     // Get all running projects
getPausedProjects()      // Get all paused projects
getCompletedProjects()   // Get all completed projects
```

**Usage:**
```typescript
import { useProjectStore } from './stores';

function ProjectList() {
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return <div>{projects.map(p => ...)}</div>;
}
```

### 2. Agent Store (`agentStore.ts`)
Manages agent state for all projects.

**State:**
- `agents`: Map of projectId -> Agent[]
- `selectedAgentId`: Currently selected agent ID
- `loading`: Loading state
- `error`: Error state

**Actions:**
```typescript
fetchAgents(projectId)        // Fetch agents for project
updateAgent(agentId, data)    // Update agent
addAgent(agent)               // Add new agent
selectAgent(id)               // Select agent
pauseAgent(agentId)           // Pause agent
resumeAgent(agentId)          // Resume agent
clearAgents(projectId)        // Clear agents for project
```

**Selectors:**
```typescript
getAgentsByProject(projectId) // Get agents for project
getSelectedAgent()            // Get selected agent
getAgentById(id)              // Get agent by ID
getRootAgents(projectId)      // Get root agents (no parent)
getChildAgents(parentId)      // Get child agents
getAgentTree(projectId)       // Get sorted agent tree
```

### 3. Graph Store (`graphStore.ts`)
Manages the React Flow graph visualization.

**State:**
- `nodes`: Array of graph nodes
- `edges`: Array of graph edges
- `viewport`: Current viewport position and zoom
- `selectedNodeId`: Selected node ID
- `layoutType`: Current layout algorithm
- `autoLayout`: Auto-layout enabled flag

**Actions:**
```typescript
setNodes(nodes)                     // Set all nodes
setEdges(edges)                     // Set all edges
updateNode(id, data)                // Update node data
addNode(node)                       // Add new node
removeNode(id)                      // Remove node
selectNode(id)                      // Select node
setViewport(viewport)               // Set viewport
updateNodePosition(id, position)    // Update node position
applyLayout(type)                   // Apply layout algorithm
setAutoLayout(enabled)              // Enable/disable auto-layout
resetGraph()                        // Reset graph
```

**Layout Algorithms:**
- `hierarchical`: Tree layout (parent-child)
- `radial`: Circular layout
- `force`: Force-directed layout

**Selectors:**
```typescript
getNodeById(id)           // Get node by ID
getEdgesForNode(nodeId)   // Get edges connected to node
getConnectedNodes(nodeId) // Get connected nodes
```

### 4. UI Store (`uiStore.ts`)
Manages UI state and preferences (persisted to localStorage).

**State:**
- `sidebarCollapsed`: Sidebar collapse state
- `inspectorOpen`: Inspector panel open state
- `inspectorWidth`: Inspector panel width
- `activeTab`: Current active tab
- `theme`: Theme (dark/light)
- `notifications`: Array of notifications

**Actions:**
```typescript
toggleSidebar()               // Toggle sidebar
setSidebarCollapsed(collapsed)// Set sidebar state
toggleInspector()             // Toggle inspector
setInspectorOpen(open)        // Set inspector state
setInspectorWidth(width)      // Set inspector width (clamped 300-800px)
setActiveTab(tab)             // Set active tab
setTheme(theme)               // Set theme
toggleTheme()                 // Toggle theme
addNotification(notification) // Add notification (auto-removes after duration)
removeNotification(id)        // Remove notification
clearNotifications()          // Clear all notifications
```

**Selectors:**
```typescript
getRecentNotifications(limit) // Get recent notifications
hasUnreadNotifications()      // Check for unread notifications
```

### 5. Config Store (`configStore.ts`)
Manages application configuration.

**State:**
- `config`: Config object
- `hasApiKey`: API key status
- `loading`: Loading state
- `error`: Error state

**Actions:**
```typescript
fetchConfig()                    // Fetch config
updateConfig(key, value)         // Update single config value
updateMultipleConfig(updates)    // Update multiple values
setApiKey(key)                   // Set API key
checkApiKey()                    // Check API key status
resetConfig()                    // Reset to defaults
```

**Selectors:**
```typescript
getConfigValue(key)  // Get config value
isConfigLoaded()     // Check if config is loaded
```

**Default Config:**
```typescript
{
  theme: 'dark',
  defaultModel: 'claude-opus-4-5-20251101',
  defaultTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
  defaultBudgetLimit: 10,
  defaultMaxIterations: 100,
  circuitBreakerThreshold: 5,
  completionThreshold: 3,
  eventThrottleMs: 16,
  maxRecentEvents: 100,
}
```

### 6. Event Store (`eventStore.ts`)
Handles real-time events from the main process.

**State:**
- `recentEvents`: Array of recent events (max 100)
- `isInitialized`: Initialization state

**Actions:**
```typescript
initialize()              // Initialize event listeners (returns cleanup function)
addEvent(event)           // Add event manually
clearEvents()             // Clear all events
```

**Selectors:**
```typescript
getEventsByType(type)         // Get events by type
getEventsForProject(projectId)// Get events for project
getEventsForAgent(agentId)    // Get events for agent
getRecentEvents(limit)        // Get recent events
```

**Event Types:**
```typescript
'project_created' | 'project_updated' | 'project_deleted' | 'project_status_changed'
'agent_created' | 'agent_updated' | 'agent_status_changed' | 'agent_output_chunk'
'agent_completed' | 'agent_failed' | 'cost_updated' | 'iteration_completed'
'circuit_breaker_triggered' | 'budget_limit_reached'
```

## Initialization

Initialize all stores in your App component:

```typescript
import { useEffect } from 'react';
import { initializeStores } from './stores';

function App() {
  useEffect(() => {
    const cleanup = initializeStores();
    return cleanup;
  }, []);

  return <div>...</div>;
}
```

Or use the hook:

```typescript
import { useStoreInitializer } from './stores';

function App() {
  const { isInitialized, error } = useStoreInitializer();

  if (error) return <ErrorScreen error={error} />;
  if (!isInitialized) return <LoadingScreen />;

  return <div>...</div>;
}
```

## Usage Patterns

### Basic Usage
```typescript
import { useProjectStore } from './stores';

function Component() {
  // Select entire state (re-renders on any change)
  const state = useProjectStore();

  // Select specific values (only re-renders when these change)
  const projects = useProjectStore((state) => state.projects);
  const createProject = useProjectStore((state) => state.createProject);
}
```

### Using Selectors
```typescript
import { useProjectStore } from './stores';

function Component() {
  // Use built-in selectors
  const selectedProject = useProjectStore((state) =>
    state.getSelectedProject()
  );

  // Custom selector
  const activeProjects = useProjectStore((state) =>
    state.projects.filter(p => p.status === 'running' || p.status === 'paused')
  );
}
```

### Async Actions
```typescript
import { useProjectStore } from './stores';

function Component() {
  const createProject = useProjectStore((state) => state.createProject);

  const handleCreate = async () => {
    try {
      const project = await createProject({
        name: 'My Project',
        prompt: 'Implement feature X',
      });
      console.log('Created:', project);
    } catch (error) {
      console.error('Failed:', error);
    }
  };
}
```

### Accessing Store Outside Components
```typescript
import { useProjectStore } from './stores';

// Get current state
const projects = useProjectStore.getState().projects;

// Call action
useProjectStore.getState().selectProject('project-id');

// Subscribe to changes
const unsubscribe = useProjectStore.subscribe((state) => {
  console.log('Projects:', state.projects);
});
```

## Event Flow

```
Main Process Event
       ↓
EventStore.initialize() listener
       ↓
Route to appropriate store
       ↓
Update store state
       ↓
React components re-render
```

Example:
1. Main process emits `agent_created` event
2. EventStore receives event and adds to `recentEvents`
3. EventStore calls `agentStore.addAgent(agent)`
4. EventStore calls `graphStore.addNode(node)`
5. Components using these stores re-render

## Best Practices

1. **Use shallow selectors**: Select only what you need to minimize re-renders
   ```typescript
   // Good
   const name = useProjectStore((state) => state.projects[0]?.name);

   // Bad (re-renders on any project change)
   const projects = useProjectStore((state) => state.projects);
   const name = projects[0]?.name;
   ```

2. **Use built-in selectors**: They're memoized and optimized
   ```typescript
   const project = useProjectStore((state) => state.getProjectById(id));
   ```

3. **Extract actions once**: Don't recreate them on every render
   ```typescript
   const createProject = useProjectStore((state) => state.createProject);
   ```

4. **Handle errors**: All async actions can throw
   ```typescript
   try {
     await createProject(data);
   } catch (error) {
     // Handle error
   }
   ```

5. **Clean up subscriptions**: If subscribing outside React
   ```typescript
   useEffect(() => {
     const unsubscribe = useProjectStore.subscribe(...);
     return unsubscribe;
   }, []);
   ```

## DevTools

All stores are connected to Redux DevTools. Open Redux DevTools in your browser to:
- Inspect current state
- Time-travel debug
- Track actions
- Export/import state

## Testing

```typescript
import { useProjectStore } from './stores';

describe('ProjectStore', () => {
  beforeEach(() => {
    // Reset store before each test
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

## Performance

- **Immer**: Allows mutable syntax while maintaining immutability
- **Selector optimization**: Use shallow selectors to minimize re-renders
- **Event throttling**: EventStore batches updates at ~60fps
- **Map data structure**: AgentStore uses Map for O(1) project lookups
- **Lazy loading**: Only fetch data when needed

## Type Safety

All stores are fully typed with TypeScript. Import types from the stores:

```typescript
import type { Project, Agent, Node, Config } from './stores';
```
