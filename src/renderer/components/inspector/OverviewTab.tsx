/**
 * Overview tab with metrics and activity
 */
import React, { useState, useEffect } from 'react';
import type { AgentWithConfig } from '../../../main/database/types';
import { AgentStatus } from '../../../main/database/types';

interface OverviewTabProps {
  agent: AgentWithConfig;
}

interface SubAgent {
  id: string;
  name: string | null;
  status: AgentStatus;
  depth: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ agent }) => {
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [timeRunning, setTimeRunning] = useState<string>('0s');

  // Fetch sub-agents
  useEffect(() => {
    const fetchSubAgents = async () => {
      const children = await window.api.agent.getChildren(agent.id);
      setSubAgents(children);
    };
    fetchSubAgents();
  }, [agent.id]);

  // Calculate time running
  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(agent.created_at);
      const now = new Date();
      const diff = now.getTime() - start.getTime();

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    };

    setTimeRunning(calculateTime());
    const interval = setInterval(() => setTimeRunning(calculateTime()), 1000);
    return () => clearInterval(interval);
  }, [agent.created_at]);

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(2)}K`;
    return tokens.toString();
  };

  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case AgentStatus.WORKING:
        return 'text-green-400';
      case AgentStatus.IDLE:
        return 'text-blue-400';
      case AgentStatus.PAUSED:
        return 'text-yellow-400';
      case AgentStatus.COMPLETED:
        return 'text-purple-400';
      case AgentStatus.FAILED:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: AgentStatus): React.ReactNode => {
    switch (status) {
      case AgentStatus.WORKING:
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case AgentStatus.COMPLETED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case AgentStatus.FAILED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
          </svg>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status Card */}
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Status
          </div>
          <div className={`flex items-center gap-2 text-2xl font-bold ${getStatusColor(agent.status)}`}>
            {getStatusIcon(agent.status)}
            <span className="capitalize">{agent.status}</span>
          </div>
        </div>

        {/* Iterations Card */}
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Iterations
          </div>
          <div className="text-2xl font-bold text-white">
            {agent.iteration_count}
          </div>
        </div>

        {/* Tokens Card */}
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700/50 backdrop-blur-sm hover:border-blue-600/50 transition-all">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Total Tokens
          </div>
          <div className="text-2xl font-bold text-white">
            {formatTokens(agent.total_tokens)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {agent.total_tokens.toLocaleString()} tokens
          </div>
        </div>

        {/* Cost Card */}
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 backdrop-blur-sm hover:border-green-600/50 transition-all">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Total Cost
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCost(agent.total_cost)}
          </div>
        </div>

        {/* Time Running Card */}
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Time Running
          </div>
          <div className="text-2xl font-bold text-white">
            {timeRunning}
          </div>
        </div>

        {/* Current Task Card */}
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Current Task
          </div>
          <div className="text-sm text-white line-clamp-2">
            {agent.current_task || 'No active task'}
          </div>
        </div>
      </div>

      {/* Sub-agents Section */}
      {subAgents.length > 0 && (
        <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Sub-agents ({subAgents.length})
          </h3>
          <div className="space-y-2">
            {subAgents.map((subAgent) => (
              <button
                key={subAgent.id}
                onClick={() => window.api.agent.select(subAgent.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {subAgent.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                      {subAgent.name || `Agent ${subAgent.id.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Depth: {subAgent.depth}
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-2 text-xs ${getStatusColor(subAgent.status)}`}>
                  {getStatusIcon(subAgent.status)}
                  <span className="capitalize">{subAgent.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Timeline */}
      <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity Timeline
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
            <div className="flex-1">
              <div className="text-sm text-white">Agent created</div>
              <div className="text-xs text-gray-500">
                {new Date(agent.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          {agent.updated_at && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="text-sm text-white">Last updated</div>
                <div className="text-xs text-gray-500">
                  {new Date(agent.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
