// Safe DOM Cleaner - Removes unwanted browser extension elements
// This utility helps clean up the page from browser extensions that might
// add unwanted navigation elements but does so safely without breaking the app

class SafeDOMCleaner {
  constructor() {
    this.isActive = false;
    this.observer = null;
    this.cleanupAttempts = 0;
    this.maxCleanupAttempts = 5; // Reduced for safety
    
    // Only target very specific known problematic patterns
    this.targetSelectors = [
      // Only iframe extensions (safest to remove)
      'iframe[src*="extension"]',
      
      // Only clearly marked extension divs
      'div[id*="extension"]:empty',
      'div[class*="extension"]:empty',
      'div[data-extension]:empty',
    ];
  }

  // Start monitoring (safer approach)
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🧹 Safe DOM Cleaner: Starting...');
    
    // Only do cleanup after a longer delay to ensure app is loaded
    setTimeout(() => {
      if (this.isActive) {
        this.cleanup();
      }
    }, 5000);
  }

  // Stop monitoring
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    console.log('🧹 Safe DOM Cleaner: Stopped');
  }

  // Very conservative cleanup function
  cleanup() {
    if (!this.isActive || this.cleanupAttempts >= this.maxCleanupAttempts) return;
    
    let removedCount = 0;
    
    try {
      // Only remove iframe extensions - these are safest to remove
      const extensionIframes = document.querySelectorAll('iframe[src*="extension"]');
      extensionIframes.forEach(iframe => {
        // Extra safety check
        if (!iframe.closest('#root')) {
          try {
            console.log('🧹 Safe DOM Cleaner: Removing extension iframe');
            iframe.remove();
            removedCount++;
          } catch (e) {
            console.warn('🧹 Safe DOM Cleaner: Could not remove iframe:', e);
          }
        }
      });
      
      if (removedCount > 0) {
        console.log(`🧹 Safe DOM Cleaner: Removed ${removedCount} extension iframes`);
      }
      
      this.cleanupAttempts++;
      
    } catch (error) {
      console.warn('🧹 Safe DOM Cleaner: Error during cleanup:', error);
    }
  }

  // Get status information
  getStatus() {
    return {
      isActive: this.isActive,
      cleanupAttempts: this.cleanupAttempts,
      maxCleanupAttempts: this.maxCleanupAttempts,
    };
  }
}

// Create singleton instance
const safeDomCleaner = new SafeDOMCleaner();

export default safeDomCleaner;