/**
 * Initial database schema migration
 */

export const up = `
-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'running', 'paused', 'completed', 'failed', 'stopped')),
    prompt_path TEXT NOT NULL,
    settings TEXT DEFAULT '{}',
    cost_total REAL DEFAULT 0,
    iteration_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    ended_at DATETIME
);

-- Agents table
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    name TEXT,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'idle', 'working', 'paused', 'completed', 'failed')),
    config TEXT DEFAULT '{}',
    current_task TEXT,
    total_tokens INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    iteration_count INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Agent history table
CREATE TABLE agent_history (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content TEXT,
    tool_calls TEXT,
    tool_results TEXT,
    usage TEXT,
    cost REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Outputs table
CREATE TABLE outputs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('file', 'artifact', 'log')),
    path TEXT,
    content TEXT,
    previous_content TEXT,
    checksum TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for projects
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Indexes for agents
CREATE INDEX idx_agents_project_id ON agents(project_id);
CREATE INDEX idx_agents_parent_id ON agents(parent_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_project_status ON agents(project_id, status);

-- Indexes for agent_history
CREATE INDEX idx_agent_history_agent_id ON agent_history(agent_id);
CREATE INDEX idx_agent_history_created_at ON agent_history(created_at DESC);
CREATE INDEX idx_agent_history_agent_created ON agent_history(agent_id, created_at DESC);

-- Indexes for outputs
CREATE INDEX idx_outputs_project_id ON outputs(project_id);
CREATE INDEX idx_outputs_agent_id ON outputs(agent_id);
CREATE INDEX idx_outputs_type ON outputs(type);
CREATE INDEX idx_outputs_created_at ON outputs(created_at DESC);

-- Indexes for events
CREATE INDEX idx_events_project_id ON events(project_id);
CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_project_type ON events(project_id, type);
`;

export const down = `
-- Drop indexes
DROP INDEX IF EXISTS idx_events_project_type;
DROP INDEX IF EXISTS idx_events_created_at;
DROP INDEX IF EXISTS idx_events_type;
DROP INDEX IF EXISTS idx_events_agent_id;
DROP INDEX IF EXISTS idx_events_project_id;

DROP INDEX IF EXISTS idx_outputs_created_at;
DROP INDEX IF EXISTS idx_outputs_type;
DROP INDEX IF EXISTS idx_outputs_agent_id;
DROP INDEX IF EXISTS idx_outputs_project_id;

DROP INDEX IF EXISTS idx_agent_history_agent_created;
DROP INDEX IF EXISTS idx_agent_history_created_at;
DROP INDEX IF EXISTS idx_agent_history_agent_id;

DROP INDEX IF EXISTS idx_agents_project_status;
DROP INDEX IF EXISTS idx_agents_status;
DROP INDEX IF EXISTS idx_agents_parent_id;
DROP INDEX IF EXISTS idx_agents_project_id;

DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_projects_status;

-- Drop tables
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS outputs;
DROP TABLE IF EXISTS agent_history;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS projects;
`;
