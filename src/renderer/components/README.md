# Constellation Design System

A premium, high-end UI component library for the Constellation AI agent visualization platform. Inspired by Linear, Raycast, and Arc browser, featuring dark theme with electric blue accents, glass-morphism effects, and smooth animations.

## Design Philosophy

- **Premium & Polished**: Every component feels like a high-end developer tool
- **Dark Theme First**: Optimized for extended coding sessions
- **Electric Blue Accents**: Signature blue-purple gradient (#3B82F6 to #8B5CF6)
- **Glass-morphism**: Semi-transparent backgrounds with backdrop blur
- **Smooth Animations**: Powered by Framer Motion for buttery interactions
- **Accessibility**: Keyboard navigation, ARIA labels, and focus management

## Technology Stack

- **React 18.x** with TypeScript
- **Tailwind CSS 3.x** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **clsx + tailwind-merge** for class management

## Component Library

### Common Components

#### Button
Multiple variants with loading states, icons, and smooth hover animations.

```tsx
import { Button } from '@/components/common';
import { Play } from 'lucide-react';

<Button variant="primary" icon={<Play size={16} />}>
  Start Agent
</Button>
<Button variant="secondary" loading>Loading...</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger">Delete</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'danger'`
- `size`: `'sm' | 'md' | 'lg'`
- `loading`: `boolean`
- `icon`: `ReactNode`

#### Card
Glass-morphism cards with optional header and footer.

```tsx
import { Card } from '@/components/common';

<Card
  hoverable
  header={<h3>Agent Status</h3>}
  footer={<Button variant="primary">View Details</Button>}
>
  Card content here
</Card>
```

**Props:**
- `variant`: `'default' | 'elevated'`
- `hoverable`: `boolean` - Adds glow effect on hover
- `header`: `ReactNode`
- `footer`: `ReactNode`

#### Badge
Status badges with animated pulse effects.

```tsx
import { Badge } from '@/components/common';

<Badge variant="success" dot pulse>Running</Badge>
<Badge variant="error" dot>Failed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Processing</Badge>
```

**Props:**
- `variant`: `'default' | 'success' | 'warning' | 'error' | 'info'`
- `dot`: `boolean` - Show status dot
- `pulse`: `boolean` - Animate the dot

#### Input
Text input with search variant and error states.

```tsx
import { Input } from '@/components/common';
import { Search } from 'lucide-react';

<Input placeholder="Enter text" />
<Input variant="search" placeholder="Search..." />
<Input error="This field is required" />
<Input prefix={<Search size={16} />} />
```

**Props:**
- `variant`: `'default' | 'search'`
- `error`: `string`
- `prefix`: `ReactNode`
- `suffix`: `ReactNode`

#### Dialog
Animated modal dialogs with backdrop blur.

```tsx
import { Dialog } from '@/components/common';

<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Settings"
  description="Configure your preferences"
  size="lg"
  footer={
    <Button variant="primary" onClick={handleSave}>
      Save Changes
    </Button>
  }
>
  Dialog content
</Dialog>
```

**Props:**
- `open`: `boolean`
- `onOpenChange`: `(open: boolean) => void`
- `title`: `ReactNode`
- `description`: `ReactNode`
- `size`: `'sm' | 'md' | 'lg' | 'xl'`
- `footer`: `ReactNode`

#### Tabs
Tab navigation with sliding indicator animation.

```tsx
import { Tabs } from '@/components/common';
import { Zap, Settings } from 'lucide-react';

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Zap size={14} />,
    content: <OverviewPanel />
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={14} />,
    content: <SettingsPanel />
  }
];

<Tabs tabs={tabs} defaultTab="overview" variant="default" />
<Tabs tabs={tabs} variant="pills" />
```

**Props:**
- `tabs`: `Tab[]` - Array of tab objects
- `defaultTab`: `string` - Initial active tab
- `variant`: `'default' | 'pills'`
- `onChange`: `(tabId: string) => void`

#### Tooltip
Hover tooltips with customizable positioning.

```tsx
import { Tooltip } from '@/components/common';

<Tooltip content="Click to start" position="top">
  <Button>Start</Button>
</Tooltip>
```

**Props:**
- `content`: `ReactNode`
- `position`: `'top' | 'bottom' | 'left' | 'right'`
- `delay`: `number` - Delay in ms (default: 200)

#### Progress
Linear and circular progress indicators.

```tsx
import { LinearProgress, CircularProgress } from '@/components/common';

<LinearProgress value={75} size="md" />
<LinearProgress indeterminate />

<CircularProgress value={65} size={48} />
<CircularProgress indeterminate size={32} />
```

**LinearProgress Props:**
- `value`: `number` - 0-100
- `indeterminate`: `boolean`
- `size`: `'sm' | 'md' | 'lg'`

**CircularProgress Props:**
- `value`: `number` - 0-100
- `indeterminate`: `boolean`
- `size`: `number` - Diameter in pixels
- `strokeWidth`: `number`

#### Dropdown
Select dropdown with search functionality.

```tsx
import { Dropdown } from '@/components/common';

const options = [
  {
    value: 'opus',
    label: 'Claude Opus 4.5',
    icon: <Zap size={16} />,
    description: 'Most powerful model'
  },
  { value: 'sonnet', label: 'Claude Sonnet 4.5' }
];

<Dropdown
  options={options}
  value={selected}
  onChange={setSelected}
  searchable
/>
```

**Props:**
- `options`: `DropdownOption[]`
- `value`: `string`
- `onChange`: `(value: string) => void`
- `placeholder`: `string`
- `searchable`: `boolean`

#### ScrollArea
Custom scrollbar with auto-hide functionality.

```tsx
import { ScrollArea } from '@/components/common';

<ScrollArea className="h-96">
  <div>Long content...</div>
</ScrollArea>
```

#### Toast
Toast notifications with auto-dismiss.

```tsx
import { useToast, ToastContainer } from '@/components/common';

function MyComponent() {
  const { toasts, success, error, warning, info, removeToast } = useToast();

  const handleSuccess = () => {
    success('Success!', 'Operation completed');
  };

  return (
    <>
      <Button onClick={handleSuccess}>Show Toast</Button>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

**useToast Hook:**
- `toasts`: Array of active toasts
- `success(title, description?)`: Show success toast
- `error(title, description?)`: Show error toast
- `warning(title, description?)`: Show warning toast
- `info(title, description?)`: Show info toast
- `removeToast(id)`: Manually dismiss a toast

### Layout Components

#### AppShell
Main application layout container.

```tsx
import { AppShell } from '@/components/layout';

<AppShell
  sidebar={<Sidebar />}
  header={<Header />}
  statusBar={<StatusBar />}
  inspector={<InspectorPanel />}
  showInspector={true}
>
  <MainContent />
</AppShell>
```

**Props:**
- `sidebar`: `ReactNode`
- `header`: `ReactNode`
- `children`: Main content
- `inspector`: `ReactNode` - Right panel
- `statusBar`: `ReactNode`
- `sidebarCollapsed`: `boolean`
- `onSidebarToggle`: `(collapsed: boolean) => void`
- `showInspector`: `boolean`

#### Sidebar
Navigation sidebar with collapsible support.

```tsx
import { Sidebar } from '@/components/layout';
import { Zap, Settings } from 'lucide-react';

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Zap size={16} />,
    active: true,
    badge: 5
  }
];

