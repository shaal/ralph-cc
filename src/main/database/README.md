# Constellation Database Layer

Complete SQLite database implementation for the Constellation AI agent orchestration platform.

## Overview

This database layer provides persistent storage for projects, agents, conversation history, outputs, and system events. It uses `better-sqlite3` for synchronous SQLite operations with full TypeScript type safety.

## Architecture

```
database/
├── Database.ts              # Singleton connection manager
├── types.ts                 # TypeScript interfaces and enums
├── index.ts                 # Main export point
├── migrations/
│   ├── index.ts            # Migration runner
│   └── 001_initial.ts      # Initial schema
└── repositories/
    ├── index.ts            # Repository exports
    ├── BaseRepository.ts   # Common CRUD operations
    ├── ProjectRepository.ts
    ├── AgentRepository.ts
    ├── HistoryRepository.ts
    ├── EventRepository.ts
    └── OutputRepository.ts
```

## Database Location

The SQLite database is stored at: `~/.constellation/constellation.db`

## Getting Started

### Initialize the Database

```typescript
import Database from './database/Database';

// Initialize database (runs migrations automatically)
Database.init();
```

### Using Repositories

```typescript
import {
  projectRepository,
  agentRepository,
  historyRepository,
  eventRepository,
  outputRepository
} from './database';

// Create a new project
const project = projectRepository.create({
  name: 'My AI Project',
  description: 'Testing agent orchestration',
  prompt_path: '/path/to/PROMPT.md',
  settings: {
    maxIterations: 100,
    budget: 50.00
  }
});

// Create an agent for the project
const agent = agentRepository.create({
  project_id: project.id,
  name: 'Main Agent',
  config: {
    model: 'claude-opus-4-5',
    temperature: 0.7
  }
});

// Add conversation history
const history = historyRepository.create({
  agent_id: agent.id,
  role: 'user',
  content: 'Build a web application',
  usage: {
    input_tokens: 10,
    output_tokens: 0
  }
});

// Log an event
const event = eventRepository.create({
  project_id: project.id,
  agent_id: agent.id,
  type: 'agent_started',
  data: { timestamp: Date.now() }
});

// Track an output
const output = outputRepository.create({
  project_id: project.id,
  agent_id: agent.id,
  type: 'file',
  path: '/src/index.ts',
  content: 'console.log("Hello World");'
});
```

## Schema

### Tables

#### `projects`
Tracks Ralph loop projects with status, settings, and cost tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| name | TEXT | Project name |
| description | TEXT | Optional description |
| status | TEXT | created/running/paused/completed/failed/stopped |
| prompt_path | TEXT | Path to PROMPT.md file |
| settings | TEXT | JSON configuration |
| cost_total | REAL | Total cost in USD |
| iteration_count | INTEGER | Number of iterations |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |
| ended_at | DATETIME | Completion timestamp |

#### `agents`
Manages agent instances with parent-child relationships for sub-agents.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| project_id | TEXT | Foreign key to projects |
| parent_id | TEXT | Parent agent ID (for sub-agents) |
| name | TEXT | Agent name |
| status | TEXT | created/idle/working/paused/completed/failed |
| config | TEXT | JSON configuration (model, tools, etc.) |
| current_task | TEXT | Current task description |
| total_tokens | INTEGER | Total tokens used |
| total_cost | REAL | Total cost in USD |
| iteration_count | INTEGER | Number of iterations |
| depth | INTEGER | Hierarchy depth (0 = root) |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### `agent_history`
Stores conversation messages with tool calls and usage tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| agent_id | TEXT | Foreign key to agents |
| role | TEXT | user/assistant/tool |
| content | TEXT | Message content |
| tool_calls | TEXT | JSON array of tool calls |
| tool_results | TEXT | JSON array of tool results |
| usage | TEXT | JSON with token usage |
| cost | REAL | Cost of this message |
| created_at | DATETIME | Creation timestamp |

