# Agent Inspector Architecture

## Component Hierarchy

```
AgentInspector (Main Container)
├── InspectorHeader
│   ├── Agent Icon + Status Badge
│   ├── Agent Name + Parent Link
│   ├── Quick Actions (Pause/Resume/Stop/Restart)
│   └── Close Button
│
├── InspectorTabs
│   ├── Overview Tab Button
│   ├── Live Output Tab Button (with unread indicator)
│   ├── History Tab Button
│   ├── Outputs Tab Button
│   └── Config Tab Button
│
└── Tab Content Area
    ├── OverviewTab
    │   ├── Metrics Grid
    │   │   ├── Status Card
    │   │   ├── Iterations Card
    │   │   ├── Tokens Card
    │   │   ├── Cost Card
    │   │   ├── Time Running Card
    │   │   └── Current Task Card
    │   ├── Sub-agents Section
    │   └── Activity Timeline
    │
    ├── LiveStreamTab
    │   ├── Controls Bar
    │   │   ├── Streaming Status
    │   │   ├── Auto-scroll Toggle
    │   │   ├── Copy Button
    │   │   └── Clear Button
    │   ├── Terminal Output Area
    │   └── Status Bar
    │
    ├── HistoryTab
    │   ├── Search Bar
    │   └── Message List
    │       ├── User Messages (blue)
    │       ├── Assistant Messages (purple)
    │       └── Tool Messages (yellow)
    │           ├── Message Content
    │           ├── Tool Calls (expandable)
    │           └── Metadata Footer
    │
    ├── OutputsTab
    │   ├── File Tree Sidebar
    │   │   ├── Directory Nodes (expandable)
    │   │   └── File Nodes (clickable)
    │   └── Preview Pane
    │       ├── Preview Header
    │       ├── Content View / Diff View
    │       └── Metadata Footer
    │
    └── ConfigTab
        ├── Agent Identity Section
        ├── Model Configuration Section
        ├── Available Tools Section
        ├── Full Configuration Section
        ├── Timestamps Section
        ├── Statistics Section
        └── Current Task Section
```

## Data Flow

```
User Interaction
    ↓
AgentInspector
    ↓
useAgent Hook ──────┐
    │               │
    ↓               ↓
IPC Call        Event Subscription
    ↓               ↓
Main Process    EventBus
    ↓               ↓
Database        Real-time Events
    ↓               ↓
Return Data     State Updates
    ↓               ↓
Component Re-renders
```

## Hook Dependencies

```
AgentInspector
    ├── useAgent(agentId)
    │   ├── Fetches agent data
    │   ├── Fetches history
    │   ├── Subscribes to agent_status_changed
    │   └── Subscribes to agent_history_added
    │
    └── useAgentStream(agentId)  [used by LiveStreamTab]
        ├── Subscribes to agent_output_chunk
        ├── Subscribes to agent_tool_call
        ├── Subscribes to agent_error
        ├── Subscribes to agent_iteration_start
        └── Subscribes to agent_iteration_end
```

## State Management

### Component State
- **AgentInspector**
  - `activeTab`: Current selected tab
  - `width`: Panel width (resizable)
  - `isResizing`: Resize drag state
  - `hasNewOutput`: Unread output indicator

- **OverviewTab**
  - `subAgents`: List of child agents
  - `timeRunning`: Auto-updating time display

- **LiveStreamTab**
  - `autoScroll`: Auto-scroll enabled/disabled
  - Scroll position tracking

- **HistoryTab**
  - `expandedMessages`: Set of expanded message IDs
  - `searchQuery`: Search filter text

- **OutputsTab**
  - `outputs`: List of file outputs
  - `selectedOutput`: Currently previewed file
  - `showDiff`: Diff view toggle
  - `loading`: Fetch state

### Hook State
- **useAgent**
  - `agent`: Current agent data
  - `history`: Conversation history
  - `loading`: Fetch state
  - `error`: Error message

- **useAgentStream**
  - `chunks`: Array of output chunks
  - `isStreaming`: Streaming status

## Event Subscriptions

| Event | Subscribers | Purpose |
|-------|-------------|---------|
| `agent_status_changed` | useAgent | Update agent status in real-time |
| `agent_history_added` | useAgent | Append new messages to history |
| `agent_output_chunk` | useAgentStream, AgentInspector | Stream output, show unread indicator |
| `agent_tool_call` | useAgentStream | Display tool invocations |
| `agent_error` | useAgentStream | Show error messages |
| `agent_iteration_start` | useAgentStream | Set streaming status |
| `agent_iteration_end` | useAgentStream | Clear streaming status |

