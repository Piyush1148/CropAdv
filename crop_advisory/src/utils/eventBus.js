/**
 * Simple event bus for triggering data refreshes across components
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Emit an event
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  // Remove all listeners for an event
  off(event) {
    delete this.events[event];
  }
}

// Create global instance
const eventBus = new EventBus();

// Export both the instance and the class
export { EventBus };
export default eventBus;

// Event constants
export const EVENTS = {
  PREDICTION_CREATED: 'prediction_created',
  DASHBOARD_REFRESH: 'dashboard_refresh',
  PROFILE_UPDATED: 'profile_updated',
};