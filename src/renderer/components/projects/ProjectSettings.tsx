/**
 * ProjectSettings - Project configuration panel
 */

import React, { useState, useEffect } from 'react';
import { Project, ProjectSettings as ProjectSettingsType } from '../../types';

interface ProjectSettingsProps {
  project: Project;
  onSave: (settings: Partial<ProjectSettingsType>) => Promise<void>;
}

const AVAILABLE_MODELS = [
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Most capable model' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Balanced performance' },
  { id: 'claude-sonnet-3-5-20241022', name: 'Claude Sonnet 3.5', description: 'Fast and efficient' },
  { id: 'claude-haiku-3-5-20241022', name: 'Claude Haiku 3.5', description: 'Fastest responses' },
];

const AVAILABLE_TOOLS = [
  { id: 'bash', name: 'Bash', description: 'Execute shell commands' },
  { id: 'read', name: 'Read', description: 'Read files' },
  { id: 'write', name: 'Write', description: 'Write files' },
  { id: 'edit', name: 'Edit', description: 'Edit files' },
  { id: 'glob', name: 'Glob', description: 'Find files by pattern' },
  { id: 'grep', name: 'Grep', description: 'Search file contents' },
];

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project, onSave }) => {
  const [settings, setSettings] = useState<ProjectSettingsType>(project.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(project.settings);
    setHasChanges(false);
  }, [project.settings]);

  const handleChange = <K extends keyof ProjectSettingsType>(
    key: K,
    value: ProjectSettingsType[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setError(null);
  };

  const handleCircuitBreakerChange = (
    key: keyof ProjectSettingsType['circuitBreaker'],
    value: boolean | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      circuitBreaker: { ...prev.circuitBreaker, [key]: value },
    }));
    setHasChanges(true);
    setError(null);
  };

  const handleToolToggle = (toolId: string) => {
    const currentTools = settings.allowedTools;
    const newTools = currentTools.includes(toolId)
      ? currentTools.filter((t) => t !== toolId)
      : [...currentTools, toolId];

    handleChange('allowedTools', newTools);
  };

  const validateSettings = (): string | null => {
    if (settings.budgetLimit <= 0) {
      return 'Budget limit must be greater than 0';
    }
    if (settings.maxIterations <= 0) {
      return 'Max iterations must be greater than 0';
    }
    if (settings.circuitBreaker.maxConsecutiveFailures <= 0) {
      return 'Max consecutive failures must be greater than 0';
    }
    if (settings.circuitBreaker.maxConsecutiveCompletions <= 0) {
      return 'Max consecutive completions must be greater than 0';
    }
    if (settings.temperature !== undefined && (settings.temperature < 0 || settings.temperature > 1)) {
      return 'Temperature must be between 0 and 1';
    }
    if (settings.allowedTools.length === 0) {
      return 'At least one tool must be enabled';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateSettings();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(settings);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(project.settings);
    setHasChanges(false);
    setError(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-white text-2xl font-bold mb-6">Project Settings</h2>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Model Selection */}
        <div className="mb-8">
          <label className="block text-white font-semibold mb-3">Model</label>
          <div className="space-y-2">
            {AVAILABLE_MODELS.map((model) => (
              <label
                key={model.id}
                className={`
                  flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    settings.model === model.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="model"
                  value={model.id}
                  checked={settings.model === model.id}
                  onChange={(e) => handleChange('model', e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="text-white font-medium">{model.name}</div>
                  <div className="text-gray-400 text-sm">{model.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Budget and Iterations */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Budget Limit ($)
            </label>
            <input
              type="number"
              value={settings.budgetLimit}
              onChange={(e) => handleChange('budgetLimit', parseFloat(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-gray-400 text-xs mt-1">
              Maximum amount to spend on this project
            </p>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Max Iterations
            </label>
            <input
              type="number"
              value={settings.maxIterations}
              onChange={(e) => handleChange('maxIterations', parseInt(e.target.value))}
              min="1"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-gray-400 text-xs mt-1">
              Maximum number of Ralph loop iterations
            </p>
          </div>
        </div>

        {/* Circuit Breaker Settings */}
        <div className="mb-8">
          <label className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold">Circuit Breaker</span>
            <input
              type="checkbox"
              checked={settings.circuitBreaker.enabled}
              onChange={(e) => handleCircuitBreakerChange('enabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          {settings.circuitBreaker.enabled && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Max Consecutive Failures
                </label>
                <input
                  type="number"
                  value={settings.circuitBreaker.maxConsecutiveFailures}
                  onChange={(e) =>
                    handleCircuitBreakerChange('maxConsecutiveFailures', parseInt(e.target.value))
                  }
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Pause after this many consecutive failures
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Max Consecutive Completions
                </label>
                <input
                  type="number"
                  value={settings.circuitBreaker.maxConsecutiveCompletions}
                  onChange={(e) =>
                    handleCircuitBreakerChange('maxConsecutiveCompletions', parseInt(e.target.value))
                  }
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Pause after this many consecutive completions without tool calls
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">Advanced Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Temperature (Optional)
              </label>
              <input
                type="number"
                value={settings.temperature ?? ''}
                onChange={(e) =>
                  handleChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                min="0"
                max="1"
                step="0.1"
                placeholder="Default"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Controls randomness (0 = deterministic, 1 = creative)
              </p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Max Tokens (Optional)
              </label>
              <input
                type="number"
                value={settings.maxTokens ?? ''}
                onChange={(e) =>
                  handleChange('maxTokens', e.target.value ? parseInt(e.target.value) : undefined)
                }
                min="1"
                placeholder="Default"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Maximum tokens per response
              </p>
            </div>
          </div>
        </div>

        {/* Allowed Tools */}
        <div className="mb-8">
          <label className="block text-white font-semibold mb-3">Allowed Tools</label>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_TOOLS.map((tool) => (
              <label
                key={tool.id}
                className={`
                  flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    settings.allowedTools.includes(tool.id)
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={settings.allowedTools.includes(tool.id)}
                  onChange={() => handleToolToggle(tool.id)}
                  className="w-4 h-4 text-blue-600 mt-0.5 rounded"
                />
                <div className="ml-3">
                  <div className="text-white font-medium text-sm">{tool.name}</div>
                  <div className="text-gray-400 text-xs">{tool.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 pt-4 pb-2 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
