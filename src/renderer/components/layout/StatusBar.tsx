import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Circle, Activity, DollarSign, Package } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../common/Badge';
import { Tooltip } from '../common/Tooltip';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface StatusBarProps {
  connectionStatus?: ConnectionStatus;
  agentCount?: number;
  activeAgents?: number;
  costRate?: number;
  version?: string;
  customItems?: ReactNode;
}

const statusConfig: Record<
  ConnectionStatus,
  { label: string; color: string; variant: 'success' | 'error' | 'warning' }
> = {
  connected: {
    label: 'Connected',
    color: 'text-[#10B981]',
    variant: 'success',
  },
  disconnected: {
    label: 'Disconnected',
    color: 'text-[#EF4444]',
    variant: 'error',
  },
  connecting: {
    label: 'Connecting',
    color: 'text-[#F59E0B]',
    variant: 'warning',
  },
};

export function StatusBar({
  connectionStatus = 'connected',
  agentCount = 0,
  activeAgents = 0,
  costRate = 0,
  version,
  customItems,
}: StatusBarProps) {
  const status = statusConfig[connectionStatus];

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-[#0A0A0F] text-xs">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <Tooltip content={`API ${status.label}`} position="top">
          <div className="flex items-center gap-2">
            <motion.div
              animate={connectionStatus === 'connecting' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Circle
                size={8}
                className={cn('fill-current', status.color)}
                strokeWidth={0}
              />
            </motion.div>
            <span className="text-[#9CA3AF]">{status.label}</span>
          </div>
        </Tooltip>

        {/* Agent Count */}
        {agentCount > 0 && (
          <Tooltip
            content={`${activeAgents} active out of ${agentCount} total agents`}
            position="top"
          >
            <div className="flex items-center gap-2 text-[#9CA3AF]">
              <Activity size={14} className="text-[#3B82F6]" />
              <span>
                {activeAgents}/{agentCount} agents
              </span>
            </div>
          </Tooltip>
        )}

        {/* Cost Rate */}
        {costRate > 0 && (
          <Tooltip content="Current cost per hour" position="top">
            <div className="flex items-center gap-2 text-[#9CA3AF]">
              <DollarSign size={14} className="text-[#10B981]" />
              <span className="font-mono">${costRate.toFixed(3)}/hr</span>
            </div>
          </Tooltip>
        )}

        {/* Custom Items */}
        {customItems}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Version */}
        {version && (
          <Tooltip content="Application version" position="top">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Package size={14} />
              <span className="font-mono">{version}</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
