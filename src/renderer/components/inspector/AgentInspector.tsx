/**
 * Main Agent Inspector panel - detail view for selected agent
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAgent } from '../../hooks/useAgent';
import { InspectorHeader } from './InspectorHeader';
import { InspectorTabs, type InspectorTab } from './InspectorTabs';
import { OverviewTab } from './OverviewTab';
import { LiveStreamTab } from './LiveStreamTab';
import { HistoryTab } from './HistoryTab';
import { OutputsTab } from './OutputsTab';
import { ConfigTab } from './ConfigTab';

export interface AgentInspectorProps {
  agentId: string | null;
  onClose: () => void;
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({ agentId, onClose }) => {
  const { agent, history, loading, error } = useAgent(agentId);
  const [activeTab, setActiveTab] = useState<InspectorTab>('overview');
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [hasNewOutput, setHasNewOutput] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Reset tab when agent changes
  useEffect(() => {
    setActiveTab('overview');
    setHasNewOutput(false);
  }, [agentId]);

  // Track new output for unread indicator
  useEffect(() => {
    if (!agentId) return;

    const unsubscribe = window.api.onEvent('agent_output_chunk', (event) => {
      // Note: agentId is inside event.data (from IPC forwarding)
      if (event.data?.agentId === agentId && activeTab !== 'live') {
        setHasNewOutput(true);
      }
    });

    return unsubscribe;
  }, [agentId, activeTab]);

  // Clear unread indicator when switching to live tab
  useEffect(() => {
    if (activeTab === 'live') {
      setHasNewOutput(false);
    }
  }, [activeTab]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.max(400, Math.min(1200, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Don't render if no agent selected
  if (!agentId) {
    return null;
  }

  return (
    <>
      {/* Overlay for resizing */}
      {isResizing && (
        <div className="fixed inset-0 z-40 cursor-ew-resize" />
      )}

      {/* Inspector Panel */}
      <div
        ref={resizeRef}
        className="fixed top-0 right-0 h-screen bg-gray-900 border-l border-gray-700 shadow-2xl z-30 flex flex-col animate-slide-in-right"
        style={{ width: `${width}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-blue-500/50 cursor-ew-resize transition-all z-50"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Loading State */}
        {loading && !agent && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading agent details...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !agent && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 mb-2">Error loading agent</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {agent && (
          <>
            <InspectorHeader agent={agent} onClose={onClose} />
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

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        /* Glass card effect */
        .glass-card {
          backdrop-filter: blur(10px);
        }

        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.9);
        }
      `}</style>
    </>
  );
};