#### `outputs`
Tracks files, artifacts, and logs produced by agents.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| project_id | TEXT | Foreign key to projects |
| agent_id | TEXT | Foreign key to agents |
| type | TEXT | file/artifact/log |
| path | TEXT | File path |
| content | TEXT | File content |
| previous_content | TEXT | Previous version (for diffs) |
| checksum | TEXT | Content hash |
| created_at | DATETIME | Creation timestamp |

#### `events`
System event log for audit trails and debugging.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| project_id | TEXT | Foreign key to projects |
| agent_id | TEXT | Foreign key to agents |
| type | TEXT | Event type |
| data | TEXT | JSON event data |
| created_at | DATETIME | Creation timestamp |

### Indexes

All tables have appropriate indexes for common query patterns:
- Foreign key relationships
- Status fields
- Timestamps
- Composite indexes for filtering

## Repository API

### ProjectRepository

```typescript
// CRUD operations
create(data: CreateProjectDTO): Project
update(id: string, data: UpdateProjectDTO): Project
findById(id: string): Project | undefined
findAll(): Project[]
delete(id: string): boolean

// Status management
updateStatus(id: string, status: ProjectStatus): Project
updateCost(id: string, cost: number): Project
incrementIterationCount(id: string): Project

// Queries
findByStatus(status: ProjectStatus): Project[]
findByIdWithSettings(id: string): ProjectWithSettings | undefined
findAllWithSettings(): ProjectWithSettings[]
findByDateRange(startDate: string, endDate: string): Project[]

// Statistics
getTotalCost(): number
getStats(): { total, byStatus, totalCost, totalIterations }
```

### AgentRepository

```typescript
// CRUD operations
create(data: CreateAgentDTO): Agent
update(id: string, data: UpdateAgentDTO): Agent
findById(id: string): Agent | undefined
delete(id: string): boolean

// Status and metrics
updateStatus(id: string, status: AgentStatus): Agent
addTokens(id: string, tokens: number, cost: number): Agent
incrementIterationCount(id: string): Agent
updateCurrentTask(id: string, task: string | null): Agent

// Queries
findByProjectId(projectId: string): Agent[]
findByParentId(parentId: string): Agent[]
findByStatus(status: AgentStatus): Agent[]
findByProjectAndStatus(projectId: string, status: AgentStatus): Agent[]
findRootAgentsByProject(projectId: string): Agent[]

// Hierarchy
getAgentHierarchy(agentId: string): Agent[]

// Statistics
countByProject(projectId: string): number
getProjectStats(projectId: string): { total, byStatus, totalTokens, totalCost, ... }
```

### HistoryRepository

```typescript
// CRUD operations
create(data: CreateAgentHistoryDTO): AgentHistory
findById(id: string): AgentHistory | undefined
delete(id: string): boolean

// Queries
findByAgentId(agentId: string, options?: FindHistoryOptions): AgentHistory[]
getLatest(agentId: string): AgentHistory | undefined
getFirst(agentId: string): AgentHistory | undefined
findByAgentAndRole(agentId: string, role: MessageRole, options?): AgentHistory[]
findWithToolCalls(agentId: string, options?): AgentHistoryWithParsed[]
searchByContent(agentId: string, searchTerm: string, options?): AgentHistory[]

// Parsed variants (JSON fields parsed to objects)
findByAgentIdWithParsed(agentId: string, options?): AgentHistoryWithParsed[]
getLatestWithParsed(agentId: string): AgentHistoryWithParsed | undefined
getConversation(agentId: string, options?): AgentHistoryWithParsed[]

// Statistics
countByAgent(agentId: string): number
getTotalCostByAgent(agentId: string): number
getAgentStats(agentId: string): { total, byRole, totalCost, firstMessage, lastMessage }

// Cleanup
deleteByAgentId(agentId: string): number
deleteOlderThan(date: string): number
```

### EventRepository

