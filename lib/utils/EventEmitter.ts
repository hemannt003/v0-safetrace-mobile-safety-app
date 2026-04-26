type Listener = (...args: any[]) => void;

export class EventEmitter {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, callback: Listener): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Listener): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (err) {
        console.error(`[EventEmitter] Error in listener for event ${event}:`, err);
      }
    });
  }
}
