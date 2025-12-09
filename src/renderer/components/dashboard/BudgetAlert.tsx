import React from 'react';
import { BudgetAlert as BudgetAlertType } from '../../hooks/useBudgetAlert';

interface BudgetAlertProps {
  alert: BudgetAlertType | null;
  onDismiss: (alertId: string) => void;
  onSnooze: (alertId: string, minutes: number) => void;
}

export const BudgetAlert: React.FC<BudgetAlertProps> = ({ alert, onDismiss, onSnooze }) => {
  if (!alert || alert.snoozedUntil) return null;

  const isCritical = alert.level === 'critical';

  return (
    <div
      className={`glass-panel p-4 rounded-xl border-2 ${
        isCritical ? 'border-red-500/50 bg-red-500/5' : 'border-yellow-500/50 bg-yellow-500/5'
      } animate-slideInDown`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex-shrink-0 p-2 rounded-lg ${
            isCritical ? 'bg-red-500/10' : 'bg-yellow-500/10'
          }`}
        >
          {isCritical ? (
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4
                className={`text-sm font-semibold ${
                  isCritical ? 'text-red-400' : 'text-yellow-400'
                }`}
              >
                {isCritical ? 'Critical Budget Alert' : 'Budget Warning'}
              </h4>
              <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Budget Usage</span>
              <span>{alert.percentageUsed.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCritical
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                }`}
                style={{ width: `${Math.min(100, alert.percentageUsed)}%` }}
              >
                <div className="h-full w-full bg-white/20 animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-800/50 rounded-lg p-2">
              <div className="text-xs text-gray-400">Remaining</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                ${alert.budgetRemaining.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2">
              <div className="text-xs text-gray-400">Total Budget</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                ${alert.budgetTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSnooze(alert.id, 30)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Snooze 30m
            </button>
            <button
              onClick={() => onSnooze(alert.id, 60)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Snooze 1h
            </button>
            <button
              onClick={() => onDismiss(alert.id)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(alert.id)}
          className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface BudgetProgressProps {
  projectId?: string;
  budgetUsed: number;
  budgetTotal: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  budgetUsed,
  budgetTotal,
  showLabel = true,
  size = 'md',
}) => {
  const percentage = (budgetUsed / budgetTotal) * 100;

  let color = 'green';
  if (percentage >= 90) color = 'red';
  else if (percentage >= 75) color = 'yellow';

  const colorClasses = {
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
  };

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Budget</span>
          <span>
            ${budgetUsed.toFixed(2)} / ${budgetTotal.toFixed(2)} ({percentage.toFixed(1)}%)
          </span>
        </div>
      )}
      <div className={`${heights[size]} bg-gray-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full transition-all duration-500 bg-gradient-to-r ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        >
          <div className="h-full w-full bg-white/20 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-slideInDown {
    animation: slideInDown 0.5s ease-out;
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
if (!document.getElementById('budget-alert-styles')) {
  style.id = 'budget-alert-styles';
  document.head.appendChild(style);
}
