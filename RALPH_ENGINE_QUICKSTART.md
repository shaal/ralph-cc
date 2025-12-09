# Ralph Engine Quick Start Guide

Get the Ralph Engine running in 5 minutes.

## Prerequisites

The main dependencies are already in package.json:
- `@anthropic-ai/sdk` - Claude API integration
- `uuid` - Unique ID generation

## Step 1: Set Up Environment

Create or add to `.env` file:
```bash
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

## Step 2: Create a Project Directory

```bash
mkdir my-coding-project
cd my-coding-project

# Create a prompt file
cat > PROMPT.md << 'EOF'
# Task: Create a Hello World Application

Please create a simple "Hello World" application in Python.

Requirements:
1. Create a file called `hello.py`
2. The program should print "Hello, World!" to the console
3. Add a comment explaining what the code does
4. Test the program to verify it works

Work step by step, using the available tools to create and verify the code.
EOF
```

## Step 3: Initialize and Run

Create `run-ralph.ts`:

```typescript
import { ClaudeClient } from './src/main/claude';
import { RalphEngine } from './src/main/services/ralph';
import { AgentOrchestrator } from './src/main/services/agent';
import { getEventBus } from './src/main/services/EventBus';
import type { Project } from './src/main/services/ralph/RalphLoop';

async function main() {
  // 1. Initialize components
  const eventBus = getEventBus();
  const claudeClient = new ClaudeClient();
  await claudeClient.initialize(process.env.ANTHROPIC_API_KEY!);

  // 2. Create orchestrator
  const orchestrator = new AgentOrchestrator({
    model: 'claude-sonnet-4',
    maxTokens: 8192,
    temperature: 0.7,
    maxIterations: 100,
    circuitBreaker: {
      maxConsecutiveFailures: 5,
      maxConsecutiveCompletions: 3,
      timeoutMinutes: 30,
    },
    budget: { limit: 10 }, // $10 limit
    sandbox: {
      enabled: true,
      allowedPaths: [process.cwd()],
      deniedCommands: ['rm -rf', 'sudo'],
      maxExecutionTimeMs: 120000,
    },
    enabledTools: ['bash', 'read', 'write', 'edit'],
    systemPrompt: 'You are a helpful coding assistant.',
  }, eventBus);

  // 3. Create engine
  const engine = new RalphEngine(claudeClient, {}, eventBus);

  // 4. Subscribe to events
  eventBus.subscribe('agent_output_chunk', (event) => {
    process.stdout.write(event.data.chunk as string);
  });

  eventBus.subscribe('iteration_complete', (event) => {
    const cost = (event.data.costState as any).totalCost;
    console.log(`\n[Iteration ${event.data.iteration}] Cost: $${cost.toFixed(4)}`);
  });

  eventBus.subscribe('project_completed', (event) => {
    console.log('\n✓ Project completed!');
    process.exit(0);
  });

  eventBus.subscribe('budget_exceeded', (event) => {
    console.log('\n⚠ Budget exceeded!');
    process.exit(1);
  });

  // 5. Define project
  const project: Project = {
    id: 'proj-001',
    name: 'Hello World',
    promptPath: './my-coding-project/PROMPT.md',
    workingDirectory: './my-coding-project',
    status: 'created',
    settings: {},
  };

  // 6. Create agent and start
  const agent = await orchestrator.createAgent({
    projectId: project.id,
    name: 'Main Agent',
  });

  console.log('Starting Ralph loop...\n');
  await engine.startLoop(project, agent);

  // 7. Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await engine.stopLoop(project.id);
    process.exit(0);
  });
}

main().catch(console.error);
```

## Step 4: Run It

```bash
# Run with ts-node
npx ts-node run-ralph.ts

# Or compile and run
npx tsc run-ralph.ts && node run-ralph.js
```

## Expected Output

```
Starting Ralph loop...

I'll help you create a Hello World application in Python. Let me start by creating the hello.py file.

[Tool: write]
Creating hello.py...

[Iteration 1] Cost: $0.0023

Now let me verify the file was created correctly.

[Tool: read]
Reading hello.py...

[Iteration 2] Cost: $0.0041

Let me test the program to make sure it works.

[Tool: bash]
Running: python hello.py

Hello, World!

[Iteration 3] Cost: $0.0058

