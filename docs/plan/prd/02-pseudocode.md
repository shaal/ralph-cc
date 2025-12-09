# SPARC Phase 2: Pseudocode

## Ralph-as-a-Service (RaaS) - "Constellation"

---

## 1. Core System Logic

### 1.1 Application Lifecycle

```
APPLICATION_LIFECYCLE:
    ON app_start:
        LOAD config FROM ~/.constellation/config.json
        INITIALIZE database (SQLite)
        RESTORE previous_session IF exists
        RENDER main_window
        START background_services:
            - agent_monitor_service
            - cost_tracking_service
            - health_check_service

    ON app_quit:
        FOR EACH running_agent IN active_agents:
            GRACEFULLY_STOP agent
            SAVE agent_state TO database
        PERSIST session_state
        CLOSE database_connections
        EXIT
```

### 1.2 Project Management

```
PROJECT_MANAGEMENT:

    FUNCTION create_project(name, description, prompt_content):
        project_id = GENERATE_UUID()
        project = {
            id: project_id,
            name: name,
            description: description,
            status: "created",
            created_at: NOW(),
            prompt_path: SAVE_FILE(prompt_content, "{project_id}/PROMPT.md"),
            settings: DEFAULT_PROJECT_SETTINGS,
            agents: [],
            outputs: [],
            cost_total: 0
        }
        INSERT project INTO database.projects
        EMIT event("project_created", project)
        RETURN project

    FUNCTION start_project(project_id):
        project = GET project FROM database WHERE id = project_id
        IF project.status IN ["running", "paused"]:
            RAISE ProjectAlreadyActiveError

        // Initialize the Ralph loop
        ralph_config = {
            prompt: READ_FILE(project.prompt_path),
            model: project.settings.model OR "claude-sonnet-4",
            tools: project.settings.enabled_tools,
            max_iterations: project.settings.max_iterations,
            budget_limit: project.settings.budget_limit,
            circuit_breaker: project.settings.circuit_breaker
        }

        root_agent = CREATE_AGENT(ralph_config)
        project.agents.APPEND(root_agent)
        project.status = "running"

        UPDATE project IN database
        START ralph_loop(project, root_agent)
        EMIT event("project_started", project)

    FUNCTION pause_project(project_id):
        project = GET project FROM database WHERE id = project_id
        FOR EACH agent IN project.agents:
            PAUSE agent
            SAVE agent.state TO database
        project.status = "paused"
        UPDATE project IN database
        EMIT event("project_paused", project)

    FUNCTION stop_project(project_id):
        project = GET project FROM database WHERE id = project_id
        FOR EACH agent IN project.agents:
            STOP agent WITH graceful_timeout = 30s
            SAVE agent.final_state TO database
        project.status = "stopped"
        project.ended_at = NOW()
        UPDATE project IN database
        EMIT event("project_stopped", project)
```

---

## 2. Ralph Loop Implementation

### 2.1 Core Ralph Loop

```
RALPH_LOOP:

    FUNCTION ralph_loop(project, root_agent):
        iteration = 0
        consecutive_failures = 0
        consecutive_completions = 0

        WHILE project.status == "running":
            iteration += 1

            // Circuit breaker check
            IF consecutive_failures >= project.circuit_breaker.max_failures:
                EMIT event("circuit_breaker_triggered", project, "max_failures")
                PAUSE project
                BREAK

            IF project.cost_total >= project.budget_limit:
                EMIT event("budget_exceeded", project)
                PAUSE project
                BREAK

            TRY:
                // Load fresh prompt (may have been updated by user)
                current_prompt = READ_FILE(project.prompt_path)

                // Execute one iteration
                result = EXECUTE_AGENT_ITERATION(root_agent, current_prompt)

                // Process result
                IF result.type == "completion":
                    consecutive_completions += 1
                    consecutive_failures = 0

                    IF consecutive_completions >= project.completion_threshold:
                        EMIT event("project_completed", project)
                        project.status = "completed"
                        BREAK

                ELSE IF result.type == "tool_calls":
                    consecutive_completions = 0
                    consecutive_failures = 0

                    FOR EACH tool_call IN result.tool_calls:
                        tool_result = EXECUTE_TOOL(tool_call)
                        FEED_RESULT_TO_AGENT(root_agent, tool_result)
                        EMIT event("tool_executed", project, tool_call, tool_result)

                ELSE IF result.type == "subagent_spawn":
                    sub_agent = CREATE_SUBAGENT(result.subagent_config)
                    project.agents.APPEND(sub_agent)
                    CONNECT_AGENTS(root_agent, sub_agent)
                    START ralph_loop_async(project, sub_agent)
                    EMIT event("subagent_spawned", project, sub_agent)

                // Update metrics
                project.cost_total += result.cost
                UPDATE project IN database
                EMIT event("iteration_complete", project, iteration, result)

            CATCH error:
                consecutive_failures += 1
                LOG_ERROR(error)
                EMIT event("iteration_error", project, iteration, error)

                IF error.is_recoverable:
                    WAIT(exponential_backoff(consecutive_failures))
                ELSE:
                    RAISE error

        // Cleanup
        FINALIZE_AGENT(root_agent)
        RETURN project
```

