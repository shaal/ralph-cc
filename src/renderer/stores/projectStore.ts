import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { Project, CreateProjectDTO } from './types';
import { getApi } from './api';

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  loading: boolean;
  error: Error | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectDTO) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
  startProject: (id: string) => Promise<void>;
  pauseProject: (id: string) => Promise<void>;
  resumeProject: (id: string) => Promise<void>;
  stopProject: (id: string) => Promise<void>;

  // Selectors
  getSelectedProject: () => Project | null;
  getProjectById: (id: string) => Project | undefined;
  getRunningProjects: () => Project[];
  getPausedProjects: () => Project[];
  getCompletedProjects: () => Project[];
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    immer((set, get) => ({
      projects: [],
      selectedProjectId: null,
      loading: false,
      error: null,

      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const projects = await getApi().project.list();
          set({ projects, loading: false });
        } catch (error) {
          set({ error: error as Error, loading: false });
          throw error;
        }
      },

      createProject: async (data) => {
        set({ loading: true, error: null });
        try {
          const project = await getApi().project.create(data);
          set((state) => {
            state.projects.push(project);
            state.loading = false;
          });
          return project;
        } catch (error) {
          set({ error: error as Error, loading: false });
          throw error;
        }
      },

      updateProject: async (id, data) => {
        try {
          await getApi().project.update(id, data);
          set((state) => {
            const index = state.projects.findIndex((p) => p.id === id);
            if (index !== -1) {
              state.projects[index] = { ...state.projects[index], ...data };
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      deleteProject: async (id) => {
        try {
          await getApi().project.delete(id);
          set((state) => {
            state.projects = state.projects.filter((p) => p.id !== id);
            if (state.selectedProjectId === id) {
              state.selectedProjectId = null;
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      selectProject: (id) => {
        set({ selectedProjectId: id });
      },

      startProject: async (id) => {
        try {
          await getApi().project.start(id);
          set((state) => {
            const project = state.projects.find((p) => p.id === id);
            if (project) {
              project.status = 'running';
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      pauseProject: async (id) => {
        try {
          await getApi().project.pause(id);
          set((state) => {
            const project = state.projects.find((p) => p.id === id);
            if (project) {
              project.status = 'paused';
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      resumeProject: async (id) => {
        try {
          await getApi().project.resume(id);
          set((state) => {
            const project = state.projects.find((p) => p.id === id);
            if (project) {
              project.status = 'running';
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      stopProject: async (id) => {
        try {
          await getApi().project.stop(id);
          set((state) => {
            const project = state.projects.find((p) => p.id === id);
            if (project) {
              project.status = 'idle';
            }
          });
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      // Selectors
      getSelectedProject: () => {
        const { projects, selectedProjectId } = get();
        return projects.find((p) => p.id === selectedProjectId) || null;
      },

      getProjectById: (id) => {
        const { projects } = get();
        return projects.find((p) => p.id === id);
      },

      getRunningProjects: () => {
        const { projects } = get();
        return projects.filter((p) => p.status === 'running');
      },

      getPausedProjects: () => {
        const { projects } = get();
        return projects.filter((p) => p.status === 'paused');
      },

      getCompletedProjects: () => {
        const { projects } = get();
        return projects.filter((p) => p.status === 'completed');
      },
    })),
    { name: 'ProjectStore' }
  )
);
