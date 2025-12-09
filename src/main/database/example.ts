/**
 * Example usage of the Constellation database layer
 *
 * This file demonstrates how to use the database layer in practice.
 * DO NOT import this file in production - it's for reference only.
 */

import Database, {
  projectRepository,
  agentRepository,
  historyRepository,
  eventRepository,
  outputRepository,
  ProjectStatus,
  AgentStatus,
  MessageRole,
  OutputType,
} from './index';

// =============================================================================
// Example 1: Basic Setup
// =============================================================================

function exampleSetup() {
  // Initialize the database (runs migrations automatically)
  Database.init();

  // Check database status
  const stats = Database.getStats();
  console.log('Database initialized at:', stats.path);
  console.log('Database size:', stats.size, 'bytes');
  console.log('WAL mode enabled:', stats.walEnabled);
}

// =============================================================================
// Example 2: Creating a Complete Project
// =============================================================================

function exampleCreateProject() {
  // Create a new project with settings
  const project = projectRepository.create({
    name: 'Build Calculator App',
    description: 'Create a web-based calculator with React',
    prompt_path: '/home/user/projects/calculator/PROMPT.md',
    settings: {
      maxIterations: 50,
      budget: 10.00,
      model: 'claude-opus-4-5',
      tools: ['bash', 'read', 'write', 'edit'],
    },
  });

  console.log('Created project:', project.id);

  // Create the root agent
  const agent = agentRepository.create({
    project_id: project.id,
    name: 'Root Agent',
    config: {
      model: 'claude-opus-4-5',
      temperature: 0.7,
      max_tokens: 8000,
    },
    depth: 0,
  });

  console.log('Created agent:', agent.id);

  // Log the initial prompt
  const initialMessage = historyRepository.create({
    agent_id: agent.id,
    role: MessageRole.USER,
    content: 'Build a calculator application with React and TypeScript',
    usage: {
      input_tokens: 10,
      output_tokens: 0,
    },
  });

  // Record project creation event
  eventRepository.create({
    project_id: project.id,
    type: 'project_created',
    data: {
      timestamp: Date.now(),
      user: 'system',
    },
  });

  return { project, agent };
}

// =============================================================================
// Example 3: Agent Workflow Simulation
// =============================================================================

function exampleAgentWorkflow(projectId: string, agentId: string) {
  // Update agent status to working
  agentRepository.updateStatus(agentId, AgentStatus.WORKING);
  agentRepository.updateCurrentTask(agentId, 'Setting up project structure');

  // Log agent response
  historyRepository.create({
    agent_id: agentId,
    role: MessageRole.ASSISTANT,
    content: "I'll create a React calculator app. Let me start by setting up the project structure.",
    tool_calls: [
      {
        type: 'tool_use',
        name: 'bash',
        input: { command: 'npx create-react-app calculator --template typescript' },
      },
    ],
    usage: {
      input_tokens: 150,
      output_tokens: 200,
    },
    cost: 0.05,
  });

  // Update token usage and cost
  agentRepository.addTokens(agentId, 350, 0.05);
  projectRepository.updateCost(projectId, 0.05);

  // Log tool execution
  historyRepository.create({
    agent_id: agentId,
    role: MessageRole.TOOL,
    content: 'Command executed successfully',
    tool_results: [
      {
        type: 'tool_result',
        output: 'Project created successfully',
      },
    ],
  });

  // Track file creation
  outputRepository.create({
    project_id: projectId,
    agent_id: agentId,
    type: OutputType.FILE,
    path: '/calculator/src/App.tsx',
    content: 'import React from "react";\n\nexport default function App() {\n  return <div>Calculator</div>;\n}',
    checksum: 'abc123...',
  });

  // Increment iteration count
  agentRepository.incrementIterationCount(agentId);
  projectRepository.incrementIterationCount(projectId);

  // Log progress event
  eventRepository.create({
    project_id: projectId,
    agent_id: agentId,
    type: 'agent_progress',
    data: {
      task: 'Project structure created',
      files_created: 1,
      cost_so_far: 0.05,
    },
  });
}

