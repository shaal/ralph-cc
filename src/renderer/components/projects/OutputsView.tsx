/**
 * OutputsView - File tree and output viewer for project artifacts
 */

import React, { useState, useEffect } from 'react';
import { OutputType } from '../../types';

interface Output {
  id: string;
  project_id: string;
  agent_id: string | null;
  type: OutputType;
  path: string | null;
  content: string | null;
  previous_content: string | null;
  checksum: string | null;
  created_at: string;
}

interface OutputsViewProps {
  projectId: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  output?: Output;
}

const buildFileTree = (outputs: Output[]): FileNode[] => {
  const tree: FileNode[] = [];
  const dirMap = new Map<string, FileNode>();

  outputs.forEach((output) => {
    if (!output.path) return;

    const parts = output.path.split('/').filter(Boolean);
    let currentPath = '';
    let currentLevel = tree;

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      let node = currentLevel.find((n) => n.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          children: isFile ? undefined : [],
          output: isFile ? output : undefined,
        };
        currentLevel.push(node);

        if (!isFile) {
          dirMap.set(currentPath, node);
        }
      }

      if (!isFile && node.children) {
        currentLevel = node.children;
      }
    });
  });

  return tree;
};

const FileTreeNode: React.FC<{
  node: FileNode;
  level: number;
  onSelect: (output: Output) => void;
  selectedPath: string | null;
}> = ({ node, level, onSelect, selectedPath }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else if (node.output) {
      onSelect(node.output);
    }
  };

  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors
          ${isSelected ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800 text-gray-300'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OutputsView: React.FC<OutputsViewProps> = ({ projectId }) => {
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [filterType, setFilterType] = useState<'all' | OutputType>('all');

  useEffect(() => {
    loadOutputs();
  }, [projectId]);

  const loadOutputs = async () => {
    try {
      setLoading(true);
      // This would call window.api.outputs.list(projectId)
      // For now, we'll use mock data
      const mockOutputs: Output[] = [];
      setOutputs(mockOutputs);
    } catch (err) {
      console.error('Failed to load outputs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutputs =
    filterType === 'all' ? outputs : outputs.filter((o) => o.type === filterType);

  const fileTree = buildFileTree(filteredOutputs.filter((o) => o.type === OutputType.FILE));

  const handleDownload = () => {
    if (!selectedOutput || !selectedOutput.content) return;

    const blob = new Blob([selectedOutput.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedOutput.path?.split('/').pop() || 'output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderDiff = () => {
    if (!selectedOutput || !selectedOutput.previous_content || !selectedOutput.content) {
      return <div className="text-gray-400 text-sm">No changes to display</div>;
    }

    const oldLines = selectedOutput.previous_content.split('\n');
    const newLines = selectedOutput.content.split('\n');

    return (
      <div className="font-mono text-xs">
        {newLines.map((line, index) => {
          const oldLine = oldLines[index];
          const isChanged = oldLine !== line;
          const isAdded = index >= oldLines.length;
          const isRemoved = false; // Simplified diff

          return (
            <div
              key={index}
              className={`
                px-2 py-0.5
                ${isAdded ? 'bg-green-900/30 text-green-300' : ''}
                ${isChanged && !isAdded ? 'bg-yellow-900/30 text-yellow-300' : ''}
              `}
            >
              <span className="text-gray-500 mr-4">{index + 1}</span>
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Left sidebar: File tree */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-semibold mb-3">Outputs</h3>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`
                px-3 py-1 text-xs rounded transition-colors
                ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              All
            </button>
            <button
              onClick={() => setFilterType(OutputType.FILE)}
              className={`
                px-3 py-1 text-xs rounded transition-colors
                ${
                  filterType === OutputType.FILE
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              Files
            </button>
            <button
              onClick={() => setFilterType(OutputType.ARTIFACT)}
              className={`
                px-3 py-1 text-xs rounded transition-colors
                ${
                  filterType === OutputType.ARTIFACT
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              Artifacts
            </button>
          </div>
        </div>

        {/* File tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : fileTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <svg
                className="w-12 h-12 text-gray-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-400 text-sm mb-1">No outputs yet</p>
              <p className="text-gray-500 text-xs">
                Start the project to generate outputs
              </p>
            </div>
          ) : (
            fileTree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                level={0}
                onSelect={setSelectedOutput}
                selectedPath={selectedOutput?.path || null}
              />
            ))
          )}
        </div>

        {/* Footer stats */}
        {filteredOutputs.length > 0 && (
          <div className="p-3 border-t border-gray-800 text-xs text-gray-400">
            {filteredOutputs.length} output{filteredOutputs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Right panel: Content viewer */}
      <div className="flex-1 flex flex-col">
        {selectedOutput ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">
                  {selectedOutput.path?.split('/').pop() || 'Output'}
                </h3>
                <p className="text-gray-400 text-xs mt-1">{selectedOutput.path}</p>
              </div>

              <div className="flex items-center gap-2">
                {selectedOutput.previous_content && (
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className={`
                      px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1
                      ${
                        showDiff
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }
                    `}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                    {showDiff ? 'Show Content' : 'Show Diff'}
                  </button>
                )}

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-950">
              {showDiff && selectedOutput.previous_content ? (
                renderDiff()
              ) : (
                <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                  {selectedOutput.content || 'No content'}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg
              className="w-16 h-16 text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-400 text-sm mb-1">No file selected</p>
            <p className="text-gray-500 text-xs max-w-sm">
              Select a file from the tree to view its contents
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