```typescript
// CRUD operations
create(data: CreateEventDTO): Event
findById(id: string): Event | undefined
delete(id: string): boolean

// Queries
findByProjectId(projectId: string, options?: FindEventsOptions): Event[]
findByAgentId(agentId: string, options?: FindEventsOptions): Event[]
findByType(type: string, options?: FindEventsOptions): Event[]
findByDateRange(startDate: string, endDate: string, options?): Event[]
getRecent(limit?: number): Event[]

// Parsed variants
findByProjectIdWithData(projectId: string, options?): EventWithData[]
findByAgentIdWithData(agentId: string, options?): EventWithData[]
getRecentWithData(limit?: number): EventWithData[]

// Statistics
countByProject(projectId: string, type?: string): number
countByAgent(agentId: string, type?: string): number
countByType(type: string): number
getProjectStats(projectId: string): { total, byType, firstEvent, lastEvent }
getAgentStats(agentId: string): { total, byType, firstEvent, lastEvent }
getGlobalStats(): { total, byType, firstEvent, lastEvent }

// Cleanup
deleteByProjectId(projectId: string): number
deleteByAgentId(agentId: string): number
deleteByType(type: string): number
deleteOlderThan(date: string): number
```

### OutputRepository

```typescript
// CRUD operations
create(data: CreateOutputDTO): Output
findById(id: string): Output | undefined
delete(id: string): boolean

// Queries
findByProjectId(projectId: string, options?: PaginationOptions): Output[]
findByAgentId(agentId: string, options?: PaginationOptions): Output[]
findByType(type: OutputType, options?: PaginationOptions): Output[]
findByProjectAndType(projectId: string, type: OutputType, options?): Output[]
findByPath(projectId: string, path: string): Output | undefined
findHistoryByPath(projectId: string, path: string, options?): Output[]
findByDateRange(startDate: string, endDate: string, options?): Output[]
getRecent(limit?: number): Output[]
getUniquePaths(projectId: string, type?: OutputType): string[]
searchByContent(projectId: string, searchTerm: string, options?): Output[]

// Statistics
countByProject(projectId: string, type?: OutputType): number
countByAgent(agentId: string, type?: OutputType): number
getProjectStats(projectId: string): { total, byType, uniquePaths }

// Cleanup
deleteByProjectId(projectId: string): number
deleteByAgentId(agentId: string): number
deleteOlderThan(date: string): number
```

## Pagination

All `findBy*` methods support pagination through options:

```typescript
interface PaginationOptions {
  limit?: number;   // Maximum number of results
  offset?: number;  // Number of results to skip
}

interface FindHistoryOptions extends PaginationOptions {
  order?: 'asc' | 'desc';  // Sort order
}

interface FindEventsOptions extends PaginationOptions {
  type?: string;           // Filter by event type
  order?: 'asc' | 'desc';  // Sort order
}
```

Example:

```typescript
// Get first 10 messages
const messages = historyRepository.findByAgentId(agentId, {
  limit: 10,
  offset: 0,
  order: 'asc'
});

// Get next 10 messages
const moreMessages = historyRepository.findByAgentId(agentId, {
  limit: 10,
  offset: 10,
  order: 'asc'
});
```

## Transactions

Use the Database transaction method for atomic operations:

```typescript
import Database from './database/Database';

Database.transaction(() => {
  const project = projectRepository.create({ ... });
  const agent = agentRepository.create({ project_id: project.id, ... });
  eventRepository.create({ project_id: project.id, type: 'project_created' });
});
```

## Migrations

Migrations run automatically on database initialization. The migration system:

- Tracks applied migrations in the `_migrations` table
- Runs pending migrations in order
- Supports rollback (use with caution in production)

### Adding New Migrations

1. Create a new file: `migrations/002_your_migration.ts`
2. Export `up` and `down` SQL strings
3. Register in `migrations/index.ts`

Example:

```typescript
// migrations/002_add_indexes.ts
export const up = `
  CREATE INDEX idx_custom ON table_name(column_name);
`;

export const down = `
  DROP INDEX IF EXISTS idx_custom;
`;
```

```typescript
// migrations/index.ts
import * as migration002 from './002_add_indexes';

const migrations: MigrationDefinition[] = [
  { name: '001_initial', up: migration001.up, down: migration001.down },
  { name: '002_add_indexes', up: migration002.up, down: migration002.down },
];
```

## Type Safety

All operations are fully typed. The type system distinguishes between:

