/**
 * User Engagement and Analytics Tracking
 * Tracks user interactions, feature usage, and engagement metrics
 */

class AnalyticsTracker {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'http://localhost:8787';
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.events = [];
    this.maxEventsBeforeSend = options.maxEventsBeforeSend || 10;
    this.sendIntervalMs = options.sendIntervalMs || 30000; // 30 seconds
    this.enabled = options.enabled !== false;

    // Start periodic send
    if (this.enabled) {
      this.startPeriodicSend();
    }
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track a user event
   * @param {string} eventType - Type of event (view_state, select_state, copy_link, etc.)
   * @param {object} data - Event data
   */
  trackEvent(eventType, data = {}) {
    if (!this.enabled) return;

    const event = {
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.events.push(event);

    // Send if we've reached the max events threshold
    if (this.events.length >= this.maxEventsBeforeSend) {
      this.sendEvents();
    }
  }

  /**
   * Track state selection
   * @param {string} stateCode - State code selected
   */
  trackStateSelection(stateCode) {
    this.trackEvent('select_state', {
      stateCode,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track state view
   * @param {string} stateCode - State code viewed
   * @param {boolean} isLegal - Whether balcony solar is legal
   */
  trackStateView(stateCode, isLegal) {
    this.trackEvent('view_state', {
      stateCode,
      isLegal,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track link copy
   * @param {string} stateCode - State code for which link was copied
   */
  trackLinkCopy(stateCode) {
    this.trackEvent('copy_link', {
      stateCode,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track resource link click
   * @param {string} stateCode - State code
   * @param {string} resourceTitle - Title of resource clicked
   * @param {string} resourceUrl - URL of resource
   */
  trackResourceClick(stateCode, resourceTitle, resourceUrl) {
    this.trackEvent('click_resource', {
      stateCode,
      resourceTitle,
      resourceUrl,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track newsletter CTA click
   * @param {string} stateCode - State code when CTA was clicked
   */
  trackNewsletterClick(stateCode) {
    this.trackEvent('click_newsletter_cta', {
      stateCode,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track related content link click
   * @param {string} linkType - Type of related content (guide, comparison, companies)
   * @param {string} stateCode - State code when link was clicked
   */
  trackRelatedContentClick(linkType, stateCode) {
    this.trackEvent('click_related_content', {
      linkType,
      stateCode,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track error occurrence
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   */
  trackError(errorType, errorMessage) {
    this.trackEvent('error', {
      errorType,
      errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track page view
   */
  trackPageView() {
    this.trackEvent('page_view', {
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
    });
  }

  /**
   * Track session duration
   */
  trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.trackEvent('session_end', {
      sessionDuration,
      totalEvents: this.events.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send events to analytics endpoint
   */
  async sendEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const response = await fetch(`${this.apiUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: eventsToSend,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send analytics events:', response.status);
        // Re-add events if send failed
        this.events = [...eventsToSend, ...this.events];
      }
    } catch (error) {
      console.warn('Error sending analytics events:', error);
      // Re-add events if send failed
      this.events = [...eventsToSend, ...this.events];
    }
  }

  /**
   * Start periodic event sending
   */
  startPeriodicSend() {
    this.sendInterval = setInterval(() => {
      this.sendEvents();
    }, this.sendIntervalMs);
  }

  /**
   * Stop periodic event sending
   */
  stopPeriodicSend() {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
    }
  }

  /**
   * Flush all events immediately
   */
  async flush() {
    this.stopPeriodicSend();
    await this.sendEvents();
  }

  /**
   * Get current session info
   * @returns {object} Session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      duration: Date.now() - this.sessionStartTime,
      eventCount: this.events.length,
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }
}

export default AnalyticsTracker;
