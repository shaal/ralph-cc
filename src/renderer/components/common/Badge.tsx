import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
  pulse?: boolean;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: {
    bg: 'bg-[#1A1A24] border-[#1E1E2E]',
    text: 'text-[#9CA3AF]',
    dot: 'bg-[#9CA3AF]',
  },
  success: {
    bg: 'bg-[#10B981]/10 border-[#10B981]/30',
    text: 'text-[#10B981]',
    dot: 'bg-[#10B981]',
  },
  warning: {
    bg: 'bg-[#F59E0B]/10 border-[#F59E0B]/30',
    text: 'text-[#F59E0B]',
    dot: 'bg-[#F59E0B]',
  },
  error: {
    bg: 'bg-[#EF4444]/10 border-[#EF4444]/30',
    text: 'text-[#EF4444]',
    dot: 'bg-[#EF4444]',
  },
  info: {
    bg: 'bg-[#3B82F6]/10 border-[#3B82F6]/30',
    text: 'text-[#3B82F6]',
    dot: 'bg-[#3B82F6]',
  },
};

export function Badge({
  variant = 'default',
  children,
  pulse = false,
  dot = false,
  className,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-1',
        'text-xs font-medium',
        'rounded-full border',
        styles.bg,
        styles.text,
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <motion.span
              className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', styles.dot)}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.75, 0, 0.75],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', styles.dot)} />
        </span>
      )}
      {children}
    </motion.span>
  );
}
