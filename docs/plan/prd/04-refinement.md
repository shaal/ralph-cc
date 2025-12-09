# SPARC Phase 4: Refinement

## Ralph-as-a-Service (RaaS) - "Constellation"

---

## 1. Testing Strategy

### 1.1 Testing Pyramid

```
                          ┌───────────────┐
                          │     E2E       │  ~10%
                          │   (Playwright)│  Critical user journeys
                          └───────┬───────┘
                                  │
                      ┌───────────┴───────────┐
                      │    Integration        │  ~30%
                      │    (Vitest + IPC)     │  Service interactions
                      └───────────┬───────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │              Unit Tests               │  ~60%
              │          (Vitest + React Testing)     │  Individual functions
              └───────────────────────────────────────┘
```

### 1.2 Test Categories

#### Unit Tests

| Component | Test Focus | Coverage Target |
|-----------|------------|-----------------|
| RalphEngine | Loop logic, exit conditions, error handling | 95% |
| CostTracker | Cost calculations, budget enforcement | 100% |
| EventBus | Event emission, subscription, persistence | 90% |
| Database Repositories | CRUD operations, queries | 95% |
| React Components | Rendering, user interactions | 80% |
| Zustand Stores | State updates, selectors | 90% |

#### Integration Tests

| Integration Point | Test Scenarios |
|-------------------|----------------|
| IPC Communication | All handlers respond correctly |
| Database ↔ Services | Data flows correctly between layers |
| Claude SDK ↔ RalphEngine | Agent creation, iteration, streaming |
| React ↔ Zustand | State updates trigger re-renders |
| EventBus ↔ UI | Events propagate to components |

#### E2E Tests

| User Journey | Steps |
|--------------|-------|
| Create & Run Project | New project → Configure → Start → See agents in graph |
| Monitor Running Agent | Select agent → View live output → See token count update |
| Pause & Resume | Running project → Pause → Verify state → Resume |
| Budget Alert | Set low budget → Run → Verify alert appears |
| Error Recovery | Simulate API error → Verify retry → Check recovery |

### 1.3 Test Implementation Examples

```typescript
// Unit Test: CostTracker
describe('CostTracker', () => {
  it('calculates cost correctly for Claude Sonnet 4', () => {
    const usage = { inputTokens: 1000, outputTokens: 500 };
    const cost = calculateCost(usage, 'claude-sonnet-4');
    // $3/1M input + $15/1M output
    expect(cost).toBeCloseTo(0.003 + 0.0075);
  });

  it('triggers budget warning at 80% threshold', () => {
    const tracker = new CostTracker({ budgetLimit: 100, warningThreshold: 0.8 });
    const events: string[] = [];
    tracker.on('budget_warning', () => events.push('warning'));

    tracker.addCost(79); // No warning
    expect(events).toHaveLength(0);

    tracker.addCost(2); // $81 = 81%, triggers warning
    expect(events).toHaveLength(1);
  });

  it('enforces budget limit', () => {
    const tracker = new CostTracker({ budgetLimit: 100 });
    tracker.addCost(100);

    const result = tracker.checkBudget();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('budget_exceeded');
  });
});

// Integration Test: Project Lifecycle
describe('Project Lifecycle', () => {
  it('creates and starts a project', async () => {
    // Create project via IPC
    const project = await ipcRenderer.invoke('project:create', {
      name: 'Test Project',
      description: 'Integration test',
      prompt: '# Test Prompt\nDo nothing.',
    });

    expect(project.id).toBeDefined();
    expect(project.status).toBe('created');

    // Start project
    await ipcRenderer.invoke('project:start', project.id);

    // Verify project is running
    const updated = await ipcRenderer.invoke('project:get', project.id);
    expect(updated.status).toBe('running');

    // Cleanup
    await ipcRenderer.invoke('project:stop', project.id);
  });
});

// E2E Test: Agent Visualization
test('agent appears in graph when project starts', async ({ page }) => {
  // Create project
  await page.click('[data-testid="new-project-button"]');
  await page.fill('[data-testid="project-name"]', 'E2E Test');
  await page.fill('[data-testid="prompt-editor"]', '# Test\nSay hello.');
  await page.click('[data-testid="create-project"]');

  // Start project
  await page.click('[data-testid="start-project"]');

  // Verify agent node appears in graph
  await expect(page.locator('[data-testid="agent-node"]')).toBeVisible({
    timeout: 5000,
  });

  // Verify agent is working
  await expect(page.locator('[data-testid="agent-status-working"]')).toBeVisible();
});
```