### 2.2 Agent Execution

```
AGENT_EXECUTION:

    FUNCTION EXECUTE_AGENT_ITERATION(agent, prompt):
        // Prepare context
        context = {
            system_prompt: agent.config.system_prompt,
            user_prompt: prompt,
            conversation_history: agent.history,
            available_tools: agent.config.tools
        }

        // Call Claude API via Agent SDK
        response = CLAUDE_AGENT_SDK.run({
            model: agent.config.model,
            messages: BUILD_MESSAGES(context),
            tools: agent.config.tools,
            max_tokens: agent.config.max_tokens,
            stream: TRUE
        })

        // Stream handling
        accumulated_output = ""
        tool_calls = []

        FOR EACH chunk IN response.stream:
            IF chunk.type == "text":
                accumulated_output += chunk.text
                EMIT event("agent_output_chunk", agent, chunk)

            ELSE IF chunk.type == "tool_use":
                tool_calls.APPEND(chunk.tool_use)
                EMIT event("agent_tool_call", agent, chunk.tool_use)

        // Update agent state
        agent.history.APPEND({
            role: "assistant",
            content: accumulated_output,
            tool_calls: tool_calls
        })

        // Calculate cost
        cost = CALCULATE_COST(response.usage)

        RETURN {
            type: IF tool_calls.length > 0 THEN "tool_calls" ELSE "completion",
            output: accumulated_output,
            tool_calls: tool_calls,
            cost: cost,
            usage: response.usage
        }

    FUNCTION CREATE_SUBAGENT(config):
        subagent = {
            id: GENERATE_UUID(),
            parent_id: config.parent_id,
            config: {
                model: config.model OR parent.config.model,
                tools: config.tools OR parent.config.tools,
                system_prompt: config.system_prompt,
                max_depth: parent.max_depth - 1
            },
            status: "created",
            history: [],
            outputs: []
        }

        IF subagent.config.max_depth <= 0:
            RAISE MaxDepthExceededError

        RETURN subagent
```

---

## 3. Visualization System

### 3.1 Agent Graph Data Model

```
AGENT_GRAPH:

    STRUCTURE Node:
        id: string
        type: "root_agent" | "sub_agent" | "tool"
        label: string
        status: "idle" | "working" | "blocked" | "completed" | "error"
        position: { x: number, y: number }
        data: {
            agent_id: string
            current_task: string
            token_count: number
            cost: number
            last_output: string
        }

    STRUCTURE Edge:
        id: string
        source: node_id
        target: node_id
        type: "parent_child" | "communication" | "data_flow"
        animated: boolean
        data: {
            message_count: number
            last_message: string
        }

    FUNCTION build_graph_from_project(project):
        nodes = []
        edges = []

        FOR EACH agent IN project.agents:
            node = {
                id: agent.id,
                type: IF agent.parent_id IS NULL THEN "root_agent" ELSE "sub_agent",
                label: agent.name OR "Agent " + agent.id.slice(0, 8),
                status: agent.status,
                position: CALCULATE_POSITION(agent, project.agents),
                data: {
                    agent_id: agent.id,
                    current_task: agent.current_task,
                    token_count: agent.total_tokens,
                    cost: agent.total_cost,
                    last_output: agent.history.last().content
                }
            }
            nodes.APPEND(node)

            IF agent.parent_id IS NOT NULL:
                edge = {
                    id: agent.parent_id + "->" + agent.id,
                    source: agent.parent_id,
                    target: agent.id,
                    type: "parent_child",
                    animated: agent.status == "working"
                }
                edges.APPEND(edge)

        RETURN { nodes, edges }
```

### 3.2 Real-Time Updates

