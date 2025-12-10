/**
 * Event Bus for pub/sub communication between services
 * Implements throttling for real-time UI updates (~60fps)
 */

export type EventType =
  | 'project_created'
  | 'project_started'
  | 'project_paused'
  | 'project_stopped'
  | 'project_completed'
  | 'project_updated'
  | 'project_status_changed'
  | 'agent_created'
  | 'agent_started'
  | 'agent_paused'
  | 'agent_stopped'
  | 'agent_status_changed'
  | 'agent_output_chunk'
  | 'agent_tool_call'
  | 'iteration_complete'
  | 'iteration_error'
  | 'tool_executed'
  | 'subagent_spawned'
  | 'circuit_breaker_triggered'
  | 'budget_exceeded'
  | 'budget_warning'
  | 'api_key_required'
  | 'proxy_auth_required';

export interface Event {
  type: EventType;
  data: Record<string, unknown>;
  timestamp: number;
  id?: string;
}

export type EventHandler = (event: Event) => void | Promise<void>;

interface Subscription {
  id: string;
  handler: EventHandler;
  filter?: (event: Event) => boolean;
}

interface ThrottleConfig {
  enabled: boolean;
  intervalMs: number; // Default: ~16ms (60fps)
}

export class EventBus {
  private subscriptions: Map<EventType, Subscription[]> = new Map();
  private globalSubscriptions: Subscription[] = [];
  private throttleConfig: ThrottleConfig;
  private pendingEvents: Map<EventType, Event[]> = new Map();
  private throttleTimers: Map<EventType, NodeJS.Timeout> = new Map();
  private eventCounter = 0;

  // Event types that should NOT be throttled (critical events)
  private criticalEvents: Set<EventType> = new Set([
    'project_created',
    'project_started',
    'project_paused',
    'project_stopped',
    'project_completed',
    'project_status_changed',
    'circuit_breaker_triggered',
    'budget_exceeded',
    'api_key_required',
    'proxy_auth_required',
    'iteration_error',
    // Streaming events must be real-time for responsive UI
    'agent_output_chunk',
    'agent_tool_call',
    'tool_executed',
  ]);

  constructor(throttleConfig: ThrottleConfig = { enabled: true, intervalMs: 16 }) {
    this.throttleConfig = throttleConfig;
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe(
    eventType: EventType,
    handler: EventHandler,
    filter?: (event: Event) => boolean
  ): () => void {
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      handler,
      filter,
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    this.subscriptions.get(eventType)!.push(subscription);

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, subscription.id);
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(
    handler: EventHandler,
    filter?: (event: Event) => boolean
  ): () => void {
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      handler,
      filter,
    };

    this.globalSubscriptions.push(subscription);

    // Return unsubscribe function
    return () => {
      const index = this.globalSubscriptions.findIndex(sub => sub.id === subscription.id);
      if (index !== -1) {
        this.globalSubscriptions.splice(index, 1);
      }
    };
  }

  /**
   * Unsubscribe from an event type
   */
  private unsubscribe(eventType: EventType, subscriptionId: string): void {
    const subs = this.subscriptions.get(eventType);
    if (subs) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(type: EventType, data: Record<string, unknown>): void {
    const event: Event = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateEventId(),
    };

    // Check if this event should be throttled
    const shouldThrottle = this.throttleConfig.enabled && !this.criticalEvents.has(type);

    if (shouldThrottle) {
      this.emitThrottled(event);
    } else {
      this.emitImmediate(event);
    }
  }

  /**
   * Emit event immediately (no throttling)
   */
  private emitImmediate(event: Event): void {
    // Notify specific event subscribers
    const subs = this.subscriptions.get(event.type);
    if (subs) {
      for (const sub of subs) {
        if (!sub.filter || sub.filter(event)) {
          this.invokeHandler(sub.handler, event);
        }
      }
    }

    // Notify global subscribers
    for (const sub of this.globalSubscriptions) {
      if (!sub.filter || sub.filter(event)) {
        this.invokeHandler(sub.handler, event);
      }
    }
  }

  /**
   * Emit event with throttling
   */
  private emitThrottled(event: Event): void {
    // Add to pending events
    if (!this.pendingEvents.has(event.type)) {
      this.pendingEvents.set(event.type, []);
    }
    this.pendingEvents.get(event.type)!.push(event);

    // If no timer is running for this event type, start one
    if (!this.throttleTimers.has(event.type)) {
      const timer = setTimeout(() => {
        this.flushPendingEvents(event.type);
      }, this.throttleConfig.intervalMs);

      this.throttleTimers.set(event.type, timer);
    }
  }

  /**
   * Flush pending events for a specific type
   */
  private flushPendingEvents(eventType: EventType): void {
    const events = this.pendingEvents.get(eventType);
    if (events && events.length > 0) {
      // Emit all pending events
      for (const event of events) {
        this.emitImmediate(event);
      }

      // Clear pending events and timer
      this.pendingEvents.set(eventType, []);
      this.throttleTimers.delete(eventType);
    }
  }

  /**
   * Invoke an event handler safely
   */
  private invokeHandler(handler: EventHandler, event: Event): void {
    try {
      const result = handler(event);
      if (result instanceof Promise) {
        result.catch(error => {
          console.error('Error in event handler:', error);
        });
      }
    } catch (error) {
      console.error('Error in event handler:', error);
    }
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${++this.eventCounter}`;
  }

  /**
   * Clear all subscriptions
   */
  clearAll(): void {
    this.subscriptions.clear();
    this.globalSubscriptions = [];

    // Clear all pending throttle timers
    for (const timer of this.throttleTimers.values()) {
      clearTimeout(timer);
    }
    this.throttleTimers.clear();
    this.pendingEvents.clear();
  }

  /**
   * Get subscription count for debugging
   */
  getSubscriptionCount(eventType?: EventType): number {
    if (eventType) {
      return this.subscriptions.get(eventType)?.length || 0;
    }

    let total = this.globalSubscriptions.length;
    for (const subs of this.subscriptions.values()) {
      total += subs.length;
    }
    return total;
  }

  /**
   * Enable or disable throttling
   */
  setThrottling(enabled: boolean, intervalMs?: number): void {
    this.throttleConfig.enabled = enabled;
    if (intervalMs !== undefined) {
      this.throttleConfig.intervalMs = intervalMs;
    }

    // If disabling, flush all pending events
    if (!enabled) {
      for (const eventType of this.pendingEvents.keys()) {
        this.flushPendingEvents(eventType);
      }
    }
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export function resetEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.clearAll();
  }
  eventBusInstance = null;
}
