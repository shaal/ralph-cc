import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AppShellProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  inspector?: ReactNode;
  statusBar?: ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
  showInspector?: boolean;
}

export function AppShell({
  sidebar,
  header,
  children,
  inspector,
  statusBar,
  sidebarCollapsed = false,
  onSidebarToggle,
  showInspector = false,
}: AppShellProps) {
  const [isInspectorOpen, setIsInspectorOpen] = useState(showInspector);

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0F] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <motion.aside
            initial={false}
            animate={{
              width: sidebarCollapsed ? 64 : 280,
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="flex-shrink-0 border-r border-[#1E1E2E] bg-[#0A0A0F]"
          >
            {sidebar}
          </motion.aside>
        )}

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          {header && (
            <header className="flex-shrink-0 border-b border-[#1E1E2E] bg-[#0A0A0F]">
              {header}
            </header>
          )}

          {/* Content + Inspector */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Content */}
            <main className="flex-1 overflow-auto custom-scrollbar">{children}</main>

            {/* Inspector Panel */}
            <AnimatePresence>
              {isInspectorOpen && inspector && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="flex-shrink-0 border-l border-[#1E1E2E] bg-[#0A0A0F] overflow-hidden"
                >
                  <div className="h-full overflow-auto custom-scrollbar">{inspector}</div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {statusBar && (
        <footer className="flex-shrink-0 border-t border-[#1E1E2E] bg-[#0A0A0F]">
          {statusBar}
        </footer>
      )}
    </div>
  );
}
