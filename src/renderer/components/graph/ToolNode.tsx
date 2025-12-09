/**
 * ToolNode - Temporary node for tool execution visualization
 *
 * Features:
 * - Appears when agent calls a tool
 * - Animated entrance and exit
 * - Shows tool name and execution status
 * - Auto-removes after completion
 */

import React, { useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolNodeData } from '../../hooks/useAgentGraph';

// Tool status colors
const TOOL_STATUS_COLORS = {
  running: {
    border: 'border-blue-400',
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    icon: 'text-blue-400',
  },
  completed: {
    border: 'border-green-400',
    bg: 'bg-green-500/20',
    text: 'text-green-300',
    icon: 'text-green-400',
  },
  failed: {
    border: 'border-red-400',
    bg: 'bg-red-500/20',
    text: 'text-red-300',
    icon: 'text-red-400',
  },
};

// Tool icons based on tool name
const getToolIcon = (toolName: string) => {
  const name = toolName.toLowerCase();

  if (name.includes('read') || name.includes('file')) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }

  if (name.includes('write') || name.includes('edit')) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    );
  }

  if (name.includes('bash') || name.includes('command') || name.includes('exec')) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (name.includes('search') || name.includes('grep') || name.includes('find')) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    );
  }

  // Default tool icon
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
};

export const ToolNode: React.FC<NodeProps<ToolNodeData>> = ({ data }) => {
  const [isVisible, setIsVisible] = useState(true);
  const colors = TOOL_STATUS_COLORS[data.status];

  // Auto-remove after completion/failure
  useEffect(() => {
    if (data.status === 'completed' || data.status === 'failed') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000); // Stay visible for 2 seconds after completion

      return () => clearTimeout(timer);
    }
  }, [data.status]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Input handle */}
          <Handle
            type="target"
            position={Position.Top}
            className="w-2 h-2 !bg-purple-400 border-2 border-bg-primary"
          />

          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Main card */}
            <div
              className={`
                relative w-48 rounded-lg backdrop-blur-sm
                border-2 ${colors.border} ${colors.bg}
                shadow-lg hover:shadow-xl
                transition-all duration-300
              `}
            >
              {/* Content */}
              <div className="relative p-3 space-y-2">
                {/* Header */}
                <div className="flex items-center space-x-2">
                  {/* Icon */}
                  <div className={colors.icon}>
                    {getToolIcon(data.toolName)}
                  </div>

                  {/* Tool name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${colors.text} truncate`}>
                      {data.toolName}
                    </p>
                  </div>

                  {/* Status indicator */}
                  {data.status === 'running' && (
                    <motion.div
                      className="flex space-x-1"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    </motion.div>
                  )}

                  {data.status === 'completed' && (
                    <svg
                      className="w-5 h-5 text-green-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}

                  {data.status === 'failed' && (
                    <svg
                      className="w-5 h-5 text-red-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>

                {/* Status text */}
                <p className="text-xs text-text-secondary">
                  {data.status === 'running' && 'Executing...'}
                  {data.status === 'completed' && 'Completed'}
                  {data.status === 'failed' && 'Failed'}
                </p>
              </div>

              {/* Animated progress bar for running tools */}
              {data.status === 'running' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/50 rounded-b-lg"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </div>
          </motion.div>

          {/* Output handle */}
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-2 h-2 !bg-purple-400 border-2 border-bg-primary"
          />
        </>
      )}
    </AnimatePresence>
  );
};
