# Agent Inspector Components

The Agent Inspector is a comprehensive detail panel that provides deep visibility into individual agents within the Constellation application. It appears as a slide-in panel from the right side of the screen when an agent is selected in the graph view.

## Overview

The inspector consists of:
- **Main Panel**: `AgentInspector.tsx` - The container component
- **Header**: `InspectorHeader.tsx` - Agent info and quick actions
- **Tab Navigation**: `InspectorTabs.tsx` - Tab switching interface
- **Tab Views**: Five specialized tabs for different aspects of the agent

## Components

### AgentInspector (Main Component)

The root component that orchestrates all inspector functionality.

```typescript
import { AgentInspector } from '@/renderer/components/inspector';

<AgentInspector
  agentId={selectedAgentId}
  onClose={() => setSelectedAgentId(null)}
/>
```

**Features:**
- Resizable width (400px - 1200px) via drag handle
- Smooth slide-in animation
- Auto-updates via event subscriptions
- Loading and error states
- Unread output indicator

### InspectorHeader

Displays agent identity, status, and control buttons.

**Features:**
- Agent name with status badge
- Animated pulse for working agents
- Parent agent link (for sub-agents)
- Quick actions: Pause, Resume, Stop, Restart
- Status-dependent button visibility

### InspectorTabs

Tab navigation with 5 tabs:
1. **Overview** - Metrics and activity timeline
2. **Live Output** - Real-time terminal stream
3. **History** - Conversation messages
4. **Outputs** - File tree and preview
5. **Config** - Agent configuration

**Features:**
- Active tab highlighting
- Unread indicator on Live Output tab
- Smooth transitions

## Tab Components

### OverviewTab

Dashboard-style metrics display with glass morphism cards.

**Metrics Shown:**
- Status with animated icons
- Iteration count
- Total tokens (formatted: K/M)
- Total cost
- Time running (auto-updating)
- Current task

**Additional Sections:**
- Sub-agents list (clickable to inspect)
- Activity timeline

**Styling:**
- Glass card effect with backdrop blur
- Gradient backgrounds per metric type
- Hover animations

### LiveStreamTab

Terminal-like real-time output stream.

**Features:**
- Auto-scrolling with manual override detection
- Timestamp display on hover
- Color-coded output:
  - Green: Normal output
  - Yellow: Tool calls
  - Red: Errors
- Copy all output button
- Clear button
- Streaming status indicator
- Line count display

**Controls:**
- Auto-scroll toggle
- Copy to clipboard
- Clear output

### HistoryTab

Complete conversation history with message details.

**Features:**
- Message list with role icons
- Collapsible long messages (>500 chars)
- Expandable tool call details
- Search within history
- Token and cost per message
- Metadata footer

**Message Types:**
- User (blue)
- Assistant (purple)
- Tool (yellow)

### OutputsTab

File tree viewer with diff support.

**Features:**
- Hierarchical file tree
- File type icons
- File preview with line numbers
- Diff view for modified files
- Syntax highlighting preparation
- Modified file indicators

**Layout:**
- Left: File tree (264px)
- Right: Preview pane with metadata

### ConfigTab

Read-only configuration display.

**Sections:**
- Agent Identity (ID, name, project, parent, depth)
- Model Configuration (model, max_tokens, temperature)
- Available Tools (expandable JSON)
- Full Configuration (raw JSON)
- Timestamps (created, updated)
- Statistics (tokens, cost, iterations)
- Current Task

**Styling:**
- Categorized glass cards
- Color-coded by section type
- Monospace font for technical values

## Hooks

### useAgent

Fetches and subscribes to agent data.

```typescript
const { agent, history, loading, error, refresh } = useAgent(agentId);
```

**Returns:**
- `agent`: AgentWithConfig (with parsed config)
- `history`: AgentHistoryWithParsed[] (with parsed JSON fields)
- `loading`: boolean
- `error`: string | null
- `refresh`: () => Promise<void>

**Subscriptions:**
- `agent_status_changed`: Updates agent status in real-time
- `agent_history_added`: Appends new history entries

### useAgentStream

Live output streaming hook.

```typescript
const { chunks, isStreaming, clear, addChunk } = useAgentStream(agentId);
```

**Returns:**
- `chunks`: OutputChunk[] (id, timestamp, chunk, type)
- `isStreaming`: boolean
- `clear`: () => void
- `addChunk`: (chunk: OutputChunk) => void

**Subscriptions:**
- `agent_output_chunk`: Normal output
- `agent_tool_call`: Tool invocations
- `agent_error`: Error messages
- `agent_iteration_start/end`: Streaming status

## Styling

The inspector uses:
- **Tailwind CSS** for utility classes
- **Glass morphism** for card effects
- **Gradient backgrounds** for visual hierarchy
- **Custom scrollbars** for better UX
- **Animations**: slide-in, pulse, spin

### Color Scheme

**Status Colors:**
- Working: Green (`bg-green-500`)
- Idle: Blue (`bg-blue-500`)
- Paused: Yellow (`bg-yellow-500`)
- Completed: Purple (`bg-purple-500`)
- Failed: Red (`bg-red-500`)

**Tab Colors:**
- User messages: Blue gradient
- Assistant messages: Purple gradient
- Tool messages: Yellow gradient

## Integration

To integrate the inspector into your app:

```typescript
import { useState } from 'react';
import { AgentInspector } from '@/renderer/components/inspector';

function App() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  return (
    <>
      {/* Your main UI */}
      <GraphView onAgentClick={(id) => setSelectedAgentId(id)} />

      {/* Inspector panel */}
      <AgentInspector
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    </>
  );
}
```

## Required IPC Methods

The inspector expects these methods on `window.api`:

**Agent Operations:**
- `window.api.agent.get(id)`: Fetch agent data
- `window.api.agent.getHistory(id, options)`: Fetch conversation history
- `window.api.agent.getChildren(id)`: Fetch sub-agents
- `window.api.agent.getOutputs(id)`: Fetch file outputs
- `window.api.agent.pause(id)`: Pause agent
- `window.api.agent.resume(id)`: Resume agent
- `window.api.agent.stop(id)`: Stop agent
- `window.api.agent.restart(id)`: Restart agent
- `window.api.agent.select(id)`: Switch to another agent

**Events:**
- `window.api.onEvent(type, callback)`: Subscribe to events
  - `agent_status_changed`
  - `agent_history_added`
  - `agent_output_chunk`
  - `agent_tool_call`
  - `agent_error`
  - `agent_iteration_start`
  - `agent_iteration_end`

## Performance Considerations

- **Lazy rendering**: Only active tab content is rendered
- **Virtual scrolling**: Consider for large history/output lists
- **Throttled events**: Output chunks should be throttled at main process level
- **Memoization**: Tab components should use React.memo if needed
- **Resize debouncing**: Panel resize uses direct state updates

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support needed (TODO)
- Screen reader friendly status updates
- High contrast mode support via Tailwind

## Future Enhancements

- [ ] Keyboard shortcuts (Esc to close, Ctrl+Tab for tabs)
- [ ] Export conversation history
- [ ] Search across all tabs
- [ ] Pin inspector open
- [ ] Multi-agent comparison view
- [ ] Performance metrics charts
- [ ] Tool call success/failure stats
