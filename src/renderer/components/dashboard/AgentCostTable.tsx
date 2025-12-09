import React, { useState, useMemo } from 'react';
import { AgentCost } from '../../hooks/useCostData';

interface AgentCostTableProps {
  data: AgentCost[];
}

type SortField = 'agentName' | 'projectName' | 'tokensIn' | 'tokensOut' | 'cost' | 'lastActive';
type SortDirection = 'asc' | 'desc';

export const AgentCostTable: React.FC<AgentCostTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        agent =>
          agent.agentName.toLowerCase().includes(query) ||
          agent.projectName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'lastActive') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedAgents.size === paginatedData.length) {
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(paginatedData.map(a => a.agentId)));
    }
  };

  const handleSelectAgent = (agentId: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgents(newSelected);
  };

  const handleExport = () => {
    const csv = generateCSV(selectedAgents.size > 0
      ? filteredData.filter(a => selectedAgents.has(a.agentId))
      : filteredData
    );
    downloadCSV(csv, 'agent-costs.csv');
  };

  const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    error: 'bg-red-500',
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Agent Cost Details</h3>
          <p className="text-sm text-gray-400 mt-1">
            {filteredData.length} agent{filteredData.length !== 1 ? 's' : ''}
            {selectedAgents.size > 0 && ` • ${selectedAgents.size} selected`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      {paginatedData.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-800/30 rounded-lg">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-600 mb-3"
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
            <p className="text-gray-400">
              {searchQuery ? 'No agents found' : 'No agents yet'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? 'Try a different search term' : 'Agents will appear as they run'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 &&
                        selectedAgents.size === paginatedData.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                  </th>
                  <SortableHeader
                    field="agentName"
                    label="Agent"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    field="projectName"
                    label="Project"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    field="tokensIn"
                    label="Tokens In"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHeader
                    field="tokensOut"
                    label="Tokens Out"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHeader
                    field="cost"
                    label="Cost"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="right"
                  />
                  <th className="pb-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <SortableHeader
                    field="lastActive"
                    label="Last Active"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(agent => (
                  <tr
                    key={agent.agentId}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedAgents.has(agent.agentId)}
                        onChange={() => handleSelectAgent(agent.agentId)}
                        className="rounded border-gray-600 bg-gray-800"
                      />
                    </td>
                    <td className="py-3">
                      <div className="text-sm font-medium text-white">{agent.agentName}</div>
                      <div className="text-xs text-gray-500">{agent.agentId.substring(0, 8)}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-300">{agent.projectName}</div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="text-sm text-gray-300">{agent.tokensIn.toLocaleString()}</div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="text-sm text-gray-300">{agent.tokensOut.toLocaleString()}</div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="text-sm font-semibold text-white">${agent.cost.toFixed(2)}</div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`}></div>
                        <span className="text-sm text-gray-300 capitalize">{agent.status}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-400">{formatRelativeTime(agent.lastActive)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SortableHeader: React.FC<{
  field: SortField;
  label: string;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  align?: 'left' | 'right';
}> = ({ field, label, currentField, direction, onSort, align = 'left' }) => {
  const isActive = currentField === field;

  return (
    <th
      className={`pb-3 text-${align} text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <div className="flex flex-col">
          <svg
            className={`w-3 h-3 ${
              isActive && direction === 'asc' ? 'text-blue-400' : 'text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5 10l5-5 5 5H5z" />
          </svg>
          <svg
            className={`w-3 h-3 -mt-1 ${
              isActive && direction === 'desc' ? 'text-blue-400' : 'text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M15 10l-5 5-5-5h10z" />
          </svg>
        </div>
      </div>
    </th>
  );
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function generateCSV(data: AgentCost[]): string {
  const headers = ['Agent ID', 'Agent Name', 'Project', 'Tokens In', 'Tokens Out', 'Cost', 'Status', 'Last Active'];
  const rows = data.map(agent => [
    agent.agentId,
    agent.agentName,
    agent.projectName,
    agent.tokensIn,
    agent.tokensOut,
    agent.cost.toFixed(2),
    agent.status,
    new Date(agent.lastActive).toISOString(),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