### 1.4 Mock Strategy

```typescript
// Mock Claude Agent SDK for testing
class MockClaudeClient {
  private responses: Map<string, MockResponse> = new Map();

  setMockResponse(prompt: string, response: MockResponse) {
    this.responses.set(prompt, response);
  }

  async runIteration(agentId: string, prompt: string): Promise<IterationResult> {
    const mock = this.responses.get(prompt) || this.defaultResponse();

    // Simulate streaming delay
    for (const chunk of mock.chunks) {
      await delay(10);
      this.emit('chunk', { agentId, chunk });
    }

    return {
      type: mock.toolCalls.length > 0 ? 'tool_calls' : 'completion',
      output: mock.content,
      toolCalls: mock.toolCalls,
      usage: mock.usage,
      cost: mock.cost,
    };
  }

  private defaultResponse(): MockResponse {
    return {
      chunks: ['Hello', ', ', 'world', '!'],
      content: 'Hello, world!',
      toolCalls: [],
      usage: { inputTokens: 100, outputTokens: 50 },
      cost: 0.001,
    };
  }
}

// Usage in tests
beforeEach(() => {
  mockClient = new MockClaudeClient();
  container.register('claudeClient', mockClient);
});

test('agent completes iteration', async () => {
  mockClient.setMockResponse('test prompt', {
    content: 'Task completed',
    toolCalls: [],
    usage: { inputTokens: 50, outputTokens: 20 },
  });

  const result = await ralphEngine.runIteration('agent-1', 'test prompt');
  expect(result.type).toBe('completion');
});
```

---

## 2. Iteration Plan

### 2.1 Development Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT PHASES                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 0: Foundation (Week 1-2)
├── Project scaffolding (Electron + Vite + React)
├── Database setup (SQLite + migrations)
├── IPC infrastructure
├── Basic UI shell
└── CI/CD pipeline

Phase 1: Core Ralph Engine (Week 3-4)
├── Claude Agent SDK integration
├── Basic Ralph loop
├── Single project execution
├── Console output display
└── Start/stop controls

Phase 2: Multi-Project & State (Week 5-6)
├── Project CRUD
├── Multiple concurrent projects
├── State persistence
├── Session recovery
└── Basic event system

Phase 3: Visualization (Week 7-9)
├── React Flow integration
├── Agent node components
├── Real-time graph updates
├── Agent inspector panel
├── Zoom/pan/filter controls

Phase 4: Advanced Features (Week 10-12)
├── Cost tracking dashboard
├── Budget enforcement
├── Circuit breaker
├── Prompt editor
├── Output management

Phase 5: Polish & Release (Week 13-14)
├── Performance optimization
├── Error handling refinement
├── Documentation
├── Cross-platform testing
├── Beta release
```

### 2.2 Iteration Cycles

Each phase follows a 2-week iteration cycle:

```
Week N                           Week N+1
─────────────────────────────────────────────────────────────
│ Day 1-2  │ Day 3-4  │ Day 5  │ Day 1-2  │ Day 3-4  │ Day 5 │
│ Design   │ Implement│ Test   │ Implement│ Refine   │ Review│
│ & Plan   │ Core     │ & Fix  │ Features │ & Polish │ & Demo│
─────────────────────────────────────────────────────────────
```

### 2.3 Definition of Done

Each feature must meet these criteria:

- [ ] Unit tests written and passing (coverage ≥ 80%)
- [ ] Integration tests for cross-component interactions
- [ ] TypeScript types complete (no `any` without justification)
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design verified
- [ ] Accessibility checked (keyboard navigation, screen reader)
- [ ] Performance acceptable (no visible lag)
- [ ] Code reviewed by at least one other developer
- [ ] Documentation updated

---

## 3. Performance Optimization

### 3.1 Identified Bottlenecks

| Area | Potential Issue | Mitigation |
|------|-----------------|------------|
| Graph Rendering | 100+ nodes causes lag | Virtualization, LOD rendering |
| Event Streaming | High-frequency updates | Throttling, batching |
| Database Queries | Large history tables | Pagination, indexing |
| Memory | Long-running projects | Periodic cleanup, streaming |
| Startup | Loading all projects | Lazy loading, caching |

### 3.2 Optimization Strategies

#### React Flow Performance

```typescript
// Use virtualization for large graphs
const AgentGraph = () => {
  const { nodes, edges } = useAgentGraph();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      // Performance optimizations
      nodesDraggable={nodes.length < 200}
      nodesConnectable={false}
      elementsSelectable={true}
      minZoom={0.1}
      maxZoom={2}
      // Only render visible nodes
      onlyRenderVisibleElements={true}
      // Disable edge updates when many edges
      edgesUpdatable={edges.length < 500}
    >
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
};