Perfect! I've completed all the requirements:
1. ✓ Created hello.py
2. ✓ Added print statement
3. ✓ Added explanatory comment
4. ✓ Tested and verified it works

[Iteration 4] Cost: $0.0072

✓ Project completed!
```

## Advanced Usage

### Custom Configuration

```typescript
// Higher iteration limit
const orchestrator = new AgentOrchestrator({
  maxIterations: 1000, // More iterations
  budget: { limit: 100 }, // Higher budget
  // ... other config
});
```

### Multiple Projects (Agent Swarm)

```typescript
const projects = [
  { id: '1', name: 'Frontend', promptPath: './frontend/PROMPT.md', workingDirectory: './frontend', status: 'created', settings: {} },
  { id: '2', name: 'Backend', promptPath: './backend/PROMPT.md', workingDirectory: './backend', status: 'created', settings: {} },
];

for (const project of projects) {
  const agent = await orchestrator.createAgent({
    projectId: project.id,
    name: `${project.name} Agent`,
  });

  await engine.startLoop(project as Project, agent);
}
```

### Pause/Resume Control

```typescript
// Pause after 30 seconds
setTimeout(() => engine.pauseLoop(project.id), 30000);

// Resume after user input
readline.on('line', () => {
  engine.resumeLoop(project.id);
});
```

### Custom Event Handling

```typescript
// Track all tool executions
eventBus.subscribe('tool_executed', (event) => {
  console.log(`Tool: ${event.data.toolCall.name}`);
  console.log(`Result: ${event.data.toolResult.content}`);
});

// Budget warnings
eventBus.subscribe('budget_warning', (event) => {
  const percent = ((event.data.percentUsed as number) * 100).toFixed(1);
  console.warn(`⚠ Budget at ${percent}%`);
});

// Circuit breaker
eventBus.subscribe('circuit_breaker_triggered', (event) => {
  console.error(`Circuit breaker: ${event.data.reason}`);
});
```

## Common Issues

### 1. API Key Not Found
```
Error: ClaudeClient not initialized
```
**Solution**: Set `ANTHROPIC_API_KEY` environment variable

### 2. File Permission Errors
```
Error: File path not allowed: /some/path
```
**Solution**: Add path to `sandbox.allowedPaths` in config

### 3. Budget Exceeded Too Quickly
```
⚠ Budget exceeded!
```
**Solution**: Increase `budget.limit` or reduce `maxIterations`

### 4. Circuit Breaker Triggered
```
Circuit breaker tripped: 5 consecutive failures
```
**Solution**: Check PROMPT.md for clarity, or increase `maxConsecutiveFailures`

## Monitoring

### Real-time Status

```typescript
setInterval(() => {
  const info = engine.getLoopInfo(project.id);
  if (info) {
    console.log(`Status: ${info.status}`);
    console.log(`Iteration: ${info.iteration}`);
    console.log(`Cost: $${info.costTotal.toFixed(4)}`);
  }
}, 5000);
```

### Cost Tracking

```typescript
eventBus.subscribe('iteration_complete', (event) => {
  const state = event.data.costState as any;
  console.log({
    totalCost: state.totalCost,
    totalTokens: state.totalInputTokens + state.totalOutputTokens,
    avgCostPerIteration: state.averageCostPerIteration,
  });
});
```

## Next Steps

- Read the [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- View the [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
- Check out [Usage Examples](./src/main/examples/usage.example.ts)
- Review the [Main Process README](./src/main/README.md)

## Troubleshooting

Enable debug logging:
```typescript
eventBus.subscribeAll((event) => {
  console.log(`[${event.type}]`, event.data);
});
```

Check loop status:
```typescript
const loop = engine.getLoop(project.id);
if (loop) {
  console.log('Status:', loop.getStatus());
  console.log('Iteration:', loop.getIteration());
  console.log('Cost:', loop.getCostState());
  console.log('Circuit Breaker:', loop.getCircuitBreakerState());
}
```

## Tips

1. **Start Small**: Use low iteration limits and budgets for testing
2. **Clear Prompts**: Be specific in PROMPT.md about what you want
3. **Monitor Events**: Subscribe to events to understand what's happening
4. **Use Circuit Breaker**: Let it detect when tasks are complete
5. **Budget Wisely**: Set realistic limits based on task complexity

Happy coding! 🚀
