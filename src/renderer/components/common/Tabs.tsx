import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type TabsVariant = 'default' | 'pills';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: TabsVariant;
  onChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTab, variant = 'default', onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      {/* Tab List */}
      <div
        className={cn(
          'flex gap-1',
          variant === 'default' && 'border-b border-[#1E1E2E]',
          variant === 'pills' && 'p-1 bg-[#0A0A0F] rounded-lg'
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium',
                'transition-colors duration-200',
                'focus:outline-none',
                variant === 'default' && [
                  'rounded-t-lg',
                  isActive
                    ? 'text-[#3B82F6]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]',
                ],
                variant === 'pills' && [
                  'rounded-md',
                  isActive
                    ? 'text-[#F9FAFB] bg-[#1A1A24] shadow-lg'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#12121A]',
                ]
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
              </span>

              {/* Animated Indicator for default variant */}
              {variant === 'default' && isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-4"
      >
        {activeTabContent}
      </motion.div>
    </div>
  );
}
