import React, { useState } from 'react';
import { ProjectCost } from '../../hooks/useCostData';

interface ProjectCostBreakdownProps {
  data: ProjectCost[];
}

export const ProjectCostBreakdown: React.FC<ProjectCostBreakdownProps> = ({ data }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500' },
    paused: { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500' },
    completed: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
    error: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' },
  };

  const totalCost = data.reduce((sum, p) => sum + p.cost, 0);

  return (
    <div className="glass-panel p-6 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Cost by Project</h3>
          <p className="text-sm text-gray-400 mt-1">
            {data.length} project{data.length !== 1 ? 's' : ''} • ${totalCost.toFixed(2)} total
          </p>
        </div>
        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View All
        </button>
      </div>

      {/* Project Bars */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 bg-gray-800/30 rounded-lg">
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="text-gray-400">No projects yet</p>
            <p className="text-sm text-gray-500 mt-1">Create a project to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((project, index) => (
            <ProjectBar
              key={project.projectId}
              project={project}
              index={index}
              statusColors={statusColors}
              isSelected={selectedProject === project.projectId}
              onClick={() =>
                setSelectedProject(
                  selectedProject === project.projectId ? null : project.projectId
                )
              }
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Status:</span>
          <div className="flex items-center gap-4">
            {Object.entries(statusColors).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${colors.bg}`}></div>
                <span className="text-gray-400 capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProjectBarProps {
  project: ProjectCost;
  index: number;
  statusColors: Record<string, { bg: string; text: string; border: string }>;
  isSelected: boolean;
  onClick: () => void;
}

const ProjectBar: React.FC<ProjectBarProps> = ({
  project,
  index,
  statusColors,
  isSelected,
  onClick,
}) => {
  const colors = statusColors[project.status] || statusColors.active;

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      style={{
        animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Project Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.bg}`}></div>
          <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
            {project.projectName}
          </span>
          <span className="text-xs text-gray-500">
            ({project.agentCount} agent{project.agentCount !== 1 ? 's' : ''})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{project.percentage.toFixed(1)}%</span>
          <span className="text-sm font-semibold text-white">${project.cost.toFixed(2)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-8 bg-gray-800/50 rounded-lg overflow-hidden">
        {/* Background gradient */}
        <div
          className={`absolute inset-0 ${colors.bg} opacity-10 transition-all duration-500`}
          style={{
            width: `${project.percentage}%`,
          }}
        ></div>

        {/* Main bar */}
        <div
          className={`absolute inset-y-0 left-0 ${colors.bg} transition-all duration-500`}
          style={{
            width: `${project.percentage}%`,
            boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
          }}
        ></div>

        {/* Percentage label inside bar */}
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className="text-xs font-medium text-white z-10">
            {project.percentage > 15 ? `${project.percentage.toFixed(1)}%` : ''}
          </span>
          <span className="text-xs font-medium text-white z-10">
            ${project.cost.toFixed(2)}
          </span>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity"></div>
      </div>

      {/* Expanded details */}
      {isSelected && (
        <div
          className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          style={{
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-gray-400 mb-1">Status</div>
              <div className={`font-medium ${colors.text} capitalize`}>{project.status}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Agents</div>
              <div className="font-medium text-white">{project.agentCount}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Cost per Agent</div>
              <div className="font-medium text-white">
                ${(project.cost / project.agentCount).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add keyframe animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
if (!document.getElementById('project-breakdown-styles')) {
  style.id = 'project-breakdown-styles';
  document.head.appendChild(style);
}
