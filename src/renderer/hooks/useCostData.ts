import { useState, useEffect } from 'react';
import { getApi } from '../stores/api';

export interface CostSummary {
  totalCost: number;
  todayCost: number;
  currentRate: number; // $/hour
  budgetRemaining: number;
  trend: number; // percentage change
  estimatedRunway: number; // days
}

export interface CostHistory {
  timestamp: Date;
  cost: number;
  cumulative: number;
}

export interface ProjectCost {
  projectId: string;
  projectName: string;
  cost: number;
  percentage: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  agentCount: number;
}

export interface AgentCost {
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

export interface TokenMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  inputCost: number;
  outputCost: number;
  efficiency: number; // output tokens per dollar
}

export interface CostProjection {
  dailyRate: number;
  monthlyProjection: number;
  burnRate: number;
  daysUntilBudgetDepletion: number | null;
  warningLevel: 'safe' | 'warning' | 'critical';
}

interface UseCostDataResult {
  summary: CostSummary | null;
  history: CostHistory[];
  byProject: ProjectCost[];
  byAgent: AgentCost[];
  tokenMetrics: TokenMetrics | null;
  projection: CostProjection | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useCostData = (timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): UseCostDataResult => {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [history, setHistory] = useState<CostHistory[]>([]);
  const [byProject, setByProject] = useState<ProjectCost[]>([]);
  const [byAgent, setByAgent] = useState<AgentCost[]>([]);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics | null>(null);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate time range boundaries
      const now = new Date();
      const rangeMs: Record<typeof timeRange, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const since = new Date(now.getTime() - rangeMs[timeRange]);

      // Fetch all projects and agents from database
      const api = getApi();
      const projectsRaw: any[] = await api.project.list();

      // Map database fields to expected format
      const projects = projectsRaw.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        totalCost: p.cost_total || 0,
        budget: p.settings ? (JSON.parse(p.settings).budgetLimit || 0) : 0,
        createdAt: p.created_at,
      }));

      // Fetch agents for all projects
      const allAgents: any[] = [];
      for (const project of projectsRaw) {
        if (project && project.id) {
          const projectAgents = await api.agent.list(project.id);
          allAgents.push(...projectAgents);
        }
      }

      // Map agent database fields to expected format
      const agents = allAgents.map((a: any) => ({
        id: a.id,
        name: a.name,
        projectId: a.project_id,
        status: a.status,
        tokensIn: 0, // Will be calculated from agent_history in future
        tokensOut: 0, // Will be calculated from agent_history in future
        totalCost: a.total_cost || 0,
        createdAt: a.created_at,
        updatedAt: a.updated_at || a.created_at,
      }));

      // Calculate summary
      const totalCost = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayCost = calculateCostSince(agents, todayStart);

      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const lastHourCost = calculateCostSince(agents, oneHourAgo);
      const currentRate = lastHourCost; // $/hour

      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const budgetRemaining = totalBudget - totalCost;

      // Calculate trend (compare today vs yesterday)
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayCost = calculateCostBetween(agents, yesterdayStart, todayStart);
      const trend = yesterdayCost > 0 ? ((todayCost - yesterdayCost) / yesterdayCost) * 100 : 0;

      // Calculate runway
      const estimatedRunway = currentRate > 0 ? budgetRemaining / (currentRate * 24) : Infinity;

      setSummary({
        totalCost,
        todayCost,
        currentRate,
        budgetRemaining,
        trend,
        estimatedRunway: Math.floor(estimatedRunway),
      });

      // Generate cost history
      const historyData = generateCostHistory(agents, since, now, timeRange);
      setHistory(historyData);

      // Calculate per-project costs
      const projectCosts: ProjectCost[] = projects.map(project => {
        const projectAgents = agents.filter(a => a.projectId === project.id);
        const cost = projectAgents.reduce((sum, a) => sum + (a.totalCost || 0), 0);
        const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          cost,
          percentage,
          status: project.status,
          agentCount: projectAgents.length,
        };
      }).sort((a, b) => b.cost - a.cost);
      setByProject(projectCosts);

      // Calculate per-agent costs
      const agentCosts: AgentCost[] = agents.map(agent => {
        const project = projects.find(p => p.id === agent.projectId);
        return {
          agentId: agent.id,
          agentName: agent.name || `Agent ${agent.id.substring(0, 8)}`,
          projectId: agent.projectId,
          projectName: project?.name || 'Unknown',
          tokensIn: agent.tokensIn || 0,
          tokensOut: agent.tokensOut || 0,
          cost: agent.totalCost || 0,
          status: agent.status,
          lastActive: new Date(agent.updatedAt || agent.createdAt),
        };
      }).sort((a, b) => b.cost - a.cost);
      setByAgent(agentCosts);

      // Calculate token metrics
      const totalInputTokens = agents.reduce((sum, a) => sum + (a.tokensIn || 0), 0);
      const totalOutputTokens = agents.reduce((sum, a) => sum + (a.tokensOut || 0), 0);
      const inputCost = totalInputTokens * 0.003 / 1000; // Example pricing
      const outputCost = totalOutputTokens * 0.015 / 1000;
      const efficiency = totalCost > 0 ? totalOutputTokens / totalCost : 0;

      setTokenMetrics({
        totalInputTokens,
        totalOutputTokens,
        inputCost,
        outputCost,
        efficiency,
      });

      // Calculate projections
      const dailyRate = currentRate * 24;
      const monthlyProjection = dailyRate * 30;
      const burnRate = totalBudget > 0 ? (dailyRate / totalBudget) * 100 : 0;
      const daysUntilBudgetDepletion = dailyRate > 0 ? budgetRemaining / dailyRate : null;

      let warningLevel: 'safe' | 'warning' | 'critical' = 'safe';
      if (budgetRemaining < totalBudget * 0.1) {
        warningLevel = 'critical';
      } else if (budgetRemaining < totalBudget * 0.25) {
        warningLevel = 'warning';
      }

      setProjection({
        dailyRate,
        monthlyProjection,
        burnRate,
        daysUntilBudgetDepletion,
        warningLevel,
      });

    } catch (err) {
      setError(err as Error);
      console.error('Error fetching cost data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();

    // Subscribe to real-time cost updates
    const api = getApi();
    const unsubscribe = api.onEvent('cost_updated', fetchCostData);

    // Also subscribe to agent status changes which might affect cost calculations
    const unsubscribeAgentStatus = api.onEvent('agent_status_changed', fetchCostData);
    const unsubscribeProjectStatus = api.onEvent('project_status_changed', fetchCostData);

    return () => {
      unsubscribe();
      unsubscribeAgentStatus();
      unsubscribeProjectStatus();
    };
  }, [timeRange]);

  return {
    summary,
    history,
    byProject,
    byAgent,
    tokenMetrics,
    projection,
    loading,
    error,
    refresh: fetchCostData,
  };
};

