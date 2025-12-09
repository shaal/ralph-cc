/**
 * AgentMiniMap - Custom minimap styling for the agent graph
 *
 * Features:
 * - Dark theme
 * - Color-coded nodes by status
 * - Current viewport indicator
 * - Styled mask and background
 */

import React from 'react';
import { MiniMap, Node } from '@xyflow/react';
import { AgentStatus } from '../../main/database/types';
import { AgentNodeData } from '../../hooks/useAgentGraph';

// Node color based on agent status
export const getNodeColor = (node: Node<AgentNodeData>): string => {
  if (!node.data) return '#4B5563'; // Gray fallback

  switch (node.data.status) {
    case AgentStatus.IDLE:
      return '#6B7280'; // Gray
    case AgentStatus.WORKING:
      return '#3B82F6'; // Blue
    case AgentStatus.PAUSED:
      return '#EAB308'; // Yellow
    case AgentStatus.COMPLETED:
      return '#22C55E'; // Green
    case AgentStatus.FAILED:
      return '#EF4444'; // Red
    case AgentStatus.CREATED:
      return '#6B7280'; // Gray
    default:
      return '#4B5563';
  }
};

// Custom minimap with dark theme styling
export const AgentMiniMap: React.FC = () => {
  return (
    <MiniMap
      nodeColor={getNodeColor}
      nodeStrokeWidth={3}
      nodeStrokeColor={(node: Node<AgentNodeData>) => {
        // Add stroke for selected nodes
        return 'transparent';
      }}
      nodeBorderRadius={8}
      maskColor="rgba(10, 10, 15, 0.85)"
      maskStrokeColor="rgba(59, 130, 246, 0.5)"
      maskStrokeWidth={2}
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
      }}
      className="react-flow__minimap shadow-2xl"
      position="bottom-left"
      zoomable
      pannable
    />
  );
};
