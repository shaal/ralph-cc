/**
 * ConnectionEdge - Custom animated edge for agent connections
 *
 * Features:
 * - Gradient stroke from parent to child
 * - Animated dash pattern when data flowing
 * - Different styles for different connection types
 * - Smooth transitions
 */

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { motion } from 'framer-motion';

export enum EdgeType {
  PARENT_CHILD = 'parent_child',
  COMMUNICATION = 'communication',
  DATA_FLOW = 'data_flow',
}

interface ConnectionEdgeData {
  type?: EdgeType;
  label?: string;
}

// Edge styling based on type
const EDGE_STYLES = {
  [EdgeType.PARENT_CHILD]: {
    stroke: 'url(#gradient-blue)',
    strokeWidth: 2,
    strokeDasharray: '0',
  },
  [EdgeType.COMMUNICATION]: {
    stroke: 'url(#gradient-purple)',
    strokeWidth: 1.5,
    strokeDasharray: '5,5',
  },
  [EdgeType.DATA_FLOW]: {
    stroke: 'url(#gradient-cyan)',
    strokeWidth: 2,
    strokeDasharray: '0',
  },
};

export const ConnectionEdge: React.FC<EdgeProps<ConnectionEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
  animated,
}) => {
  const edgeType = data?.type || EdgeType.PARENT_CHILD;
  const edgeStyle = EDGE_STYLES[edgeType];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Gradient definitions */}
      <svg width="0" height="0">
        <defs>
          {/* Blue gradient for parent-child */}
          <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </linearGradient>

          {/* Purple gradient for communication */}
          <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.6" />
          </linearGradient>

          {/* Cyan gradient for data flow */}
          <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Background path (wider, for better hover area) */}
      <path
        id={`${id}-bg`}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={edgeStyle.strokeWidth + 8}
        stroke="transparent"
        fill="none"
      />

      {/* Main path */}
      <motion.path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={edgeStyle.strokeWidth}
        stroke={edgeStyle.stroke}
        strokeDasharray={edgeStyle.strokeDasharray}
        fill="none"
        markerEnd={markerEnd}
        style={{
          ...style,
          filter: selected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none',
        }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Animated dash flow for animated edges */}
      {animated && (
        <motion.path
          d={edgePath}
          strokeWidth={edgeStyle.strokeWidth}
          stroke={edgeStyle.stroke}
          strokeDasharray="5,5"
          fill="none"
          strokeDashoffset={0}
          animate={{
            strokeDashoffset: [0, -10],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Edge label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className={`
                px-2 py-1 rounded-md text-xs font-medium
                bg-bg-secondary/90 backdrop-blur-sm
                border border-border-primary
                text-text-secondary
                shadow-lg
              `}
            >
              {data.label}
            </motion.div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
