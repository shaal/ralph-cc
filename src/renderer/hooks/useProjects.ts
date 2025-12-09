/**
 * Hook for accessing and managing all projects
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, CreateProjectInput } from '../types';

export interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (input: CreateProjectInput) => Promise<Project>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProjects: Project[];
}

export const useProjects = (): UseProjectsResult => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.api.project.list();

      // Sort by last updated (most recent first)
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      });

      setProjects(sorted);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load projects'));
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Subscribe to project creation events
    const unsubscribeCreated = window.api.onEvent('project_created', (event) => {
      setProjects((prev) => {
        // Add new project at the beginning
        const newProject = event.data.project;
        return [newProject, ...prev];
      });
    });

    // Subscribe to project updates
    const unsubscribeUpdated = window.api.onEvent('project_updated', (event) => {
      setProjects((prev) => {
        return prev.map((p) =>
          p.id === event.data.projectId ? { ...p, ...event.data.changes } : p
        );
      });
    });

    // Subscribe to project deletions
    const unsubscribeDeleted = window.api.onEvent('project_deleted', (event) => {
      setProjects((prev) => prev.filter((p) => p.id !== event.data.projectId));
    });

    // Subscribe to status changes
    const unsubscribeStatus = window.api.onEvent('project_status_changed', (event) => {
      setProjects((prev) => {
        return prev.map((p) =>
          p.id === event.data.projectId ? { ...p, status: event.data.status } : p
        );
      });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeStatus();
    };
  }, [refresh]);

  const create = useCallback(
    async (input: CreateProjectInput): Promise<Project> => {
      try {
        const project = await window.api.project.create(input);
        await refresh();
        return project;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create project'));
        throw err;
      }
    },
    [refresh]
  );

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }

    const query = searchQuery.toLowerCase();
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query)
      );
    });
  }, [projects, searchQuery]);

  return {
    projects,
    loading,
    error,
    refresh,
    create,
    searchQuery,
    setSearchQuery,
    filteredProjects,
  };
};
