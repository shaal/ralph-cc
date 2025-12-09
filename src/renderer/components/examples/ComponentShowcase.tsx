import { useState } from 'react';
import {
  Play,
  Pause,
  StopCircle,
  Settings,
  FileCode,
  Database,
  Zap,
  GitBranch,
  Users,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Input,
  Dialog,
  Tabs,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Dropdown,
  ScrollArea,
  useToast,
  ToastContainer,
} from '../common';
import {
  AppShell,
  Sidebar,
  Header,
  StatusBar,
} from '../layout';

/**
 * Component Showcase - Demo of all Constellation UI components
 * This file demonstrates the usage of all components in the design system
 */
export function ComponentShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedOption, setSelectedOption] = useState('option1');
  const { toasts, addToast, removeToast, success, error, warning, info } = useToast();

  // Sidebar navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Zap size={16} />, active: true },
    { id: 'projects', label: 'Projects', icon: <FileCode size={16} />, badge: 3 },
    { id: 'agents', label: 'Agents', icon: <Users size={16} />, badge: 12 },
    { id: 'database', label: 'Database', icon: <Database size={16} /> },
  ];

  const projectItems = [
    { id: 'project1', label: 'E-Commerce Refactor', icon: <GitBranch size={16} />, badge: 2 },
    { id: 'project2', label: 'API Integration', icon: <GitBranch size={16} />, badge: 5 },
    { id: 'project3', label: 'UI Redesign', icon: <GitBranch size={16} /> },
  ];

  // Tab content
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Zap size={14} />,
      content: <ComponentsDemo />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={14} />,
      content: <SettingsDemo />,
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <Users size={14} />,
      content: <AgentsDemo />,
    },
  ];

  // Dropdown options
  const dropdownOptions = [
    {
      value: 'option1',
      label: 'Claude Opus 4.5',
      icon: <Zap size={16} />,
      description: 'Most powerful model',
    },
    {
      value: 'option2',
      label: 'Claude Sonnet 4.5',
      icon: <Zap size={16} />,
      description: 'Balanced performance',
    },
    {
      value: 'option3',
      label: 'Claude Haiku 4',
      icon: <Zap size={16} />,
      description: 'Fastest model',
    },
  ];

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={setSidebarCollapsed}
            navigationItems={navigationItems}
            projectItems={projectItems}
            onSettingsClick={() => setDialogOpen(true)}
            onHelpClick={() => info('Help', 'Check out our documentation')}
          />
        }
        header={
          <Header
            breadcrumbs={[
              { label: 'Projects', onClick: () => {} },
              { label: 'E-Commerce Refactor', onClick: () => {} },
              { label: 'Overview' },
            ]}
            actions={
              <div className="flex items-center gap-2">
                <Tooltip content="Start all agents">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play size={14} />}
                    onClick={() => success('Started!', 'All agents are now running')}
                  >
                    Start
                  </Button>
                </Tooltip>
                <Tooltip content="Pause execution">
                  <Button variant="secondary" size="sm" icon={<Pause size={14} />}>
                    Pause
                  </Button>
                </Tooltip>
                <Tooltip content="Stop all agents">
                  <Button variant="ghost" size="sm" icon={<StopCircle size={14} />}>
                    Stop
                  </Button>
                </Tooltip>
              </div>
            }
            cost={0.0847}
          />
        }
        statusBar={
          <StatusBar
            connectionStatus="connected"
            agentCount={12}
            activeAgents={8}
            costRate={0.156}
            version="v1.0.0-alpha"
          />
        }
      >
        <div className="p-6 space-y-6">
          {/* Hero Section */}
          <Card hoverable>
            <div className="text-center space-y-4 py-8">
              <h1 className="text-4xl font-bold text-gradient">
                Constellation Design System
              </h1>
              <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
                A premium component library for AI agent visualization with glass-morphism,
                animations, and electric blue accents
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="primary"
                  onClick={() => success('Welcome!', 'Enjoy exploring the components')}
                >
                  Get Started
                </Button>
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  View Dialog
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => warning('Demo Mode', 'This is a component showcase')}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </Card>

          {/* Tabs Demo */}
          <Card header={<h2 className="text-lg font-semibold">Component Tabs</h2>}>
            <Tabs tabs={tabs} />
          </Card>

          {/* Toast Notifications */}
          <Card header={<h2 className="text-lg font-semibold">Toast Notifications</h2>}>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => success('Success!', 'Operation completed successfully')}
              >
                Show Success
              </Button>
              <Button
                variant="danger"
                onClick={() => error('Error!', 'Something went wrong')}
              >
                Show Error
              </Button>
              <Button
                variant="secondary"
                onClick={() => warning('Warning!', 'Please review this action')}
              >
                Show Warning
              </Button>
              <Button
                variant="ghost"
                onClick={() => info('Info', 'Here is some useful information')}
              >
                Show Info
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>

      {/* Dialog Demo */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Settings"
        description="Configure your workspace preferences"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDialogOpen(false);
                success('Saved!', 'Settings updated successfully');
              }}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
              Model Selection
            </label>
            <Dropdown
              options={dropdownOptions}
              value={selectedOption}
              onChange={setSelectedOption}
              searchable
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
              Project Name
            </label>
            <Input placeholder="Enter project name" />
          </div>
        </div>
      </Dialog>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

// Demo content for tabs
function ComponentsDemo() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons */}
        <Card header={<h3 className="font-semibold">Buttons</h3>}>
          <div className="space-y-3">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button variant="primary" loading>
              Loading...
            </Button>
          </div>
        </Card>

        {/* Badges */}
        <Card header={<h3 className="font-semibold">Badges</h3>}>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="success" dot>
              Success
            </Badge>
            <Badge variant="warning" dot pulse>
              Warning
            </Badge>
            <Badge variant="error" dot>
              Error
            </Badge>
            <Badge variant="info" dot pulse>
              Running
            </Badge>
          </div>
        </Card>

        {/* Progress */}
        <Card header={<h3 className="font-semibold">Progress Bars</h3>}>
          <div className="space-y-4">
            <LinearProgress value={75} />
            <LinearProgress indeterminate />
            <div className="flex gap-4 justify-center">
              <CircularProgress value={65} />
              <CircularProgress indeterminate />
            </div>
          </div>
        </Card>

        {/* Inputs */}
        <Card header={<h3 className="font-semibold">Input Fields</h3>}>
          <div className="space-y-3">
            <Input placeholder="Default input" />
            <Input variant="search" placeholder="Search..." />
            <Input placeholder="With error" error="This field is required" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsDemo() {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold mb-4">General Settings</h3>
        <div className="space-y-4">
          <Input placeholder="Workspace name" />
          <Input variant="search" placeholder="Search settings..." />
        </div>
      </Card>
    </div>
  );
}

function AgentsDemo() {
  return (
    <ScrollArea className="h-96">
      <div className="space-y-3 pr-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} hoverable>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CircularProgress value={Math.random() * 100} size={32} strokeWidth={3} />
                <div>
                  <h4 className="font-medium">Agent {i + 1}</h4>
                  <p className="text-xs text-[#6B7280]">Running task #{i + 1}</p>
                </div>
              </div>
              <Badge variant={i % 2 === 0 ? 'success' : 'info'} dot pulse>
                {i % 2 === 0 ? 'Active' : 'Working'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
