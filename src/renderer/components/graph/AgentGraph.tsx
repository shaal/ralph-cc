/**
 * AgentGraph - Main graph container for agent visualization
 *
 * Uses @xyflow/react (React Flow v12) to create a stunning
 * visualization of the agent swarm with real-time updates.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  NodeTypes,
  EdgeTypes,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAgentGraph } from '../../hooks/useAgentGraph';
import { AgentNode } from './AgentNode';
import { ToolNode } from './ToolNode';
import { ConnectionEdge } from './ConnectionEdge';
import { GraphControls } from './GraphControls';
import { AgentMiniMap, getNodeColor } from './AgentMiniMap';
import { AgentStatus } from '../../main/database/types';

interface AgentGraphProps {
  projectId: string;
  onNodeClick?: (nodeId: string) => void;
}

// Register custom node types
const nodeTypes: NodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
  connection: ConnectionEdge,
};

// Default viewport
const defaultViewport = { x: 0, y: 0, zoom: 1 };

// Background grid colors
const BACKGROUND_COLOR = '#0A0A0F';
const GRID_COLOR = '#1E1E2E';

const AgentGraphInner: React.FC<AgentGraphProps> = ({ projectId, onNodeClick }) => {
  const {
    nodes,
    edges,
    layout,
    onNodesChange,
    onEdgesChange,
    changeLayout,
    selectNode,
    selectedAgent,
  } = useAgentGraph(projectId);

  const [showMinimap, setShowMinimap] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AgentStatus[]>([]);

  // Filter nodes based on status
  const filteredNodes = useMemo(() => {
    if (statusFilter.length === 0) return nodes;

    return nodes.filter(node => {
      if (node.type === 'agent' && node.data) {
        return statusFilter.includes(node.data.status);
      }
      return true;
    });
  }, [nodes, statusFilter]);

  // Filter edges to only show connections between visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
      onNodeClick?.(node.id);
    },
    [selectNode, onNodeClick]
  );

  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Prevent connections (agents don't manually connect)
  const onConnect = useCallback((_connection: Connection) => {
    // Do nothing - connections are managed by agent hierarchy
  }, []);

  return (
    <div className="h-full w-full relative" style={{ backgroundColor: BACKGROUND_COLOR }}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        nodesDraggable={true}
        nodesConnectable={false}
        nodesFocusable={true}
        edgesFocusable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        defaultViewport={defaultViewport}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null} // Disable delete key
        multiSelectionKeyCode={null} // Disable multi-selection
        className="constellation-graph"
      >
        {/* Animated dot background */}
        <Background
          color={GRID_COLOR}
          gap={20}
          size={1}
          variant="dots"
        />

        {/* Built-in controls (will be hidden, we use custom ones) */}
        <Controls
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="hidden"
        />

        {/* Custom minimap */}
        {showMinimap && <AgentMiniMap />}

        {/* Info panel */}
        <Panel position="top-left" className="space-y-2">
          <div className="bg-bg-secondary/95 backdrop-blur-sm rounded-xl border border-border-primary shadow-2xl p-4">
            <div className="space-y-3">
              {/* Project info */}
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">
                  Project
                </p>
                <p className="text-sm font-semibold text-text-primary">
                  {projectId.slice(0, 8)}...
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary">Agents</p>
                  <p className="text-lg font-bold text-text-primary">
                    {filteredNodes.filter(n => n.type === 'agent').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Active</p>
                  <p className="text-lg font-bold text-blue-400">
                    {
                      filteredNodes.filter(
                        n => n.type === 'agent' && n.data?.status === AgentStatus.WORKING
                      ).length
                    }
                  </p>
                </div>
              </div>

              {/* Selected agent info */}
              {selectedAgent && (
                <div className="pt-3 border-t border-border-primary">
                  <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">
                    Selected Agent
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {selectedAgent.name || `Agent ${selectedAgent.id.slice(0, 8)}`}
                    </p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-text-secondary">
                        {selectedAgent.total_tokens.toLocaleString()} tokens
                      </span>
                      <span className="text-text-secondary">•</span>
                      <span className="text-text-secondary">
                        ${selectedAgent.total_cost.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Custom controls */}
        <GraphControls
          layoutType={layout}
          onLayoutChange={changeLayout}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Legend */}
        <Panel position="bottom-right" className="space-y-2">
          <div className="bg-bg-secondary/95 backdrop-blur-sm rounded-xl border border-border-primary shadow-2xl p-3">
            <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">
              Status
            </p>
            <div className="space-y-1.5">
              {[
                { status: AgentStatus.WORKING, label: 'Working', color: 'bg-blue-400' },
                { status: AgentStatus.IDLE, label: 'Idle', color: 'bg-gray-400' },
                { status: AgentStatus.COMPLETED, label: 'Completed', color: 'bg-green-400' },
                { status: AgentStatus.FAILED, label: 'Failed', color: 'bg-red-400' },
                { status: AgentStatus.PAUSED, label: 'Paused', color: 'bg-yellow-400' },
              ].map(({ status, label, color }) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrapped with ReactFlowProvider
export const AgentGraph: React.FC<AgentGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <AgentGraphInner {...props} />
    </ReactFlowProvider>
  );
};
