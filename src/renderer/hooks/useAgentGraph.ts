/**
 * useAgentGraph - Hook for managing agent graph visualization state
 *
 * Transforms agent data into React Flow compatible nodes and edges,
 * handles real-time updates, and provides auto-layout capabilities.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { Agent, AgentStatus } from '../../main/database/types';

export interface AgentNodeData {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
  tokenCount: number;
  cost: number;
  depth: number;
}

export interface ToolNodeData {
  id: string;
  agentId: string;
  toolName: string;
  status: 'running' | 'completed' | 'failed';
}

interface LayoutConfig {
  type: 'hierarchical' | 'radial' | 'force';
  horizontalSpacing: number;
  verticalSpacing: number;
  startX: number;
  startY: number;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  type: 'hierarchical',
  horizontalSpacing: 250,
  verticalSpacing: 150,
  startX: 100,
  startY: 100,
};

/**
 * Calculate node position based on agent hierarchy
 * Uses hierarchical layout by default (depth-based)
 */
const calculatePosition = (
  agent: Agent,
  allAgents: Agent[],
  layout: LayoutConfig = DEFAULT_LAYOUT
): { x: number; y: number } => {
  if (layout.type === 'hierarchical') {
    // Count siblings at same depth with same parent
    const siblings = allAgents.filter(
      a => a.depth === agent.depth && a.parent_id === agent.parent_id
    );
    const siblingIndex = siblings.findIndex(a => a.id === agent.id);

    const x = layout.startX + (siblingIndex * layout.horizontalSpacing);
    const y = layout.startY + (agent.depth * layout.verticalSpacing);

    return { x, y };
  }

  if (layout.type === 'radial') {
    // Radial layout: root at center, children in circles
    if (agent.depth === 0) {
      return { x: 400, y: 300 }; // Center
    }

    const siblings = allAgents.filter(a => a.depth === agent.depth);
    const siblingIndex = siblings.findIndex(a => a.id === agent.id);
    const angle = (2 * Math.PI * siblingIndex) / siblings.length;
    const radius = agent.depth * 200;

    return {
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
    };
  }

  // Force layout would be handled by a separate physics engine
  // For now, fall back to hierarchical
  return calculatePosition(agent, allAgents, { ...layout, type: 'hierarchical' });
};

/**
 * Build React Flow nodes from agents
 */
const buildNodes = (agents: Agent[], layout: LayoutConfig): Node<AgentNodeData>[] => {
  return agents.map(agent => {
    const position = calculatePosition(agent, agents, layout);

    return {
      id: agent.id,
      type: 'agent',
      position,
      data: {
        id: agent.id,
        name: agent.name || `Agent ${agent.id.slice(0, 8)}`,
        status: agent.status,
        currentTask: agent.current_task || undefined,
        tokenCount: agent.total_tokens,
        cost: agent.total_cost,
        depth: agent.depth,
      },
      draggable: true,
      selectable: true,
    };
  });
};

/**
 * Build React Flow edges from parent-child relationships
 */
const buildEdges = (agents: Agent[]): Edge[] => {
  return agents
    .filter(agent => agent.parent_id)
    .map(agent => ({
      id: `${agent.parent_id}-${agent.id}`,
      source: agent.parent_id!,
      target: agent.id,
      type: 'connection',
      animated: agent.status === AgentStatus.WORKING,
      style: {
        strokeWidth: 2,
      },
    }));
};

/**
 * Main hook for agent graph state
 */
export const useAgentGraph = (projectId: string) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [nodes, setNodes] = useState<Node<AgentNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Load initial agents
  useEffect(() => {
    // TODO: Replace with actual API call when IPC is ready
    // window.api.agent.getByProject(projectId).then(setAgents);

    // Mock data for now
    const mockAgents: Agent[] = [
      {
        id: 'agent-1',
        project_id: projectId,
        parent_id: null,
        name: 'Main Agent',
        status: AgentStatus.WORKING,
        config: '{}',
        current_task: 'Analyzing codebase structure',
        total_tokens: 15420,
        total_cost: 0.0234,
        iteration_count: 3,
        depth: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'agent-2',
        project_id: projectId,
        parent_id: 'agent-1',
        name: 'Research Agent',
        status: AgentStatus.COMPLETED,
        config: '{}',
        current_task: null,
        total_tokens: 8230,
        total_cost: 0.0124,
        iteration_count: 2,
        depth: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'agent-3',
        project_id: projectId,
        parent_id: 'agent-1',
        name: 'Implementation Agent',
        status: AgentStatus.WORKING,
        config: '{}',
        current_task: 'Creating React components',
        total_tokens: 12100,
        total_cost: 0.0182,
        iteration_count: 4,
        depth: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'agent-4',
        project_id: projectId,
        parent_id: 'agent-3',
        name: 'Test Agent',
        status: AgentStatus.IDLE,
        config: '{}',
        current_task: 'Waiting for implementation',
        total_tokens: 1200,
        total_cost: 0.0018,
        iteration_count: 1,
        depth: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    setAgents(mockAgents);
  }, [projectId]);

  // Subscribe to real-time agent updates
  useEffect(() => {
    // TODO: Subscribe to agent events via IPC
    // const unsubscribe = window.api.events.subscribe('agent_updated', (event) => {
    //   if (event.data.projectId === projectId) {
    //     // Update specific agent in state
    //   }
    // });
    //
    // return unsubscribe;
  }, [projectId]);

  // Rebuild nodes and edges when agents or layout changes
  useEffect(() => {
    const newNodes = buildNodes(agents, layout);
    const newEdges = buildEdges(agents);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [agents, layout]);

  // Handle node changes (position, selection, etc.)
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Change layout type
  const changeLayout = useCallback((type: LayoutConfig['type']) => {
    setLayout((prev) => ({ ...prev, type }));
  }, []);

  // Select node
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Get selected agent
  const selectedAgent = useMemo(() => {
    if (!selectedNodeId) return null;
    return agents.find(a => a.id === selectedNodeId) || null;
  }, [selectedNodeId, agents]);

  return {
    nodes,
    edges,
    agents,
    selectedAgent,
    layout: layout.type,
    onNodesChange,
    onEdgesChange,
    changeLayout,
    selectNode,
  };
};
