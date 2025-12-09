import React from 'react';
import { CostSummary } from '../../hooks/useCostData';

interface SummaryCardsProps {
  summary: CostSummary | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-panel p-6 rounded-xl animate-pulse">
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'total',
      label: 'Total Cost',
      value: `$${summary.totalCost.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'blue',
      trend: null,
    },
    {
      id: 'today',
      label: "Today's Cost",
      value: `$${summary.todayCost.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'green',
      trend: summary.trend,
    },
    {
      id: 'rate',
      label: 'Current Rate',
      value: `$${summary.currentRate.toFixed(2)}/hr`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'purple',
      trend: null,
    },
    {
      id: 'budget',
      label: 'Budget Remaining',
      value: `$${summary.budgetRemaining.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: summary.budgetRemaining > 10 ? 'teal' : summary.budgetRemaining > 5 ? 'yellow' : 'red',
      trend: null,
      subtitle: summary.estimatedRunway < 999 ? `~${summary.estimatedRunway} days remaining` : '∞ days',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <SummaryCard key={card.id} card={card} index={index} />
      ))}
    </div>
  );
};

interface CardData {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend: number | null;
  subtitle?: string;
}

const SummaryCard: React.FC<{ card: CardData; index: number }> = ({ card, index }) => {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  };

  const colors = colorClasses[card.color] || colorClasses.blue;

  return (
    <div
      className={`glass-panel p-6 rounded-xl border ${colors.border} transition-all duration-300 hover:scale-105 hover:shadow-lg`}
      style={{
        animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <div className={colors.text}>{card.icon}</div>
        </div>
        {card.trend !== null && (
          <TrendIndicator trend={card.trend} />
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold text-white">{card.value}</div>
        <div className="text-sm text-gray-400">{card.label}</div>
        {card.subtitle && (
          <div className="text-xs text-gray-500 mt-2">{card.subtitle}</div>
        )}
      </div>

      {/* Sparkline placeholder - could be enhanced with actual data */}
      <div className="mt-4 h-8">
        <MiniSparkline color={card.color} />
      </div>
    </div>
  );
};

const TrendIndicator: React.FC<{ trend: number }> = ({ trend }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isNeutral
          ? 'bg-gray-500/10 text-gray-400'
          : isPositive
          ? 'bg-green-500/10 text-green-400'
          : 'bg-red-500/10 text-red-400'
      }`}
    >
      {!isNeutral && (
        <svg
          className={`w-3 h-3 ${isPositive ? 'rotate-0' : 'rotate-180'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{Math.abs(trend).toFixed(1)}%</span>
    </div>
  );
};

const MiniSparkline: React.FC<{ color: string }> = ({ color }) => {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    teal: '#14b8a6',
    yellow: '#f59e0b',
    red: '#ef4444',
  };

  const lineColor = colorMap[color] || colorMap.blue;

  // Generate random sparkline data for demo
  const points = Array.from({ length: 20 }, (_, i) => ({
    x: (i / 19) * 100,
    y: 30 + Math.random() * 40,
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: lineColor, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: lineColor, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L 100 100 L 0 100 Z`}
        fill={`url(#gradient-${color})`}
        opacity="0.5"
      />
      <path
        d={pathData}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// Add keyframe animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
