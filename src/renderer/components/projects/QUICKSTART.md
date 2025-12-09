# Quick Start Guide - Project Management UI

This guide helps you quickly integrate the project management UI components into Constellation.

## Installation

All components are already created in `/src/renderer/components/projects/`. No additional dependencies are needed beyond the existing stack (React, TypeScript, Tailwind CSS).

## Basic Integration

### Step 1: Import Components

```typescript
import {
  ProjectList,
  ProjectDetail,
  NewProjectDialog,
} from './components/projects';
import { useProjects } from './hooks';
```

### Step 2: Create Main Layout

```tsx
import React, { useState } from 'react';
import { ProjectList, ProjectDetail, NewProjectDialog } from './components/projects';
import { useProjects } from './hooks';

export const ProjectsView: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { create } = useProjects();

  const handleCreateProject = async (input: CreateProjectInput) => {
    const newProject = await create(input);
    setSelectedProjectId(newProject.id);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar with project list */}
      <ProjectList
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onNewProject={() => setShowNewDialog(true)}
      />

      {/* Main content area */}
      <div className="flex-1">
        {selectedProjectId ? (
          <ProjectDetail projectId={selectedProjectId} />
        ) : (
          <EmptyState onNewProject={() => setShowNewDialog(true)} />
        )}
      </div>

      {/* New project dialog */}
      <NewProjectDialog
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
};

// Empty state component
const EmptyState: React.FC<{ onNewProject: () => void }> = ({ onNewProject }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <svg
      className="w-24 h-24 text-gray-600 mb-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <h2 className="text-white text-2xl font-bold mb-2">No Project Selected</h2>
    <p className="text-gray-400 mb-6 max-w-md">
      Select a project from the sidebar or create a new one to get started with AI agent orchestration.
    </p>
    <button
      onClick={onNewProject}
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      Create New Project
    </button>
  </div>
);
```

### Step 3: Implement IPC Bridge (Preload Script)

The components expect `window.api` to be available. Implement this in your preload script:

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  project: {
    create: (input: CreateProjectInput) =>
      ipcRenderer.invoke('project:create', input),
    get: (id: string) =>
      ipcRenderer.invoke('project:get', id),
    list: () =>
      ipcRenderer.invoke('project:list'),
    update: (id: string, input: UpdateProjectInput) =>
      ipcRenderer.invoke('project:update', id, input),
    delete: (id: string) =>
      ipcRenderer.invoke('project:delete', id),
    start: (id: string) =>
      ipcRenderer.invoke('project:start', id),
    pause: (id: string) =>
      ipcRenderer.invoke('project:pause', id),
    stop: (id: string) =>
      ipcRenderer.invoke('project:stop', id),
  },
  agent: {
    get: (id: string) =>
      ipcRenderer.invoke('agent:get', id),
    listByProject: (projectId: string) =>
      ipcRenderer.invoke('agent:listByProject', projectId),
    pause: (id: string) =>
      ipcRenderer.invoke('agent:pause', id),
    resume: (id: string) =>
      ipcRenderer.invoke('agent:resume', id),
  },
  onEvent: (eventType: string, callback: (event: any) => void) => {
    const listener = (_: any, event: any) => {
      if (event.type === eventType) {
        callback(event);
      }
    };
    ipcRenderer.on('event', listener);
    return () => ipcRenderer.removeListener('event', listener);
  },
});
```

### Step 4: Implement IPC Handlers (Main Process)

```typescript
// src/main/ipc/projectHandlers.ts
import { ipcMain } from 'electron';
import { ProjectService } from '../services/ProjectService';

export function registerProjectHandlers(projectService: ProjectService) {
  ipcMain.handle('project:create', async (_, input) => {
    return await projectService.create(input);
  });

  ipcMain.handle('project:get', async (_, id) => {
    return await projectService.get(id);
  });

  ipcMain.handle('project:list', async () => {
    return await projectService.list();
  });

  ipcMain.handle('project:update', async (_, id, input) => {
    return await projectService.update(id, input);
  });

  ipcMain.handle('project:delete', async (_, id) => {
    return await projectService.delete(id);
  });

  ipcMain.handle('project:start', async (_, id) => {
    return await projectService.start(id);
  });

  ipcMain.handle('project:pause', async (_, id) => {
    return await projectService.pause(id);
  });

  ipcMain.handle('project:stop', async (_, id) => {
    return await projectService.stop(id);
  });
}
```

### Step 5: Setup Event Broadcasting

```typescript
// src/main/services/EventBus.ts
import { BrowserWindow } from 'electron';

export class EventBus {
  constructor(private mainWindow: BrowserWindow) {}

