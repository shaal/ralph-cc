import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type CardVariant = 'default' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[#12121A]/80 backdrop-blur-xl
    border border-[#1E1E2E]
    shadow-lg
  `,
  elevated: `
    bg-[#1A1A24]/90 backdrop-blur-xl
    border border-[#1E1E2E]
    shadow-2xl shadow-black/50
  `,
};

export function Card({
  variant = 'default',
  header,
  footer,
  children,
  hoverable = false,
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={
        hoverable
          ? {
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
            }
          : undefined
      }
      className={cn(
        'rounded-xl overflow-hidden',
        'transition-all duration-300',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-[#1E1E2E] bg-[#0A0A0F]/50">
          {header}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-[#1E1E2E] bg-[#0A0A0F]/50">
          {footer}
        </div>
      )}
    </motion.div>
  );
}
