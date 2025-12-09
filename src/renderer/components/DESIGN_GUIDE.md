# Constellation Design System - Quick Reference Guide

## Design Principles

### 1. Premium & Professional
- High-end developer tool aesthetic (Linear, Raycast, Arc browser)
- Polished animations and transitions
- Attention to micro-interactions

### 2. Dark Theme Optimized
- Easy on the eyes during extended sessions
- High contrast for readability
- Subtle gradients for depth

### 3. Consistent Visual Language
- Electric blue (#3B82F6) as primary accent
- Purple (#8B5CF6) for secondary accents
- Gradient combinations for premium feel

### 4. Glass-morphism & Depth
- Semi-transparent backgrounds
- Backdrop blur effects
- Layered elevation system

## Color System

### Primary Palette
```
Electric Blue:  #3B82F6  ████  Primary actions, links, focus states
Purple:         #8B5CF6  ████  Secondary accents, gradients
Green:          #10B981  ████  Success states, positive actions
Yellow:         #F59E0B  ████  Warnings, caution states
Red:            #EF4444  ████  Errors, destructive actions
```

### Background Hierarchy
```
Deep Black:     #0A0A0F  ████  Base background (Level 0)
Dark Surface:   #12121A  ████  Cards, panels (Level 1)
Elevated:       #1A1A24  ████  Raised elements (Level 2)
```

### Text Hierarchy
```
Primary:        #F9FAFB  ████  Headings, important text
Secondary:      #9CA3AF  ████  Body text, descriptions
Muted:          #6B7280  ████  Placeholders, disabled text
```

### Borders
```
Default:        #1E1E2E  ████  Subtle separators
Focus:          #3B82F6  ████  Active/focused elements
```

## Typography

### Font Stack
```css
/* Sans-serif (UI) */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto';

/* Monospace (Code/Data) */
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono';
```

### Scale
```
text-xs     12px  Labels, captions
text-sm     14px  Body text, buttons
text-base   16px  Default text
text-lg     18px  Subheadings
text-xl     20px  Headings
text-2xl    24px  Page titles
text-3xl    30px  Hero text
text-4xl    36px  Display text
```

### Weight
```
font-normal    400   Body text
font-medium    500   Emphasized text
font-semibold  600   Headings
font-bold      700   Highlights
```

## Spacing System

Use the 4px grid system:

```
space-1    4px
space-2    8px
space-3    12px
space-4    16px    ← Most common
space-5    20px
space-6    24px    ← Section spacing
space-8    32px
space-12   48px
space-16   64px
```

### Padding Guidelines
- **Buttons**: `px-4 py-2` (16px × 8px)
- **Cards**: `p-6` (24px all sides)
- **Inputs**: `px-4 py-2.5` (16px × 10px)
- **Modals**: `p-6` for content, `p-4` for header/footer

### Gap Guidelines
- **Inline elements**: `gap-2` or `gap-3`
- **Card grids**: `gap-4` or `gap-6`
- **Sections**: `gap-6` or `gap-8`

## Border Radius

```
rounded-md    6px    Small elements (buttons, badges)
rounded-lg    8px    Cards, inputs
rounded-xl    12px   Modals, large cards
rounded-2xl   16px   Hero sections
rounded-full  9999px Circular elements
```

## Shadows & Elevation

### Shadow Scale
```css
/* Level 0 - Flat */
shadow-none

/* Level 1 - Subtle */
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)

/* Level 2 - Card */
shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)

/* Level 3 - Modal */
shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### Glow Effects
```css
/* Subtle glow */
box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);

/* Medium glow */
box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);

/* Strong glow */
box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
```

## Animation Guidelines

### Duration
```
Fast:      150ms   Hover states, tooltips
Default:   200ms   Buttons, inputs
Medium:    300ms   Cards, modals
Slow:      500ms   Complex transitions
```

### Easing
```css
ease-out      Default for entrances
ease-in       Default for exits
ease-in-out   Smooth both ways
spring        Elastic, playful (Framer Motion)
```

### Common Patterns
```tsx
// Hover scale
whileHover={{ scale: 1.02 }}

// Click feedback
whileTap={{ scale: 0.98 }}

// Fade in
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}

