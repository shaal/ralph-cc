# Constellation UI - Quick Start Guide

Get up and running with the Constellation component library in 5 minutes.

## 1. Install Dependencies (2 minutes)

```bash
# Install required packages
npm install framer-motion lucide-react clsx tailwind-merge

# Install dev dependencies (if not already installed)
npm install -D tailwindcss postcss autoprefixer
```

## 2. Configure Tailwind (1 minute)

Create or update **`tailwind.config.js`**:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      },
    },
  },
  plugins: [],
}
```

Create **`postcss.config.js`**:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## 3. Import Global Styles (30 seconds)

In your main entry file (e.g., **`src/main.tsx`**):

```typescript
import '@/renderer/styles/globals.css';
```

## 4. Start Building (1 minute)

### Example 1: Simple Button

```tsx
import { Button } from '@/components/common';
import { Play } from 'lucide-react';

function MyComponent() {
  return (
    <Button variant="primary" icon={<Play size={16} />}>
      Start Agent
    </Button>
  );
}
```

### Example 2: Card with Content

```tsx
import { Card, Badge, Button } from '@/components/common';

function AgentCard() {
  return (
    <Card hoverable>
      <h3 className="text-lg font-semibold text-[#F9FAFB]">
        Agent Status
      </h3>
      <Badge variant="success" dot pulse className="mt-2">
        Running
      </Badge>
      <Button variant="primary" className="mt-4">
        View Details
      </Button>
    </Card>
  );
}
```

### Example 3: Full Layout

```tsx
import { AppShell, Sidebar, Header, StatusBar } from '@/components/layout';
import { Button, Card } from '@/components/common';
import { Zap, Settings } from 'lucide-react';

