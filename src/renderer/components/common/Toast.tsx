import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const toastConfig: Record<
  ToastType,
  { icon: ReactNode; colors: { bg: string; border: string; icon: string } }
> = {
  success: {
    icon: <CheckCircle2 size={20} />,
    colors: {
      bg: 'bg-[#10B981]/10',
      border: 'border-[#10B981]/30',
      icon: 'text-[#10B981]',
    },
  },
  error: {
    icon: <XCircle size={20} />,
    colors: {
      bg: 'bg-[#EF4444]/10',
      border: 'border-[#EF4444]/30',
      icon: 'text-[#EF4444]',
    },
  },
  warning: {
    icon: <AlertCircle size={20} />,
    colors: {
      bg: 'bg-[#F59E0B]/10',
      border: 'border-[#F59E0B]/30',
      icon: 'text-[#F59E0B]',
    },
  },
  info: {
    icon: <Info size={20} />,
    colors: {
      bg: 'bg-[#3B82F6]/10',
      border: 'border-[#3B82F6]/30',
      icon: 'text-[#3B82F6]',
    },
  },
};

function ToastItem({ id, type, title, description, duration = 5000, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const config = toastConfig[type];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        onClose(id);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: 100 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={cn(
        'relative flex items-start gap-3 w-full max-w-sm',
        'p-4 rounded-lg border',
        'bg-[#12121A]/95 backdrop-blur-xl',
        'shadow-2xl',
        config.colors.bg,
        config.colors.border
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0', config.colors.icon)}>{config.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[#F9FAFB]">{title}</h4>
        {description && <p className="mt-1 text-xs text-[#9CA3AF]">{description}</p>}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-[#6B7280] hover:text-[#F9FAFB] transition-colors"
      >
        <X size={16} />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1A1A24] rounded-b-lg overflow-hidden">
        <motion.div
          className={cn('h-full', config.colors.icon.replace('text-', 'bg-'))}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts?: Toast[];
  onClose?: (id: string) => void;
}

/**
 * ToastContainer - Renders toast notifications
 * Can be used in two modes:
 * 1. Controlled: Pass toasts and onClose props
 * 2. Standalone: Uses internal state (renders empty until toasts are added externally)
 */
export function ToastContainer({ toasts: externalToasts, onClose: externalOnClose }: ToastContainerProps) {
  const [internalToasts, setInternalToasts] = useState<Toast[]>([]);

  const toasts = externalToasts ?? internalToasts;
  const onClose = externalOnClose ?? ((id: string) => {
    setInternalToasts((prev) => prev.filter((t) => t.id !== id));
  });

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem {...toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Toast Manager Hook
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
  };
}