  emit(event: { type: string; projectId?: string; agentId?: string; data?: any }) {
    this.mainWindow.webContents.send('event', event);
  }
}

// Usage in ProjectService
projectService.on('created', (project) => {
  eventBus.emit({
    type: 'project_created',
    projectId: project.id,
    data: { project },
  });
});

projectService.on('updated', (projectId, changes) => {
  eventBus.emit({
    type: 'project_updated',
    projectId,
    data: { projectId, changes },
  });
});
```

## Component Usage Examples

### Using ProjectList Standalone

```tsx
import { ProjectList } from './components/projects';

function Sidebar() {
  return (
    <ProjectList
      selectedProjectId={currentId}
      onSelectProject={setCurrentId}
      onNewProject={() => alert('Create new project')}
    />
  );
}
```

### Using ProjectDetail Standalone

```tsx
import { ProjectDetail } from './components/projects';

function MainView({ projectId }: { projectId: string }) {
  return <ProjectDetail projectId={projectId} />;
}
```

### Using Individual Settings

```tsx
import { ProjectSettings } from './components/projects';
import { useProject } from './hooks';

function SettingsPanel({ projectId }: { projectId: string }) {
  const { project, update } = useProject(projectId);

  if (!project) return null;

  return (
    <ProjectSettings
      project={project}
      onSave={async (settings) => {
        await update({ settings });
      }}
    />
  );
}
```

### Using Prompt Editor Standalone

```tsx
import { PromptEditor } from './components/projects';

function PromptView() {
  const [prompt, setPrompt] = useState('');

  return (
    <PromptEditor
      value={prompt}
      onChange={setPrompt}
      autoSave={true}
      autoSaveDelay={2000}
    />
  );
}
```

## Styling Requirements

The components use Tailwind CSS. Ensure your `tailwind.config.js` includes:

```javascript
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1f2937', // Custom gray for certain backgrounds
          950: '#0f1117', // Custom darker gray
        },
      },
    },
  },
  plugins: [],
};
```

## Common Customizations

### Change Color Scheme

Search and replace color classes in components:
- Primary: `blue-600` → your color
- Background: `gray-900` → your color
- Text: `gray-400` → your color

### Adjust Sidebar Width

In `ProjectList.tsx`, change:
```tsx
<div className="w-80"> {/* Change this value */}
```

### Customize Status Colors

In `ProjectCard.tsx` and `ProjectHeader.tsx`, modify the `getStatusColor` function:
```typescript
const getStatusColor = (status: ProjectStatus): string => {
  // Customize colors here
};
```

### Change Auto-save Delay

```tsx
<PromptEditor
  value={prompt}
  onChange={setPrompt}
  autoSaveDelay={5000} // 5 seconds instead of 2
/>
```

## Testing

### Mock window.api for Tests

```typescript
// setupTests.ts
global.window.api = {
  project: {
    create: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    start: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
  },
  agent: {
    get: jest.fn(),
    listByProject: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  },
  onEvent: jest.fn(() => jest.fn()),
};
```

### Example Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

test('renders project card', () => {
  const project = {
    id: '1',
    name: 'Test Project',
    status: ProjectStatus.CREATED,
    cost_total: 0.5,
    // ... other fields
  };

  render(
    <ProjectCard
      project={project}
      isSelected={false}
      onSelect={jest.fn()}
      onStart={jest.fn()}
      onStop={jest.fn()}
      onPause={jest.fn()}
      onDelete={jest.fn()}
    />
  );

  expect(screen.getByText('Test Project')).toBeInTheDocument();
});
```

## Troubleshooting

### Components not rendering
- Check that `window.api` is properly exposed in preload script
- Verify IPC handlers are registered in main process
- Check console for TypeScript errors

### Events not updating
- Ensure EventBus is emitting events correctly
- Check that event types match (e.g., 'project_updated')
- Verify event listeners are being cleaned up

### Styling issues
- Ensure Tailwind is processing the component files
- Check that custom colors are in tailwind.config.js
- Verify no CSS conflicts with other styles

### Type errors
- Import types from `/src/renderer/types`
- Ensure database types are properly exported
- Check that window.api types match preload implementation

## Next Steps

1. Implement the AgentGraph component for visualization
2. Implement the InspectorPanel component for agent details
3. Add keyboard shortcuts for power users
4. Implement project templates
5. Add export/import functionality
6. Enhance diff view with syntax highlighting
7. Add real-time collaboration features

## Support

For issues or questions:
1. Check the README.md in this directory
2. Review type definitions in `/src/renderer/types`
3. Check CLAUDE.md for project architecture
4. Review the SPARC documentation in `/docs/plan/prd/`
