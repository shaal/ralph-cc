/**
 * ProjectHeader - Header bar for project detail view
 */

import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectStatus } from '../../types';

interface ProjectHeaderProps {
  project: Project;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onUpdateName: (name: string) => void;
  onDelete: () => void;
}

const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.RUNNING:
      return 'bg-green-500 text-green-100';
    case ProjectStatus.PAUSED:
      return 'bg-yellow-500 text-yellow-100';
    case ProjectStatus.COMPLETED:
      return 'bg-blue-500 text-blue-100';
    case ProjectStatus.FAILED:
      return 'bg-red-500 text-red-100';
    case ProjectStatus.STOPPED:
      return 'bg-gray-500 text-gray-100';
    default:
      return 'bg-gray-400 text-gray-100';
  }
};

const getStatusText = (status: ProjectStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDuration = (startDate: string, endDate?: string | null): string => {
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

const formatCost = (cost: number, budget: number): { text: string; percentage: number; isOverBudget: boolean } => {
  const percentage = budget > 0 ? (cost / budget) * 100 : 0;
  const isOverBudget = cost > budget;
  const text = `$${cost.toFixed(4)} / $${budget.toFixed(2)}`;
  return { text, percentage, isOverBudget };
};

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onStart,
  onPause,
  onStop,
  onUpdateName,
  onDelete,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [showMenu, setShowMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const nameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isRunning = project.status === ProjectStatus.RUNNING;
  const isPaused = project.status === ProjectStatus.PAUSED;
  const canStart = !isRunning && project.status !== ProjectStatus.COMPLETED;
  const canPause = isRunning;
  const canStop = isRunning || isPaused;

  const costInfo = formatCost(project.cost_total, project.settings.budgetLimit);

  // Update current time every second for live duration display
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  // Handle clicking outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Focus input when editing name
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setEditedName(project.name);
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== project.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(project.name);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      onDelete();
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side: Name and status */}
        <div className="flex items-center gap-4">
          {/* Project name (editable) */}
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleNameSave}
                className="px-2 py-1 bg-gray-800 border border-blue-500 rounded text-white text-xl font-bold focus:outline-none"
                style={{ width: `${Math.max(editedName.length, 10)}ch` }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-white text-xl font-bold">{project.name}</h1>
              <button
                onClick={handleNameEdit}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="Edit project name"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          )}

          {/* Status badge with animation */}
          <div className="flex items-center gap-2">
            <span
              className={`
                px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2
                ${getStatusColor(project.status)}
                ${isRunning ? 'animate-pulse' : ''}
              `}
            >
              {isRunning && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              )}
              {getStatusText(project.status)}
            </span>
          </div>
        </div>

        {/* Center: Metrics */}
        <div className="flex items-center gap-6 text-sm">
          {/* Cost with progress bar */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Cost:</span>
              <span className={`font-mono ${costInfo.isOverBudget ? 'text-red-400' : 'text-white'}`}>
                {costInfo.text}
              </span>
            </div>
            <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  costInfo.isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(costInfo.percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-end">
            <span className="text-gray-400">Duration:</span>
            <span className="text-white font-mono">
              {formatDuration(project.created_at, project.ended_at)}
            </span>
          </div>

          {/* Iterations */}
          <div className="flex flex-col items-end">
            <span className="text-gray-400">Iterations:</span>
            <span className="text-white font-mono">{project.iteration_count}</span>
          </div>
        </div>

        {/* Right side: Control buttons */}
        <div className="flex items-center gap-2">
          {canStart && (
            <button
              onClick={onStart}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-2"
              title="Start project"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start
            </button>
          )}

          {canPause && (
            <button
              onClick={onPause}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors flex items-center gap-2"
              title="Pause project"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}

          {canStop && (
            <button
              onClick={onStop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2"
              title="Stop project"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          )}

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title="More options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
