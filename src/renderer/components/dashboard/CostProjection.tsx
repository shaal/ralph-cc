import React from 'react';
import { CostProjection as CostProjectionType } from '../../hooks/useCostData';

interface CostProjectionProps {
  projection: CostProjectionType | null;
}

export const CostProjection: React.FC<CostProjectionProps> = ({ projection }) => {
  if (!projection) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-gray-700 animate-pulse">
        <div className="h-48 bg-gray-700 rounded"></div>
      </div>
    );
  }

  const warningColors = {
    safe: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: 'text-green-500' },
    warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: 'text-yellow-500' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: 'text-red-500' },
  };

  const colors = warningColors[projection.warningLevel];

  return (
    <div className={`glass-panel p-6 rounded-xl border-2 ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Cost Projections</h3>
          <p className="text-sm text-gray-400 mt-1">Based on current usage patterns</p>
        </div>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          {projection.warningLevel === 'safe' ? (
            <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : projection.warningLevel === 'warning' ? (
            <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Projection Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Daily Rate */}
        <ProjectionCard
          label="Daily Rate"
          value={`$${projection.dailyRate.toFixed(2)}`}
          subtitle="per day"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Monthly Projection */}
        <ProjectionCard
          label="Monthly Projection"
          value={`$${projection.monthlyProjection.toFixed(2)}`}
          subtitle="estimated"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        {/* Burn Rate */}
        <ProjectionCard
          label="Burn Rate"
          value={`${projection.burnRate.toFixed(2)}%`}
          subtitle="of budget/day"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
        />

        {/* Budget Runway */}
        <ProjectionCard
          label="Budget Runway"
          value={
            projection.daysUntilBudgetDepletion !== null
              ? projection.daysUntilBudgetDepletion < 999
                ? `${Math.floor(projection.daysUntilBudgetDepletion)} days`
                : '∞ days'
              : '∞ days'
          }
          subtitle="at current rate"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          highlight={projection.daysUntilBudgetDepletion !== null && projection.daysUntilBudgetDepletion < 7}
        />
      </div>

      {/* Warning Message */}
      {projection.warningLevel !== 'safe' && (
        <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
          <div className="flex items-start gap-3">
            <svg className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className={`font-medium ${colors.text} mb-1`}>
                {projection.warningLevel === 'critical' ? 'Critical Budget Status' : 'Budget Warning'}
              </div>
              <div className="text-sm text-gray-300">
                {projection.warningLevel === 'critical'
                  ? 'Your budget is nearly depleted. Consider pausing agents or increasing your budget.'
                  : 'Your current spending rate may exceed your budget soon. Monitor your usage closely.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-3">Recommendations</h4>
        <div className="space-y-2">
          {projection.warningLevel === 'critical' && (
            <RecommendationItem
              icon="pause"
              text="Pause non-essential agents to reduce spending"
              priority="high"
            />
          )}
          {projection.burnRate > 5 && (
            <RecommendationItem
              icon="adjust"
              text="Review agent configurations for optimization opportunities"
              priority={projection.warningLevel === 'critical' ? 'high' : 'medium'}
            />
          )}
          {projection.daysUntilBudgetDepletion !== null && projection.daysUntilBudgetDepletion < 30 && (
            <RecommendationItem
              icon="budget"
              text="Consider increasing project budgets or reducing scope"
              priority={projection.daysUntilBudgetDepletion < 7 ? 'high' : 'medium'}
            />
          )}
          {projection.warningLevel === 'safe' && (
            <RecommendationItem
              icon="check"
              text="Budget is healthy. Continue monitoring usage patterns."
              priority="low"
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface ProjectionCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const ProjectionCard: React.FC<ProjectionCardProps> = ({ label, value, subtitle, icon, highlight }) => {
  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 ${highlight ? 'ring-2 ring-yellow-500/50' : ''}`}>
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
};

interface RecommendationItemProps {
  icon: 'pause' | 'adjust' | 'budget' | 'check';
  text: string;
  priority: 'high' | 'medium' | 'low';
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({ icon, text, priority }) => {
  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400',
  };

  const icons = {
    pause: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    adjust: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    budget: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-2 text-sm">
      <div className={priorityColors[priority]}>{icons[icon]}</div>
      <span className="text-gray-300 flex-1">{text}</span>
    </div>
  );
};
