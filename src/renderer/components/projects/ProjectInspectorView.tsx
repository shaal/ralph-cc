/**
 * ProjectInspectorView - Embedded inspector for project detail view
 * Shows agent output and details inline without the sliding panel
 */
import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { useAgent } from '../../hooks/useAgent';
import { InspectorTabs, type InspectorTab } from '../inspector/InspectorTabs';
import { OverviewTab } from '../inspector/OverviewTab';
import { LiveStreamTab } from '../inspector/LiveStreamTab';
import { HistoryTab } from '../inspector/HistoryTab';
import { OutputsTab } from '../inspector/OutputsTab';
import { ConfigTab } from '../inspector/ConfigTab';

interface ProjectInspectorViewProps {
  projectId: string;
  projectStatus: string;
}

export const ProjectInspectorView: React.FC<ProjectInspectorViewProps> = ({
  projectId,
  projectStatus,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('live');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [hasNewOutput, setHasNewOutput] = useState(false);

  // Get agents for this project from the store
  const fetchAgents = useAgentStore((state) => state.fetchAgents);
  const getAgentsByProject = useAgentStore((state) => state.getAgentsByProject);
  const agents = getAgentsByProject(projectId);

  // Fetch agent data for selected agent
  const { agent, history, loading, error } = useAgent(selectedAgentId);

  // Fetch agents when component mounts or project changes
  useEffect(() => {
    fetchAgents(projectId);
  }, [projectId, fetchAgents]);

  // Auto-select first agent when agents are loaded
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // Subscribe to agent creation events
  useEffect(() => {
    const unsubscribe = window.api.onEvent('agent_created', (event) => {
      if (event.projectId === projectId) {
        fetchAgents(projectId);
        // Auto-select the new agent
        if (event.agentId) {
          setSelectedAgentId(event.agentId);
        }
      }
    });

    return unsubscribe;
  }, [projectId, fetchAgents]);

  // Track new output for unread indicator
  useEffect(() => {
    if (!selectedAgentId) return;

    const unsubscribe = window.api.onEvent('agent_output_chunk', (event) => {
      if (event.agentId === selectedAgentId && activeTab !== 'live') {
        setHasNewOutput(true);
      }
    });

    return unsubscribe;
  }, [selectedAgentId, activeTab]);

  // Clear unread indicator when switching to live tab
  useEffect(() => {
    if (activeTab === 'live') {
      setHasNewOutput(false);
    }
  }, [activeTab]);

  // No agents yet - show waiting state
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950 text-center p-8">
        {projectStatus === 'running' ? (
          <>
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Starting Agent...</h3>
            <p className="text-gray-400 text-sm max-w-md">
              The Ralph loop is initializing. Agent activity will appear here momentarily.
            </p>
          </>
        ) : (
          <>
            <svg
              className="w-20 h-20 text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-white text-lg font-semibold mb-2">No Agent Activity Yet</h3>
            <p className="text-gray-400 text-sm max-w-md mb-4">
              Start the project to begin the Ralph loop. Agent output and activity will be displayed here in real-time.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click the Play button in the header to start</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // Loading agent data
  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading agent details...</p>
        </div>
      </div>
    );
  }

  // Error loading agent
  if (error && !agent) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 mb-2">Error loading agent</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Agent Selector (if multiple agents) */}
      {agents.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900">
          <span className="text-xs text-gray-500">Agent:</span>
          <select
            value={selectedAgentId || ''}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="flex-1 max-w-xs bg-gray-800 text-white text-sm rounded px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || `Agent ${a.id.slice(0, 8)}`} ({a.status})
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-600">
            {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Single agent header (if only one agent) */}
      {agents.length === 1 && agent && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              agent.status === 'running' ? 'bg-green-500 animate-pulse' :
              agent.status === 'paused' ? 'bg-yellow-500' :
              agent.status === 'completed' ? 'bg-blue-500' :
              agent.status === 'failed' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="text-white text-sm font-medium">
              {agent.name || `Agent ${agent.id.slice(0, 8)}`}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              agent.status === 'running' ? 'bg-green-900/50 text-green-400' :
              agent.status === 'paused' ? 'bg-yellow-900/50 text-yellow-400' :
              agent.status === 'completed' ? 'bg-blue-900/50 text-blue-400' :
              agent.status === 'failed' ? 'bg-red-900/50 text-red-400' :
              'bg-gray-800 text-gray-400'
            }`}>
              {agent.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Iteration: {agent.iteration_count || 0}</span>
            {agent.total_tokens && <span>Tokens: {agent.total_tokens.toLocaleString()}</span>}
          </div>
        </div>
      )}

      {/* Inspector Tabs */}
      {agent && (
        <>
          <InspectorTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasNewOutput={hasNewOutput}
          />

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'overview' && <OverviewTab agent={agent} />}
            {activeTab === 'live' && <LiveStreamTab agentId={agent.id} />}
            {activeTab === 'history' && <HistoryTab history={history} />}
            {activeTab === 'outputs' && <OutputsTab agentId={agent.id} />}
            {activeTab === 'config' && <ConfigTab agent={agent} />}
          </div>
        </>
      )}
    </div>
  );
};
