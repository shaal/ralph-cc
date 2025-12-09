import React, { useRef, useEffect } from 'react';
import { TokenMetrics as TokenMetricsType } from '../../hooks/useCostData';

interface TokenMetricsProps {
  metrics: TokenMetricsType | null;
}

export const TokenMetrics: React.FC<TokenMetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-gray-700 animate-pulse">
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  const totalTokens = metrics.totalInputTokens + metrics.totalOutputTokens;
  const inputPercentage = totalTokens > 0 ? (metrics.totalInputTokens / totalTokens) * 100 : 50;
  const outputPercentage = totalTokens > 0 ? (metrics.totalOutputTokens / totalTokens) * 100 : 50;

  return (
    <div className="glass-panel p-6 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Token Usage</h3>
          <p className="text-sm text-gray-400 mt-1">
            {totalTokens.toLocaleString()} total tokens
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <DonutChart
            inputTokens={metrics.totalInputTokens}
            outputTokens={metrics.totalOutputTokens}
          />
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {/* Input Tokens */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-white">Input Tokens</span>
              </div>
              <span className="text-xs text-gray-400">{inputPercentage.toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.totalInputTokens.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              Cost: ${metrics.inputCost.toFixed(4)}
            </div>
          </div>

          {/* Output Tokens */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm font-medium text-white">Output Tokens</span>
              </div>
              <span className="text-xs text-gray-400">{outputPercentage.toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.totalOutputTokens.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              Cost: ${metrics.outputCost.toFixed(4)}
            </div>
          </div>

          {/* Efficiency */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-white">Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {metrics.efficiency.toFixed(0)}
            </div>
            <div className="text-xs text-gray-400">tokens per dollar</div>
          </div>
        </div>
      </div>

      {/* Token Breakdown */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-2">Total Cost</div>
            <div className="text-lg font-semibold text-white">
              ${(metrics.inputCost + metrics.outputCost).toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">Avg Cost per 1K Tokens</div>
            <div className="text-lg font-semibold text-white">
              ${totalTokens > 0 ? (((metrics.inputCost + metrics.outputCost) / totalTokens) * 1000).toFixed(4) : '0.0000'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DonutChartProps {
  inputTokens: number;
  outputTokens: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ inputTokens, outputTokens }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 70;
    const thickness = 25;

    const total = inputTokens + outputTokens;
    const inputAngle = total > 0 ? (inputTokens / total) * 2 * Math.PI : Math.PI;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    // Draw input tokens arc (blue)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + inputAngle);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw output tokens arc (purple)
    if (outputTokens > 0) {
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2 + inputAngle,
        -Math.PI / 2 + 2 * Math.PI
      );
      ctx.lineWidth = thickness;
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - thickness / 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Draw center text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total > 0 ? formatNumber(total) : '0', centerX, centerY - 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('tokens', centerX, centerY + 10);

    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + inputAngle);
    ctx.lineWidth = thickness + 2;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.stroke();

    ctx.shadowColor = '#8b5cf6';
    if (outputTokens > 0) {
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2 + inputAngle,
        -Math.PI / 2 + 2 * Math.PI
      );
      ctx.lineWidth = thickness + 2;
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.stroke();
    }
  }, [inputTokens, outputTokens]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '200px', height: '200px' }}
      className="mx-auto"
    />
  );
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