```
REALTIME_UPDATES:

    FUNCTION setup_graph_subscriptions(project_id):
        // Subscribe to agent events
        SUBSCRIBE TO event("agent_output_chunk"):
            node = FIND_NODE(event.agent_id)
            UPDATE node.data.last_output = event.chunk
            UPDATE node.status = "working"
            TRIGGER_RENDER()

        SUBSCRIBE TO event("iteration_complete"):
            node = FIND_NODE(event.agent_id)
            UPDATE node.data.token_count += event.usage.total_tokens
            UPDATE node.data.cost += event.cost
            IF event.result.type == "completion":
                UPDATE node.status = "idle"
            TRIGGER_RENDER()

        SUBSCRIBE TO event("subagent_spawned"):
            new_node = CREATE_NODE_FROM_AGENT(event.subagent)
            new_edge = CREATE_EDGE(event.parent_id, event.subagent.id)
            ADD_TO_GRAPH(new_node, new_edge)
            ANIMATE_NODE_ENTRANCE(new_node)
            TRIGGER_RENDER()

        SUBSCRIBE TO event("tool_executed"):
            // Show tool execution as temporary node
            tool_node = CREATE_TEMP_TOOL_NODE(event.tool_call)
            SHOW_TOOL_EXECUTION_ANIMATION(tool_node)
            AFTER 2 seconds:
                REMOVE_TEMP_NODE(tool_node)

    FUNCTION TRIGGER_RENDER():
        // Throttle to 60fps
        IF NOW() - last_render < 16ms:
            SCHEDULE_RENDER(16ms - (NOW() - last_render))
            RETURN

        last_render = NOW()
        REACT_FLOW.setNodes(current_nodes)
        REACT_FLOW.setEdges(current_edges)
```

### 3.3 Agent Inspector

```
AGENT_INSPECTOR:

    FUNCTION open_inspector(agent_id):
        agent = GET_AGENT(agent_id)

        inspector_state = {
            agent: agent,
            view: "overview",  // "overview" | "history" | "config" | "outputs"
            streaming_output: "",
            is_live: agent.status == "working"
        }

        IF inspector_state.is_live:
            SUBSCRIBE TO event("agent_output_chunk") WHERE agent_id = agent_id:
                inspector_state.streaming_output += event.chunk
                UPDATE_INSPECTOR_VIEW()

        RENDER inspector_panel(inspector_state)

    FUNCTION inspector_panel(state):
        RETURN (
            <Panel>
                <Header>
                    <AgentName>{state.agent.name}</AgentName>
                    <StatusBadge status={state.agent.status} />
                    <Actions>
                        <Button onClick={pause_agent}>Pause</Button>
                        <Button onClick={stop_agent}>Stop</Button>
                        <Button onClick={restart_agent}>Restart</Button>
                    </Actions>
                </Header>

                <Tabs selected={state.view}>
                    <Tab id="overview">
                        <MetricCard label="Tokens" value={state.agent.total_tokens} />
                        <MetricCard label="Cost" value={"$" + state.agent.total_cost} />
                        <MetricCard label="Iterations" value={state.agent.iteration_count} />
                        <CurrentTask>{state.agent.current_task}</CurrentTask>
                    </Tab>

                    <Tab id="history">
                        <MessageList messages={state.agent.history} />
                    </Tab>

                    <Tab id="outputs">
                        <FileTree files={state.agent.outputs} />
                    </Tab>

                    <Tab id="config">
                        <ConfigEditor config={state.agent.config} />
                    </Tab>
                </Tabs>

                <LiveOutput IF state.is_live>
                    <StreamingText>{state.streaming_output}</StreamingText>
                </LiveOutput>
            </Panel>
        )
```

---

## 4. Data Persistence

### 4.1 Database Schema (SQLite)