// Memoize node components
const AgentNode = memo(({ data }: NodeProps<AgentNodeData>) => {
  return (
    <div className={`agent-node agent-node--${data.status}`}>
      <div className="agent-node__header">{data.label}</div>
      <div className="agent-node__metrics">
        <span>{data.tokenCount} tokens</span>
        <span>${data.cost.toFixed(4)}</span>
      </div>
    </div>
  );
}, (prev, next) => {
  // Custom comparison for performance
  return (
    prev.data.status === next.data.status &&
    prev.data.tokenCount === next.data.tokenCount &&
    prev.data.cost === next.data.cost
  );
});
```

#### Event Throttling

```typescript
// Throttle high-frequency events
class ThrottledEventBus extends EventBus {
  private pendingEvents: Map<string, AppEvent[]> = new Map();
  private flushInterval = 16; // ~60fps

  constructor() {
    super();
    setInterval(() => this.flush(), this.flushInterval);
  }

  emit(event: AppEvent) {
    // Immediately emit critical events
    if (event.type === 'error' || event.type === 'budget_exceeded') {
      super.emit(event);
      return;
    }

    // Batch non-critical events
    const key = `${event.type}:${event.data.agentId || event.data.projectId}`;
    if (!this.pendingEvents.has(key)) {
      this.pendingEvents.set(key, []);
    }
    this.pendingEvents.get(key)!.push(event);
  }

