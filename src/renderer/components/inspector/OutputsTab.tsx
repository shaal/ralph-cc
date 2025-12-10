/**
 * Outputs tab with file tree and preview
 */
import React, { useState, useEffect } from 'react';
import type { Output } from '../../types';
import { OutputType } from '../../types';

interface OutputsTabProps {
  agentId: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  output?: Output;
}

export const OutputsTab: React.FC<OutputsTabProps> = ({ agentId }) => {
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutputs = async () => {
      setLoading(true);
      try {
        const data = await window.api.agent.getOutputs(agentId);
        setOutputs(data);
      } catch (error) {
        console.error('Error fetching outputs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutputs();
  }, [agentId]);

  // Build file tree from outputs
  const buildFileTree = (outputs: Output[]): FileNode[] => {
    const root: { [key: string]: FileNode } = {};

    outputs.forEach(output => {
      if (!output.path) return;

      const parts = output.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? 'file' : 'directory',
            children: index === parts.length - 1 ? undefined : {}
          };

          if (index === parts.length - 1) {
            current[part].output = output;
          }
        }

        if (index < parts.length - 1 && current[part].children) {
          current = current[part].children as { [key: string]: FileNode };
        }
      });
    });

    // Convert to array and sort
    const convertToArray = (obj: { [key: string]: FileNode }): FileNode[] => {
      return Object.values(obj)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map(node => ({
          ...node,
          children: node.children ? convertToArray(node.children as any) : undefined
        }));
    };

    return convertToArray(root);
  };

  const fileTree = buildFileTree(outputs);

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return '📜';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'css':
      case 'scss':
        return '🎨';
      case 'html':
        return '🌐';
      default:
        return '📄';
    }
  };

  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'css':
      case 'scss':
        return 'css';
      case 'html':
        return 'html';
      case 'py':
        return 'python';
      default:
        return 'text';
    }
  };

  const renderDiff = (previous: string | null, current: string | null) => {
    if (!previous || !current) {
      return (
        <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words">
          {current || previous || ''}
        </pre>
      );
    }

    // Simple line-by-line diff
    const prevLines = previous.split('\n');
    const currLines = current.split('\n');
    const maxLines = Math.max(prevLines.length, currLines.length);

    return (
      <div className="space-y-0">
        {Array.from({ length: maxLines }).map((_, i) => {
          const prevLine = prevLines[i];
          const currLine = currLines[i];

          if (prevLine === currLine) {
            return (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 text-xs w-8 text-right">{i + 1}</span>
                <pre className="flex-1 text-sm text-gray-300">{currLine}</pre>
              </div>
            );
          }

          return (
            <div key={i}>
              {prevLine !== undefined && (
                <div className="flex gap-2 bg-red-900/20">
                  <span className="text-red-500 text-xs w-8 text-right">-{i + 1}</span>
                  <pre className="flex-1 text-sm text-red-300">{prevLine}</pre>
                </div>
              )}
              {currLine !== undefined && (
                <div className="flex gap-2 bg-green-900/20">
                  <span className="text-green-500 text-xs w-8 text-right">+{i + 1}</span>
                  <pre className="flex-1 text-sm text-green-300">{currLine}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const FileTreeNode: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2);

    if (node.type === 'directory') {
      return (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700/50 rounded w-full text-left transition-colors"
            style={{ paddingLeft: `${depth * 1.5}rem` }}
          >
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm text-gray-300">📁 {node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child, i) => (
                <FileTreeNode key={i} node={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={() => node.output && setSelectedOutput(node.output)}
        className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-700/50 rounded w-full text-left transition-colors ${
          selectedOutput?.id === node.output?.id ? 'bg-blue-900/30' : ''
        }`}
        style={{ paddingLeft: `${depth * 1.5 + 1.25}rem` }}
      >
        <span className="text-sm">{getFileIcon(node.path)}</span>
        <span className="text-sm text-gray-300">{node.name}</span>
        {node.output?.previous_content && (
          <span className="ml-auto text-xs text-yellow-500">Modified</span>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Loading outputs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File tree sidebar */}
      <div className="w-64 border-r border-gray-700 bg-gray-800/30 overflow-y-auto">
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Outputs ({outputs.length})
          </h3>
        </div>
        <div className="p-2">
          {fileTree.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No outputs yet
            </div>
          ) : (
            fileTree.map((node, i) => (
              <FileTreeNode key={i} node={node} depth={0} />
            ))
          )}
        </div>
      </div>

      {/* Preview pane */}
      <div className="flex-1 flex flex-col">
        {selectedOutput ? (
          <>
            {/* Preview header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/30">
              <div className="flex items-center gap-2">
                <span className="text-sm">{getFileIcon(selectedOutput.path || '')}</span>
                <span className="text-sm font-medium text-white">
                  {selectedOutput.path?.split('/').pop()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  selectedOutput.type === OutputType.FILE
                    ? 'bg-blue-500/20 text-blue-400'
                    : selectedOutput.type === OutputType.ARTIFACT
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {selectedOutput.type}
                </span>
              </div>
              {selectedOutput.previous_content && (
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    showDiff
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {showDiff ? 'Hide Diff' : 'Show Diff'}
                </button>
              )}
            </div>

            {/* Content preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-sm">
              {showDiff && selectedOutput.previous_content ? (
                renderDiff(selectedOutput.previous_content, selectedOutput.content)
              ) : (
                <div className="space-y-0">
                  {selectedOutput.content?.split('\n').map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-600 text-xs w-8 text-right">{i + 1}</span>
                      <pre className="flex-1 text-sm text-gray-300">{line}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata footer */}
            <div className="p-3 border-t border-gray-700 bg-gray-800/30 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Created: {new Date(selectedOutput.created_at).toLocaleString()}</span>
                {selectedOutput.checksum && (
                  <span>Checksum: {selectedOutput.checksum.slice(0, 8)}...</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Select a file to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