```
DATABASE_SCHEMA:

    TABLE projects:
        id              TEXT PRIMARY KEY
        name            TEXT NOT NULL
        description     TEXT
        status          TEXT DEFAULT 'created'
        prompt_path     TEXT NOT NULL
        settings        JSON
        cost_total      REAL DEFAULT 0
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        updated_at      DATETIME
        ended_at        DATETIME

    TABLE agents:
        id              TEXT PRIMARY KEY
        project_id      TEXT REFERENCES projects(id)
        parent_id       TEXT REFERENCES agents(id)
        name            TEXT
        status          TEXT DEFAULT 'created'
        config          JSON
        total_tokens    INTEGER DEFAULT 0
        total_cost      REAL DEFAULT 0
        iteration_count INTEGER DEFAULT 0
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        updated_at      DATETIME

    TABLE agent_history:
        id              TEXT PRIMARY KEY
        agent_id        TEXT REFERENCES agents(id)
        role            TEXT NOT NULL  -- 'user' | 'assistant' | 'tool'
        content         TEXT
        tool_calls      JSON
        usage           JSON
        cost            REAL
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

    TABLE outputs:
        id              TEXT PRIMARY KEY
        agent_id        TEXT REFERENCES agents(id)
        project_id      TEXT REFERENCES projects(id)
        type            TEXT NOT NULL  -- 'file' | 'artifact'
        path            TEXT
        content         TEXT
        previous_content TEXT
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

    TABLE events:
        id              TEXT PRIMARY KEY
        project_id      TEXT REFERENCES projects(id)
        agent_id        TEXT REFERENCES agents(id)
        type            TEXT NOT NULL
        data            JSON
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

    INDEX idx_agents_project ON agents(project_id)
    INDEX idx_history_agent ON agent_history(agent_id)
    INDEX idx_events_project_time ON events(project_id, created_at)
```

### 4.2 State Persistence

```
STATE_PERSISTENCE:

    FUNCTION save_agent_state(agent):
        // Save to database
        UPDATE agents SET
            status = agent.status,
            config = JSON(agent.config),
            total_tokens = agent.total_tokens,
            total_cost = agent.total_cost,
            iteration_count = agent.iteration_count,
            updated_at = NOW()
        WHERE id = agent.id

        // Save conversation history
        FOR EACH message IN agent.unsaved_history:
            INSERT INTO agent_history (
                id, agent_id, role, content, tool_calls, usage, cost
            ) VALUES (
                GENERATE_UUID(),
                agent.id,
                message.role,
                message.content,
                JSON(message.tool_calls),
                JSON(message.usage),
                message.cost
            )

        agent.unsaved_history = []

    FUNCTION restore_agent_state(agent_id):
        // Load agent
        agent_row = SELECT * FROM agents WHERE id = agent_id
        agent = DESERIALIZE_AGENT(agent_row)

        // Load history
        history_rows = SELECT * FROM agent_history
                       WHERE agent_id = agent_id
                       ORDER BY created_at
        agent.history = history_rows.MAP(DESERIALIZE_MESSAGE)

        RETURN agent

    FUNCTION restore_project_state(project_id):
        // Load project
        project_row = SELECT * FROM projects WHERE id = project_id
        project = DESERIALIZE_PROJECT(project_row)

        // Load agents
        agent_rows = SELECT * FROM agents WHERE project_id = project_id
        project.agents = agent_rows.MAP(agent_row =>
            restore_agent_state(agent_row.id)
        )

        RETURN project
```

---

## 5. Cost Tracking

### 5.1 Cost Calculation

```
COST_TRACKING:

    // Pricing per 1M tokens (example rates, should be configurable)
    PRICING = {
        "claude-opus-4": { input: 15.00, output: 75.00 },
        "claude-sonnet-4": { input: 3.00, output: 15.00 },
        "claude-haiku-3.5": { input: 0.80, output: 4.00 }
    }

    FUNCTION CALCULATE_COST(usage, model):
        rates = PRICING[model]
        input_cost = (usage.input_tokens / 1_000_000) * rates.input
        output_cost = (usage.output_tokens / 1_000_000) * rates.output
        RETURN input_cost + output_cost

    FUNCTION get_project_cost_summary(project_id):
        RETURN SELECT
            SUM(cost) as total_cost,
            SUM(CASE WHEN role = 'user' THEN usage->>'input_tokens' ELSE 0 END) as total_input_tokens,
            SUM(CASE WHEN role = 'assistant' THEN usage->>'output_tokens' ELSE 0 END) as total_output_tokens,
            COUNT(DISTINCT agent_id) as agent_count,
            COUNT(*) as message_count
        FROM agent_history h
        JOIN agents a ON h.agent_id = a.id
        WHERE a.project_id = project_id

    FUNCTION get_cost_over_time(project_id, granularity = "hour"):
        RETURN SELECT
            DATE_TRUNC(granularity, created_at) as period,
            SUM(cost) as cost
        FROM agent_history h
        JOIN agents a ON h.agent_id = a.id
        WHERE a.project_id = project_id
        GROUP BY period
        ORDER BY period
```

### 5.2 Budget Enforcement

