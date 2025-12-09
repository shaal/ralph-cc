import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

// Store initialization
import { useStoreInitializer, useProjectStore, useUIStore, useConfigStore } from './stores';

// Layout components
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';

// Main views
import { ProjectList } from './components/projects/ProjectList';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { NewProjectDialog } from './components/projects/NewProjectDialog';
import { CostDashboard } from './components/dashboard/CostDashboard';
import { AgentInspector } from './components/inspector/AgentInspector';

// Common components
import { ToastContainer } from './components/common/Toast';
import { Button } from './components/common/Button';
import { Card } from './components/common/Card';
import { Input } from './components/common/Input';

// Import styles
import './styles/globals.css';

/**
 * Loading Screen Component
 * Shown while stores are initializing
 */
const LoadingScreen: React.FC = () => (
  <div className="relative min-h-screen w-full overflow-hidden bg-background">
    {/* Starfield background */}
    <div className="fixed inset-0 bg-starfield" />

    {/* Animated stars */}
    <div className="fixed inset-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            opacity: [
              Math.random() * 0.5 + 0.2,
              Math.random() * 0.8 + 0.2,
              Math.random() * 0.5 + 0.2,
            ],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>

    {/* Main content */}
    <div className="relative z-10 flex min-h-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        {/* Logo and title */}
        <motion.div
          className="mb-8 flex items-center justify-center gap-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </motion.div>
          <h1 className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-7xl font-bold text-transparent">
            Constellation
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="mb-12 text-xl font-light text-gray-400"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          AI Agent Swarm Orchestrator
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          className="mx-auto flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-mono text-sm text-gray-500">
            Initializing swarm visualization engine...
          </span>
        </motion.div>
      </motion.div>
    </div>

    {/* Grid overlay */}
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #3B82F6 1px, transparent 1px),
          linear-gradient(to bottom, #3B82F6 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    />
  </div>
);

/**
 * Error Screen Component
 * Shown when initialization fails
 */
const ErrorScreen: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex min-h-screen items-center justify-center bg-background p-8">
    <Card className="max-w-md">
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="rounded-full bg-error/10 p-4">
          <AlertCircle className="h-8 w-8 text-error" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Initialization Failed</h2>
        <p className="text-sm text-text-secondary">
          {error.message || 'An unexpected error occurred while starting Constellation.'}
        </p>
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </Card>
  </div>
);

/**
 * API Key Setup Screen
 * Shown when no API key is configured
 */
const ApiKeySetup: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setApiKeyStore = useConfigStore((state) => state.setApiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setApiKeyStore(apiKey.trim());
      onComplete();
    } catch (err) {
      setError('Failed to save API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[480px]">
          <div className="p-8">
            <div className="mb-6 flex items-center justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h2 className="mb-2 text-center text-2xl font-bold text-text-primary">
              Welcome to Constellation
            </h2>
            <p className="mb-8 text-center text-sm text-text-secondary">
              Enter your Anthropic API key to start orchestrating AI agent swarms.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                error={error || undefined}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
              >
                Get Started
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-text-muted">
              Your API key is stored securely in your system's keychain.
              <br />
              Get your key at{' '}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

/**
 * Main Application Component
 * The fully integrated Constellation UI
 */
const MainApp: React.FC = () => {
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const selectedAgentId = useUIStore((state) => state.selectedAgentId);
  const setSelectedAgentId = useUIStore((state) => state.setSelectedAgentId);
  const activeTab = useUIStore((state) => state.activeTab);
  const inspectorOpen = useUIStore((state) => state.inspectorOpen);
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <AppShell
        sidebar={
          <Sidebar onNewProject={() => setShowNewProject(true)}>
            <ProjectList onNewProject={() => setShowNewProject(true)} />
          </Sidebar>
        }
        header={<Header />}
        statusBar={<StatusBar />}
        inspector={
          inspectorOpen && selectedAgentId ? (
            <AgentInspector
              agentId={selectedAgentId}
              onClose={() => setSelectedAgentId(null)}
            />
          ) : undefined
        }
      >
        {/* Main content area */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-auto"
            >
              <CostDashboard />
            </motion.div>
          ) : selectedProjectId ? (
            <motion.div
              key={selectedProjectId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <ProjectDetail projectId={selectedProjectId} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <EmptyState onNewProject={() => setShowNewProject(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </AppShell>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

/**
 * Empty State Component
 * Shown when no project is selected
 */
const EmptyState: React.FC<{ onNewProject: () => void }> = ({ onNewProject }) => (
  <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
    <div className="relative">
      {/* Pulsing rings */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-secondary/30"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 2, delay: 1, repeat: Infinity }}
      />
      <div className="relative rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
    </div>

    <div>
      <h2 className="mb-2 text-xl font-semibold text-text-primary">
        No Project Selected
      </h2>
      <p className="max-w-md text-sm text-text-secondary">
        Select a project from the sidebar or create a new one to start
        orchestrating your AI agent swarm.
      </p>
    </div>

    <Button variant="primary" onClick={onNewProject}>
      Create New Project
    </Button>
  </div>
);

/**
 * Root App Component
 * Handles initialization, API key setup, and routing to main app
 */
const App: React.FC = () => {
  const { isInitialized, error } = useStoreInitializer();
  const hasApiKey = useConfigStore((state) => state.hasApiKey);
  const checkApiKey = useConfigStore((state) => state.checkApiKey);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if API key setup is needed
  useEffect(() => {
    if (isInitialized && !hasApiKey) {
      setShowApiSetup(true);
    }
  }, [isInitialized, hasApiKey]);

  // Handle retry
  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    window.location.reload();
  };

  // Handle API key setup complete
  const handleApiKeyComplete = async () => {
    await checkApiKey();
    setShowApiSetup(false);
  };

  // Show loading screen
  if (!isInitialized && !error) {
    return <LoadingScreen />;
  }

  // Show error screen
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  // Show API key setup
  if (showApiSetup) {
    return <ApiKeySetup onComplete={handleApiKeyComplete} />;
  }

  // Show main app
  return <MainApp />;
};

export default App;
