/**
 * GraphControls - Custom control panel for the agent graph
 *
 * Features:
 * - Zoom in/out buttons
 * - Fit to view
 * - Toggle minimap
 * - Toggle physics
 * - Layout options (hierarchical, radial)
 * - Filter by status
 */

import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentStatus } from '../../types';

interface GraphControlsProps {
  layoutType: 'hierarchical' | 'radial' | 'force';
  onLayoutChange: (type: 'hierarchical' | 'radial' | 'force') => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  statusFilter?: AgentStatus[];
  onStatusFilterChange?: (statuses: AgentStatus[]) => void;
}

const ControlButton: React.FC<{
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, active, children }) => (
  <motion.button
    onClick={onClick}
    title={title}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`
      p-2 rounded-lg transition-all duration-200
      ${
        active
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
          : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
      }
      border border-border-primary
    `}
  >
    {children}
  </motion.button>
);

const ControlSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="space-y-2">
    <p className="text-xs text-text-secondary uppercase tracking-wide px-2">
      {title}
    </p>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

export const GraphControls: React.FC<GraphControlsProps> = ({
  layoutType,
  onLayoutChange,
  showMinimap,
  onToggleMinimap,
  statusFilter = [],
  onStatusFilterChange,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusToggle = (status: AgentStatus) => {
    if (!onStatusFilterChange) return;

    const newFilter = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status];

    onStatusFilterChange(newFilter);
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <motion.div
        className="bg-bg-secondary/95 backdrop-blur-sm rounded-xl border border-border-primary shadow-2xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main controls (always visible) */}
        <div className="p-3 space-y-2">
          {/* Zoom controls */}
          <div className="flex space-x-2">
            <ControlButton onClick={() => zoomIn()} title="Zoom In">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </ControlButton>

            <ControlButton onClick={() => zoomOut()} title="Zoom Out">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </ControlButton>

            <ControlButton onClick={() => fitView({ duration: 300 })} title="Fit View">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </ControlButton>
          </div>

          {/* Divider */}
          <div className="border-t border-border-primary" />

          {/* Toggle expanded panel */}
          <ControlButton
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Hide Options" : "Show Options"}
            active={isExpanded}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </ControlButton>
        </div>

        {/* Expanded panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border-primary"
            >
              <div className="p-3 space-y-4">
                {/* Layout options */}
                <ControlSection title="Layout">
                  <div className="grid grid-cols-3 gap-2">
                    <ControlButton
                      onClick={() => onLayoutChange('hierarchical')}
                      title="Hierarchical Layout"
                      active={layoutType === 'hierarchical'}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    </ControlButton>

                    <ControlButton
                      onClick={() => onLayoutChange('radial')}
                      title="Radial Layout"
                      active={layoutType === 'radial'}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </ControlButton>

                    <ControlButton
                      onClick={() => onLayoutChange('force')}
                      title="Force Layout"
                      active={layoutType === 'force'}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </ControlButton>
                  </div>
                </ControlSection>

                {/* View options */}
                <ControlSection title="View">
                  <ControlButton
                    onClick={onToggleMinimap}
                    title={showMinimap ? "Hide Minimap" : "Show Minimap"}
                    active={showMinimap}
                  >
                    <div className="flex items-center space-x-2 px-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <span className="text-sm">Minimap</span>
                    </div>
                  </ControlButton>
                </ControlSection>

                {/* Status filters */}
                {onStatusFilterChange && (
                  <ControlSection title="Filter by Status">
                    <div className="space-y-1">
                      {[
                        { status: AgentStatus.WORKING, label: 'Working', color: 'blue' },
                        { status: AgentStatus.IDLE, label: 'Idle', color: 'gray' },
                        { status: AgentStatus.COMPLETED, label: 'Completed', color: 'green' },
                        { status: AgentStatus.FAILED, label: 'Failed', color: 'red' },
                        { status: AgentStatus.PAUSED, label: 'Paused', color: 'yellow' },
                      ].map(({ status, label, color }) => (
                        <button
                          key={status}
                          onClick={() => handleStatusToggle(status)}
                          className={`
                            w-full px-3 py-2 rounded-lg text-sm text-left
                            transition-all duration-200
                            ${
                              statusFilter.includes(status)
                                ? `bg-${color}-500/20 border-${color}-500 text-${color}-300`
                                : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-quaternary'
                            }
                            border
                          `}
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full bg-${color}-400`}
                            />
                            <span>{label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ControlSection>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
