/**
 * ProjectDetail - Main project view with tabbed interface
 */

import React, { useState } from 'react';
import { useProject } from '../../hooks/useProject';
import { ProjectTab, UpdateProjectInput } from '../../types';
import { ProjectHeader } from './ProjectHeader';
import { ProjectSettings } from './ProjectSettings';
import { OutputsView } from './OutputsView';
import { PromptEditor } from './PromptEditor';

interface ProjectDetailProps {
  projectId: string;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId }) => {
  const { project, loading, error, update, start, pause, stop, delete: deleteProject } = useProject(projectId);
  const [activeTab, setActiveTab] = useState<ProjectTab>('graph');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-white text-xl font-bold mb-2">Failed to load project</h2>
          <p className="text-gray-400 text-sm mb-4">
            {error?.message || 'The project could not be found or loaded.'}
          </p>
        </div>
      </div>
    );
  }

  const handleUpdateName = async (name: string) => {
    await update({ name });
  };

  const handleUpdateSettings = async (settings: UpdateProjectInput['settings']) => {
    await update({ settings });
  };

  const handleUpdatePrompt = async (prompt: string) => {
    await update({ prompt });
  };

  const tabs: { id: ProjectTab; label: string; icon: JSX.Element }[] = [
    {
      id: 'graph',
      label: 'Agent Graph',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      id: 'inspector',
      label: 'Inspector',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path
            fillRule="evenodd"
            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      id: 'outputs',
      label: 'Outputs',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <ProjectHeader
        project={project}
        onStart={start}
        onPause={pause}
        onStop={stop}
        onUpdateName={handleUpdateName}
        onDelete={deleteProject}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2
                ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-blue-500 bg-gray-800/50'
                    : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'graph' && (
          <div className="h-full flex items-center justify-center bg-gray-950">
            <div className="text-center max-w-md">
              <svg
                className="w-20 h-20 text-gray-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-white text-lg font-semibold mb-2">Agent Graph View</h3>
              <p className="text-gray-400 text-sm mb-4">
                This will display a force-directed graph visualization of all agents and their relationships.
              </p>
              <p className="text-gray-500 text-xs">
                Component: AgentGraph (to be implemented)
              </p>
            </div>
          </div>
        )}

        {activeTab === 'inspector' && (
          <div className="h-full flex items-center justify-center bg-gray-950">
            <div className="text-center max-w-md">
              <svg
                className="w-20 h-20 text-gray-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <h3 className="text-white text-lg font-semibold mb-2">Agent Inspector</h3>
              <p className="text-gray-400 text-sm mb-4">
                This will show detailed information about a selected agent, including its conversation history,
                tool calls, and current state.
              </p>
              <p className="text-gray-500 text-xs">
                Component: InspectorPanel (to be implemented)
              </p>
            </div>
          </div>
        )}

        {activeTab === 'outputs' && <OutputsView projectId={projectId} />}

        {activeTab === 'settings' && (
          <div className="h-full overflow-hidden">
            <div className="h-1/2 border-b border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-800 bg-gray-850">
                <h3 className="text-white font-semibold">Prompt</h3>
                <p className="text-gray-400 text-xs mt-1">
                  The instructions that will be used in each Ralph loop iteration
                </p>
              </div>
              <div className="flex-1 p-4">
                <PromptEditor
                  value={project.prompt_path || ''}
                  onChange={handleUpdatePrompt}
                  autoSave={true}
                />
              </div>
            </div>
            <div className="h-1/2">
              <ProjectSettings project={project} onSave={handleUpdateSettings} />
            </div>
          </div>
        )}
      </div>

      {/* Floating action button (optional, for quick actions) */}
      {activeTab === 'graph' && project.status === 'running' && (
        <div className="absolute bottom-8 right-8">
          <button className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
