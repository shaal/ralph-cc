import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { Node, Edge, Viewport, NodeData } from './types';

type LayoutType = 'hierarchical' | 'radial' | 'force';

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  selectedNodeId: string | null;
  layoutType: LayoutType;
  autoLayout: boolean;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;

  // Layout
  applyLayout: (type: LayoutType) => void;
  setAutoLayout: (enabled: boolean) => void;
  resetGraph: () => void;

  // Selectors
  getNodeById: (id: string) => Node | undefined;
  getEdgesForNode: (nodeId: string) => Edge[];
  getConnectedNodes: (nodeId: string) => Node[];
}

// Helper function for hierarchical layout
const applyHierarchicalLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return nodes;

  // Build parent-child relationships
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  edges.forEach((edge) => {
    const children = childrenMap.get(edge.source) || [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
    parentMap.set(edge.target, edge.source);
  });

  // Find root nodes (nodes with no parents)
  const roots = nodes.filter((node) => !parentMap.has(node.id));
  const positioned = new Set<string>();
  const result: Node[] = [];

  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 150;

  const positionNode = (
    node: Node,
    x: number,
    y: number,
    level: number
  ): number => {
    const positioned_node = {
      ...node,
      position: { x, y },
    };
    result.push(positioned_node);
    positioned.add(node.id);

    const children = childrenMap.get(node.id) || [];
    let childX = x;

    children.forEach((childId) => {
      const childNode = nodes.find((n) => n.id === childId);
      if (childNode && !positioned.has(childId)) {
        childX = positionNode(
          childNode,
          childX,
          y + VERTICAL_SPACING,
          level + 1
        );
        childX += HORIZONTAL_SPACING;
      }
    });

    return Math.max(x + HORIZONTAL_SPACING, childX);
  };

  // Position root nodes and their children
  let currentX = 0;
  roots.forEach((root) => {
    currentX = positionNode(root, currentX, 0, 0);
    currentX += HORIZONTAL_SPACING;
  });

  // Add any remaining nodes that weren't positioned (orphans)
  nodes.forEach((node) => {
    if (!positioned.has(node.id)) {
      result.push({ ...node, position: { x: currentX, y: 0 } });
      currentX += HORIZONTAL_SPACING;
    }
  });

  return result;
};

// Helper function for radial layout
const applyRadialLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return nodes;
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: 0, y: 0 } }];
  }

  const result: Node[] = [];
  const radius = 200;
  const angleStep = (2 * Math.PI) / nodes.length;

  nodes.forEach((node, index) => {
    const angle = index * angleStep;
    result.push({
      ...node,
      position: {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      },
    });
  });

  return result;
};

// Simple force-directed layout simulation (basic implementation)
const applyForceLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return nodes;

  const result = nodes.map((node, index) => ({
    ...node,
    position: node.position || {
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200,
    },
  }));

  // Simple force-directed algorithm (could be enhanced with proper physics)
  const iterations = 50;
  const repulsion = 100;
  const attraction = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = result.map(() => ({ x: 0, y: 0 }));

    // Repulsion between all nodes
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].position.x - result[i].position.x;
        const dy = result[j].position.y - result[i].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (distance * distance);

        forces[i].x -= (dx / distance) * force;
        forces[i].y -= (dy / distance) * force;
        forces[j].x += (dx / distance) * force;
        forces[j].y += (dy / distance) * force;
      }
    }

    // Attraction along edges
    edges.forEach((edge) => {
      const sourceIdx = result.findIndex((n) => n.id === edge.source);
      const targetIdx = result.findIndex((n) => n.id === edge.target);
      if (sourceIdx === -1 || targetIdx === -1) return;

      const dx = result[targetIdx].position.x - result[sourceIdx].position.x;
      const dy = result[targetIdx].position.y - result[sourceIdx].position.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = distance * attraction;

      forces[sourceIdx].x += dx * force;
      forces[sourceIdx].y += dy * force;
      forces[targetIdx].x -= dx * force;
      forces[targetIdx].y -= dy * force;
    });

    // Apply forces
    result.forEach((node, i) => {
      node.position.x += forces[i].x;
      node.position.y += forces[i].y;
    });
  }

  return result;
};

export const useGraphStore = create<GraphState>()(
  devtools(
    immer((set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeId: null,
      layoutType: 'hierarchical',
      autoLayout: true,

      setNodes: (nodes) => {
        set({ nodes });
      },

      setEdges: (edges) => {
        set({ edges });
      },

      updateNode: (id, data) => {
        set((state) => {
          const index = state.nodes.findIndex((n) => n.id === id);
          if (index !== -1) {
            state.nodes[index].data = { ...state.nodes[index].data, ...data };
          }
        });
      },

      addNode: (node) => {
        set((state) => {
          state.nodes.push(node);
        });

        // Auto-apply layout if enabled
        if (get().autoLayout) {
          get().applyLayout(get().layoutType);
        }
      },

      removeNode: (id) => {
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter(
            (e) => e.source !== id && e.target !== id
          );
          if (state.selectedNodeId === id) {
            state.selectedNodeId = null;
          }
        });
      },

      selectNode: (id) => {
        set({ selectedNodeId: id });
      },

      setViewport: (viewport) => {
        set({ viewport });
      },

      updateNodePosition: (id, position) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id);
          if (node) {
            node.position = position;
          }
        });
      },

      applyLayout: (type) => {
        const { nodes, edges } = get();
        let layoutedNodes: Node[];

        switch (type) {
          case 'hierarchical':
            layoutedNodes = applyHierarchicalLayout(nodes, edges);
            break;
          case 'radial':
            layoutedNodes = applyRadialLayout(nodes, edges);
            break;
          case 'force':
            layoutedNodes = applyForceLayout(nodes, edges);
            break;
          default:
            layoutedNodes = nodes;
        }

        set({ nodes: layoutedNodes, layoutType: type });
      },

      setAutoLayout: (enabled) => {
        set({ autoLayout: enabled });
      },

      resetGraph: () => {
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          viewport: { x: 0, y: 0, zoom: 1 },
        });
      },

      // Selectors
      getNodeById: (id) => {
        const { nodes } = get();
        return nodes.find((n) => n.id === id);
      },

      getEdgesForNode: (nodeId) => {
        const { edges } = get();
        return edges.filter((e) => e.source === nodeId || e.target === nodeId);
      },

      getConnectedNodes: (nodeId) => {
        const { nodes, edges } = get();
        const connectedIds = new Set<string>();

        edges.forEach((edge) => {
          if (edge.source === nodeId) connectedIds.add(edge.target);
          if (edge.target === nodeId) connectedIds.add(edge.source);
        });

        return nodes.filter((n) => connectedIds.has(n.id));
      },
    })),
    { name: 'GraphStore' }
  )
);
