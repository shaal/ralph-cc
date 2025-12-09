import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../common/Badge';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface HeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  cost?: number;
  className?: string;
}

export function Header({ title, breadcrumbs, actions, cost, className }: HeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        'px-6 py-4',
        'bg-[#0A0A0F]/80 backdrop-blur-xl',
        // Make draggable for Electron window
        'select-none',
        className
      )}
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Title & Breadcrumbs */}
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div key={index} className="flex items-center gap-2">
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className={cn(
                        'transition-colors',
                        isLast
                          ? 'text-[#F9FAFB] font-medium'
                          : 'text-[#6B7280] hover:text-[#9CA3AF]'
                      )}
                      style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        isLast ? 'text-[#F9FAFB] font-medium' : 'text-[#6B7280]'
                      )}
                    >
                      {item.label}
                    </span>
                  )}

                  {!isLast && (
                    <ChevronRight size={14} className="text-[#6B7280] flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </nav>
        ) : title ? (
          <h1 className="text-lg font-semibold text-[#F9FAFB] truncate">{title}</h1>
        ) : null}
      </div>

      {/* Actions & Cost */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {cost !== undefined && (
          <Badge variant="info" className="font-mono">
            ${cost.toFixed(4)}
          </Badge>
        )}
        {actions}
      </div>
    </div>
  );
}
