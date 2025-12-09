/**
 * ProjectCard - Individual project card in the sidebar
 */

import React, { useState } from 'react';
import { Project, ProjectStatus } from '../../types';

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onDelete: () => void;
}

const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.RUNNING:
      return 'bg-green-500';
    case ProjectStatus.PAUSED:
      return 'bg-yellow-500';
    case ProjectStatus.COMPLETED:
      return 'bg-blue-500';
    case ProjectStatus.FAILED:
      return 'bg-red-500';
    case ProjectStatus.STOPPED:
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
};

const getStatusText = (status: ProjectStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`;
};

const formatDuration = (startDate: string, endDate?: string | null): string => {
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isSelected,
  onSelect,
  onStart,
  onStop,
  onPause,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStart();
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStop();
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPause();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      onDelete();
    }
  };

  const isRunning = project.status === ProjectStatus.RUNNING;
  const isPaused = project.status === ProjectStatus.PAUSED;
  const canStart = !isRunning && project.status !== ProjectStatus.COMPLETED;
  const canPause = isRunning;
  const canStop = isRunning || isPaused;

  return (
    <div
      className={`
        relative p-3 mb-2 rounded-lg cursor-pointer transition-all
        ${isSelected ? 'bg-blue-600/20 border-2 border-blue-500' : 'bg-gray-800 border-2 border-transparent hover:border-gray-700'}
      `}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Status indicator dot */}
      <div className="absolute top-3 right-3">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(project.status)} ${
            isRunning ? 'animate-pulse' : ''
          }`}
          title={getStatusText(project.status)}
        />
      </div>

      {/* Project name */}
      <h3 className="text-white font-semibold text-sm mb-1 pr-6 truncate">
        {project.name}
      </h3>

      {/* Description */}
      {project.description && (
        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{project.description}</p>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`
            px-2 py-0.5 rounded text-xs font-medium
            ${isRunning ? 'bg-green-500/20 text-green-400' : ''}
            ${isPaused ? 'bg-yellow-500/20 text-yellow-400' : ''}
            ${project.status === ProjectStatus.COMPLETED ? 'bg-blue-500/20 text-blue-400' : ''}
            ${project.status === ProjectStatus.FAILED ? 'bg-red-500/20 text-red-400' : ''}
            ${project.status === ProjectStatus.STOPPED ? 'bg-gray-500/20 text-gray-400' : ''}
            ${project.status === ProjectStatus.CREATED ? 'bg-gray-500/20 text-gray-400' : ''}
          `}
        >
          {getStatusText(project.status)}
        </span>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {/* Cost */}
          <span title="Total cost">{formatCost(project.cost_total)}</span>

          {/* Agent count */}
          {project.agentCount !== undefined && (
            <span title="Active agents" className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              {project.agentCount}
            </span>
          )}

          {/* Iterations */}
          <span title="Iterations" className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {project.iteration_count}
          </span>
        </div>

        {/* Duration */}
        <span title="Duration" className="text-xs">
          {formatDuration(project.created_at, project.ended_at)}
        </span>
      </div>

      {/* Action buttons (shown on hover) */}
      {showActions && (
        <div className="absolute inset-0 bg-gray-900/95 rounded-lg flex items-center justify-center gap-2 p-2">
          {canStart && (
            <button
              onClick={handleStart}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center gap-1"
              title="Start project"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start
            </button>
          )}

          {canPause && (
            <button
              onClick={handlePause}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors flex items-center gap-1"
              title="Pause project"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}

          {canStop && (
            <button
              onClick={handleStop}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors flex items-center gap-1"
              title="Stop project"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors flex items-center gap-1"
            title="Delete project"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
