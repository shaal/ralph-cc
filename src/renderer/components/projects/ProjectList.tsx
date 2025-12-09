/**
 * ProjectList - Sidebar list of all projects with search and filtering
 */

import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useProject } from '../../hooks/useProject';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  selectedProjectId,
  onSelectProject,
  onNewProject,
}) => {
  const { filteredProjects, loading, error, searchQuery, setSearchQuery, refresh } = useProjects();

  const handleProjectAction = async (
    projectId: string,
    action: 'start' | 'stop' | 'pause' | 'delete'
  ) => {
    try {
      if (action === 'delete') {
        await window.api.project.delete(projectId);
        if (selectedProjectId === projectId) {
          onSelectProject('');
        }
      } else if (action === 'start') {
        await window.api.project.start(projectId);
      } else if (action === 'stop') {
        await window.api.project.stop(projectId);
      } else if (action === 'pause') {
        await window.api.project.pause(projectId);
      }
      await refresh();
    } catch (err) {
      console.error(`Failed to ${action} project:`, err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
        <div className="p-4">
          <h2 className="text-white font-bold text-lg mb-4">Projects</h2>
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400 text-sm">
            <p className="font-semibold mb-1">Error loading projects</p>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-80">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Projects</h2>
          <button
            onClick={onNewProject}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center gap-1.5"
            title="Create new project"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Results count */}
        {searchQuery && (
          <p className="text-gray-400 text-xs mt-2">
            {filteredProjects.length} result{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            {searchQuery ? (
              <>
                <svg
                  className="w-12 h-12 text-gray-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-gray-400 text-sm mb-1">No projects found</p>
                <p className="text-gray-500 text-xs">
                  Try adjusting your search query
                </p>
              </>
            ) : (
              <>
                <svg
                  className="w-16 h-16 text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-400 text-sm mb-2">No projects yet</p>
                <p className="text-gray-500 text-xs mb-4 max-w-xs">
                  Create your first project to start orchestrating AI agent swarms
                </p>
                <button
                  onClick={onNewProject}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Project
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selectedProjectId === project.id}
                onSelect={() => onSelectProject(project.id)}
                onStart={() => handleProjectAction(project.id, 'start')}
                onStop={() => handleProjectAction(project.id, 'stop')}
                onPause={() => handleProjectAction(project.id, 'pause')}
                onDelete={() => handleProjectAction(project.id, 'delete')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with summary stats */}
      {!loading && filteredProjects.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
            <button
              onClick={refresh}
              className="hover:text-gray-300 transition-colors flex items-center gap-1"
              title="Refresh projects"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
