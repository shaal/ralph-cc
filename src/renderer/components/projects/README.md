# Project Management UI Components

This directory contains all the UI components for managing projects in Constellation.

## Components Overview

### Core Components

#### `ProjectList.tsx`
Sidebar component that displays all projects with search and filtering capabilities.

**Features:**
- Real-time project list with auto-refresh
- Search functionality with live filtering
- Empty state for first-time users
- Quick action buttons (start, pause, stop, delete)
- Project count and status summary
- Sorted by last updated (most recent first)

**Usage:**
```tsx
import { ProjectList } from './components/projects';

<ProjectList
  selectedProjectId={currentProjectId}
  onSelectProject={(id) => setCurrentProjectId(id)}
  onNewProject={() => setShowNewDialog(true)}
/>
```

#### `ProjectCard.tsx`
Individual project card component used within ProjectList.

**Features:**
- Compact display with project name, description, and status
- Real-time status indicator with animation for running projects
- Metrics display (cost, agent count, iterations, duration)
- Hover state reveals quick action buttons
- Color-coded status badges
- Confirmation dialog for destructive actions

**Props:**
```typescript
interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onDelete: () => void;
}
```

#### `ProjectDetail.tsx`
Main project view with tabbed interface for comprehensive project management.

**Features:**
- Four-tab interface: Graph, Inspector, Outputs, Settings
- Integrated project header with controls
- Error handling and loading states
- Tab-specific content rendering
- Floating action button for quick actions

**Tabs:**
- **Graph**: Agent graph visualization (placeholder for AgentGraph component)
- **Inspector**: Agent details and conversation history (placeholder for InspectorPanel)
- **Outputs**: File tree and content viewer
- **Settings**: Project configuration and prompt editor

#### `ProjectHeader.tsx`
Header bar component with project controls and metrics.

**Features:**
- Editable project name with inline editing
- Animated status badge (pulsing for running projects)
- Real-time metrics display:
  - Cost with progress bar (red when over budget)
  - Duration with live updates
  - Iteration count
- Control buttons (Start, Pause, Stop)
- More menu with additional actions (Delete)
- Automatic time updates every second for running projects

#### `ProjectSettings.tsx`
Comprehensive project configuration panel.

**Features:**
- Model selection with radio buttons
- Budget and iteration limits
- Circuit breaker configuration with toggle
- Advanced settings (temperature, max tokens)
- Tool permissions with checkboxes
- Real-time validation
- Unsaved changes indicator with sticky save bar
- Error handling and feedback

**Available Models:**
- Claude Opus 4.5 (most capable)
- Claude Sonnet 4.5 (balanced)
- Claude Sonnet 3.5 (fast)
- Claude Haiku 3.5 (fastest)

**Available Tools:**
- Bash, Read, Write, Edit, Glob, Grep

#### `NewProjectDialog.tsx`
Multi-step wizard for creating new projects.

**Features:**
- Three-step wizard with progress indicator
- Step 1: Project name and description
- Step 2: Prompt editor with markdown support
- Step 3: Settings configuration (model, budget, tools)
- Per-step validation
- Animated step transitions
- Informative help text and tips
- Modal overlay with click-outside-to-close

**Workflow:**
1. Details: Capture basic project information
2. Prompt: Write the Ralph loop instructions
3. Settings: Configure model, budget, and allowed tools
4. Create: Submit and create the project

#### `PromptEditor.tsx`
Markdown editor for project prompts with syntax highlighting.

**Features:**
- Line numbers
- Auto-save with debounce (configurable delay)
- Save status indicator (saving/unsaved/saved)
- Full-screen mode toggle
- Tab key support for indentation
- Character and line count
- Keyboard shortcuts (Tab for indent)
- Read-only mode support

**Props:**
```typescript
interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number; // default: 2000ms
}
```

#### `OutputsView.tsx`
File tree viewer and content display for project outputs.

**Features:**
- Hierarchical file tree with expand/collapse
- File type filtering (All, Files, Artifacts)
- Split-pane layout (tree + content viewer)
- Content preview with syntax preservation
- Diff view for changed files (comparing previous and current content)
- Download functionality for individual files
- Empty state with helpful message
- Automatic file tree building from flat output list

**Output Types:**
- `FILE`: Regular files created/modified by agents
- `ARTIFACT`: Special artifacts generated during execution
- `LOG`: Log files and debugging output

## Hooks

### `useProject(projectId: string | null)`
Hook for accessing and managing a single project.

