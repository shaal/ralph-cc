/**
 * Example usage of the AgentGraph component
 *
 * This file demonstrates how to integrate the agent graph
 * into a typical Constellation project view.
 */

import React, { useState } from 'react';
import { AgentGraph } from './AgentGraph';
import { Agent } from '../../main/database/types';

/**
 * Example: Full-screen graph view
 */
export function FullScreenGraphExample() {
  const projectId = 'project-123';

  return (
    <div className="h-screen w-screen bg-bg-primary">
      <AgentGraph projectId={projectId} />
    </div>
  );
}

/**
 * Example: Graph with inspector panel
 */
export function GraphWithInspectorExample() {
  const projectId = 'project-123';
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen flex bg-bg-primary">
      {/* Graph panel */}
      <div className="flex-1 relative">
        <AgentGraph
          projectId={projectId}
          onNodeClick={setSelectedNodeId}
        />
      </div>

      {/* Inspector panel (slides in when agent selected) */}
      {selectedNodeId && (
        <div className="w-96 bg-bg-secondary border-l border-border-primary p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Agent Inspector</h2>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Agent details would go here */}
            <div className="text-text-secondary">
              Selected agent: {selectedNodeId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Graph in a dashboard card
 */
export function GraphInCardExample() {
  const projectId = 'project-123';

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-text-primary">Agent Swarm</h2>
            <p className="text-text-secondary">Real-time visualization</p>
          </div>

          {/* Graph container with fixed height */}
          <div className="h-[600px] rounded-lg overflow-hidden border border-border-primary">
            <AgentGraph projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Graph with custom controls overlay
 */
export function GraphWithCustomOverlayExample() {
  const projectId = 'project-123';
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="h-screen w-screen relative bg-bg-primary">
      <AgentGraph projectId={projectId} />

      {/* Custom overlay controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-bg-secondary/95 backdrop-blur-sm rounded-xl border border-border-primary shadow-2xl px-6 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  isPaused
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }
              `}
            >
              {isPaused ? 'Resume' : 'Pause'} All
            </button>

            <div className="h-6 w-px bg-border-primary" />

            <div className="text-sm text-text-secondary">
              Project: <span className="text-text-primary font-medium">{projectId.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Using the graph hook directly for custom implementations
 */
export function CustomGraphImplementation() {
  const projectId = 'project-123';

  // You can use the hook directly if you need more control
  // import { useAgentGraph } from '@/renderer/hooks';
  //
  // const {
  //   nodes,
  //   edges,
  //   agents,
  //   selectedAgent,
  //   layout,
  //   onNodesChange,
  //   onEdgesChange,
  //   changeLayout,
  //   selectNode,
  // } = useAgentGraph(projectId);

  return (
    <div className="h-screen w-screen">
      {/* Your custom implementation using the hook data */}
      <AgentGraph projectId={projectId} />
    </div>
  );
}

/**
 * Example: Responsive graph (desktop/mobile)
 */
export function ResponsiveGraphExample() {
  const projectId = 'project-123';
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-bg-primary">
      {/* Graph panel */}
      <div className="flex-1 relative min-h-[400px]">
        <AgentGraph
          projectId={projectId}
          onNodeClick={setSelectedNodeId}
        />
      </div>

      {/* Inspector panel - bottom drawer on mobile, side panel on desktop */}
      {selectedNodeId && (
        <div className="lg:w-96 h-64 lg:h-auto bg-bg-secondary border-t lg:border-t-0 lg:border-l border-border-primary p-4 lg:p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Agent Details</h3>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="p-1 rounded hover:bg-bg-tertiary text-text-secondary"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-text-secondary">Agent ID: {selectedNodeId}</p>
        </div>
      )}
    </div>
  );
}