function App() {
  return (
    <AppShell
      sidebar={
        <Sidebar
          navigationItems={[
            {
              id: 'dashboard',
              label: 'Dashboard',
              icon: <Zap size={16} />,
              active: true,
            },
          ]}
          onSettingsClick={() => console.log('Settings')}
        />
      }
      header={
        <Header
          title="Dashboard"
          actions={
            <Button variant="primary">Start All</Button>
          }
          cost={0.0847}
        />
      }
      statusBar={
        <StatusBar
          connectionStatus="connected"
          agentCount={5}
          activeAgents={3}
          version="v1.0.0"
        />
      }
    >
      <div className="p-6">
        <Card>
          <h2 className="text-2xl font-bold">Welcome to Constellation</h2>
          <p className="text-[#9CA3AF] mt-2">
            Your AI agent visualization platform
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
```

### Example 4: Toast Notifications

```tsx
import { Button, useToast, ToastContainer } from '@/components/common';

function NotificationDemo() {
  const { toasts, success, error, removeToast } = useToast();

  return (
    <div>
      <Button
        variant="primary"
        onClick={() => success('Success!', 'Operation completed')}
      >
        Show Success
      </Button>

      <Button
        variant="danger"
        onClick={() => error('Error!', 'Something went wrong')}
      >
        Show Error
      </Button>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
```

### Example 5: Form with Input & Dropdown

```tsx
import { Input, Dropdown, Button, Dialog } from '@/components/common';
import { useState } from 'react';

function ProjectDialog() {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState('opus');

  const models = [
    { value: 'opus', label: 'Claude Opus 4.5', description: 'Most powerful' },
    { value: 'sonnet', label: 'Claude Sonnet 4.5', description: 'Balanced' },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Project</Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Create Project"
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            Create
          </Button>
        }
      >
        <div className="space-y-4">
          <Input placeholder="Project name" />
          <Dropdown
            options={models}
            value={model}
            onChange={setModel}
            searchable
          />
        </div>
      </Dialog>
    </>
  );
}
```

## 5. Common Patterns (30 seconds)

### Status Badge
```tsx
<Badge variant="success" dot pulse>Active</Badge>
<Badge variant="error" dot>Failed</Badge>
<Badge variant="warning">Pending</Badge>
```

### Progress Indicator
```tsx
<LinearProgress value={75} />
<CircularProgress value={65} size={48} />
<LinearProgress indeterminate />
```

### Button Loading State
```tsx
<Button variant="primary" loading>
  Processing...
</Button>
```

### Card with Hover Effect
```tsx
<Card hoverable>
  Content here
</Card>
```

### Tooltip on Button
```tsx
<Tooltip content="Start the agent" position="top">
  <Button icon={<Play />}>Start</Button>
</Tooltip>
```

## Troubleshooting

### Styles not working?
1. Ensure `globals.css` is imported in your entry file
2. Check Tailwind config `content` paths include your components
3. Restart dev server after config changes

### TypeScript errors?
1. Check path aliases in `tsconfig.json`:
   ```json
   "paths": {
     "@/*": ["./src/*"]
   }
   ```
2. Ensure all dependencies are installed
3. Verify React types version matches React version

### Icons not showing?
1. Import from `lucide-react` (not `lucide`)
2. Pass size as number: `<Icon size={16} />`
3. Check icon name is correct (PascalCase)

### Animations not smooth?
1. Verify `framer-motion` is installed
2. Check browser supports backdrop-filter
3. Ensure GPU acceleration is enabled

## Next Steps

1. **Explore Components**: Open `ComponentShowcase.tsx` for live examples
2. **Read Docs**: Check `README.md` for detailed component APIs
3. **Design Guide**: Review `DESIGN_GUIDE.md` for patterns and best practices
4. **Component Map**: Use `COMPONENT_MAP.md` for quick reference

## Common Imports

```typescript
// Most used components
import {
  Button,
  Card,
  Badge,
  Input,
  Dialog,
  useToast,
  ToastContainer,
} from '@/components/common';

import {
  AppShell,
  Sidebar,
  Header,
  StatusBar,
} from '@/components/layout';

// Icons
import { Play, Pause, Settings, Zap } from 'lucide-react';
```

## Color Classes Quick Reference

```tsx
// Backgrounds
className="bg-[#0A0A0F]"      // Base
className="bg-[#12121A]"      // Surface
className="bg-[#1A1A24]"      // Elevated

// Text
className="text-[#F9FAFB]"    // Primary
className="text-[#9CA3AF]"    // Secondary
className="text-[#6B7280]"    // Muted

// Accents
className="text-[#3B82F6]"    // Blue
className="text-[#10B981]"    // Green
className="text-[#EF4444]"    // Red

// Gradient
className="text-gradient"     // Blue-purple gradient
```

## Keyboard Shortcuts

```
Tab           Navigate forward
Shift+Tab     Navigate backward
Enter         Activate button/link
Space         Activate button/checkbox
Escape        Close dialog/dropdown
Arrow Keys    Navigate dropdowns/lists
```

## Tips

1. **Always use the design tokens** - Don't use arbitrary colors
2. **Provide loading states** - Users need feedback on async operations
3. **Include error handling** - Show clear error messages
4. **Test keyboard navigation** - All components should be keyboard accessible
5. **Use tooltips sparingly** - Only for non-obvious actions
6. **Keep animations subtle** - Don't overdo the motion
7. **Maintain spacing consistency** - Use the 4px grid system

## Example Project Structure

```
src/
├── renderer/
│   ├── components/
│   │   ├── common/          # UI components (from library)
│   │   ├── layout/          # Layout components (from library)
│   │   └── features/        # Your custom components
│   │       ├── AgentView/
│   │       └── ProjectList/
│   ├── hooks/
│   │   └── useAgents.ts
│   ├── stores/
│   │   └── projectStore.ts
│   ├── styles/
│   │   └── globals.css      # Constellation styles
│   └── App.tsx
└── main/                    # Electron main process
```

## Getting Help

- **Component Usage**: See `README.md`
- **Design Patterns**: See `DESIGN_GUIDE.md`
- **Component Reference**: See `COMPONENT_MAP.md`
- **Dependencies**: See `DEPENDENCIES.md`
- **Examples**: See `examples/ComponentShowcase.tsx`

---

**You're ready to build!** Start with simple components and gradually compose them into complex interfaces. The design system handles all the styling, animations, and accessibility for you.