<Sidebar
  collapsed={false}
  onToggle={setCollapsed}
  navigationItems={navItems}
  projectItems={projects}
  onSettingsClick={openSettings}
  onHelpClick={openHelp}
/>
```

**Props:**
- `collapsed`: `boolean`
- `onToggle`: `(collapsed: boolean) => void`
- `navigationItems`: `SidebarItem[]`
- `projectItems`: `SidebarItem[]`
- `onSettingsClick`: `() => void`
- `onHelpClick`: `() => void`

#### Header
Top header with breadcrumbs and actions.

```tsx
import { Header } from '@/components/layout';
import { Play, Pause } from 'lucide-react';

<Header
  breadcrumbs={[
    { label: 'Projects', onClick: () => navigate('/projects') },
    { label: 'Current Project' }
  ]}
  actions={
    <>
      <Button icon={<Play />}>Start</Button>
      <Button icon={<Pause />}>Pause</Button>
    </>
  }
  cost={0.0847}
/>
```

**Props:**
- `title`: `string` - Simple title (alternative to breadcrumbs)
- `breadcrumbs`: `BreadcrumbItem[]`
- `actions`: `ReactNode`
- `cost`: `number` - Current cost to display

#### StatusBar
Bottom status bar with connection status and metrics.

```tsx
import { StatusBar } from '@/components/layout';

