/**
 * Hook for accessing and managing a single project
 */

import { useState, useEffect, useCallback } from 'react';
import { Project, UpdateProjectInput } from '../types';

export interface UseProjectResult {
  project: Project | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  update: (input: UpdateProjectInput) => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  delete: () => Promise<void>;
}

export const useProject = (projectId: string | null): UseProjectResult => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await window.api.project.get(projectId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load project'));
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();

    if (!projectId) return;

    // Subscribe to project updates
    const unsubscribe = window.api.onEvent('project_updated', (event) => {
      if (event.data?.projectId === projectId) {
        setProject((prev) => {
          if (!prev) return prev;
          return { ...prev, ...event.data.changes };
        });
      }
    });

    // Subscribe to status changes
    const unsubscribeStatus = window.api.onEvent('project_status_changed', (event) => {
      if (event.data?.projectId === projectId) {
        setProject((prev) => {
          if (!prev) return prev;
          return { ...prev, status: event.data.status };
        });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [projectId, refresh]);

  const update = useCallback(
    async (input: UpdateProjectInput) => {
      if (!projectId) return;
      try {
        await window.api.project.update(projectId, input);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update project'));
        throw err;
      }
    },
    [projectId, refresh]
  );

  const start = useCallback(async () => {
    if (!projectId) return;
    try {
      await window.api.project.start(projectId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start project'));
      throw err;
    }
  }, [projectId]);

  const pause = useCallback(async () => {
    if (!projectId) return;
    try {
      await window.api.project.pause(projectId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to pause project'));
      throw err;
    }
  }, [projectId]);

  const stop = useCallback(async () => {
    if (!projectId) return;
    try {
      await window.api.project.stop(projectId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to stop project'));
      throw err;
    }
  }, [projectId]);

  const deleteProject = useCallback(async () => {
    if (!projectId) return;
    try {
      await window.api.project.delete(projectId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete project'));
      throw err;
    }
  }, [projectId]);

  return {
    project,
    loading,
    error,
    refresh,
    update,
    start,
    pause,
    stop,
    delete: deleteProject,
  };
};
