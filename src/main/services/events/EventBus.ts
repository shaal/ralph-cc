/**
 * EventBus - Central event bus for Constellation
 *
 * Features:
 * - Type-safe event emission and subscription
 * - Event persistence to database
 * - IPC broadcast to renderer process
 * - Singleton pattern
 */

import { randomUUID } from 'crypto';
import { BrowserWindow } from 'electron';
import type { AppEvent, EventType } from './EventTypes';

/**
 * Event listener callback type
 */
type EventListener<T extends EventType = EventType> = (event: Extract<AppEvent, { type: T }>) => void;

/**
 * Event listener registration
 */
interface ListenerRegistration {
  type: EventType;
  callback: EventListener<any>;
  id: string;
}

/**
 * EventBus class - Singleton
 */
export class EventBus {
  private static instance: EventBus | null = null;
  private listeners: Map<EventType, Set<ListenerRegistration>> = new Map();
  private eventRepository: any = null; // Will be injected
  private mainWindow: BrowserWindow | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Set the event repository for persistence
   */
  public setEventRepository(repository: any): void {
    this.eventRepository = repository;
  }

  /**
   * Set the main window for IPC broadcasts
   */
  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Emit an event
   *
   * @param event - Event to emit (without id and timestamp, will be auto-added)
   */
  public emit<T extends EventType>(
    event: Omit<Extract<AppEvent, { type: T }>, 'id' | 'timestamp'>
  ): void {
    // Add id and timestamp
    const fullEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date(),
    } as Extract<AppEvent, { type: T }>;

    // Persist to database (async, don't block)
    this.persistEvent(fullEvent).catch((error) => {
      console.error('Failed to persist event:', error);
    });

    // Broadcast to renderer via IPC
    this.broadcastToRenderer(fullEvent);

    // Notify listeners
    this.notifyListeners(fullEvent);
  }

  /**
   * Subscribe to events of a specific type
   *
   * @param type - Event type to listen for
   * @param callback - Callback function to invoke when event occurs
   * @returns Unsubscribe function
   */
  public on<T extends EventType>(
    type: T,
    callback: EventListener<T>
  ): () => void {
    const registration: ListenerRegistration = {
      type,
      callback,
      id: randomUUID(),
    };

    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(registration);

    // Return unsubscribe function
    return () => {
      this.off(type, registration.id);
    };
  }

  /**
   * Unsubscribe from events
   *
   * @param type - Event type
   * @param listenerId - Listener ID to remove
   */
  public off(type: EventType, listenerId: string): void {
    const typeListeners = this.listeners.get(type);
    if (!typeListeners) return;

    for (const listener of typeListeners) {
      if (listener.id === listenerId) {
        typeListeners.delete(listener);
        break;
      }
    }

    // Clean up empty sets
    if (typeListeners.size === 0) {
      this.listeners.delete(type);
    }
  }

  /**
   * Remove all listeners for a specific event type
   */
  public removeAllListeners(type?: EventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for an event type
   */
  public listenerCount(type: EventType): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  /**
   * Persist event to database
   */
  private async persistEvent(event: AppEvent): Promise<void> {
    if (!this.eventRepository) {
      console.warn('EventRepository not set, skipping event persistence');
      return;
    }

    try {
      await this.eventRepository.create({
        id: event.id,
        projectId: event.projectId,
        agentId: event.agentId,
        type: event.type,
        data: JSON.stringify(event.data),
        createdAt: event.timestamp,
      });
    } catch (error) {
      console.error('Failed to persist event to database:', error);
      throw error;
    }
  }

  /**
   * Broadcast event to renderer process via IPC
   */
  private broadcastToRenderer(event: AppEvent): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    try {
      this.mainWindow.webContents.send('event', event);
    } catch (error) {
      console.error('Failed to broadcast event to renderer:', error);
    }
  }

  /**
   * Notify all listeners for this event type
   */
  private notifyListeners(event: AppEvent): void {
    const typeListeners = this.listeners.get(event.type);
    if (!typeListeners) return;

    for (const listener of typeListeners) {
      try {
        listener.callback(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }
  }

  /**
   * For testing: reset singleton instance
   */
  public static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.removeAllListeners();
      EventBus.instance = null;
    }
  }
}

/**
 * Export singleton instance getter
 */
export const getEventBus = () => EventBus.getInstance();
