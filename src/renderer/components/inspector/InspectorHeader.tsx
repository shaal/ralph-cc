/**
 * Inspector header with agent info and controls
 */
import React from 'react';
import type { AgentWithConfig } from '../../../main/database/types';
import { AgentStatus } from '../../../main/database/types';

interface InspectorHeaderProps {
  agent: AgentWithConfig;
  onClose: () => void;
}

export const InspectorHeader: React.FC<InspectorHeaderProps> = ({ agent, onClose }) => {
  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case AgentStatus.WORKING:
        return 'bg-green-500';
      case AgentStatus.IDLE:
        return 'bg-blue-500';
      case AgentStatus.PAUSED:
        return 'bg-yellow-500';
      case AgentStatus.COMPLETED:
        return 'bg-purple-500';
      case AgentStatus.FAILED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handlePause = async () => {
    await window.api.agent.pause(agent.id);
  };

  const handleResume = async () => {
    await window.api.agent.resume(agent.id);
  };

  const handleStop = async () => {
    if (confirm('Are you sure you want to stop this agent?')) {
      await window.api.agent.stop(agent.id);
    }
  };

  const handleRestart = async () => {
    if (confirm('Are you sure you want to restart this agent?')) {
      await window.api.agent.restart(agent.id);
    }
  };

  const isWorking = agent.status === AgentStatus.WORKING;
  const isPaused = agent.status === AgentStatus.PAUSED;
  const canControl = [AgentStatus.WORKING, AgentStatus.IDLE, AgentStatus.PAUSED].includes(agent.status);

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 flex-1">
        {/* Agent Icon with Status */}
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            {agent.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${getStatusColor(agent.status)} ${isWorking ? 'animate-pulse' : ''}`} />
        </div>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white truncate">
              {agent.name || `Agent ${agent.id.slice(0, 8)}`}
            </h2>
            {agent.parent_id && (
              <button
                onClick={() => window.api.agent.select(agent.parent_id!)}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                title="View parent agent"
              >
                (sub-agent)
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isWorking
                ? 'bg-green-500/20 text-green-400'
                : isPaused
                ? 'bg-yellow-500/20 text-yellow-400'
                : agent.status === AgentStatus.COMPLETED
                ? 'bg-purple-500/20 text-purple-400'
                : agent.status === AgentStatus.FAILED
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {isWorking && (
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
              )}
              {agent.status}
            </span>
            {agent.depth > 0 && (
              <span className="text-xs text-gray-500">
                Depth: {agent.depth}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 ml-4">
        {canControl && (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Resume agent"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                title="Pause agent"
              >
                Pause
              </button>
            )}
            <button
              onClick={handleStop}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              title="Stop agent"
            >
              Stop
            </button>
          </>
        )}
        {agent.status === AgentStatus.FAILED && (
          <button
            onClick={handleRestart}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title="Restart agent"
          >
            Restart
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="ml-2 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Close inspector"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
