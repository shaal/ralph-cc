/**
 * Live output stream tab - terminal-like real-time output
 */
import React, { useRef, useEffect, useState } from 'react';
import { useAgentStream } from '../../hooks/useAgentStream';

interface LiveStreamTabProps {
  agentId: string;
}

export const LiveStreamTab: React.FC<LiveStreamTabProps> = ({ agentId }) => {
  const { chunks, isStreaming, clear } = useAgentStream(agentId);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Debug: log when chunks change
  console.log(`[LiveStreamTab] Rendering with ${chunks.length} chunks, isStreaming=${isStreaming}, agentId=${agentId}`);

  // Auto-scroll to bottom when new chunks arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chunks, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    } else if (isAtBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  const copyToClipboard = async () => {
    const text = chunks.map(c => c.chunk).join('\n');
    await navigator.clipboard.writeText(text);
  };

  const getChunkColor = (type: 'output' | 'tool_call' | 'error'): string => {
    switch (type) {
      case 'tool_call':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-green-400';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/30">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 text-sm ${isStreaming ? 'text-green-400' : 'text-gray-400'}`}>
            {isStreaming ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>Streaming...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span>Idle</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {chunks.length} chunks
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              autoScroll
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-700 hover:text-white hover:bg-gray-600 rounded transition-colors"
            title="Copy all output"
            disabled={chunks.length === 0}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Clear button */}
          <button
            onClick={clear}
            className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-700 hover:text-white hover:bg-gray-600 rounded transition-colors"
            title="Clear output"
            disabled={chunks.length === 0}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-sm"
      >
        {chunks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No output yet. Waiting for agent activity...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="flex gap-3 group">
                {/* Timestamp */}
                <span className="text-gray-600 text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTimestamp(chunk.timestamp)}
                </span>

                {/* Output content */}
                <div className={`flex-1 ${getChunkColor(chunk.type)}`}>
                  <pre className="whitespace-pre-wrap break-words">
                    {chunk.chunk}
                  </pre>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-gray-800/30 text-xs text-gray-500">
        <div>
          {autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled - scroll to bottom to re-enable'}
        </div>
        <div>
          Lines: {chunks.length}
        </div>
      </div>
    </div>
  );
};