<StatusBar
  connectionStatus="connected"
  agentCount={12}
  activeAgents={8}
  costRate={0.156}
  version="v1.0.0"
  customItems={<CustomMetric />}
/>
```

**Props:**
- `connectionStatus`: `'connected' | 'disconnected' | 'connecting'`
- `agentCount`: `number`
- `activeAgents`: `number`
- `costRate`: `number` - Cost per hour
- `version`: `string`
- `customItems`: `ReactNode`

## Design Tokens

### Colors

```css
/* Primary Colors */
--color-primary: #3B82F6 (blue)
--color-secondary: #8B5CF6 (purple)
--color-success: #10B981 (green)
--color-warning: #F59E0B (yellow)
--color-error: #EF4444 (red)

/* Backgrounds */
--color-bg-primary: #0A0A0F (near black)
--color-bg-secondary: #12121A (dark surface)
--color-bg-tertiary: #1A1A24 (elevated surface)

/* Borders */
--color-border: #1E1E2E (subtle border)
--color-border-focus: #3B82F6 (focus border)

/* Text */
--color-text-primary: #F9FAFB (white)
--color-text-secondary: #9CA3AF (gray)
--color-text-muted: #6B7280 (muted)
```

### Gradients

```css
--gradient-primary: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)
--gradient-glow: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)
```

### Utility Classes

```css
.glass              /* Glass-morphism effect */
.glow               /* Blue glow shadow */
.glow-sm            /* Small glow */
.glow-lg            /* Large glow */
.text-gradient      /* Blue-purple gradient text */
.animate-glow       /* Pulsing glow animation */
.shimmer            /* Shimmer loading effect */
.custom-scrollbar   /* Styled scrollbar */
.scrollbar-hide     /* Hide scrollbar */
```

## Usage Example

```tsx
import {
  AppShell,
  Sidebar,
  Header,
  StatusBar
} from '@/components/layout';
import {
  Button,
  Card,
  Badge,
  useToast,
  ToastContainer
} from '@/components/common';
import { Play, Pause } from 'lucide-react';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toasts, success, removeToast } = useToast();

  return (
    <AppShell
      sidebar={
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={setSidebarCollapsed}
          navigationItems={navItems}
        />
      }
      header={
        <Header
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              variant="primary"
              icon={<Play size={16} />}
              onClick={() => success('Started', 'Agents are running')}
            >
              Start
            </Button>
          }
          cost={0.0847}
        />
      }
      statusBar={
        <StatusBar
          connectionStatus="connected"
          agentCount={12}
          activeAgents={8}
        />
      }
    >
      <div className="p-6">
        <Card hoverable>
          <h2 className="text-xl font-bold text-gradient">
            AI Agent Dashboard
          </h2>
          <p className="text-[#9CA3AF] mt-2">
            Monitor and control your agent swarm
          </p>
          <Badge variant="success" dot pulse className="mt-4">
            All systems operational
          </Badge>
        </Card>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </AppShell>
  );
}
```

## Installation

Make sure you have the required dependencies:

```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

Import the global styles in your main entry point:

```tsx
import '@/renderer/styles/globals.css';
```

## Best Practices

1. **Consistent Spacing**: Use the 4px grid system (space-2, space-4, space-6, etc.)
2. **Hover States**: Always provide visual feedback on interactive elements
3. **Loading States**: Use loading states for async operations
4. **Error Handling**: Show clear error messages with the error variant
5. **Accessibility**: Include ARIA labels and keyboard navigation
6. **Performance**: Use `AnimatePresence` for exit animations
7. **Dark Theme**: Design with the dark background in mind

## Contributing

When adding new components:
1. Follow the existing naming conventions
2. Add TypeScript types for all props
3. Include hover and focus states
4. Add animations with Framer Motion
5. Update this README with usage examples
6. Ensure accessibility with ARIA labels

## License

Part of the Constellation project.
