/**
 * ThrottledEventBus - Performance-optimized event bus
 *
 * Features:
 * - Batches non-critical events at ~60fps (16ms)
 * - Immediately emits critical events
 * - Merges consecutive agent_output_chunk events
 * - Extends base EventBus
 */

import { EventBus } from './EventBus';
import type { AppEvent, EventType } from './EventTypes';
import { CRITICAL_EVENT_TYPES, THROTTLEABLE_EVENT_TYPES } from './EventTypes';

/**
 * Batched event queue item
 */
interface QueuedEvent {
  event: AppEvent;
  timestamp: number;
}

/**
 * ThrottledEventBus class - Singleton
 */
export class ThrottledEventBus extends EventBus {
  private static throttledInstance: ThrottledEventBus | null = null;
  private eventQueue: QueuedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_INTERVAL_MS = 16; // ~60fps
  private outputChunkBuffer: Map<string, string[]> = new Map(); // agentId -> chunks

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ThrottledEventBus {
    if (!ThrottledEventBus.throttledInstance) {
      ThrottledEventBus.throttledInstance = new ThrottledEventBus();
    }
    return ThrottledEventBus.throttledInstance;
  }

  /**
   * Emit an event with throttling logic
   *
   * Critical events are emitted immediately.
   * Non-critical events are batched and emitted at ~60fps.
   */
  public emit<T extends EventType>(
    event: Omit<Extract<AppEvent, { type: T }>, 'id' | 'timestamp'>
  ): void {
    const eventType = event.type;

    // Emit critical events immediately
    if (CRITICAL_EVENT_TYPES.includes(eventType)) {
      super.emit(event);
      return;
    }

    // Special handling for agent_output_chunk - buffer and merge
    if (eventType === 'agent_output_chunk') {
      this.bufferOutputChunk(event as any);
      this.scheduleFlush();
      return;
    }

    // Queue other throttleable events
    if (THROTTLEABLE_EVENT_TYPES.includes(eventType)) {
      this.queueEvent(event as any);
      this.scheduleFlush();
      return;
    }

    // Emit all other events immediately
    super.emit(event);
  }

  /**
   * Buffer output chunks for merging
   */
  private bufferOutputChunk(event: any): void {
    const agentId = event.data.agentId;

    if (!this.outputChunkBuffer.has(agentId)) {
      this.outputChunkBuffer.set(agentId, []);
    }

    this.outputChunkBuffer.get(agentId)!.push(event.data.chunk);
  }

  /**
   * Queue a non-critical event for batched emission
   */
  private queueEvent(event: AppEvent): void {
    this.eventQueue.push({
      event,
      timestamp: Date.now(),
    });
  }

  /**
   * Schedule a flush of queued events
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return; // Already scheduled
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.BATCH_INTERVAL_MS);
  }

  /**
   * Flush all queued events
   */
  private flush(): void {
    this.flushTimer = null;

    // Flush output chunks
    this.flushOutputChunks();

    // Flush other queued events
    this.flushQueuedEvents();
  }

  /**
   * Flush buffered output chunks as merged events
   */
  private flushOutputChunks(): void {
    if (this.outputChunkBuffer.size === 0) {
      return;
    }

    for (const [agentId, chunks] of this.outputChunkBuffer.entries()) {
      if (chunks.length === 0) continue;

      // Merge all chunks into a single event
      const mergedChunk = chunks.join('');

      super.emit({
        type: 'agent_output_chunk',
        agentId,
        data: {
          agentId,
          chunk: mergedChunk,
          chunkIndex: 0, // Reset index for merged chunk
        },
      } as any);
    }

    // Clear buffer
    this.outputChunkBuffer.clear();
  }

  /**
   * Flush other queued events
   */
  private flushQueuedEvents(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    // Emit all queued events
    for (const { event } of this.eventQueue) {
      super.emit(event as any);
    }

    // Clear queue
    this.eventQueue = [];
  }

  /**
   * Force immediate flush of all queued events
   */
  public forceFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.flush();
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Get current buffer size
   */
  public getBufferSize(): number {
    let total = 0;
    for (const chunks of this.outputChunkBuffer.values()) {
      total += chunks.length;
    }
    return total;
  }

  /**
   * Clear all queues and buffers
   */
  public clearQueues(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.eventQueue = [];
    this.outputChunkBuffer.clear();
  }

  /**
   * For testing: reset singleton instance
   */
  public static resetInstance(): void {
    if (ThrottledEventBus.throttledInstance) {
      ThrottledEventBus.throttledInstance.clearQueues();
      ThrottledEventBus.throttledInstance.removeAllListeners();
      ThrottledEventBus.throttledInstance = null;
    }
  }
}

/**
 * Export singleton instance getter
 */
export const getThrottledEventBus = () => ThrottledEventBus.getInstance();
