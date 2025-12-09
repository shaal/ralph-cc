import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface LinearProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface CircularProgressProps {
  value?: number;
  indeterminate?: boolean;
  size?: number;
  strokeWidth?: number;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function LinearProgress({
  value = 0,
  indeterminate = false,
  size = 'md',
  className,
  ...props
}: LinearProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        'bg-[#1A1A24] rounded-full',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {indeterminate ? (
        <motion.div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-full"
          animate={{
            x: ['-100%', '400%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ) : (
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-full shadow-lg shadow-[#3B82F6]/50"
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

export function CircularProgress({
  value = 0,
  indeterminate = false,
  size = 48,
  strokeWidth = 4,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className={cn(indeterminate && 'animate-spin')}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1A24"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        {indeterminate ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.75}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Value text */}
      {!indeterminate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-[#F9FAFB]">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
    </div>
  );
}