```
BUDGET_ENFORCEMENT:

    FUNCTION check_budget(project):
        IF project.settings.budget_limit IS NULL:
            RETURN { ok: TRUE }

        current_cost = project.cost_total
        limit = project.settings.budget_limit
        warning_threshold = project.settings.budget_warning_threshold OR 0.8

        IF current_cost >= limit:
            RETURN {
                ok: FALSE,
                reason: "budget_exceeded",
                current: current_cost,
                limit: limit
            }

        IF current_cost >= limit * warning_threshold:
            EMIT event("budget_warning", project, {
                current: current_cost,
                limit: limit,
                percentage: current_cost / limit
            })

        RETURN { ok: TRUE, remaining: limit - current_cost }

    FUNCTION estimate_completion_cost(project):
        // Use historical data to estimate
        avg_cost_per_iteration = project.cost_total / project.iteration_count
        estimated_remaining_iterations = ESTIMATE_REMAINING_ITERATIONS(project)

        RETURN {
            estimated_total: project.cost_total + (avg_cost_per_iteration * estimated_remaining_iterations),
            confidence: CALCULATE_CONFIDENCE(project.iteration_count)
        }
```

---

## 6. IPC Communication (Electron)

### 6.1 Main Process Handlers

```
IPC_MAIN_PROCESS:

    // Project operations
    ipcMain.handle("project:create", async (event, data) => {
        RETURN await create_project(data.name, data.description, data.prompt)
    })

    ipcMain.handle("project:start", async (event, project_id) => {
        RETURN await start_project(project_id)
    })

    ipcMain.handle("project:pause", async (event, project_id) => {
        RETURN await pause_project(project_id)
    })

    ipcMain.handle("project:stop", async (event, project_id) => {
        RETURN await stop_project(project_id)
    })

    ipcMain.handle("project:list", async () => {
        RETURN await get_all_projects()
    })

    // Agent operations
    ipcMain.handle("agent:inspect", async (event, agent_id) => {
        RETURN await get_agent_details(agent_id)
    })

    ipcMain.handle("agent:history", async (event, agent_id) => {
        RETURN await get_agent_history(agent_id)
    })

    // Streaming events to renderer
    FUNCTION broadcast_event(event_type, data):
        main_window.webContents.send("event", { type: event_type, data })
```

### 6.2 Renderer Process Hooks

```
IPC_RENDERER_HOOKS:

    // React hooks for IPC
    FUNCTION useProject(project_id):
        [project, setProject] = useState(null)

        useEffect(() => {
            // Initial load
            window.api.invoke("project:get", project_id).then(setProject)

            // Subscribe to updates
            cleanup = window.api.on("event", (event) => {
                IF event.data.project_id == project_id:
                    setProject(prev => MERGE_UPDATE(prev, event))
            })

            RETURN cleanup
        }, [project_id])

        RETURN project

    FUNCTION useAgentGraph(project_id):
        [nodes, setNodes] = useState([])
        [edges, setEdges] = useState([])

        useEffect(() => {
            // Build initial graph
            window.api.invoke("project:get", project_id).then(project => {
                graph = build_graph_from_project(project)
                setNodes(graph.nodes)
                setEdges(graph.edges)
            })

            // Subscribe to graph updates
            cleanup = window.api.on("event", (event) => {
                SWITCH event.type:
                    CASE "subagent_spawned":
                        ADD_NODE_AND_EDGE(event.data)
                    CASE "agent_status_changed":
                        UPDATE_NODE_STATUS(event.data)
                    CASE "agent_output_chunk":
                        UPDATE_NODE_DATA(event.data)
            })

            RETURN cleanup
        }, [project_id])

        RETURN { nodes, edges, setNodes, setEdges }
```

---

## 7. Error Handling & Recovery

### 7.1 Error Classification

```
ERROR_HANDLING:

    ENUM ErrorSeverity:
        RECOVERABLE    // Retry with backoff
        DEGRADED       // Continue with reduced functionality
        FATAL          // Stop agent/project

    FUNCTION classify_error(error):
        IF error IS RateLimitError:
            RETURN { severity: RECOVERABLE, retry_after: error.retry_after }

        IF error IS NetworkError:
            RETURN { severity: RECOVERABLE, retry_after: exponential_backoff() }

        IF error IS InvalidAPIKeyError:
            RETURN { severity: FATAL, action: "prompt_for_api_key" }

        IF error IS ContextLengthExceeded:
            RETURN { severity: DEGRADED, action: "truncate_history" }

        IF error IS ToolExecutionError:
            RETURN { severity: RECOVERABLE, action: "retry_without_tool" }

        // Default
        RETURN { severity: FATAL, action: "stop_and_report" }
```

