/**
 * USAGE EXAMPLES for Cost Dashboard
 *
 * This file demonstrates various ways to use the Cost Dashboard components.
 * Copy and adapt these examples for your specific use case.
 */

import React from 'react';
import {
  CostDashboard,
  SummaryCards,
  CostChart,
  ProjectCostBreakdown,
  AgentCostTable,
  BudgetAlert,
  BudgetProgress,
  TokenMetrics,
  CostProjection,
} from './index';
import { useCostData, useBudgetAlert } from '../../hooks';

// ============================================================================
// EXAMPLE 1: Full Dashboard (Simplest)
// ============================================================================

export function Example1_FullDashboard() {
  return <CostDashboard />;
}

// ============================================================================
// EXAMPLE 2: Custom Layout with Selected Components
// ============================================================================

export function Example2_CustomLayout() {
  const { summary, history, byProject } = useCostData('24h');
  const { activeAlert, dismiss, snooze } = useBudgetAlert();

  return (
    <div className="p-6 space-y-6">
      {/* Alert Banner */}
      {activeAlert && (
        <BudgetAlert alert={activeAlert} onDismiss={dismiss} onSnooze={snooze} />
      )}

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Main Chart */}
      <CostChart
        data={history}
        timeRange="24h"
        onTimeRangeChange={(range) => console.log('Time range changed:', range)}
      />

      {/* Project Breakdown */}
      <ProjectCostBreakdown data={byProject} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Project-Specific Dashboard
// ============================================================================

export function Example3_ProjectDashboard({ projectId }: { projectId: string }) {
  const { summary, history, byAgent, tokenMetrics } = useCostData('7d');
  const { activeAlert, dismiss, snooze } = useBudgetAlert({ projectId });

  // Filter data for specific project
  const projectAgents = byAgent.filter(a => a.projectId === projectId);

  return (
    <div className="p-6 space-y-6">
      {activeAlert && (
        <BudgetAlert alert={activeAlert} onDismiss={dismiss} onSnooze={snooze} />
      )}

      <div className="grid grid-cols-2 gap-6">
        <CostChart
          data={history}
          timeRange="7d"
          onTimeRangeChange={() => {}}
        />
        <TokenMetrics metrics={tokenMetrics} />
      </div>

      <AgentCostTable data={projectAgents} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Minimal Cost Overview
// ============================================================================

export function Example4_MinimalOverview() {
  const { summary, byProject } = useCostData('24h');

  return (
    <div className="p-6 space-y-6">
      <SummaryCards summary={summary} />
      <ProjectCostBreakdown data={byProject} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Budget Monitoring Widget
// ============================================================================

export function Example5_BudgetWidget() {
  const { summary } = useCostData('24h');
  const { activeAlert, alerts, dismiss, snooze } = useBudgetAlert({
    playSound: true,
    warningThreshold: 75,
    criticalThreshold: 90,
  });

  return (
    <div className="max-w-md">
      {/* Active Alert */}
      {activeAlert && (
        <BudgetAlert alert={activeAlert} onDismiss={dismiss} onSnooze={snooze} />
      )}

      {/* Budget Progress */}
      {summary && (
        <div className="glass-panel p-4 rounded-xl border border-gray-700 mt-4">
          <h3 className="text-sm font-semibold text-white mb-3">Budget Status</h3>
          <BudgetProgress
            budgetUsed={summary.totalCost}
            budgetTotal={summary.totalCost + summary.budgetRemaining}
            showLabel={true}
            size="lg"
          />

          {/* Alert Count */}
          {alerts.length > 0 && (
            <div className="mt-4 text-sm text-gray-400">
              {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Real-time Cost Monitor
// ============================================================================

export function Example6_RealTimeMonitor() {
  const { summary, history, refresh } = useCostData('1h');
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  // Auto-refresh every 5 seconds
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Live Cost Monitor</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={refresh}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Current Rate */}
      {summary && (
        <div className="glass-panel p-6 rounded-xl border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Current Spending Rate</div>
          <div className="text-4xl font-bold text-white mb-1">
            ${summary.currentRate.toFixed(4)}/hr
          </div>
          <div className="text-sm text-gray-500">
            Estimated ${(summary.currentRate * 24).toFixed(2)}/day
          </div>
        </div>
      )}

      {/* Live Chart */}
      <CostChart data={history} timeRange="1h" onTimeRangeChange={() => {}} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Cost Analytics Page
// ============================================================================

export function Example7_AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState<'1h' | '24h' | '7d' | '30d'>('30d');
  const {
    summary,
    history,
    byProject,
    byAgent,
    tokenMetrics,
    projection,
  } = useCostData(timeRange);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cost Analytics</h1>
          <p className="text-gray-400">Comprehensive cost tracking and analysis</p>
        </div>

        {/* Summary */}
        <SummaryCards summary={summary} />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostChart
            data={history}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
          <ProjectCostBreakdown data={byProject} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TokenMetrics metrics={tokenMetrics} />
          <CostProjection projection={projection} />
        </div>

        {/* Detailed Table */}
        <AgentCostTable data={byAgent} />
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Embedded Cost Widget (for Sidebar)
// ============================================================================

export function Example8_CompactWidget() {
  const { summary } = useCostData('24h');

  if (!summary) return null;

  return (
    <div className="w-64 glass-panel p-4 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Today's Costs</h3>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>

      <div className="space-y-3">
        {/* Today's Cost */}
        <div>
          <div className="text-2xl font-bold text-white">
            ${summary.todayCost.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            {summary.trend >= 0 ? '+' : ''}
            {summary.trend.toFixed(1)}% vs yesterday
          </div>
        </div>

        {/* Current Rate */}
        <div className="pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Current Rate</div>
          <div className="text-sm font-semibold text-white">
            ${summary.currentRate.toFixed(4)}/hr
          </div>
        </div>

        {/* Budget Progress */}
        <BudgetProgress
          budgetUsed={summary.totalCost}
          budgetTotal={summary.totalCost + summary.budgetRemaining}
          size="sm"
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Export Integration
// ============================================================================

export function Example9_ExportIntegration() {
  const { byAgent } = useCostData('30d');

  const handleExport = () => {
    // Generate CSV
    const csv = generateCSV(byAgent);
    downloadCSV(csv, `cost-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Cost Report</h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Export to CSV
        </button>
      </div>
      <AgentCostTable data={byAgent} />
    </div>
  );
}

// Helper functions
function generateCSV(data: any[]): string {
  const headers = ['Agent', 'Project', 'Tokens In', 'Tokens Out', 'Cost', 'Status'];
  const rows = data.map(a => [
    a.agentName,
    a.projectName,
    a.tokensIn,
    a.tokensOut,
    a.cost.toFixed(2),
    a.status,
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