  private flush() {
    for (const [key, events] of this.pendingEvents) {
      if (events.length === 0) continue;

      // For output chunks, concatenate
      if (events[0].type === 'agent_output_chunk') {
        const merged = {
          ...events[0],
          data: {
            ...events[0].data,
            chunk: events.map(e => e.data.chunk).join(''),
          },
        };
        super.emit(merged);
      } else {
        // For other events, just emit the latest
        super.emit(events[events.length - 1]);
      }

      this.pendingEvents.set(key, []);
    }
  }
}
```

#### Database Optimization

```typescript
// Paginated history loading
class AgentRepository {
  async getHistory(
    agentId: string,
    options: { limit?: number; offset?: number; before?: Date } = {}
  ): Promise<HistoryEntry[]> {
    const { limit = 50, offset = 0, before } = options;

    let query = `
      SELECT * FROM agent_history
      WHERE agent_id = ?
      ${before ? 'AND created_at < ?' : ''}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const params = before
      ? [agentId, before.toISOString(), limit, offset]
      : [agentId, limit, offset];

    return this.db.all(query, params);
  }

  // Cleanup old history
  async pruneHistory(retentionDays: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.db.run(
      `DELETE FROM agent_history WHERE created_at < ?`,
      [cutoff.toISOString()]
    );

    return result.changes;
  }
}
```

### 3.3 Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Startup time | < 3s | Time from launch to interactive |
| Graph render (100 nodes) | < 16ms | React DevTools profiler |
| Graph render (500 nodes) | < 50ms | React DevTools profiler |
| Event propagation | < 10ms | Console timing |
| DB query (paginated) | < 5ms | SQLite EXPLAIN |
| Memory (idle) | < 300MB | Process monitor |
| Memory (50 agents) | < 800MB | Process monitor |

---

## 4. Error Handling Refinement

### 4.1 Error Categories

```typescript
// Error type hierarchy
abstract class ConstellationError extends Error {
  abstract readonly code: string;
  abstract readonly severity: 'recoverable' | 'degraded' | 'fatal';
  abstract readonly userMessage: string;
}

// API Errors
class APIError extends ConstellationError {
  code = 'API_ERROR';
  severity = 'recoverable' as const;

  constructor(
    public readonly statusCode: number,
    public readonly apiMessage: string
  ) {
    super(`API Error ${statusCode}: ${apiMessage}`);
    this.userMessage = this.getUserMessage();
  }

  private getUserMessage(): string {
    switch (this.statusCode) {
      case 401:
        return 'Invalid API key. Please check your settings.';
      case 429:
        return 'Rate limited. The agent will retry automatically.';
      case 500:
        return 'Anthropic service error. Retrying...';
      default:
        return `API error: ${this.apiMessage}`;
    }
  }
}

// Agent Errors
class AgentError extends ConstellationError {
  code = 'AGENT_ERROR';
  severity: 'recoverable' | 'degraded' | 'fatal';
  userMessage: string;

  constructor(
    public readonly agentId: string,
    public readonly reason: string,
    severity: 'recoverable' | 'degraded' | 'fatal' = 'recoverable'
  ) {
    super(`Agent ${agentId}: ${reason}`);
    this.severity = severity;
    this.userMessage = `Agent error: ${reason}`;
  }
}

// Database Errors
class DatabaseError extends ConstellationError {
  code = 'DB_ERROR';
  severity = 'fatal' as const;
  userMessage = 'Database error. Please restart the application.';
}
```

### 4.2 Error Recovery Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ERROR RECOVERY FLOWS                                │
└─────────────────────────────────────────────────────────────────────────────┘

API Rate Limit (429):
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ API Call │────▶│ 429 Response │────▶│ Parse Retry- │────▶│ Wait     │
│          │     │              │     │ After Header │     │          │
└──────────┘     └──────────────┘     └──────────────┘     └────┬─────┘
                                                                │
    ┌───────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────┐     ┌──────────────┐
│ Retry    │────▶│ Continue     │
│ API Call │     │ Ralph Loop   │
└──────────┘     └──────────────┘


Context Length Exceeded:
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ API Call │────▶│ Context      │────▶│ Truncate     │────▶│ Emit     │
│          │     │ Too Long     │     │ History      │     │ Warning  │
└──────────┘     └──────────────┘     └──────────────┘     └────┬─────┘
                                                                │
    ┌───────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────┐     ┌──────────────┐
│ Retry    │────▶│ Continue     │
│ API Call │     │ (Degraded)   │
└──────────┘     └──────────────┘


Tool Execution Failure:
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Execute  │────▶│ Tool Failed  │────▶│ Return Error │
│ Tool     │     │              │     │ to Agent     │
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │ Agent Decides│
                                      │ Next Action  │
                                      └──────────────┘


Fatal Error:
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ Error    │────▶│ Cannot       │────▶│ Save State   │────▶│ Stop     │
│ Occurs   │     │ Recover      │     │ to Database  │     │ Project  │
└──────────┘     └──────────────┘     └──────────────┘     └────┬─────┘
                                                                │
                                                                ▼
                                                         ┌──────────────┐
                                                         │ Show Error   │
                                                         │ Dialog to    │
                                                         │ User         │
                                                         └──────────────┘
```

### 4.3 User-Facing Error Messages

```typescript
// ErrorDisplay component
const ErrorDisplay: React.FC<{ error: ConstellationError }> = ({ error }) => {
  const { severity, userMessage, code } = error;

  const icon = {
    recoverable: <RefreshIcon className="animate-spin" />,
    degraded: <WarningIcon />,
    fatal: <ErrorIcon />,
  }[severity];

  const actions = {
    recoverable: null, // Auto-recovery in progress
    degraded: (
      <Button onClick={() => window.api.project.restart(projectId)}>
        Restart Project
      </Button>
    ),
    fatal: (
      <div className="space-x-2">
        <Button onClick={() => window.api.config.openSettings()}>
          Open Settings
        </Button>
        <Button onClick={() => window.location.reload()}>
          Restart App
        </Button>
      </div>
    ),
  }[severity];

  return (
    <Alert variant={severity}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{userMessage}</span>
      </div>
      {actions && <div className="mt-2">{actions}</div>}
      <details className="mt-2 text-xs text-gray-500">
        <summary>Technical details</summary>
        <pre>Code: {code}\n{error.stack}</pre>
      </details>
    </Alert>
  );
};
```

---

## 5. Feedback Integration

### 5.1 Feedback Channels

| Channel | Type | Integration |
|---------|------|-------------|
| In-app feedback | Bug reports, feature requests | GitHub Issues API |
| Crash reports | Automatic error reporting | Sentry (optional, opt-in) |
| Usage analytics | Anonymous usage patterns | Posthog (optional, opt-in) |
| Community | Discussions, support | GitHub Discussions |

### 5.2 Feedback Collection UI

```typescript
// Feedback dialog component
const FeedbackDialog: React.FC = () => {
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [description, setDescription] = useState('');
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true);

  const handleSubmit = async () => {
    const systemInfo = includeSystemInfo
      ? await window.api.system.getInfo()
      : null;

    await submitFeedback({
      type,
      description,
      systemInfo,
      appVersion: APP_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Dialog>
      <DialogTitle>Send Feedback</DialogTitle>
      <DialogContent>
        <RadioGroup value={type} onChange={setType}>
          <Radio value="bug">Bug Report</Radio>
          <Radio value="feature">Feature Request</Radio>
          <Radio value="other">Other</Radio>
        </RadioGroup>

        <Textarea
          value={description}
          onChange={setDescription}
          placeholder="Describe the issue or suggestion..."
          rows={5}
        />

        <Checkbox
          checked={includeSystemInfo}
          onChange={setIncludeSystemInfo}
          label="Include system information (OS, app version)"
        />
      </DialogContent>
      <DialogActions>
        <Button variant="secondary" onClick={closeDialog}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### 5.3 Telemetry (Opt-In)

```typescript
// Anonymous usage telemetry
interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
}

const telemetryEvents = {
  projectCreated: () => ({ event: 'project_created' }),
  projectStarted: () => ({ event: 'project_started' }),
  agentSpawned: (count: number) => ({
    event: 'agent_spawned',
    properties: { count },
  }),
  errorOccurred: (code: string) => ({
    event: 'error_occurred',
    properties: { code },
  }),
};

// Only send if user opted in
class TelemetryService {
  private enabled: boolean = false;

  async init() {
    const config = await window.api.config.get();
    this.enabled = config.telemetry;
  }

  track(event: TelemetryEvent) {
    if (!this.enabled) return;

    // Send to analytics backend
    // No PII, no project content, just usage patterns
  }
}
```

---

## 6. Quality Metrics

### 6.1 Code Quality

| Metric | Target | Tool |
|--------|--------|------|
| Test Coverage | ≥ 80% | Vitest + c8 |
| Type Coverage | ≥ 95% | TypeScript strict |
| Lint Errors | 0 | ESLint |
| Bundle Size | < 10MB (excl. Electron) | Vite bundle analyzer |
| Cyclomatic Complexity | < 15 per function | ESLint rule |

### 6.2 Runtime Quality

| Metric | Target | Monitoring |
|--------|--------|------------|
| Crash Rate | < 0.1% | Sentry |
| Error Rate | < 1% | Internal logging |
| P95 Latency (UI) | < 100ms | Performance API |
| Memory Growth | < 10MB/hour | Process monitor |
| CPU Idle | < 5% | Process monitor |

### 6.3 User Quality

| Metric | Target | Collection |
|--------|--------|------------|
| NPS | > 50 | In-app survey |
| Task Success Rate | > 90% | E2E tests |
| Time to First Project | < 5 min | Telemetry |
| Support Tickets | < 10/week | GitHub Issues |

---

## 7. Security Refinements

### 7.1 Security Audit Checklist

- [ ] API keys encrypted at rest (OS keychain)
- [ ] No secrets in logs
- [ ] Input validation on all IPC handlers
- [ ] Content Security Policy configured
- [ ] WebSecurity enabled
- [ ] nodeIntegration disabled
- [ ] contextIsolation enabled
- [ ] File access sandboxed to project directories
- [ ] Command execution filtered
- [ ] Dependency audit (npm audit)
- [ ] No known vulnerabilities

### 7.2 Penetration Test Scenarios

| Scenario | Test | Expected Result |
|----------|------|-----------------|
| IPC injection | Send malformed IPC messages | Handler rejects, app stable |
| Path traversal | Request file outside project | Access denied |
| Command injection | Inject commands via prompt | Command filtered or escaped |
| XSS via agent output | Agent outputs `<script>` tags | Properly escaped in UI |
| DoS via large output | Agent produces huge output | Truncated, memory stable |

---

## Reflection

### Lessons Learned

1. **Test infrastructure first**: Setting up the testing pyramid early prevents technical debt accumulation.

2. **Performance budgets matter**: Defining concrete targets (16ms frame time, 3s startup) guides optimization efforts.

3. **Error messages are UX**: Investing in clear, actionable error messages significantly improves user experience.

### Improvements Over Initial Design

| Original | Refined | Reason |
|----------|---------|--------|
| Single error type | Error hierarchy | Better categorization and handling |
| Real-time all events | Throttled events | Performance at scale |
| Load all history | Paginated history | Memory efficiency |
| Basic tests | Full pyramid | Confidence in changes |

### Outstanding Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Claude API changes | Medium | High | Abstraction layer, version pinning |
| Electron security vulnerabilities | Low | High | Regular updates, security audit |
| Performance at 500+ agents | Medium | Medium | Virtualization, lazy loading |
| Cross-platform bugs | Medium | Medium | CI matrix testing |

### Next Phase Priorities

1. Complete E2E test suite
2. Performance benchmarking on all platforms
3. Security penetration testing
4. Beta user feedback collection

---

*SPARC Phase 4: Refinement - Complete*
*Next: [05-completion.md](./05-completion.md)*
