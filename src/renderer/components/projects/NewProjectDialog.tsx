/**
 * NewProjectDialog - Multi-step wizard for creating a new project
 */

import React, { useState } from 'react';
import { CreateProjectInput, ProjectSettings } from '../../types';
import { PromptEditor } from './PromptEditor';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateProjectInput) => Promise<void>;
}

type Step = 'details' | 'prompt' | 'settings';

const DEFAULT_SETTINGS: ProjectSettings = {
  model: 'claude-sonnet-4-5-20250929',
  budgetLimit: 10.0,
  maxIterations: 100,
  circuitBreaker: {
    enabled: true,
    maxConsecutiveFailures: 5,
    maxConsecutiveCompletions: 3,
  },
  allowedTools: ['bash', 'read', 'write', 'edit', 'glob', 'grep'],
  temperature: undefined,
  maxTokens: undefined,
};

const AVAILABLE_MODELS = [
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
  { id: 'claude-sonnet-3-5-20241022', name: 'Claude Sonnet 3.5' },
  { id: 'claude-haiku-3-5-20241022', name: 'Claude Haiku 3.5' },
];

const AVAILABLE_TOOLS = [
  { id: 'bash', name: 'Bash' },
  { id: 'read', name: 'Read' },
  { id: 'write', name: 'Write' },
  { id: 'edit', name: 'Edit' },
  { id: 'glob', name: 'Glob' },
  { id: 'grep', name: 'Grep' },
];

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isCreating) {
      // Reset form
      setCurrentStep('details');
      setName('');
      setDescription('');
      setPrompt('');
      setSettings(DEFAULT_SETTINGS);
      setError(null);
      onClose();
    }
  };

  const validateStep = (step: Step): string | null => {
    if (step === 'details') {
      if (!name.trim()) return 'Project name is required';
    } else if (step === 'prompt') {
      if (!prompt.trim()) return 'Prompt is required';
    } else if (step === 'settings') {
      if (settings.budgetLimit <= 0) return 'Budget must be greater than 0';
      if (settings.maxIterations <= 0) return 'Max iterations must be greater than 0';
      if (settings.allowedTools.length === 0) return 'At least one tool must be enabled';
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    if (currentStep === 'details') {
      setCurrentStep('prompt');
    } else if (currentStep === 'prompt') {
      setCurrentStep('settings');
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'settings') {
      setCurrentStep('prompt');
    } else if (currentStep === 'prompt') {
      setCurrentStep('details');
    }
  };

  const handleCreate = async () => {
    const validationError = validateStep('settings');
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim(),
        settings,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setIsCreating(false);
    }
  };

  const handleToolToggle = (toolId: string) => {
    const newTools = settings.allowedTools.includes(toolId)
      ? settings.allowedTools.filter((t) => t !== toolId)
      : [...settings.allowedTools, toolId];
    setSettings({ ...settings, allowedTools: newTools });
  };

  const steps: { id: Step; title: string; number: number }[] = [
    { id: 'details', title: 'Details', number: 1 },
    { id: 'prompt', title: 'Prompt', number: 2 },
    { id: 'settings', title: 'Settings', number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-2xl font-bold">Create New Project</h2>
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${
                        index < currentStepIndex
                          ? 'bg-green-600 text-white'
                          : index === currentStepIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }
                    `}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      index <= currentStepIndex ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      index < currentStepIndex ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: Details */}
          {currentStep === 'details' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My AI Agent Project"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Description <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this project does..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-blue-300 text-sm">
                    <p className="font-medium mb-1">About Constellation</p>
                    <p className="text-blue-200/80">
                      Constellation orchestrates multiple AI coding agents in parallel using the "Ralph" technique.
                      Each project runs a continuous loop where agents analyze, code, test, and iterate autonomously.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Prompt */}
          {currentStep === 'prompt' && (
            <div className="h-[500px] animate-fadeIn">
              <label className="block text-white font-semibold mb-2">
                Project Prompt <span className="text-red-400">*</span>
              </label>
              <p className="text-gray-400 text-sm mb-4">
                Write the instructions for your AI agent. This prompt will be used in each iteration of the Ralph loop.
              </p>
              <PromptEditor value={prompt} onChange={setPrompt} autoSave={false} />
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Model selection */}
              <div>
                <label className="block text-white font-semibold mb-3">Model</label>
                <div className="space-y-2">
                  {AVAILABLE_MODELS.map((model) => (
                    <label
                      key={model.id}
                      className={`
                        flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
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
                        onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-white">{model.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget and iterations */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Budget Limit ($)</label>
                  <input
                    type="number"
                    value={settings.budgetLimit}
                    onChange={(e) =>
                      setSettings({ ...settings, budgetLimit: parseFloat(e.target.value) })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Max Iterations</label>
                  <input
                    type="number"
                    value={settings.maxIterations}
                    onChange={(e) =>
                      setSettings({ ...settings, maxIterations: parseInt(e.target.value) })
                    }
                    min="1"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Allowed tools */}
              <div>
                <label className="block text-white font-semibold mb-3">Allowed Tools</label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <label
                      key={tool.id}
                      className={`
                        flex items-center p-2 rounded-lg border-2 cursor-pointer transition-all
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
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-white text-sm">{tool.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={currentStep === 'details' ? handleClose : handleBack}
            disabled={isCreating}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {currentStep === 'details' ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'settings' ? (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isCreating ? 'Creating...' : 'Create Project'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
