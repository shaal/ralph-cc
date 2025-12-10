/**
 * Hook for accessing and managing a single project
 */

import { useState, useEffect, useCallback } from 'react';
import { Project, UpdateProjectInput } from '../types';
import { useProjectStore } from '../stores/projectStore';
import { getApi } from '../stores/api';

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
  // Get project from the store first (for browser mock mode)
  const projectFromStore = useProjectStore((state) =>
    state.projects.find((p) => p.id === projectId) || null
  );

  const [project, setProject] = useState<Project | null>(projectFromStore);
  const [loading, setLoading] = useState(!projectFromStore);
  const [error, setError] = useState<Error | null>(null);

  // Update local state when store changes
  useEffect(() => {
    if (projectFromStore) {
      setProject(projectFromStore);
      setLoading(false);
    }
  }, [projectFromStore]);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    // If we already have the project from the store, don't fetch again
    if (projectFromStore) {
      setProject(projectFromStore);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const api = getApi();
      const data = await api.project.get(projectId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load project'));
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, projectFromStore]);

  useEffect(() => {
    refresh();

    if (!projectId) return;

    const api = getApi();

    // Subscribe to project updates
    const unsubscribe = api.onEvent('project_updated', (event: any) => {
      if (event.data?.projectId === projectId) {
        setProject((prev) => {
          if (!prev) return prev;
          return { ...prev, ...event.data.changes };
        });
      }
    });

    // Subscribe to status changes
    const unsubscribeStatus = api.onEvent('project_status_changed', (event: any) => {
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
        const api = getApi();
        await api.project.update(projectId, input);
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
      const api = getApi();
      await api.project.start(projectId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start project'));
      throw err;
    }
  }, [projectId]);

  const pause = useCallback(async () => {
    if (!projectId) return;
    try {
      const api = getApi();
      await api.project.pause(projectId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to pause project'));
      throw err;
    }
  }, [projectId]);

  const stop = useCallback(async () => {
    if (!projectId) return;
    try {
      const api = getApi();
      await api.project.stop(projectId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to stop project'));
      throw err;
    }
  }, [projectId]);

  const deleteProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const api = getApi();
      await api.project.delete(projectId);
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