// =============================================================================
// Example 4: Sub-Agent Creation
// =============================================================================

function exampleSubAgent(projectId: string, parentAgentId: string) {
  // Create a sub-agent for a specific task
  const subAgent = agentRepository.create({
    project_id: projectId,
    parent_id: parentAgentId,
    name: 'Testing Sub-Agent',
    config: {
      model: 'claude-sonnet-4-5',
      temperature: 0.5,
      specialization: 'testing',
    },
    depth: 1,
  });

  // Log sub-agent creation
  eventRepository.create({
    project_id: projectId,
    agent_id: parentAgentId,
    type: 'subagent_spawned',
    data: {
      subagent_id: subAgent.id,
      reason: 'Write comprehensive unit tests',
    },
  });

  // Give the sub-agent its task
  historyRepository.create({
    agent_id: subAgent.id,
    role: MessageRole.USER,
    content: 'Write unit tests for the Calculator component',
  });

  return subAgent;
}

// =============================================================================
// Example 5: Querying and Statistics
// =============================================================================

function exampleQueries(projectId: string) {
  // Get project with parsed settings
  const project = projectRepository.findByIdWithSettings(projectId);
  if (project) {
    console.log('Max iterations:', project.settings.maxIterations);
    console.log('Budget:', project.settings.budget);
  }

  // Get all agents for the project
  const agents = agentRepository.findByProjectId(projectId);
  console.log('Total agents:', agents.length);

  // Get agent statistics
  const agentStats = agentRepository.getProjectStats(projectId);
  console.log('Agent stats:', {
    total: agentStats.total,
    working: agentStats.byStatus.working,
    completed: agentStats.byStatus.completed,
    totalCost: agentStats.totalCost,
    totalTokens: agentStats.totalTokens,
    maxDepth: agentStats.maxDepth,
  });

  // Get conversation history
  const mainAgent = agents[0];
  const conversation = historyRepository.getConversation(mainAgent.id, {
    limit: 50,
  });
  console.log('Conversation length:', conversation.length);

  // Get recent events
  const recentEvents = eventRepository.findByProjectId(projectId, {
    limit: 10,
    order: 'desc',
  });
  console.log('Recent events:', recentEvents.map(e => e.type));

  // Get outputs by type
  const files = outputRepository.findByProjectAndType(projectId, OutputType.FILE);
  console.log('Files created:', files.length);

  // Get event statistics
  const eventStats = eventRepository.getProjectStats(projectId);
  console.log('Events by type:', eventStats.byType);
}

// =============================================================================
// Example 6: Completing a Project
// =============================================================================

function exampleCompleteProject(projectId: string, agentId: string) {
  // Update agent status
  agentRepository.updateStatus(agentId, AgentStatus.COMPLETED);
  agentRepository.updateCurrentTask(agentId, null);

  // Check if all agents are done
  const agents = agentRepository.findByProjectAndStatus(projectId, AgentStatus.WORKING);
  if (agents.length === 0) {
    // All agents done - complete the project
    projectRepository.updateStatus(projectId, ProjectStatus.COMPLETED);

    // Log completion event
    eventRepository.create({
      project_id: projectId,
      type: 'project_completed',
      data: {
        timestamp: Date.now(),
        duration_seconds: 1200,
        final_cost: 2.45,
      },
    });
  }

  // Get final stats
  const project = projectRepository.findById(projectId);
  const agentStats = agentRepository.getProjectStats(projectId);

  console.log('Project completed:', {
    name: project?.name,
    totalCost: project?.cost_total,
    iterations: project?.iteration_count,
    agentsUsed: agentStats.total,
    tokensUsed: agentStats.totalTokens,
  });
}

// =============================================================================
// Example 7: Transactions
// =============================================================================

function exampleTransaction() {
  // Use a transaction for atomic operations
  const result = Database.transaction(() => {
    const project = projectRepository.create({
      name: 'Atomic Project',
      prompt_path: '/path/to/prompt.md',
    });

    const agent = agentRepository.create({
      project_id: project.id,
      name: 'Atomic Agent',
    });

    eventRepository.create({
      project_id: project.id,
      type: 'project_created',
    });

    return { project, agent };
  });

  console.log('Transaction completed:', result);

  // If any operation fails, the entire transaction is rolled back
}