- **Raw entities**: JSON fields stored as strings (e.g., `Project`)
- **Parsed entities**: JSON fields parsed to objects (e.g., `ProjectWithSettings`)
- **DTOs**: Data transfer objects for creation/updates (e.g., `CreateProjectDTO`)

Example:

```typescript
// Raw project with settings as string
const project: Project = projectRepository.findById(id)!;
console.log(typeof project.settings); // "string"

// Parsed project with settings as object
const parsedProject: ProjectWithSettings = projectRepository.findByIdWithSettings(id)!;
console.log(typeof parsedProject.settings); // "object"
console.log(parsedProject.settings.maxIterations); // Type-safe access
```

## Security

- All queries use parameterized statements to prevent SQL injection
- Database file permissions are managed by the OS
- No sensitive data (API keys) is stored in the database
- Foreign key constraints ensure referential integrity
- Cascade deletes clean up related records automatically

## Performance

The database layer is optimized for Constellation's workload:

- **WAL mode**: Concurrent reads while writing
- **Synchronous = NORMAL**: Balanced durability and speed
- **Strategic indexes**: Fast queries on common patterns
- **Prepared statements**: Cached query plans via better-sqlite3
- **Batch operations**: Use transactions for multiple inserts

## Backup

```typescript
import Database from './database/Database';

// Backup to a file
await Database.backup('/path/to/backup.db');

// Get database stats
const stats = Database.getStats();
console.log(`Database size: ${stats.size} bytes`);
console.log(`WAL enabled: ${stats.walEnabled}`);
```

## Testing

When writing tests, you can use an in-memory database or a temporary file:

```typescript
import Database from './database/Database';

beforeEach(() => {
  // Use a test database
  Database.init(); // Will create ~/.constellation/constellation.db
});

afterEach(() => {
  Database.close();
});
```

## Best Practices

1. **Always use repositories**: Don't access the database directly
2. **Use transactions**: For multi-step operations that must be atomic
3. **Parse JSON fields**: Use `*WithParsed` methods when you need object access
4. **Handle undefined**: Repository methods return `undefined` if not found
5. **Paginate large results**: Use `limit` and `offset` for big datasets
6. **Clean up old data**: Use `deleteOlderThan` methods periodically
7. **Monitor costs**: Use repository statistics methods to track spending

## Troubleshooting

### Database locked errors
- The database uses WAL mode which allows concurrent reads
- If you still get locks, ensure no other process is accessing the file

### Migration errors
- Check the `_migrations` table to see what's been applied
- Migrations run in transactions - a failure won't partially apply

### Type errors with JSON fields
- Use the `*WithParsed` variants of repository methods
- Remember that raw entities have JSON as strings

## Example: Complete Workflow

```typescript
import Database, {
  projectRepository,
  agentRepository,
  historyRepository,
  eventRepository
} from './database';

// Initialize
Database.init();

// Create project
const project = projectRepository.create({
  name: 'Build Calculator App',
  prompt_path: './prompts/calculator.md',
  settings: {
    maxIterations: 50,
    budget: 10.00
  }
});

// Create root agent
const agent = agentRepository.create({
  project_id: project.id,
  name: 'Root Agent',
  config: { model: 'claude-opus-4-5' }
});

// Log initial prompt
historyRepository.create({
  agent_id: agent.id,
  role: 'user',
  content: 'Build a calculator application',
  usage: { input_tokens: 5, output_tokens: 0 }
});

// Update agent status
agentRepository.updateStatus(agent.id, 'working');

// Log event
eventRepository.create({
  project_id: project.id,
  agent_id: agent.id,
  type: 'agent_started'
});

// Simulate some work...
agentRepository.addTokens(agent.id, 1500, 0.15);
projectRepository.updateCost(project.id, 0.15);

// Complete
agentRepository.updateStatus(agent.id, 'completed');
projectRepository.updateStatus(project.id, 'completed');

// Query results
const stats = agentRepository.getProjectStats(project.id);
console.log(`Total cost: $${stats.totalCost}`);
console.log(`Total tokens: ${stats.totalTokens}`);

Database.close();
```
