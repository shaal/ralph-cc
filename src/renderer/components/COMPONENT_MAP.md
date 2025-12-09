# Constellation Component Map

Visual reference for all components in the design system.

## Component Hierarchy

```
Constellation UI Library
│
├── Common Components (Building Blocks)
│   │
│   ├── Interactive
│   │   ├── Button         → Primary actions, loading states, icons
│   │   ├── Input          → Text fields, search, validation
│   │   ├── Dropdown       → Select menus with search
│   │   └── Tabs           → Content organization
│   │
│   ├── Feedback
│   │   ├── Toast          → Notifications (success/error/warning/info)
│   │   ├── Tooltip        → Contextual hints
│   │   ├── Badge          → Status indicators with pulse
│   │   └── Progress       → Linear & circular loaders
│   │
│   ├── Containers
│   │   ├── Card           → Content grouping with glass effect
│   │   ├── Dialog         → Modal overlays
│   │   └── ScrollArea     → Custom scrollbars
│   │
│   └── Utils
│       └── (All use cn.ts for class merging)
│
└── Layout Components (Application Structure)
    │
    ├── AppShell           → Master layout container
    │   ├── Sidebar        → Navigation (collapsible)
    │   ├── Header         → Top bar with breadcrumbs
    │   ├── Main Content   → Primary workspace
    │   ├── Inspector      → Right panel (optional)
    │   └── StatusBar      → Bottom metrics
    │
    ├── Sidebar            → Left navigation
    │   ├── Logo           → Constellation branding
    │   ├── Nav Items      → Primary navigation
    │   ├── Projects       → Project list (scrollable)
    │   └── Actions        → Settings, Help buttons
    │
    ├── Header             → Top application bar
    │   ├── Breadcrumbs    → Navigation path
    │   ├── Actions        → Context buttons
    │   └── Cost Badge     → Current cost display
    │
    └── StatusBar          → Bottom status display
        ├── Connection     → API status indicator
        ├── Agent Count    → Active/total agents
        ├── Cost Rate      → Cost per hour
        └── Version        → App version
```

## Component Composition Patterns

### Full Application Layout
```
AppShell
├── Sidebar
│   ├── Logo + Title
│   ├── Button (nav items)
│   ├── ScrollArea
│   │   └── Button (projects)
│   └── Button (settings, help)
│
├── Header
│   ├── Breadcrumbs
│   ├── Button (actions)
│   └── Badge (cost)
│
├── Main Content
│   └── [Your content]
│       ├── Card
│       │   ├── Badge
│       │   ├── Progress
│       │   └── Button
│       ├── Tabs
│       └── Dialog
│
├── Inspector (optional)
│   └── ScrollArea
│       └── Card
│
└── StatusBar
    └── Badge (connection, metrics)
```

### Common Card Pattern
```
Card (hoverable)
├── Header
│   ├── Title
│   └── Badge (status)
│
├── Body
│   ├── Content
│   ├── Progress
│   └── Badge
│
└── Footer
    ├── Button (secondary)
    └── Button (primary)
```

### Dialog Pattern
```
Dialog
├── Header
│   ├── Title
│   ├── Description
│   └── Button (close)
│
├── Body
│   ├── Input
│   ├── Dropdown
│   └── Tabs
│
└── Footer
    ├── Button (cancel)
    └── Button (confirm)
```

## Component Dependencies

### External Dependencies
```
All Components
├── React 18+
├── TypeScript 5+
└── Tailwind CSS 3+

Interactive Components
├── Framer Motion (animations)
└── Lucide React (icons)

Utility
├── clsx (conditional classes)
└── tailwind-merge (class merging)
```

### Internal Dependencies
```
All Components
└── utils/cn.ts (class utility)

All Components
└── styles/globals.css (design tokens)
```

## Component Size Reference

### Button Sizes
```
sm:  px-3 py-1.5  text-sm   [  Small  ]
md:  px-4 py-2    text-sm   [  Medium  ]
lg:  px-6 py-3    text-base [ Large Btn ]
```

### Dialog Sizes
```
sm:  max-w-md   (28rem / 448px)
md:  max-w-lg   (32rem / 512px)
lg:  max-w-2xl  (42rem / 672px)
xl:  max-w-4xl  (56rem / 896px)
```

### Icon Sizes (Lucide)
```
12px  → Tiny (badges, dense UI)
14px  → Small (tabs, small buttons)
16px  → Default (buttons, inputs)
20px  → Medium (headings, emphasis)
24px  → Large (hero sections)
```