// Helper functions
function calculateCostSince(agents: any[], since: Date): number {
  // Mock implementation - in production, query agent_history table
  return agents.reduce((sum, agent) => {
    const agentCreated = new Date(agent.createdAt);
    if (agentCreated >= since) {
      return sum + (agent.totalCost || 0);
    }
    return sum;
  }, 0);
}

function calculateCostBetween(agents: any[], start: Date, end: Date): number {
  // Mock implementation
  return agents.reduce((sum, agent) => {
    const agentCreated = new Date(agent.createdAt);
    if (agentCreated >= start && agentCreated < end) {
      return sum + (agent.totalCost || 0);
    }
    return sum;
  }, 0);
}

function generateCostHistory(
  _agents: any[], // Currently unused - will be used when we query agent_history table
  since: Date,
  now: Date,
  timeRange: string
): CostHistory[] {
  // Generate data points based on time range
  const pointCount = timeRange === '1h' ? 60 : timeRange === '24h' ? 48 : 50;
  const intervalMs = (now.getTime() - since.getTime()) / pointCount;

  const history: CostHistory[] = [];
  let cumulative = 0;

  for (let i = 0; i <= pointCount; i++) {
    const timestamp = new Date(since.getTime() + i * intervalMs);
    const cost = Math.random() * 0.05; // Mock incremental cost
    cumulative += cost;

    history.push({
      timestamp,
      cost,
      cumulative,
    });
  }

  return history;
}

// Mock data functions - DEPRECATED - Now using real IPC calls
// These functions are kept for reference but are no longer used
/*
async function mockFetchProjects(): Promise<any[]> {
  return [
    {
      id: 'proj-1',
      name: 'Web Scraper',
      status: 'active',
      totalCost: 12.45,
      budget: 50.0,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'proj-2',
      name: 'Data Analysis',
      status: 'paused',
      totalCost: 8.32,
      budget: 30.0,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'proj-3',
      name: 'API Integration',
      status: 'active',
      totalCost: 5.67,
      budget: 40.0,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

async function mockFetchAgents(): Promise<any[]> {
  return [
    {
      id: 'agent-1',
      name: 'Scraper Agent',
      projectId: 'proj-1',
      status: 'running',
      tokensIn: 15000,
      tokensOut: 8000,
      totalCost: 6.25,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'agent-2',
      name: 'Parser Agent',
      projectId: 'proj-1',
      status: 'running',
      tokensIn: 12000,
      tokensOut: 6000,
      totalCost: 4.20,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'agent-3',
      name: 'Analysis Agent',
      projectId: 'proj-2',
      status: 'paused',
      tokensIn: 20000,
      tokensOut: 10000,
      totalCost: 8.32,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'agent-4',
      name: 'Integration Agent',
      projectId: 'proj-3',
      status: 'running',
      tokensIn: 10000,
      tokensOut: 5000,
      totalCost: 3.67,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'agent-5',
      name: 'Testing Agent',
      projectId: 'proj-3',
      status: 'completed',
      tokensIn: 5000,
      tokensOut: 3000,
      totalCost: 2.00,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
*/
