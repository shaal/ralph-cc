import { HTMLAttributes, ReactNode, useRef, useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ScrollArea({ children, className, ...props }: ScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const checkScrollbar = () => {
      const hasScroll = scrollElement.scrollHeight > scrollElement.clientHeight;
      setShowScrollbar(hasScroll);
    };

    checkScrollbar();

    const resizeObserver = new ResizeObserver(checkScrollbar);
    resizeObserver.observe(scrollElement);

    return () => resizeObserver.disconnect();
  }, [children]);

  const handleScroll = () => {
    setIsScrolling(true);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        'relative overflow-y-auto',
        'custom-scrollbar',
        showScrollbar && isScrolling && 'scrollbar-visible',
        className
      )}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent',
      }}
      {...props}
    >
      {children}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 4px;
          transition: background 0.2s;
        }

        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        .custom-scrollbar.scrollbar-visible::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
