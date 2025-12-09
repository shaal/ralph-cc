import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6]
    text-white font-medium
    shadow-lg shadow-[#3B82F6]/25
    hover:shadow-xl hover:shadow-[#3B82F6]/40
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:shadow-none
  `,
  secondary: `
    bg-[#1A1A24] border border-[#1E1E2E]
    text-[#F9FAFB] font-medium
    hover:border-[#3B82F6]/50 hover:bg-[#12121A]
    hover:shadow-lg hover:shadow-[#3B82F6]/10
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent
    text-[#9CA3AF] font-medium
    hover:text-[#F9FAFB] hover:bg-[#1A1A24]
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  danger: `
    bg-[#EF4444]/10 border border-[#EF4444]/50
    text-[#EF4444] font-medium
    hover:bg-[#EF4444]/20 hover:border-[#EF4444]
    hover:shadow-lg hover:shadow-[#EF4444]/20
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0F]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}
