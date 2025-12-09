# Agent Graph Visualization

Stunning React Flow-based visualization for the Constellation agent swarm.

## Overview

The agent graph provides a real-time, interactive visualization of AI agents working in parallel. It features:

- **Beautiful UI**: Glass-morphism design with animated glow effects
- **Real-time Updates**: Agents update their status and appearance as they work
- **Interactive**: Click agents to inspect, drag to reposition, zoom and pan
- **Hierarchical Layout**: Automatically arranges agents by depth
- **Status Indicators**: Color-coded by agent status (working, idle, completed, failed, paused)
- **Tool Visualization**: Temporary nodes show tool execution
- **Minimap**: Overview of the entire graph
- **Custom Controls**: Layout switching, filtering, and view options

## Components

### AgentGraph

Main container component that orchestrates the entire visualization.

```tsx
import { AgentGraph } from '@/renderer/components/graph';

<AgentGraph
  projectId="project-123"
  onNodeClick={(nodeId) => console.log('Selected:', nodeId)}
/>
```

### AgentNode

Custom node representing an AI agent. Features:

- Gradient border that glows when working
- Status indicator dot with pulse animation
- Current task display
- Token count and cost metrics
- Depth badge
- Agent icon (crown for root, robot for sub-agents)

### ToolNode

Temporary node that appears when an agent calls a tool. Auto-removes after completion.

Features:
- Animated entrance/exit
- Tool-specific icons
- Execution status
- Progress animation

### ConnectionEdge

Custom animated edge connecting agents. Types:

- `parent_child`: Solid blue gradient (hierarchy)
- `communication`: Dashed purple (agent-to-agent)
- `data_flow`: Animated cyan (data transfer)

### GraphControls

Custom control panel with:

- Zoom in/out
- Fit to view
- Layout switching (hierarchical, radial, force)
- Minimap toggle
- Status filtering

### AgentMiniMap

Styled minimap showing:

- Color-coded agent nodes
- Current viewport
- Dark theme background

## Hook: useAgentGraph

Manages graph state and layout.

```tsx
const {
  nodes,           // React Flow nodes
  edges,           // React Flow edges
  agents,          // Raw agent data
  selectedAgent,   // Currently selected agent
  layout,          // Current layout type
  onNodesChange,   // Handle node updates
  onEdgesChange,   // Handle edge updates
  changeLayout,    // Switch layout type
  selectNode,      // Select an agent
} = useAgentGraph(projectId);
```

## Styling

Custom React Flow styles are in `/src/renderer/styles/globals.css`:

- Dark theme colors
- Custom node/edge styles
- Hover and selection states
- Animations

## Layout Types

### Hierarchical (default)
Arranges agents in layers by depth. Root at top, children below.

### Radial
Places root at center with children in concentric circles.

### Force (future)
Physics-based layout with force-directed positioning.

## Status Colors

- **Idle**: Gray (#6B7280)
- **Working**: Blue (#3B82F6) with animated glow
- **Paused**: Yellow (#EAB308)
- **Completed**: Green (#22C55E)
- **Failed**: Red (#EF4444)

## Real-time Updates

The graph subscribes to agent events via IPC (when implemented):

```typescript
// In useAgentGraph hook
useEffect(() => {
  const unsubscribe = window.api.events.subscribe('agent_updated', (event) => {
    // Update agent state
  });

  return unsubscribe;
}, [projectId]);
```

## Performance

Optimizations for large graphs:

- Virtualization via React Flow
- Throttled updates (60fps)
- Memoized calculations
- Conditional rendering of tool nodes
- Status filtering to reduce visible nodes

## Accessibility

- Keyboard navigation
- ARIA labels on controls
- High contrast colors
- Focus indicators

## Example Usage

```tsx
import { AgentGraph } from '@/renderer/components/graph';

function ProjectView({ projectId }: { projectId: string }) {
  const handleNodeClick = (nodeId: string) => {
    // Open inspector panel
    console.log('Selected agent:', nodeId);
  };

  return (
    <div className="h-screen w-full">
      <AgentGraph
        projectId={projectId}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
```

## Dependencies

- `@xyflow/react` (React Flow v12): Graph visualization
- `framer-motion`: Animations
- `tailwindcss`: Styling

## Future Enhancements

- [ ] Force-directed layout with physics
- [ ] Agent collaboration edges (communication)
- [ ] Tool result preview on hover
- [ ] Export graph as image
- [ ] Replay mode (step through history)
- [ ] Performance metrics overlay
- [ ] Agent spawn animation
- [ ] Edge labels for data transfer
- [ ] Clustering for large graphs
- [ ] 3D view option