## Color Usage by Component

### Button
```
Primary:    Blue gradient (#3B82F6 → #8B5CF6)
Secondary:  Dark gray with blue border
Ghost:      Transparent with blue hover
Danger:     Red accent (#EF4444)
```

### Badge
```
Default:    Gray
Success:    Green (#10B981)
Warning:    Yellow (#F59E0B)
Error:      Red (#EF4444)
Info:       Blue (#3B82F6)
```

### Progress
```
Bar:        Blue-purple gradient
Track:      Dark gray (#1A1A24)
Glow:       Blue shadow on active
```

### Status Indicators
```
Connected:     Green dot  ●
Disconnected:  Red dot    ●
Connecting:    Yellow dot ● (pulsing)
Active:        Blue dot   ● (pulsing)
```

## Animation Patterns

### Entrance Animations
```
Card:    fade + slide up (y: 10 → 0)
Dialog:  scale + fade (0.95 → 1.0)
Toast:   slide right (x: 100 → 0)
Tooltip: fade + scale (0.95 → 1.0)
```

### Hover Animations
```
Button:  scale 1.02 + glow
Card:    border glow + shadow
Badge:   subtle scale 1.05
```

### Active Animations
```
Button:  scale 0.98 (press feedback)
Badge:   pulse (dot indicator)
Progress: shimmer (indeterminate)
```

## State Variations

### Button States
```
Default   → Gradient background, shadow
Hover     → Increased shadow, glow
Active    → Scale down (0.98)
Disabled  → 50% opacity, no pointer
Loading   → Spinner icon, no pointer
```

### Input States
```
Default   → Dark background, subtle border
Focus     → Blue border, ring, shadow glow
Error     → Red border, ring, error text
Disabled  → 50% opacity, no pointer
```

### Card States
```
Default   → Glass background, subtle border
Hoverable → Blue border glow on hover
Elevated  → Stronger shadow
```

## Responsive Behavior

### Sidebar
```
Desktop:     280px wide (expanded)
Collapsed:   64px wide (icons only)
Mobile:      Overlay (full width)
```

### AppShell
```
Desktop:     Sidebar + Content + Inspector
Tablet:      Sidebar + Content (no inspector)
Mobile:      Content only (sidebar overlay)
```

### Card Grid
```
Large:   3 columns (lg:grid-cols-3)
Medium:  2 columns (md:grid-cols-2)
Small:   1 column  (grid-cols-1)
```

## Accessibility Features

### Keyboard Navigation
```
Tab        → Move focus
Enter      → Activate button/link
Space      → Activate button/checkbox
Escape     → Close dialog/dropdown
Arrows     → Navigate lists/dropdowns
```

### ARIA Support
```
Button       → aria-label for icon-only
Dialog       → role="dialog", aria-modal
Toast        → role="alert" for errors
Input        → aria-describedby for errors
Dropdown     → aria-expanded, aria-selected
```

### Focus Indicators
```
All interactive elements have:
- Visible focus ring (2px blue)
- Ring offset (2px)
- High contrast (3:1 ratio)
```

## Component Export Structure

```typescript
// From common/index.ts
export {
  Button, Card, Badge, Input,
  Dialog, Tabs, Tooltip,
  LinearProgress, CircularProgress,
  Dropdown, ScrollArea,
  ToastContainer, useToast
};

// From layout/index.ts
export {
  AppShell, Sidebar, Header, StatusBar
};

// From components/index.ts
export * from './common';
export * from './layout';
```

## Quick Component Selector

**Need to...** → **Use this component**

Show a button → `Button`
Display status → `Badge`
Group content → `Card`
Get text input → `Input`
Select option → `Dropdown`
Show progress → `LinearProgress` or `CircularProgress`
Navigate tabs → `Tabs`
Show tooltip → `Tooltip`
Alert user → `Toast` (via `useToast`)
Confirm action → `Dialog`
Custom scroll → `ScrollArea`

Build layout → `AppShell`
Side navigation → `Sidebar`
Top bar → `Header`
Bottom bar → `StatusBar`

## Performance Tips

### Do's
- Use `AnimatePresence` for exit animations
- Memoize heavy components
- Lazy load large dialogs
- Use `transform` and `opacity` for animations

### Don'ts
- Animate `width`, `height`, `top`, `left`
- Nest multiple glass effects
- Render many toast notifications
- Deep nesting of animated components

---

*Use this map as a quick reference when building Constellation interfaces.*
