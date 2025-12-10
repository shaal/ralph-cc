import { useState, useEffect } from 'react';
import { getApi } from '../stores/api';
import type { Project, ProjectSettings } from '../types';

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

  const handleBudgetWarning = (event: any) => {
    // Trigger immediate budget check when warning event received
    checkBudgets();
  };

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
    const api = getApi();
    const unsubscribe = api.onEvent('budget_warning', handleBudgetWarning);
    const interval = setInterval(checkBudgets, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [projectId, warningThreshold, criticalThreshold]);

  const checkBudgets = async () => {
    try {
      // Fetch projects and their cost data
      const api = getApi();
      const dbProjects = await api.project.list();

      const newAlerts: BudgetAlert[] = [];

      for (const dbProject of dbProjects) {
        // Filter by projectId if specified
        if (projectId && dbProject.id !== projectId) {
          continue;
        }

        // Parse settings and get budget limit (with defaults)
        let settings: ProjectSettings | null = null;
        try {
          settings = typeof dbProject.settings === 'string'
            ? JSON.parse(dbProject.settings)
            : dbProject.settings;
        } catch (err) {
          console.error(`Error parsing settings for project ${dbProject.id}:`, err);
        }

        const totalCost = dbProject.cost_total ?? 0;
        const budgetLimit = settings?.budgetLimit ?? 0;

        // Skip if no budget is set
        if (budgetLimit <= 0) {
          continue;
        }

        const percentageUsed = (totalCost / budgetLimit) * 100;
        const budgetRemaining = budgetLimit - totalCost;

        // Check if alert should be created
        let level: 'warning' | 'critical' | null = null;
        let message = '';

        if (percentageUsed >= criticalThreshold) {
          level = 'critical';
          message = `Critical: ${dbProject.name} has used ${percentageUsed.toFixed(1)}% of its budget ($${budgetRemaining.toFixed(2)} remaining)`;
        } else if (percentageUsed >= warningThreshold) {
          level = 'warning';
          message = `Warning: ${dbProject.name} has used ${percentageUsed.toFixed(1)}% of its budget ($${budgetRemaining.toFixed(2)} remaining)`;
        }

        if (level) {
          const alertId = `${dbProject.id}-${level}-${Math.floor(percentageUsed / 5) * 5}`;

          // Check if alert is dismissed or snoozed
          if (dismissedIds.has(alertId)) {
            continue;
          }

          const alert: BudgetAlert = {
            id: alertId,
            projectId: dbProject.id,
            projectName: dbProject.name,
            level,
            budgetRemaining,
            budgetTotal: budgetLimit,
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
