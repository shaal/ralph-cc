# Agent Inspector - Quick Start Guide

## 5-Minute Integration

### Step 1: Import the Component

```typescript
import { AgentInspector } from '@/renderer/components/inspector';
```

### Step 2: Add State Management

```typescript
const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
```

### Step 3: Render the Inspector

```typescript
<AgentInspector
  agentId={selectedAgentId}
  onClose={() => setSelectedAgentId(null)}
/>
```

### Complete Example

```typescript
import React, { useState } from 'react';
import { AgentInspector } from '@/renderer/components/inspector';

function MyApp() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  return (
    <div className="h-screen">
      {/* Your app content */}
      <button onClick={() => setSelectedAgentId('agent-123')}>
        Inspect Agent
      </button>

      {/* Inspector panel */}
      <AgentInspector
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    </div>
  );
}
```

## Required Dependencies

### TypeScript Types
```typescript
import type {
  Agent,
  AgentWithConfig,
  AgentHistory,
  AgentHistoryWithParsed,
  Output
} from '@/main/database/types';
```

### Tailwind CSS
Make sure these utilities are available:
- Glass effect utilities
- Color palettes (blue, purple, green, yellow, red, gray)
- Animation utilities (spin, pulse)

### IPC Bridge
Ensure `window.api` is properly exposed in your preload script:

```typescript
// preload.ts
contextBridge.exposeInMainWorld('api', {
  agent: {
    get: (id: string) => ipcRenderer.invoke('agent:get', id),
    getHistory: (id: string, options) => ipcRenderer.invoke('agent:history', id, options),
    getChildren: (id: string) => ipcRenderer.invoke('agent:children', id),
    getOutputs: (id: string) => ipcRenderer.invoke('agent:outputs', id),
    pause: (id: string) => ipcRenderer.invoke('agent:pause', id),
    resume: (id: string) => ipcRenderer.invoke('agent:resume', id),
    stop: (id: string) => ipcRenderer.invoke('agent:stop', id),
    restart: (id: string) => ipcRenderer.invoke('agent:restart', id),
    select: (id: string) => ipcRenderer.invoke('agent:select', id),
  },
  onEvent: (type: string, callback: Function) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(type, listener);
    return () => ipcRenderer.removeListener(type, listener);
  }
});
```

## Main Process Handlers

Implement these IPC handlers in your main process:

```typescript
// main/ipc/agent-handlers.ts
ipcMain.handle('agent:get', async (_, id: string) => {
  return agentRepository.findById(id);
});

ipcMain.handle('agent:history', async (_, id: string, options) => {
  return agentRepository.findHistory(id, options);
});

ipcMain.handle('agent:children', async (_, id: string) => {
  return agentRepository.findChildren(id);
});

ipcMain.handle('agent:outputs', async (_, id: string) => {
  return outputRepository.findByAgent(id);
});

ipcMain.handle('agent:pause', async (_, id: string) => {
  return agentOrchestrator.pauseAgent(id);
});

ipcMain.handle('agent:resume', async (_, id: string) => {
  return agentOrchestrator.resumeAgent(id);
});

ipcMain.handle('agent:stop', async (_, id: string) => {
  return agentOrchestrator.stopAgent(id);
});

ipcMain.handle('agent:restart', async (_, id: string) => {
  return agentOrchestrator.restartAgent(id);
});

ipcMain.handle('agent:select', async (_, id: string) => {
  // Trigger UI state change via event
  eventBus.emit({ type: 'agent_selected', data: { agentId: id } });
});
```

## Event Emitters

Emit these events from your main process:

```typescript
// When agent status changes
eventBus.emit({
  type: 'agent_status_changed',
  agentId: agent.id,
  data: { status: newStatus }
});

// When new message added
eventBus.emit({
  type: 'agent_history_added',
  agentId: agent.id,
  data: historyEntry
});

// When output chunk received
eventBus.emit({
  type: 'agent_output_chunk',
  agentId: agent.id,
  data: { chunk: outputText }
});

// When tool is called
eventBus.emit({
  type: 'agent_tool_call',
  agentId: agent.id,
  data: { tool_name: 'bash', input: { command: 'ls' } }
});

// When error occurs
eventBus.emit({
  type: 'agent_error',
  agentId: agent.id,
  data: { message: errorMessage }
});

// Iteration lifecycle
eventBus.emit({ type: 'agent_iteration_start', agentId: agent.id });
eventBus.emit({ type: 'agent_iteration_end', agentId: agent.id });
```

## Styling Requirements

Add these custom styles to your global CSS or Tailwind config:

```css
/* Glass card effect */
.glass-card {
  backdrop-filter: blur(10px);
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.8);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.9);
}

/* Slide-in animation */
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

## Common Issues

### Inspector doesn't open
- Check that `agentId` is not null
- Verify the agent exists in database
- Check browser console for errors

### No live output
- Ensure `agent_output_chunk` events are being emitted
- Check event subscription is working
- Verify agentId matches

### Events not updating
- Check IPC event listeners are registered
- Verify eventBus is emitting to renderer
- Check for memory leaks in event handlers

### Styles look broken
- Ensure Tailwind CSS is properly configured
- Check dark mode is enabled
- Verify custom CSS is loaded

## Next Steps

1. **Customize Styling**: Adjust colors, fonts, and spacing to match your app
2. **Add Keyboard Shortcuts**: Implement Esc to close, Ctrl+Tab for tabs
3. **Extend Functionality**: Add export, search, or comparison features
4. **Performance Tuning**: Add virtual scrolling for large datasets
5. **Accessibility**: Improve keyboard navigation and screen reader support

## Support

- See `/EXAMPLE_USAGE.tsx` for more examples
- See `/README.md` for detailed documentation
- See `/ARCHITECTURE.md` for system design

## Checklist

Before going live, verify:
- [ ] IPC handlers implemented
- [ ] Event emitters configured
- [ ] Tailwind CSS configured
- [ ] Custom styles added
- [ ] TypeScript types available
- [ ] Agent data structure matches
- [ ] Event payload structures match
- [ ] Error handling in place
- [ ] Loading states work
- [ ] Close button works
- [ ] All tabs render correctly
- [ ] Real-time updates work
- [ ] Resize functionality works
