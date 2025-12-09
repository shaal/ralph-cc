/**
 * Conversation history tab with message list
 */
import React, { useState } from 'react';
import type { AgentHistoryWithParsed } from '../../../main/database/types';
import { MessageRole } from '../../../main/database/types';

interface HistoryTabProps {
  history: AgentHistoryWithParsed[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpanded = (messageId: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const getRoleIcon = (role: MessageRole) => {
    switch (role) {
      case MessageRole.USER:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case MessageRole.ASSISTANT:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case MessageRole.TOOL:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getRoleColor = (role: MessageRole) => {
    switch (role) {
      case MessageRole.USER:
        return 'from-blue-900/30 to-blue-800/30 border-blue-700/50';
      case MessageRole.ASSISTANT:
        return 'from-purple-900/30 to-purple-800/30 border-purple-700/50';
      case MessageRole.TOOL:
        return 'from-yellow-900/30 to-yellow-800/30 border-yellow-700/50';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCost = (cost: number | null): string => {
    if (cost === null) return '-';
    return `$${cost.toFixed(6)}`;
  };

  const formatTokens = (usage: Record<string, any> | null): string => {
    if (!usage) return '-';
    const input = usage.input_tokens || 0;
    const output = usage.output_tokens || 0;
    return `${input + output} (${input}↑ ${output}↓)`;
  };

  const filteredHistory = searchQuery
    ? history.filter(msg =>
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(msg.tool_calls)?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/30">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-4 py-2 pl-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{filteredHistory.length} messages</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-400 hover:text-blue-300"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>{searchQuery ? 'No messages match your search' : 'No conversation history yet'}</p>
            </div>
          </div>
        ) : (
          filteredHistory.map((msg) => {
            const isExpanded = expandedMessages.has(msg.id);
            const isTruncated = (msg.content?.length || 0) > 500;
            const displayContent = isExpanded || !isTruncated
              ? msg.content
              : msg.content?.slice(0, 500) + '...';

            return (
              <div
                key={msg.id}
                className={`glass-card p-4 rounded-lg bg-gradient-to-br ${getRoleColor(msg.role)} border backdrop-blur-sm`}
              >
                {/* Message header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${
                      msg.role === MessageRole.USER ? 'bg-blue-500/20 text-blue-400' :
                      msg.role === MessageRole.ASSISTANT ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {getRoleIcon(msg.role)}
                    </div>
                    <span className="text-sm font-semibold text-white capitalize">
                      {msg.role}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(msg.created_at)}
                  </span>
                </div>

                {/* Message content */}
                {msg.content && (
                  <div className="mb-2">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words font-sans">
                      {displayContent}
                    </pre>
                    {isTruncated && (
                      <button
                        onClick={() => toggleExpanded(msg.id)}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Tool calls */}
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="mb-2">
                    <button
                      onClick={() => toggleExpanded(msg.id)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                      {msg.tool_calls.length} tool call{msg.tool_calls.length !== 1 ? 's' : ''}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 p-3 bg-gray-900/50 rounded border border-gray-700">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words overflow-x-auto">
                          {JSON.stringify(msg.tool_calls, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata footer */}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                  {msg.usage && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {formatTokens(msg.usage)}
                    </div>
                  )}
                  {msg.cost !== null && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatCost(msg.cost)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
