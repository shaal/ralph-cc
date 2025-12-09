import { useState, useEffect } from 'react';

export interface BudgetAlert {
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

interface UseBudgetAlertOptions {
  projectId?: string;
  warningThreshold?: number; // Default 75%
  criticalThreshold?: number; // Default 90%
  playSound?: boolean;
}

interface UseBudgetAlertResult {
  alerts: BudgetAlert[];
  activeAlert: BudgetAlert | null;
  hasActiveAlerts: boolean;
  dismiss: (alertId: string) => void;
  snooze: (alertId: string, minutes: number) => void;
  clearAll: () => void;
}

export const useBudgetAlert = (options: UseBudgetAlertOptions = {}): UseBudgetAlertResult => {
  const {
    projectId,
    warningThreshold = 75,
    criticalThreshold = 90,
    playSound = false,
  } = options;

  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed alerts from localStorage
    const stored = localStorage.getItem('dismissedBudgetAlerts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedIds(new Set(parsed));
      } catch (err) {
        console.error('Error loading dismissed alerts:', err);
      }
    }

    checkBudgets();

    // Subscribe to budget warning events
    // In production: window.api.events.subscribe('budget_warning', handleBudgetWarning);
    const interval = setInterval(checkBudgets, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      // In production: window.api.events.unsubscribe('budget_warning', handleBudgetWarning);
    };
  }, [projectId, warningThreshold, criticalThreshold]);

  const checkBudgets = async () => {
    try {
      // Fetch projects and their cost data
      // In production: const projects = await window.api.project.list();
      const projects = await mockFetchProjectBudgets();

      const newAlerts: BudgetAlert[] = [];

      for (const project of projects) {
        // Filter by projectId if specified
        if (projectId && project.id !== projectId) {
          continue;
        }

        const percentageUsed = (project.totalCost / project.budget) * 100;
        const budgetRemaining = project.budget - project.totalCost;

        // Check if alert should be created
        let level: 'warning' | 'critical' | null = null;
        let message = '';

        if (percentageUsed >= criticalThreshold) {
          level = 'critical';
          message = `Critical: ${project.name} has used ${percentageUsed.toFixed(1)}% of its budget ($${budgetRemaining.toFixed(2)} remaining)`;
        } else if (percentageUsed >= warningThreshold) {
          level = 'warning';
          message = `Warning: ${project.name} has used ${percentageUsed.toFixed(1)}% of its budget ($${budgetRemaining.toFixed(2)} remaining)`;
        }

        if (level) {
          const alertId = `${project.id}-${level}-${Math.floor(percentageUsed / 5) * 5}`;

          // Check if alert is dismissed or snoozed
          if (dismissedIds.has(alertId)) {
            continue;
          }

          const alert: BudgetAlert = {
            id: alertId,
            projectId: project.id,
            projectName: project.name,
            level,
            budgetRemaining,
            budgetTotal: project.budget,
            percentageUsed,
            message,
            timestamp: new Date(),
            dismissed: false,
            snoozedUntil: null,
          };

          newAlerts.push(alert);
        }
      }

      // Play sound if new critical alerts and sound enabled
      if (playSound && newAlerts.some(a => a.level === 'critical')) {
        const hasNewCritical = newAlerts.some(
          a => a.level === 'critical' && !alerts.find(old => old.id === a.id)
        );
        if (hasNewCritical) {
          playAlertSound();
        }
      }

      setAlerts(newAlerts);
    } catch (err) {
      console.error('Error checking budgets:', err);
    }
  };

  const dismiss = (alertId: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(alertId);
    setDismissedIds(newDismissed);

    // Persist to localStorage
    localStorage.setItem('dismissedBudgetAlerts', JSON.stringify(Array.from(newDismissed)));

    // Remove from current alerts
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const snooze = (alertId: string, minutes: number) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);

    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, snoozedUntil }
          : alert
      )
    );

    // Store snooze info in localStorage with expiration
    const snoozeKey = `budgetAlertSnooze-${alertId}`;
    localStorage.setItem(snoozeKey, snoozedUntil.toISOString());

    // Set timeout to remove snooze
    setTimeout(() => {
      localStorage.removeItem(snoozeKey);
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, snoozedUntil: null }
            : alert
        )
      );
    }, minutes * 60 * 1000);
  };

  const clearAll = () => {
    const allIds = alerts.map(a => a.id);
    const newDismissed = new Set([...dismissedIds, ...allIds]);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedBudgetAlerts', JSON.stringify(Array.from(newDismissed)));
    setAlerts([]);
  };

  // Filter out snoozed alerts
  const activeAlerts = alerts.filter(alert => {
    if (!alert.snoozedUntil) return true;
    return new Date() >= alert.snoozedUntil;
  });

  // Get highest priority active alert
  const activeAlert = activeAlerts.length > 0
    ? activeAlerts.sort((a, b) => {
        if (a.level === 'critical' && b.level === 'warning') return -1;
        if (a.level === 'warning' && b.level === 'critical') return 1;
        return b.percentageUsed - a.percentageUsed;
      })[0]
    : null;

  return {
    alerts: activeAlerts,
    activeAlert,
    hasActiveAlerts: activeAlerts.length > 0,
    dismiss,
    snooze,
    clearAll,
  };
};

// Helper functions
function playAlertSound() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (err) {
    console.error('Error playing alert sound:', err);
  }
}

// Mock data function
async function mockFetchProjectBudgets(): Promise<any[]> {
  return [
    {
      id: 'proj-1',
      name: 'Web Scraper',
      totalCost: 42.50,
      budget: 50.0,
    },
    {
      id: 'proj-2',
      name: 'Data Analysis',
      totalCost: 28.30,
      budget: 30.0,
    },
    {
      id: 'proj-3',
      name: 'API Integration',
      totalCost: 15.67,
      budget: 40.0,
    },
  ];
}