### 7.2 Recovery Strategies

```
RECOVERY_STRATEGIES:

    FUNCTION handle_recoverable_error(error, context):
        classification = classify_error(error)

        SWITCH classification.severity:
            CASE RECOVERABLE:
                WAIT(classification.retry_after)
                RETURN RETRY(context.operation)

            CASE DEGRADED:
                SWITCH classification.action:
                    CASE "truncate_history":
                        context.agent.history = TRUNCATE_TO_FIT(context.agent.history)
                        RETURN RETRY(context.operation)

            CASE FATAL:
                SWITCH classification.action:
                    CASE "prompt_for_api_key":
                        EMIT event("api_key_required")
                        PAUSE context.project
                    CASE "stop_and_report":
                        STOP context.agent
                        LOG_ERROR(error)
                        EMIT event("agent_error", context.agent, error)

    FUNCTION exponential_backoff(attempt):
        base_delay = 1000  // 1 second
        max_delay = 60000  // 60 seconds
        delay = MIN(base_delay * (2 ^ attempt), max_delay)
        jitter = RANDOM(0, delay * 0.1)
        RETURN delay + jitter
```

---

## 8. Configuration System

### 8.1 Configuration Schema

```
CONFIGURATION:

    DEFAULT_CONFIG = {
        // Application settings
        app: {
            theme: "system",  // "light" | "dark" | "system"
            language: "en",
            auto_update: TRUE,
            telemetry: FALSE
        },

        // Agent defaults
        agent: {
            default_model: "claude-sonnet-4",
            max_tokens: 8192,
            temperature: 0.7,
            max_iterations: 1000,
            max_subagent_depth: 3,
            tools: ["bash", "read", "write", "edit", "glob", "grep"]
        },

        // Safety settings
        safety: {
            circuit_breaker: {
                max_consecutive_failures: 5,
                max_consecutive_completions: 3,
                timeout_minutes: 120
            },
            budget: {
                default_limit: 100,  // USD
                warning_threshold: 0.8
            },
            sandbox: {
                enabled: TRUE,
                allowed_paths: ["./"],
                denied_commands: ["rm -rf", "sudo"]
            }
        },

        // API configuration
        api: {
            anthropic_api_key: NULL,  // Stored in OS keychain
            base_url: "https://api.anthropic.com",
            timeout: 120000
        },

        // UI settings
        ui: {
            graph: {
                physics_enabled: TRUE,
                animation_speed: 1.0,
                node_size: 50,
                show_labels: TRUE
            },
            inspector: {
                default_view: "overview",
                auto_scroll: TRUE
            }
        }
    }

    FUNCTION load_config():
        config_path = "~/.constellation/config.json"

        IF FILE_EXISTS(config_path):
            user_config = READ_JSON(config_path)
            RETURN DEEP_MERGE(DEFAULT_CONFIG, user_config)
        ELSE:
            RETURN DEFAULT_CONFIG

    FUNCTION save_config(config):
        config_path = "~/.constellation/config.json"
        ENSURE_DIR_EXISTS("~/.constellation")
        WRITE_JSON(config_path, config)
```

---

## Reflection

### Design Decisions

1. **Event-driven architecture**: Chose pub/sub pattern for loose coupling between components, enabling real-time UI updates without tight integration.

2. **SQLite for persistence**: Provides ACID transactions, zero-config setup, and excellent performance for single-user desktop app.

3. **Streaming-first approach**: All agent outputs stream to UI immediately, matching user expectations from ChatGPT-style interfaces.

4. **Graceful degradation**: When errors occur, system attempts recovery before failing, maximizing agent productivity.

### Key Algorithms

- **Force-directed graph layout**: Delegates to React Flow's built-in physics, with custom positioning for hierarchical agent relationships.
- **Exponential backoff**: Standard retry pattern with jitter to prevent thundering herd on API rate limits.
- **Cost estimation**: Simple linear projection based on historical iteration costs, with confidence intervals.

### Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| Start project | O(1) | O(1) |
| Agent iteration | O(h) where h = history length | O(h) |
| Graph render | O(n + e) nodes + edges | O(n + e) |
| History lookup | O(log n) with index | O(1) |

---

*SPARC Phase 2: Pseudocode - Complete*
*Next: [03-architecture.md](./03-architecture.md)*