**Returns:**
```typescript
{
  project: Project | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  update: (input: UpdateProjectInput) => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  delete: () => Promise<void>;
}
```

**Features:**
- Real-time updates via event subscriptions
- Automatic refresh on projectId change
- Error handling and loading states
- CRUD operations with proper error propagation

### `useProjects()`
Hook for accessing all projects with search/filter capabilities.

**Returns:**
```typescript
{
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (input: CreateProjectInput) => Promise<Project>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProjects: Project[];
}
```

**Features:**
- Automatic sorting by last updated
- Real-time updates for all project events
- Search/filter functionality
- Create new projects

## Types

See `/src/renderer/types/index.ts` for complete type definitions.

**Key Types:**
- `Project`: Extended project with parsed settings
- `ProjectSettings`: Configuration object with model, budget, tools, etc.
- `ProjectStatus`: Enum for project states
- `ProjectTab`: Union type for tab navigation
- `CreateProjectInput`: DTO for project creation
- `UpdateProjectInput`: DTO for project updates

## Design System

### Colors
- **Primary**: Blue (`bg-blue-600`, `text-blue-400`)
- **Success**: Green (`bg-green-600`, `text-green-400`)
- **Warning**: Yellow (`bg-yellow-600`, `text-yellow-400`)
- **Danger**: Red (`bg-red-600`, `text-red-400`)
- **Background**: Gray-900 series (`bg-gray-900`, `bg-gray-800`, `bg-gray-850`, `bg-gray-950`)
- **Text**: White and gray (`text-white`, `text-gray-400`, `text-gray-500`)

### Status Colors
- Running: Green (animated pulse)
- Paused: Yellow
- Completed: Blue
- Failed: Red
- Stopped: Gray
- Created: Gray

### Spacing
- Consistent padding: `p-4`, `p-6` for containers
- Gap spacing: `gap-2`, `gap-3`, `gap-4` for flex layouts
- Border radius: `rounded`, `rounded-lg`, `rounded-xl`

### Transitions
- Standard: `transition-colors`, `transition-all`
- Hover states: `hover:bg-gray-700`, `hover:text-white`
- Loading states: `animate-spin`, `animate-pulse`

## Integration

### Main Application Layout
```tsx
import { useState } from 'react';
import { ProjectList, ProjectDetail, NewProjectDialog } from './components/projects';

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  return (
    <div className="flex h-screen">
      <ProjectList
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onNewProject={() => setShowNewDialog(true)}
      />
      <div className="flex-1">
        {selectedProjectId ? (
          <ProjectDetail projectId={selectedProjectId} />
        ) : (
          <EmptyState />
        )}
      </div>
      <NewProjectDialog
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={async (input) => {
          // Handle project creation
        }}
      />
    </div>
  );
}
```

## Event System

Components subscribe to IPC events for real-time updates:

- `project_created`: New project added
- `project_updated`: Project properties changed
- `project_deleted`: Project removed
- `project_status_changed`: Status transition
- `agent_created`: New agent spawned
- `agent_updated`: Agent state changed
- `agent_output_chunk`: Streaming output from agent

## Future Enhancements

1. **Keyboard Shortcuts**: Add keyboard navigation and shortcuts
2. **Drag & Drop**: Reorder projects in sidebar
3. **Project Templates**: Pre-configured project templates
4. **Bulk Operations**: Select and operate on multiple projects
5. **Export/Import**: Project backup and sharing
6. **Advanced Filtering**: Filter by status, cost range, date range
7. **Project Tags**: Categorize and filter by tags
8. **Collaborative Features**: Share projects and view activity
9. **Enhanced Diff View**: Syntax-highlighted diffs with line-by-line comparison
10. **Real-time Collaboration**: Multiple users viewing/editing projects

## Testing Considerations

- Mock `window.api` calls in tests
- Test empty states and error states
- Test event subscription cleanup
- Test form validation
- Test keyboard interactions
- Test accessibility (ARIA labels, keyboard navigation)
- Test responsive behavior
- Test loading states and race conditions

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation supported (Tab, Enter, Escape)
- Focus management in dialogs and modals
- Color contrast meets WCAG AA standards
- Loading states announced to screen readers
- Error messages associated with form fields

## Performance

- Debounced search (300ms)
- Debounced auto-save (2000ms)
- Memoized filtered lists
- Event throttling for non-critical updates
- Virtual scrolling for large lists (future enhancement)
- Code splitting for heavy components (future enhancement)