// =============================================================================
// Example 8: Cleanup
// =============================================================================

function exampleCleanup() {
  // Delete old events (older than 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const deletedEvents = eventRepository.deleteOlderThan(thirtyDaysAgo);
  console.log('Deleted old events:', deletedEvents);

  // Delete old history entries
  const deletedHistory = historyRepository.deleteOlderThan(thirtyDaysAgo);
  console.log('Deleted old history:', deletedHistory);

  // Backup the database
  const backupPath = `/backups/constellation-${Date.now()}.db`;
  Database.backup(backupPath).then(() => {
    console.log('Backup created:', backupPath);
  });
}

// =============================================================================
// Example 9: Advanced Queries
// =============================================================================

function exampleAdvancedQueries(projectId: string, agentId: string) {
  // Get agent hierarchy (agent and all descendants)
  const hierarchy = agentRepository.getAgentHierarchy(agentId);
  console.log('Agent hierarchy:', hierarchy.map(a => ({ id: a.id, depth: a.depth })));

  // Search history by content
  const searchResults = historyRepository.searchByContent(agentId, 'calculator', {
    limit: 10,
  });
  console.log('Search results:', searchResults.length);

  // Get entries with tool calls
  const toolCallEntries = historyRepository.findWithToolCalls(agentId);
  console.log('Tool call entries:', toolCallEntries.length);

  // Get unique file paths
  const paths = outputRepository.getUniquePaths(projectId);
  console.log('Unique file paths:', paths);

  // Get file history
  if (paths.length > 0) {
    const fileHistory = outputRepository.findHistoryByPath(projectId, paths[0]);
    console.log('File versions:', fileHistory.length);
  }

  // Find events by date range
  const startDate = new Date('2025-01-01').toISOString();
  const endDate = new Date().toISOString();
  const eventsInRange = eventRepository.findByDateRange(startDate, endDate, {
    limit: 100,
  });
  console.log('Events in range:', eventsInRange.length);
}

// =============================================================================
// Example 10: Global Statistics
// =============================================================================

function exampleGlobalStats() {
  // Project statistics
  const projectStats = projectRepository.getStats();
  console.log('Global project stats:', {
    total: projectStats.total,
    running: projectStats.byStatus.running,
    completed: projectStats.byStatus.completed,
    totalCost: projectStats.totalCost,
    totalIterations: projectStats.totalIterations,
  });

  // Event statistics
  const eventStats = eventRepository.getGlobalStats();
  console.log('Global event stats:', {
    total: eventStats.total,
    byType: eventStats.byType,
  });

  // Database statistics
  const dbStats = Database.getStats();
  console.log('Database stats:', {
    path: dbStats.path,
    size: `${(dbStats.size / 1024 / 1024).toFixed(2)} MB`,
    pages: dbStats.pageCount,
    walEnabled: dbStats.walEnabled,
  });
}

// =============================================================================
// Main Example Flow
// =============================================================================

export function runCompleteExample() {
  console.log('=== Constellation Database Layer Example ===\n');

  // 1. Setup
  exampleSetup();

  // 2. Create project
  const { project, agent } = exampleCreateProject();

  // 3. Simulate agent work
  exampleAgentWorkflow(project.id, agent.id);

  // 4. Create sub-agent
  const subAgent = exampleSubAgent(project.id, agent.id);
  exampleAgentWorkflow(project.id, subAgent.id);

  // 5. Query data
  exampleQueries(project.id);

  // 6. Advanced queries
  exampleAdvancedQueries(project.id, agent.id);

  // 7. Complete project
  exampleCompleteProject(project.id, agent.id);

  // 8. Demonstrate transaction
  exampleTransaction();

  // 9. Global statistics
  exampleGlobalStats();

  // 10. Cleanup example (commented out to preserve data)
  // exampleCleanup();

  // Close database connection
  Database.close();

  console.log('\n=== Example Complete ===');
}

// Uncomment to run:
// runCompleteExample();
