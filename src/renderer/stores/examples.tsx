/**
 * Example usage patterns for Zustand stores
 *
 * These examples demonstrate common patterns for using the stores in React components.
 */

import { useEffect, useState } from 'react';
import {
  useProjectStore,
  useAgentStore,
  useGraphStore,
  useUIStore,
  useConfigStore,
  useEventStore,
  type Project,
  type Agent,
} from './index';

// =============================================================================
// PROJECT STORE EXAMPLES
// =============================================================================

/**
 * Example: Project List Component
 * Shows all projects with their status
 */
export function ProjectListExample() {
  const projects = useProjectStore((state) => state.projects);
  const loading = useProjectStore((state) => state.loading);
  const selectProject = useProjectStore((state) => state.selectProject);
  const startProject = useProjectStore((state) => state.startProject);

  if (loading) return <div>Loading projects...</div>;

  return (
    <div>
      {projects.map((project) => (
        <div key={project.id} onClick={() => selectProject(project.id)}>
          <h3>{project.name}</h3>
          <p>Status: {project.status}</p>
          <p>Cost: ${project.costTotal.toFixed(2)}</p>
          {project.status === 'idle' && (
            <button onClick={() => startProject(project.id)}>Start</button>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Create Project Form
 * Form to create a new project with validation
 */
export function CreateProjectExample() {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProject = useProjectStore((state) => state.createProject);
  const addNotification = useUIStore((state) => state.addNotification);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const project = await createProject({
        name,
        prompt,
        settings: {
          maxIterations: 100,
          budgetLimit: 10,
        },
      });

      addNotification({
        type: 'success',
        message: `Project "${project.name}" created successfully!`,
      });

      // Reset form
      setName('');
      setPrompt('');
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to create project',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        required
      />
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}

/**
 * Example: Selected Project Details
 * Shows details of currently selected project
 */
export function SelectedProjectExample() {
  const selectedProject = useProjectStore((state) => state.getSelectedProject());

  if (!selectedProject) {
    return <div>No project selected</div>;
  }

  return (
    <div>
      <h2>{selectedProject.name}</h2>
      <p>{selectedProject.prompt}</p>
      <dl>
        <dt>Status:</dt>
        <dd>{selectedProject.status}</dd>
        <dt>Cost:</dt>
        <dd>${selectedProject.costTotal.toFixed(2)}</dd>
        <dt>Created:</dt>
        <dd>{new Date(selectedProject.createdAt).toLocaleString()}</dd>
      </dl>
    </div>
  );
}

// =============================================================================
// AGENT STORE EXAMPLES
// =============================================================================

/**
 * Example: Agent Tree for Project
 * Shows hierarchical view of agents
 */
export function AgentTreeExample({ projectId }: { projectId: string }) {
  const agents = useAgentStore((state) => state.getAgentsByProject(projectId));
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);

  useEffect(() => {
    useAgentStore.getState().fetchAgents(projectId);
  }, [projectId]);

  const renderAgent = (agent: Agent, depth = 0) => {
    const children = agents.filter((a) => a.parentId === agent.id);

    return (
      <div key={agent.id} style={{ marginLeft: depth * 20 }}>
        <div
          onClick={() => selectAgent(agent.id)}
          style={{
            fontWeight: selectedAgentId === agent.id ? 'bold' : 'normal',
          }}
        >
          Agent {agent.depth} - {agent.status} - ${agent.costTotal.toFixed(2)}
        </div>
        {children.map((child) => renderAgent(child, depth + 1))}
      </div>
    );
  };

  const rootAgents = agents.filter((a) => a.parentId === null);

  return (
    <div>
      <h3>Agent Tree</h3>
      {rootAgents.map((agent) => renderAgent(agent))}
    </div>
  );
}

/**
 * Example: Agent Status Indicator
 * Shows real-time status of an agent
 */
export function AgentStatusExample({ agentId }: { agentId: string }) {
  const agent = useAgentStore((state) => state.getAgentById(agentId));

  if (!agent) return null;

  const statusColors = {
    idle: 'gray',
    running: 'blue',
    paused: 'orange',
    completed: 'green',
    failed: 'red',
    thinking: 'purple',
  };

  return (
    <div style={{ color: statusColors[agent.status] }}>
      <span>{agent.status.toUpperCase()}</span>
      <span> - Iteration {agent.iterationCount}</span>
    </div>
  );
}

// =============================================================================
// GRAPH STORE EXAMPLES
// =============================================================================

/**
 * Example: Graph Controls
 * Control panel for graph visualization
 */
export function GraphControlsExample() {
  const layoutType = useGraphStore((state) => state.layoutType);
  const autoLayout = useGraphStore((state) => state.autoLayout);
  const applyLayout = useGraphStore((state) => state.applyLayout);
  const setAutoLayout = useGraphStore((state) => state.setAutoLayout);
  const resetGraph = useGraphStore((state) => state.resetGraph);

  return (
    <div>
      <h3>Graph Controls</h3>

      <div>
        <label>Layout:</label>
        <select
          value={layoutType}
          onChange={(e) => applyLayout(e.target.value as any)}
        >
          <option value="hierarchical">Hierarchical</option>
          <option value="radial">Radial</option>
          <option value="force">Force-Directed</option>
        </select>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={autoLayout}
            onChange={(e) => setAutoLayout(e.target.checked)}
          />
          Auto Layout
        </label>
      </div>

      <button onClick={resetGraph}>Reset Graph</button>
    </div>
  );
}

/**
 * Example: Node Inspector
 * Shows details of selected graph node
 */
export function NodeInspectorExample() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const node = useGraphStore((state) =>
    selectedNodeId ? state.getNodeById(selectedNodeId) : null
  );

  if (!node) {
    return <div>No node selected</div>;
  }

  return (
    <div>
      <h3>Node Details</h3>
      <dl>
        <dt>Agent ID:</dt>
        <dd>{node.data.agentId}</dd>
        <dt>Status:</dt>
        <dd>{node.data.status}</dd>
        <dt>Cost:</dt>
        <dd>${node.data.cost.toFixed(2)}</dd>
        <dt>Iterations:</dt>
        <dd>{node.data.iterations}</dd>
      </dl>
    </div>
  );
}

// =============================================================================
// UI STORE EXAMPLES
// =============================================================================

/**
 * Example: Theme Toggle
 * Button to toggle between dark and light theme
 */
export function ThemeToggleExample() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}

/**
 * Example: Notification List
 * Shows active notifications with auto-dismiss
 */
export function NotificationsExample() {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  return (
    <div style={{ position: 'fixed', top: 20, right: 20 }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            padding: '10px',
            margin: '5px 0',
            backgroundColor:
              notification.type === 'error'
                ? 'red'
                : notification.type === 'success'
                ? 'green'
                : notification.type === 'warning'
                ? 'orange'
                : 'blue',
          }}
        >
          {notification.title && <strong>{notification.title}</strong>}
          <p>{notification.message}</p>
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Resizable Inspector Panel
 * Panel with draggable resize handle
 */
export function ResizableInspectorExample() {
  const inspectorOpen = useUIStore((state) => state.inspectorOpen);
  const inspectorWidth = useUIStore((state) => state.inspectorWidth);
  const setInspectorWidth = useUIStore((state) => state.setInspectorWidth);
  const toggleInspector = useUIStore((state) => state.toggleInspector);

  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = window.innerWidth - e.clientX;
        setInspectorWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, setInspectorWidth]);

  if (!inspectorOpen) {
    return <button onClick={toggleInspector}>Open Inspector</button>;
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: inspectorWidth,
        backgroundColor: '#fff',
        borderLeft: '1px solid #ccc',
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 5,
          height: '100%',
          cursor: 'col-resize',
          backgroundColor: isDragging ? '#007bff' : 'transparent',
        }}
      />
      <button onClick={toggleInspector}>Close Inspector</button>
      <div style={{ padding: 20 }}>Inspector Content</div>
    </div>
  );
}

// =============================================================================
// CONFIG STORE EXAMPLES
// =============================================================================

/**
 * Example: Settings Panel
 * Panel to edit configuration
 */
export function SettingsExample() {
  const config = useConfigStore((state) => state.config);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const hasApiKey = useConfigStore((state) => state.hasApiKey);
  const setApiKey = useConfigStore((state) => state.setApiKey);

  const [apiKeyInput, setApiKeyInput] = useState('');

  if (!config) return <div>Loading config...</div>;

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setApiKey(apiKeyInput);
      setApiKeyInput('');
      alert('API key saved!');
    } catch (error) {
      alert('Failed to save API key');
    }
  };

  return (
    <div>
      <h3>Settings</h3>

      <div>
        <label>Default Model:</label>
        <select
          value={config.defaultModel}
          onChange={(e) => updateConfig('defaultModel', e.target.value)}
        >
          <option value="claude-opus-4-5-20251101">Claude Opus 4.5</option>
          <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
        </select>
      </div>

      <div>
        <label>Default Budget Limit ($):</label>
        <input
          type="number"
          value={config.defaultBudgetLimit}
          onChange={(e) =>
            updateConfig('defaultBudgetLimit', Number(e.target.value))
          }
        />
      </div>

      <div>
        <label>Max Iterations:</label>
        <input
          type="number"
          value={config.defaultMaxIterations}
          onChange={(e) =>
            updateConfig('defaultMaxIterations', Number(e.target.value))
          }
        />
      </div>

      <div>
        <h4>API Key {hasApiKey ? '✓' : '✗'}</h4>
        <form onSubmit={handleApiKeySubmit}>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter Anthropic API key"
          />
          <button type="submit">Save API Key</button>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// EVENT STORE EXAMPLES
// =============================================================================

/**
 * Example: Event Log
 * Shows recent events
 */
export function EventLogExample() {
  const recentEvents = useEventStore((state) => state.getRecentEvents(20));

  return (
    <div>
      <h3>Event Log</h3>
      <ul>
        {recentEvents.map((event) => (
          <li key={event.id}>
            <strong>{event.type}</strong> at{' '}
            {new Date(event.timestamp).toLocaleTimeString()}
            <pre>{JSON.stringify(event.data, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example: Project Event Monitor
 * Shows events for a specific project
 */
export function ProjectEventMonitorExample({
  projectId,
}: {
  projectId: string;
}) {
  const projectEvents = useEventStore((state) =>
    state.getEventsForProject(projectId)
  );

  return (
    <div>
      <h3>Project Events</h3>
      <p>Total events: {projectEvents.length}</p>
      <ul>
        {projectEvents.slice(0, 10).map((event) => (
          <li key={event.id}>
            {event.type} at {new Date(event.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// COMBINED EXAMPLES
// =============================================================================

/**
 * Example: Dashboard with multiple stores
 * Shows how to combine multiple stores
 */
export function DashboardExample() {
  const projects = useProjectStore((state) => state.projects);
  const runningProjects = useProjectStore((state) => state.getRunningProjects());
  const theme = useUIStore((state) => state.theme);
  const hasApiKey = useConfigStore((state) => state.hasApiKey);
  const recentEvents = useEventStore((state) => state.getRecentEvents(5));

  const totalCost = projects.reduce((sum, p) => sum + p.costTotal, 0);

  return (
    <div className={theme}>
      <h1>Dashboard</h1>

      {!hasApiKey && (
        <div style={{ color: 'red' }}>⚠️ No API key configured</div>
      )}

      <div>
        <h2>Stats</h2>
        <p>Total Projects: {projects.length}</p>
        <p>Running: {runningProjects.length}</p>
        <p>Total Cost: ${totalCost.toFixed(2)}</p>
      </div>

      <div>
        <h2>Recent Events</h2>
        <ul>
          {recentEvents.map((event) => (
            <li key={event.id}>{event.type}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Example: App initialization
 * Shows how to initialize stores in App component
 */
export function AppExample() {
  const { isInitialized, error } = useStoreInitializer();

  if (error) {
    return <div>Error initializing app: {error.message}</div>;
  }

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <NotificationsExample />
      <DashboardExample />
    </div>
  );
}

// Hook import for examples
import { useStoreInitializer } from './index';
