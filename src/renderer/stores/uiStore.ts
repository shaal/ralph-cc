import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { Notification } from './types';

type ActiveTab = 'graph' | 'dashboard' | 'settings';
type Theme = 'dark' | 'light';

interface UIState {
  // Layout state
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  inspectorWidth: number;
  activeTab: ActiveTab;
  theme: Theme;

  // Notifications
  notifications: Notification[];

  // Modal state
  isCreateProjectModalOpen: boolean;
  isSettingsModalOpen: boolean;

  // Actions - Layout
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  setInspectorWidth: (width: number) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Actions - Notifications
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Modals
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // Selectors
  getRecentNotifications: (limit?: number) => Notification[];
  hasUnreadNotifications: () => boolean;
}

const DEFAULT_INSPECTOR_WIDTH = 400;
const MIN_INSPECTOR_WIDTH = 300;
const MAX_INSPECTOR_WIDTH = 800;

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        sidebarCollapsed: false,
        inspectorOpen: false,
        inspectorWidth: DEFAULT_INSPECTOR_WIDTH,
        activeTab: 'graph',
        theme: 'dark',
        notifications: [],
        isCreateProjectModalOpen: false,
        isSettingsModalOpen: false,

        // Layout actions
        toggleSidebar: () => {
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          });
        },

        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed });
        },

        toggleInspector: () => {
          set((state) => {
            state.inspectorOpen = !state.inspectorOpen;
          });
        },

        setInspectorOpen: (open) => {
          set({ inspectorOpen: open });
        },

        setInspectorWidth: (width) => {
          const clampedWidth = Math.max(
            MIN_INSPECTOR_WIDTH,
            Math.min(MAX_INSPECTOR_WIDTH, width)
          );
          set({ inspectorWidth: clampedWidth });
        },

        setActiveTab: (tab) => {
          set({ activeTab: tab });
        },

        setTheme: (theme) => {
          set({ theme });
          // Apply theme to document
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'dark');
          }
        },

        toggleTheme: () => {
          const newTheme = get().theme === 'dark' ? 'light' : 'dark';
          get().setTheme(newTheme);
        },

        // Notification actions
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random()}`;
          const timestamp = new Date().toISOString();
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp,
            duration: notification.duration || 5000,
          };

          set((state) => {
            state.notifications.push(newNotification);
          });

          // Auto-remove after duration
          if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }
        },

        removeNotification: (id) => {
          set((state) => {
            state.notifications = state.notifications.filter(
              (n) => n.id !== id
            );
          });
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // Modal actions
        openCreateProjectModal: () => {
          set({ isCreateProjectModalOpen: true });
        },

        closeCreateProjectModal: () => {
          set({ isCreateProjectModalOpen: false });
        },

        openSettingsModal: () => {
          set({ isSettingsModalOpen: true });
        },

        closeSettingsModal: () => {
          set({ isSettingsModalOpen: false });
        },

        // Selectors
        getRecentNotifications: (limit = 10) => {
          const { notifications } = get();
          return notifications.slice(-limit).reverse();
        },

        hasUnreadNotifications: () => {
          const { notifications } = get();
          return notifications.length > 0;
        },
      })),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          inspectorWidth: state.inspectorWidth,
          activeTab: state.activeTab,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Apply initial theme on store creation
if (typeof document !== 'undefined') {
  const theme = useUIStore.getState().theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
