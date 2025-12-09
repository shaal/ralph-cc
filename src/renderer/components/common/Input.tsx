import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export type InputVariant = 'default' | 'search';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', error, prefix, suffix, className, ...props }, ref) => {
    const isSearch = variant === 'search';

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {(prefix || isSearch) && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#6B7280]">
              {isSearch ? <Search size={16} /> : prefix}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2.5',
              'bg-[#12121A] border border-[#1E1E2E]',
              'text-[#F9FAFB] text-sm placeholder:text-[#6B7280]',
              'rounded-lg',
              'transition-all duration-200',
              'focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20',
              'focus:shadow-lg focus:shadow-[#3B82F6]/10',
              'hover:border-[#1E1E2E]/80',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20',
              (prefix || isSearch) && 'pl-10',
              suffix && 'pr-10',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[#6B7280]">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
