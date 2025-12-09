# Cost Dashboard

A comprehensive, real-time cost tracking dashboard for Constellation's AI agent orchestration platform. Features beautiful visualizations, budget alerts, and cost projections.

## Features

### Summary Cards
- **Total Cost**: Lifetime spending across all projects
- **Today's Cost**: Daily spending with trend indicators
- **Current Rate**: Real-time spending rate ($/hour)
- **Budget Remaining**: Available budget with runway estimation

### Visualizations
- **Cost Over Time**: Interactive line chart with time range selector (1h, 24h, 7d, 30d)
- **Project Breakdown**: Horizontal bar chart showing cost distribution by project
- **Token Metrics**: Donut chart visualizing input vs output token usage
- **Agent Cost Table**: Sortable, searchable table with pagination and CSV export

### Alerts & Projections
- **Budget Alerts**: Automatic warnings at 75% and 90% usage with snooze options
- **Cost Projections**: Daily/monthly projections, burn rate, and runway calculations
- **Recommendations**: Smart suggestions based on spending patterns

## Usage

### Basic Implementation

```tsx
import { CostDashboard } from '@/renderer/components/dashboard';

function App() {
  return <CostDashboard />;
}
```

### Using Individual Components

```tsx
import {
  SummaryCards,
  CostChart,
  ProjectCostBreakdown,
  AgentCostTable,
  BudgetAlert,
  TokenMetrics,
  CostProjection,
} from '@/renderer/components/dashboard';
import { useCostData, useBudgetAlert } from '@/renderer/hooks';

function CustomDashboard() {
  const { summary, history, byProject, byAgent, tokenMetrics, projection } = useCostData('24h');
  const { activeAlert, dismiss, snooze } = useBudgetAlert();

  return (
    <div className="p-6 space-y-6">
      {activeAlert && <BudgetAlert alert={activeAlert} onDismiss={dismiss} onSnooze={snooze} />}
      <SummaryCards summary={summary} />
      <div className="grid grid-cols-2 gap-6">
        <CostChart data={history} timeRange="24h" onTimeRangeChange={() => {}} />
        <ProjectCostBreakdown data={byProject} />
      </div>
      <TokenMetrics metrics={tokenMetrics} />
      <CostProjection projection={projection} />
      <AgentCostTable data={byAgent} />
    </div>
  );
}
```

## Hooks

### `useCostData`

Fetches and aggregates cost data across all projects and agents.

```tsx
const {
  summary,      // CostSummary: aggregated metrics
  history,      // CostHistory[]: time-series data
  byProject,    // ProjectCost[]: per-project costs
  byAgent,      // AgentCost[]: per-agent costs
  tokenMetrics, // TokenMetrics: token usage stats
  projection,   // CostProjection: future projections
  loading,      // boolean: loading state
  error,        // Error | null: error state
  refresh,      // () => Promise<void>: manual refresh
} = useCostData(timeRange);
```

**Parameters:**
- `timeRange`: `'1h' | '24h' | '7d' | '30d'` (default: `'24h'`)

**Auto-refresh:** Updates every 5 seconds

### `useBudgetAlert`

Monitors budget usage and generates alerts.

```tsx
const {
  alerts,           // BudgetAlert[]: all active alerts
  activeAlert,      // BudgetAlert | null: highest priority alert
  hasActiveAlerts,  // boolean: any alerts present
  dismiss,          // (alertId: string) => void
  snooze,           // (alertId: string, minutes: number) => void
  clearAll,         // () => void: dismiss all alerts
} = useBudgetAlert(options);
```

**Options:**
```tsx
{
  projectId?: string;          // Filter to specific project
  warningThreshold?: number;   // Default: 75 (%)
  criticalThreshold?: number;  // Default: 90 (%)
  playSound?: boolean;         // Default: false
}
```

## Component API

### `<SummaryCards />`

```tsx
<SummaryCards summary={summary} />
```

**Props:**
- `summary`: `CostSummary | null`

### `<CostChart />`

```tsx
<CostChart
  data={history}
  timeRange="24h"
  onTimeRangeChange={(range) => setTimeRange(range)}
/>
```

**Props:**
- `data`: `CostHistory[]`
- `timeRange`: `'1h' | '24h' | '7d' | '30d'`
- `onTimeRangeChange`: `(range: string) => void`

### `<ProjectCostBreakdown />`

```tsx
<ProjectCostBreakdown data={byProject} />
```

**Props:**
- `data`: `ProjectCost[]`

### `<AgentCostTable />`

```tsx
<AgentCostTable data={byAgent} />
```

**Props:**
- `data`: `AgentCost[]`

**Features:**
- Sortable columns
- Search filtering
- Pagination (5, 10, 25, 50 rows)
- Multi-select with checkbox
- CSV export

### `<BudgetAlert />`

