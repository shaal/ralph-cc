import React, { useState } from 'react';
import { useCostData } from '../../hooks/useCostData';
import { useBudgetAlert } from '../../hooks/useBudgetAlert';
import { SummaryCards } from './SummaryCards';
import { CostChart } from './CostChart';
import { ProjectCostBreakdown } from './ProjectCostBreakdown';
import { AgentCostTable } from './AgentCostTable';
import { BudgetAlert } from './BudgetAlert';
import { TokenMetrics } from './TokenMetrics';
import { CostProjection } from './CostProjection';

export const CostDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { summary, history, byProject, byAgent, tokenMetrics, projection, loading, error, refresh } = useCostData(timeRange);
  const { activeAlert, dismiss, snooze } = useBudgetAlert({ playSound: true });

  if (loading && !summary) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Cost Dashboard</h1>
            <p className="text-gray-400">Track and optimize your AI agent spending</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Settings
            </button>
          </div>
        </div>

        {/* Budget Alert */}
        {activeAlert && (
          <BudgetAlert alert={activeAlert} onDismiss={dismiss} onSnooze={snooze} />
        )}

        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostChart data={history} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          <ProjectCostBreakdown data={byProject} />
        </div>

        {/* Token Metrics and Projections Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TokenMetrics metrics={tokenMetrics} />
          <CostProjection projection={projection} />
        </div>

        {/* Agent Cost Table */}
        <AgentCostTable data={byAgent} />

        {/* Footer Info */}
        <div className="glass-panel p-4 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Live Updates</span>
              </div>
              <div>Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">All costs are in USD. Token pricing varies by model.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-64 bg-gray-800 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-800 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel p-6 rounded-xl border border-gray-700 animate-pulse">
              <div className="h-20 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="glass-panel p-6 rounded-xl border border-gray-700 animate-pulse">
              <div className="h-80 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Loading Text */}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 text-lg font-medium">Loading cost data...</p>
            <p className="text-gray-500 text-sm mt-2">Fetching metrics and analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-red-500/10 rounded-full">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Failed to Load Cost Data</h2>
            <p className="text-gray-400 mb-6">
              {error.message || 'An unexpected error occurred while fetching cost data.'}
            </p>
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add glass panel styles if not already present
const style = document.createElement('style');
style.textContent = `
  .glass-panel {
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
`;
if (!document.getElementById('cost-dashboard-styles')) {
  style.id = 'cost-dashboard-styles';
  document.head.appendChild(style);
}