## IPC Methods

| Method | Used By | Purpose |
|--------|---------|---------|
| `agent.get(id)` | useAgent | Fetch agent data |
| `agent.getHistory(id, options)` | useAgent | Fetch conversation history |
| `agent.getChildren(id)` | OverviewTab | Fetch sub-agents |
| `agent.getOutputs(id)` | OutputsTab | Fetch file outputs |
| `agent.pause(id)` | InspectorHeader | Pause agent |
| `agent.resume(id)` | InspectorHeader | Resume agent |
| `agent.stop(id)` | InspectorHeader | Stop agent |
| `agent.restart(id)` | InspectorHeader | Restart agent |
| `agent.select(id)` | InspectorHeader, OverviewTab | Switch to another agent |
| `onEvent(type, callback)` | useAgent, useAgentStream | Subscribe to events |

## File Structure

```
src/renderer/
├── components/
│   └── inspector/
│       ├── AgentInspector.tsx       (6.0K) - Main container
│       ├── InspectorHeader.tsx      (5.7K) - Header with controls
│       ├── InspectorTabs.tsx        (3.7K) - Tab navigation
│       ├── OverviewTab.tsx          (13K)  - Metrics dashboard
│       ├── LiveStreamTab.tsx        (6.8K) - Terminal output
│       ├── HistoryTab.tsx           (11K)  - Message history
│       ├── OutputsTab.tsx           (12K)  - File tree & preview
│       ├── ConfigTab.tsx            (12K)  - Configuration display
│       ├── index.ts                 (536B) - Component exports
│       ├── README.md                (7.2K) - Documentation
│       ├── ARCHITECTURE.md          (this file)
│       └── EXAMPLE_USAGE.tsx        (7.0K) - Usage examples
│
└── hooks/
    ├── useAgent.ts                  (3.2K) - Agent data hook
    ├── useAgentStream.ts            (3.1K) - Live output hook
    └── index.ts                     - Hook exports
```

## Performance Considerations

### Optimizations Implemented
1. **Lazy Tab Rendering**: Only active tab content is rendered
2. **Event Throttling**: Should be done at main process level
3. **Conditional Subscriptions**: Hooks only subscribe when agentId is set
4. **Auto-scroll Detection**: Prevents forced scrolling during manual browsing

### Future Optimizations Needed
1. **Virtual Scrolling**: For large history/output lists
2. **Memoization**: React.memo for expensive components
3. **Debounced Resize**: Throttle resize state updates
4. **Pagination**: Load history/outputs in chunks
5. **Code Splitting**: Lazy load tab components

## Styling System

### Theme
- **Base**: Dark mode (gray-900 background)
- **Glass Cards**: backdrop-blur-sm with semi-transparent backgrounds
- **Gradients**: Category-specific color gradients
- **Animations**: slide-in, pulse, spin

### Responsive Breakpoints
- Min width: 400px
- Max width: 1200px
- Default width: 600px

### Color Palette
```css
/* Status Colors */
--working: #10b981 (green-500)
--idle: #3b82f6 (blue-500)
--paused: #f59e0b (yellow-500)
--completed: #a855f7 (purple-500)
--failed: #ef4444 (red-500)

/* Tab Categories */
--user: blue gradient
--assistant: purple gradient
--tool: yellow gradient

/* Metrics */
--tokens: blue/purple gradient
--cost: green/emerald gradient
--general: gray gradient
```

## Testing Strategy

### Unit Tests
- [ ] Hook return values
- [ ] Component rendering
- [ ] Event handlers
- [ ] State updates

### Integration Tests
- [ ] IPC method calls
- [ ] Event subscriptions
- [ ] Tab switching
- [ ] Resize functionality

### E2E Tests
- [ ] Open/close inspector
- [ ] Navigate tabs
- [ ] Interact with controls
- [ ] Live output streaming
- [ ] File preview

## Accessibility

### Implemented
- Semantic HTML structure
- ARIA-compliant status badges
- Color contrast ratios
- Hover states

### TODO
- [ ] Keyboard navigation
- [ ] Screen reader announcements
- [ ] Focus management
- [ ] High contrast mode
- [ ] Reduced motion support

## Browser Compatibility

Requires:
- CSS Grid
- CSS Flexbox
- CSS Backdrop Filter
- ES6+ JavaScript
- WebSocket (for events)

Tested on:
- Electron 30.x (Chromium-based)