```tsx
<BudgetAlert
  alert={activeAlert}
  onDismiss={(id) => dismiss(id)}
  onSnooze={(id, minutes) => snooze(id, minutes)}
/>
```

**Props:**
- `alert`: `BudgetAlert | null`
- `onDismiss`: `(alertId: string) => void`
- `onSnooze`: `(alertId: string, minutes: number) => void`

### `<TokenMetrics />`

```tsx
<TokenMetrics metrics={tokenMetrics} />
```

**Props:**
- `metrics`: `TokenMetrics | null`

### `<CostProjection />`

```tsx
<CostProjection projection={projection} />
```

**Props:**
- `projection`: `CostProjection | null`

### `<SimpleLineChart />`

Low-level canvas-based chart component.

```tsx
<SimpleLineChart
  data={chartData}
  height={300}
  color="#3b82f6"
  gradientColor="#3b82f6"
  showGrid={true}
  showTooltip={true}
  animate={true}
  yAxisLabel="Cost ($)"
  formatValue={(v) => `$${v.toFixed(2)}`}
/>
```

**Props:**
- `data`: `DataPoint[]` - Array of `{ timestamp: Date, value: number }`
- `className?`: `string`
- `height?`: `number` (default: 256)
- `color?`: `string` (default: '#3b82f6')
- `gradientColor?`: `string` (default: '#3b82f6')
- `showGrid?`: `boolean` (default: true)
- `showTooltip?`: `boolean` (default: true)
- `animate?`: `boolean` (default: true)
- `yAxisLabel?`: `string`
- `formatValue?`: `(value: number) => string`

## Types

### `CostSummary`
```tsx
interface CostSummary {
  totalCost: number;
  todayCost: number;
  currentRate: number;        // $/hour
  budgetRemaining: number;
  trend: number;              // % change
  estimatedRunway: number;    // days
}
```

### `CostHistory`
```tsx
interface CostHistory {
  timestamp: Date;
  cost: number;               // incremental cost
  cumulative: number;         // cumulative cost
}
```

### `ProjectCost`
```tsx
interface ProjectCost {
  projectId: string;
  projectName: string;
  cost: number;
  percentage: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  agentCount: number;
}
```

### `AgentCost`
```tsx
interface AgentCost {
  agentId: string;
  agentName: string;
  projectId: string;
  projectName: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  status: 'running' | 'paused' | 'completed' | 'error';
  lastActive: Date;
}
```

### `TokenMetrics`
```tsx
interface TokenMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  inputCost: number;
  outputCost: number;
  efficiency: number;         // tokens per dollar
}
```

### `CostProjection`
```tsx
interface CostProjection {
  dailyRate: number;
  monthlyProjection: number;
  burnRate: number;           // % of budget per day
  daysUntilBudgetDepletion: number | null;
  warningLevel: 'safe' | 'warning' | 'critical';
}
```

### `BudgetAlert`
```tsx
interface BudgetAlert {
  id: string;
  projectId: string;
  projectName: string;
  level: 'warning' | 'critical';
  budgetRemaining: number;
  budgetTotal: number;
  percentageUsed: number;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  snoozedUntil: Date | null;
}
```

## Styling

The dashboard uses Tailwind CSS with a dark glass-morphism theme. All components are responsive and adapt to different screen sizes.

### Custom Classes
- `.glass-panel`: Semi-transparent background with blur effect
- Color schemes: blue, green, purple, teal, yellow, red variants

### Animations
- Slide-in animations on mount
- Smooth transitions on hover/click
- Shimmer effects on progress bars
- Spin animations for loading states

## Integration with IPC

Currently uses mock data. To integrate with the actual Electron IPC layer:

1. **Replace mock functions** in `useCostData.ts`:
   ```tsx
   // Replace mockFetchProjects()
   const projects = await window.api.project.list();

   // Replace mockFetchAgents()
   const agents = await window.api.agent.list();
   ```

2. **Subscribe to real-time events**:
   ```tsx
   useEffect(() => {
     const unsubscribe = window.api.events.subscribe('cost_updated', fetchCostData);
     return () => unsubscribe();
   }, []);
   ```

3. **Update budget alert monitoring**:
   ```tsx
   const unsubscribe = window.api.events.subscribe('budget_warning', handleBudgetWarning);
   ```

## Performance

- **Efficient rendering**: Components use React.memo and useMemo where appropriate
- **Canvas rendering**: Charts use HTML5 Canvas with device pixel ratio for crisp graphics
- **Throttled updates**: Real-time data updates are batched to ~60fps
- **Pagination**: Large datasets are paginated to reduce DOM nodes
- **Lazy loading**: Components load only when needed

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Electron 22+ (Chromium 108+)

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast meets WCAG AA standards
- Screen reader compatible

## License

Part of the Constellation project. See main LICENSE file.
