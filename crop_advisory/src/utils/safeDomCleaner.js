// Safe DOM Cleaner - Removes unwanted browser extension elements
// This utility helps clean up the page from browser extensions that might
// add unwanted navigation elements but does so safely without breaking the app

class SafeDOMCleaner {
  constructor() {
    this.isActive = false;
    this.observer = null;
    this.cleanupAttempts = 0;
    this.maxCleanupAttempts = 3; // Very conservative
  }

  // Start monitoring (safer approach)
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🧹 Safe DOM Cleaner: Starting...');
    
    // Only do cleanup after a longer delay to ensure app is loaded
    setTimeout(() => {
      if (this.isActive) {
        this.safeCleanup();
      }
    }, 8000); // Wait even longer for safety
  }

  // Stop monitoring
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    console.log('🧹 Safe DOM Cleaner: Stopped');
  }

  // Very conservative cleanup function
  safeCleanup() {
    if (!this.isActive || this.cleanupAttempts >= this.maxCleanupAttempts) return;
    
    let removedCount = 0;
    
    try {
      // Only remove iframe extensions - these are safest to remove
      const extensionIframes = document.querySelectorAll('iframe[src*="extension"]');
      extensionIframes.forEach(iframe => {
        // Extra safety check - must not be inside our app
        if (!iframe.closest('#root') && !iframe.closest('.crop-advisory')) {
          try {
            console.log('🧹 Safe DOM Cleaner: Removing extension iframe');
            iframe.style.display = 'none'; // Hide instead of remove for extra safety
            removedCount++;
          } catch (e) {
            console.warn('🧹 Safe DOM Cleaner: Could not hide iframe:', e);
          }
        }
      });
      
      if (removedCount > 0) {
        console.log(`🧹 Safe DOM Cleaner: Hidden ${removedCount} extension iframes`);
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