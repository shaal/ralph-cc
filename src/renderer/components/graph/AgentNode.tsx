/**
 * AgentNode - Stunning visual representation of an AI agent
 *
 * Features:
 * - Glass-morphism background with gradient borders
 * - Animated glow effects when working
 * - Status indicator with color coding
 * - Real-time task and metrics display
 * - Smooth hover and selection states
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { AgentStatus } from '../../types';
import { AgentNodeData } from '../../hooks/useAgentGraph';

// Status color mappings
const STATUS_COLORS = {
  [AgentStatus.IDLE]: {
    border: 'border-gray-500',
    glow: 'shadow-gray-500/30',
    dot: 'bg-gray-400',
    bg: 'bg-gray-900/40',
  },
  [AgentStatus.WORKING]: {
    border: 'border-blue-500',
    glow: 'shadow-blue-500/50',
    dot: 'bg-blue-400',
    bg: 'bg-blue-900/20',
  },
  [AgentStatus.PAUSED]: {
    border: 'border-yellow-500',
    glow: 'shadow-yellow-500/40',
    dot: 'bg-yellow-400',
    bg: 'bg-yellow-900/20',
  },
  [AgentStatus.COMPLETED]: {
    border: 'border-green-500',
    glow: 'shadow-green-500/40',
    dot: 'bg-green-400',
    bg: 'bg-green-900/20',
  },
  [AgentStatus.FAILED]: {
    border: 'border-red-500',
    glow: 'shadow-red-500/40',
    dot: 'bg-red-400',
    bg: 'bg-red-900/20',
  },
  [AgentStatus.CREATED]: {
    border: 'border-gray-600',
    glow: 'shadow-gray-500/20',
    dot: 'bg-gray-500',
    bg: 'bg-gray-900/30',
  },
};

// Agent icon based on depth
const AgentIcon: React.FC<{ depth: number }> = ({ depth }) => {
  if (depth === 0) {
    // Root agent - crown icon
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    );
  }

  // Sub-agents - robot icon
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
};

// Format cost display
const formatCost = (cost: number): string => {
  if (cost < 0.01) return `$${(cost * 1000).toFixed(2)}m`;
  return `$${cost.toFixed(4)}`;
};

// Format token count
const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
};

export const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ data, selected }) => {
  const colors = STATUS_COLORS[data.status];
  const isWorking = data.status === AgentStatus.WORKING;

  return (
    <>
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 border-2 border-bg-primary"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative"
      >
        {/* Glow effect for working agents */}
        {isWorking && (
          <motion.div
            className={`absolute inset-0 rounded-xl ${colors.glow} blur-xl`}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main card */}
        <motion.div
          className={`
            relative w-64 rounded-xl backdrop-blur-sm
            border-2 ${colors.border} ${colors.bg}
            transition-all duration-300
            ${selected ? 'ring-4 ring-blue-400/50 shadow-2xl' : 'shadow-lg'}
            hover:shadow-2xl hover:scale-105
          `}
          whileHover={{ y: -2 }}
        >
          {/* Gradient overlay */}
          <div
            className={`
            absolute inset-0 rounded-xl opacity-10
            bg-gradient-to-br from-white to-transparent
            pointer-events-none
          `}
          />

          {/* Content */}
          <div className="relative p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* Status indicator */}
                <div className="relative flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                  {isWorking && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${colors.dot}`}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    />
                  )}
                </div>

                {/* Name */}
                <h3 className="font-semibold text-sm text-text-primary truncate">
                  {data.name}
                </h3>
              </div>

              {/* Agent icon */}
              <div className="flex-shrink-0 text-text-secondary">
                <AgentIcon depth={data.depth} />
              </div>
            </div>

            {/* Current task */}
            {data.currentTask && (
              <div className="space-y-1">
                <p className="text-xs text-text-secondary uppercase tracking-wide">
                  Current Task
                </p>
                <p className="text-sm text-text-primary line-clamp-2">
                  {data.currentTask}
                </p>
              </div>
            )}

            {/* Metrics */}
            <div className="flex items-center justify-between pt-2 border-t border-border-primary/30">
              {/* Tokens */}
              <div className="flex items-center space-x-1 text-xs">
                <svg
                  className="w-4 h-4 text-text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <span className="text-text-secondary">
                  {formatTokens(data.tokenCount)}
                </span>
              </div>

              {/* Cost */}
              <div className="flex items-center space-x-1 text-xs">
                <svg
                  className="w-4 h-4 text-text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-text-secondary font-mono">
                  {formatCost(data.cost)}
                </span>
              </div>

              {/* Depth badge */}
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-text-secondary">L{data.depth}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500 border-2 border-bg-primary"
      />
    </>
  );
};
