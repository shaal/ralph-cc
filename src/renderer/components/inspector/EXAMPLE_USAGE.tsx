/**
 * Example usage of Agent Inspector components
 *
 * This file demonstrates how to integrate the Agent Inspector
 * into your Constellation application.
 */

import React, { useState } from 'react';
import { AgentInspector } from './AgentInspector';

/**
 * Example 1: Basic integration with graph view
 */
export function BasicExample() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  return (
    <div className="relative h-screen">
      {/* Your main application content */}
      <div className="h-full">
        {/* Graph or other content */}
        <button
          onClick={() => setSelectedAgentId('agent-123')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Inspect Agent
        </button>
      </div>

      {/* Inspector panel - only renders when agent selected */}
      <AgentInspector
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    </div>
  );
}

/**
 * Example 2: Integration with React Flow graph
 */
import { ReactFlow, Node } from 'react-flow-renderer';

export function GraphIntegration() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const nodes: Node[] = [
    { id: 'agent-1', type: 'agent', data: { name: 'Main Agent' }, position: { x: 0, y: 0 } },
    { id: 'agent-2', type: 'agent', data: { name: 'Sub Agent' }, position: { x: 200, y: 100 } },
  ];

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.type === 'agent') {
      setSelectedAgentId(node.id);
    }
  };

  return (
    <div className="relative h-screen">
      <ReactFlow
        nodes={nodes}
        onNodeClick={handleNodeClick}
      />

      <AgentInspector
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    </div>
  );
}

/**
 * Example 3: Using individual tabs programmatically
 */
import { useState } from 'react';
import { useAgent } from '../../hooks/useAgent';
import { OverviewTab, LiveStreamTab, HistoryTab, ConfigTab } from './index';

export function CustomInspector({ agentId }: { agentId: string }) {
  const { agent, history, loading } = useAgent(agentId);
  const [activeTab, setActiveTab] = useState<'overview' | 'live' | 'history' | 'config'>('overview');

  if (loading || !agent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-full bg-gray-900">
      {/* Custom tab navigation */}
      <div className="flex gap-2 p-4 border-b border-gray-700">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('live')}>Live</button>
        <button onClick={() => setActiveTab('history')}>History</button>
        <button onClick={() => setActiveTab('config')}>Config</button>
      </div>

      {/* Tab content */}
      <div className="h-full overflow-auto">
        {activeTab === 'overview' && <OverviewTab agent={agent} />}
        {activeTab === 'live' && <LiveStreamTab agentId={agentId} />}
        {activeTab === 'history' && <HistoryTab history={history} />}
        {activeTab === 'config' && <ConfigTab agent={agent} />}
      </div>
    </div>
  );
}

/**
 * Example 4: Using hooks independently
 */
import { useAgent, useAgentStream } from '../../hooks';

export function HookExample({ agentId }: { agentId: string }) {
  const { agent, history, loading, error, refresh } = useAgent(agentId);
  const { chunks, isStreaming, clear } = useAgentStream(agentId);

  if (loading) return <div>Loading agent...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!agent) return null;

  return (
    <div className="p-4">
      <h1>{agent.name}</h1>
      <p>Status: {agent.status}</p>
      <p>Tokens: {agent.total_tokens}</p>
      <p>Cost: ${agent.total_cost.toFixed(4)}</p>

      <div className="mt-4">
        <h2>History ({history.length} messages)</h2>
        {history.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h2>Live Output {isStreaming && '(streaming...)'}</h2>
        <button onClick={clear}>Clear</button>
        <div className="bg-black text-green-400 p-4 font-mono">
          {chunks.map((chunk) => (
            <div key={chunk.id}>{chunk.chunk}</div>
          ))}
        </div>
      </div>

      <button onClick={refresh}>Refresh Agent Data</button>
    </div>
  );
}

/**
 * Example 5: Multiple inspectors (split view)
 */
export function SplitViewExample() {
  const [leftAgentId, setLeftAgentId] = useState<string | null>('agent-1');
  const [rightAgentId, setRightAgentId] = useState<string | null>('agent-2');

  return (
    <div className="flex h-screen">
      {/* Left inspector */}
      <div className="flex-1 border-r border-gray-700">
        {leftAgentId && (
          <AgentInspector
            agentId={leftAgentId}
            onClose={() => setLeftAgentId(null)}
          />
        )}
      </div>

      {/* Right inspector */}
      <div className="flex-1">
        {rightAgentId && (
          <AgentInspector
            agentId={rightAgentId}
            onClose={() => setRightAgentId(null)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Handling events directly
 */
import { useEffect } from 'react';

export function EventHandlingExample({ agentId }: { agentId: string }) {
  useEffect(() => {
    // Subscribe to output chunks
    const unsubscribeOutput = window.api.onEvent('agent_output_chunk', (event) => {
      if (event.agentId === agentId) {
        console.log('New output:', event.data.chunk);
      }
    });

    // Subscribe to status changes
    const unsubscribeStatus = window.api.onEvent('agent_status_changed', (event) => {
      if (event.agentId === agentId) {
        console.log('Status changed to:', event.data.status);
      }
    });

    // Subscribe to tool calls
    const unsubscribeToolCall = window.api.onEvent('agent_tool_call', (event) => {
      if (event.agentId === agentId) {
        console.log('Tool called:', event.data.tool_name);
      }
    });

    return () => {
      unsubscribeOutput();
      unsubscribeStatus();
      unsubscribeToolCall();
    };
  }, [agentId]);

  return <div>Check console for events</div>;
}

/**
 * Example 7: Keyboard shortcuts
 */
export function KeyboardShortcutsExample() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && selectedAgentId) {
        setSelectedAgentId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAgentId]);

  return (
    <>
      <button onClick={() => setSelectedAgentId('agent-123')}>
        Open Inspector (Press ESC to close)
      </button>

      <AgentInspector
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    </>
  );
}
