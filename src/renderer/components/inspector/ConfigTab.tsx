/**
 * Configuration tab showing agent settings
 */
import React from 'react';
import type { AgentWithConfig } from '../../types';

interface ConfigTabProps {
  agent: AgentWithConfig;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({ agent }) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={value ? 'text-green-400' : 'text-red-400'}>
          {value ? 'true' : 'false'}
        </span>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-blue-400">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-yellow-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500">[]</span>;
      }
      return (
        <div className="ml-4 mt-2 space-y-1">
          {value.map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-500">[{i}]:</span>
              {renderValue(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="ml-4 mt-2 space-y-2">
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <span className="text-purple-400">{k}</span>
              <span className="text-gray-500">: </span>
              {renderValue(v)}
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-gray-300">{String(value)}</span>;
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* Agent Identity */}
      <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          Agent Identity
        </h3>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">ID:</span>
            <span className="text-gray-300">{agent.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Name:</span>
            <span className="text-gray-300">{agent.name || 'Unnamed'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Project ID:</span>
            <span className="text-gray-300">{agent.project_id}</span>
          </div>
          {agent.parent_id && (
            <div className="flex justify-between">
              <span className="text-gray-400">Parent ID:</span>
              <button
                onClick={() => window.api.agent.select(agent.parent_id!)}
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                {agent.parent_id}
              </button>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Depth:</span>
            <span className="text-gray-300">{agent.depth}</span>
          </div>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Model Configuration
        </h3>
        <div className="space-y-3 text-sm font-mono">
          {agent.config.model && (
            <div>
              <span className="text-gray-400">Model:</span>
              <div className="ml-4 mt-1">
                <span className="text-blue-300">{agent.config.model}</span>
              </div>
            </div>
          )}
          {agent.config.max_tokens && (
            <div>
              <span className="text-gray-400">Max Tokens:</span>
              <div className="ml-4 mt-1">
                <span className="text-blue-400">{agent.config.max_tokens}</span>
              </div>
            </div>
          )}
          {agent.config.temperature !== undefined && (
            <div>
              <span className="text-gray-400">Temperature:</span>
              <div className="ml-4 mt-1">
                <span className="text-blue-400">{agent.config.temperature}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Tools */}
      {agent.config.tools && (
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-700/50 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Available Tools
          </h3>
          <div className="text-sm font-mono">
            {renderValue(agent.config.tools)}
          </div>
        </div>
      )}

      {/* Full Configuration */}
      <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Full Configuration
        </h3>
        <div className="bg-gray-900/50 rounded border border-gray-700 p-4 overflow-x-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
            {JSON.stringify(agent.config, null, 2)}
          </pre>
        </div>
      </div>

      {/* Timestamps */}
      <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timestamps
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Created:</div>
            <div className="text-gray-300 font-mono text-xs">
              {formatDate(agent.created_at)}
            </div>
          </div>
          {agent.updated_at && (
            <div>
              <div className="text-gray-400 mb-1">Last Updated:</div>
              <div className="text-gray-300 font-mono text-xs">
                {formatDate(agent.updated_at)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Statistics
        </h3>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Tokens:</span>
            <span className="text-gray-300">{agent.total_tokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Cost:</span>
            <span className="text-gray-300">${agent.total_cost.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Iterations:</span>
            <span className="text-gray-300">{agent.iteration_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className="text-gray-300 capitalize">{agent.status}</span>
          </div>
        </div>
      </div>

      {/* Current Task */}
      {agent.current_task && (
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Current Task
          </h3>
          <div className="text-sm text-gray-300 bg-gray-900/50 rounded border border-gray-700 p-3">
            {agent.current_task}
          </div>
        </div>
      )}
    </div>
  );
};
