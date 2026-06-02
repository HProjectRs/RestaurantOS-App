import { logger } from '../logging/logger';

export class RetryQueue {
  queue: any[]
  listeners: Record<string, any[]>
  constructor() {
    this.queue = [];
    this.listeners = {};
  }

  on(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  emit(event, data?) {
    (this.listeners[event] || []).forEach((handler) => handler(data));
  }

  add(operation, params, maxRetries = 3) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      operation,
      params,
      maxRetries,
      attempts: 0,
      status: 'pending',
    };
    this.queue.push(entry);
    this.emit('added', entry);
    logger.debug('Operation added to retry queue', { id: entry.id, operation: operation.name });
    return entry.id;
  }

  async process() {
    const pending = this.queue.filter((e) => e.status === 'pending');
    if (pending.length === 0) return;

    this.emit('processing', { count: pending.length });

    const results = await Promise.allSettled(
      pending.map(async (entry) => {
        while (entry.attempts < entry.maxRetries) {
          try {
            entry.attempts++;
            entry.status = 'running';
            this.emit('retry', entry);
            const result = await entry.operation(...entry.params);
            entry.status = 'resolved';
            this.emit('resolved', entry);
            return result;
          } catch (err) {
            logger.warn(`Retry ${entry.attempts}/${entry.maxRetries} failed`, {
              id: entry.id,
              error: err.message,
            });
            if (entry.attempts >= entry.maxRetries) {
              entry.status = 'failed';
              this.emit('failed', { entry, error: err });
            }
          }
        }
      })
    );

    this.emit('completed', { results });
  }

  getPending() {
    return this.queue.filter((e) => e.status === 'pending').length;
  }

  clear() {
    this.queue = [];
    this.emit('cleared');
  }
}