// Slide up
initial={{ y: 10, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
```

## Component Patterns

### Button States
```tsx
// Default state
bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6]

// Hover state
hover:shadow-xl hover:shadow-[#3B82F6]/40

// Active state
active:scale-95

// Disabled state
disabled:opacity-50 disabled:cursor-not-allowed
```

### Card Hover Effect
```tsx
whileHover={{
  borderColor: 'rgba(59, 130, 246, 0.5)',
  boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
}}
```

### Input Focus State
```tsx
focus:outline-none
focus:border-[#3B82F6]
focus:ring-2
focus:ring-[#3B82F6]/20
focus:shadow-lg
focus:shadow-[#3B82F6]/10
```

## Icon Usage

### Icon Sizes
```tsx
<Icon size={12} />  // Tiny (badges)
<Icon size={14} />  // Small (tabs, small buttons)
<Icon size={16} />  // Default (buttons, inputs)
<Icon size={20} />  // Medium (headings)
<Icon size={24} />  // Large (hero sections)
```

### Icon Colors
```tsx
className="text-[#3B82F6]"     // Primary
className="text-[#10B981]"     // Success
className="text-[#F59E0B]"     // Warning
className="text-[#EF4444]"     // Error
className="text-[#6B7280]"     // Muted
```

## Status Indicators

### Connection States
```tsx
Connected:     Green dot  #10B981
Disconnected:  Red dot    #EF4444
Connecting:    Yellow dot #F59E0B (pulsing)
```

### Agent States
```tsx
Running:   Blue   #3B82F6 (pulsing)
Success:   Green  #10B981
Error:     Red    #EF4444
Paused:    Yellow #F59E0B
Idle:      Gray   #6B7280
```

## Accessibility

### Contrast Ratios
- **Primary text**: #F9FAFB on #0A0A0F = 18.4:1 ✓
- **Secondary text**: #9CA3AF on #0A0A0F = 9.2:1 ✓
- **Muted text**: #6B7280 on #0A0A0F = 5.8:1 ✓

### Focus Indicators
Always include visible focus states:
```tsx
focus:outline-none
focus:ring-2
focus:ring-[#3B82F6]/50
focus:ring-offset-2
focus:ring-offset-[#0A0A0F]
```

### Keyboard Navigation
- Support Tab/Shift+Tab
- Arrow keys for lists/dropdowns
- Escape to close modals
- Enter/Space for activation

### ARIA Labels
```tsx
<button aria-label="Start agent">
  <Play size={16} />
</button>

<input aria-describedby="error-message" />
<span id="error-message" role="alert">Error text</span>
```

## Common Layouts

### Dashboard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>...</Card>
</div>
```

### Sidebar Layout
```tsx
<div className="flex h-screen">
  <aside className="w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

### Header with Actions
```tsx
<header className="flex items-center justify-between px-6 py-4">
  <h1>Title</h1>
  <div className="flex gap-2">Actions</div>
</header>
```

## Performance Tips

### 1. Avoid Layout Shifts
- Use fixed heights for loading states
- Reserve space for dynamic content
- Use skeleton screens

### 2. Optimize Animations
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly

### 3. Lazy Load
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 4. Memoize Components
```tsx
const MemoizedCard = memo(Card);
```

## Best Practices

### ✅ Do
- Use consistent spacing (4px grid)
- Provide loading and error states
- Include hover feedback on interactive elements
- Use semantic HTML elements
- Test with keyboard navigation
- Maintain color contrast ratios

### ❌ Don't
- Mix spacing scales arbitrarily
- Animate too many properties at once
- Use colors outside the design system
- Forget disabled/loading states
- Ignore focus indicators
- Use nested glass effects (performance)

## Quick Checklist

When creating a new component:

- [ ] TypeScript types defined for all props
- [ ] Variants support (if applicable)
- [ ] Hover state with visual feedback
- [ ] Focus state with keyboard navigation
- [ ] Disabled state (reduced opacity, no pointer events)
- [ ] Loading state (with spinner or skeleton)
- [ ] Error state (red accent, error message)
- [ ] Responsive design (mobile to desktop)
- [ ] Accessibility (ARIA labels, keyboard support)
- [ ] Animation (smooth, purposeful)
- [ ] Documentation (README example)

## Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Framer Motion Docs**: https://www.framer.com/motion/
- **Lucide Icons**: https://lucide.dev/icons/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/

---

*This design system is optimized for the Constellation AI agent visualization platform.*
