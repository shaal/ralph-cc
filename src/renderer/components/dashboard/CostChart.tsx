import React, { useState } from 'react';
import { CostHistory } from '../../hooks/useCostData';
import { SimpleLineChart } from './SimpleLineChart';

interface CostChartProps {
  data: CostHistory[];
  timeRange: '1h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '1h' | '24h' | '7d' | '30d') => void;
}

export const CostChart: React.FC<CostChartProps> = ({ data, timeRange, onTimeRangeChange }) => {
  const [chartType, setChartType] = useState<'cumulative' | 'incremental'>('cumulative');

  const timeRangeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ] as const;

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    value: chartType === 'cumulative' ? point.cumulative : point.cost,
  }));

  const totalCost = data.length > 0 ? data[data.length - 1].cumulative : 0;
  const avgCost = data.length > 0 ? totalCost / data.length : 0;
  const peakCost = Math.max(...data.map(d => d.cost));

  return (
    <div className="glass-panel p-6 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Cost Over Time</h3>
          <p className="text-sm text-gray-400 mt-1">
            {chartType === 'cumulative' ? 'Cumulative' : 'Incremental'} cost tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setChartType('cumulative')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                chartType === 'cumulative'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cumulative
            </button>
            <button
              onClick={() => setChartType('incremental')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                chartType === 'incremental'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Incremental
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            {timeRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeRange === option.value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatItem
          label="Total"
          value={`$${totalCost.toFixed(2)}`}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatItem
          label="Average"
          value={`$${avgCost.toFixed(4)}`}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatItem
          label="Peak"
          value={`$${peakCost.toFixed(4)}`}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Chart */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-800/30 rounded-lg">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-600 mb-3"
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
            <p className="text-gray-400">No cost data available</p>
            <p className="text-sm text-gray-500 mt-1">Data will appear as agents run</p>
          </div>
        </div>
      ) : (
        <SimpleLineChart
          data={chartData}
          height={300}
          color="#3b82f6"
          gradientColor="#3b82f6"
          showGrid={true}
          showTooltip={true}
          animate={true}
          yAxisLabel="Cost ($)"
          formatValue={(v) => `$${v.toFixed(4)}`}
        />
      )}
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => {
  return (
    <div className="flex items-center gap-3 bg-gray-800/30 rounded-lg p-3">
      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">{icon}</div>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-semibold text-white">{value}</div>
      </div>
    </div>
  );
};
