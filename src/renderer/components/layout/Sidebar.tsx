import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { ScrollArea } from '../common/ScrollArea';

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  navigationItems?: SidebarItem[];
  projectItems?: SidebarItem[];
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggle,
  navigationItems = [],
  projectItems = [],
  onSettingsClick,
  onHelpClick,
}: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0F]">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-[#1E1E2E]">
        <motion.div
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-[#3B82F6]/30">
            <Sparkles size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-[#F9FAFB]">Constellation</h1>
              <p className="text-xs text-[#6B7280]">AI Agent Swarm</p>
            </div>
          )}
        </motion.div>

        {/* Toggle Button */}
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle?.(!collapsed)}
            icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            className="flex-shrink-0"
          >
            <span className="sr-only">{collapsed ? 'Expand' : 'Collapse'}</span>
          </Button>
        </Tooltip>
      </div>

      {/* Navigation Items */}
      {navigationItems.length > 0 && (
        <div className="px-2 py-3 border-b border-[#1E1E2E]">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>
      )}

      {/* Projects Section */}
      {projectItems.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 px-2 py-3">
          {!collapsed && (
            <h3 className="px-3 mb-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Projects
            </h3>
          )}
          <ScrollArea className="flex-1">
            <nav className="space-y-1 pb-2">
              {projectItems.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </nav>
          </ScrollArea>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="px-2 py-3 border-t border-[#1E1E2E] space-y-1">
        <Tooltip content="Settings" position="right" delay={collapsed ? 0 : 1000}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            icon={<Settings size={16} />}
            className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
          >
            {!collapsed && 'Settings'}
          </Button>
        </Tooltip>

        <Tooltip content="Help & Support" position="right" delay={collapsed ? 0 : 1000}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelpClick}
            icon={<HelpCircle size={16} />}
            className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
          >
            {!collapsed && 'Help'}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

interface SidebarNavItemProps {
  item: SidebarItem;
  collapsed: boolean;
}

function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const content = (
    <Button
      variant="ghost"
      size="sm"
      onClick={item.onClick}
      icon={item.icon}
      className={cn(
        'w-full',
        collapsed ? 'justify-center px-2' : 'justify-start',
        item.active && [
          'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30',
          'hover:bg-[#3B82F6]/20 hover:text-[#3B82F6]',
        ]
      )}
    >
      {!collapsed && (
        <span className="flex-1 text-left truncate">{item.label}</span>
      )}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-[#3B82F6] text-white rounded-full">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
