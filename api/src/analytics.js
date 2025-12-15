/**
 * Analytics Service for Backend
 * Processes and stores user engagement metrics and feedback
 */

class AnalyticsService {
  constructor(options = {}) {
    this.events = [];
    this.feedback = [];
    this.sessions = new Map();
    this.maxEventsInMemory = options.maxEventsInMemory || 10000;
    this.maxFeedbackInMemory = options.maxFeedbackInMemory || 1000;
  }

  /**
   * Record analytics events
   * @param {string} sessionId - Session ID
   * @param {array} events - Array of events
   */
  recordEvents(sessionId, events) {
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }

    // Track session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        startTime: Date.now(),
        eventCount: 0,
        lastEventTime: Date.now(),
      });
    }

    const session = this.sessions.get(sessionId);
    session.eventCount += events.length;
    session.lastEventTime = Date.now();

    // Store events
    this.events.push(...events);

    // Maintain size limit
    if (this.events.length > this.maxEventsInMemory) {
      this.events = this.events.slice(-this.maxEventsInMemory);
    }
  }

  /**
   * Record user feedback
   * @param {object} feedback - Feedback object
   */
  recordFeedback(feedback) {
    const feedbackRecord = {
      ...feedback,
      recordedAt: Date.now(),
    };

    this.feedback.push(feedbackRecord);

    // Maintain size limit
    if (this.feedback.length > this.maxFeedbackInMemory) {
      this.feedback = this.feedback.slice(-this.maxFeedbackInMemory);
    }
  }

  /**
   * Get analytics summary
   * @param {number} windowMs - Time window in milliseconds (default: 24 hours)
   * @returns {object} Analytics summary
   */
  getAnalyticsSummary(windowMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const recentEvents = this.events.filter(e => now - e.timestamp < windowMs);
    const recentFeedback = this.feedback.filter(f => now - f.recordedAt < windowMs);

    // Count event types
    const eventTypeCounts = {};
    recentEvents.forEach(event => {
      eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1;
    });

    // Count feedback types
    const feedbackTypeCounts = {};
    recentFeedback.forEach(feedback => {
      feedbackTypeCounts[feedback.type] = (feedbackTypeCounts[feedback.type] || 0) + 1;
    });

    // Get most viewed states
    const stateViews = {};
    recentEvents
      .filter(e => e.type === 'view_state' && e.data.stateCode)
      .forEach(event => {
        stateViews[event.data.stateCode] = (stateViews[event.data.stateCode] || 0) + 1;
      });

    const topStates = Object.entries(stateViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    // Calculate average rating
    const ratings = recentFeedback
      .filter(f => f.type === 'rating' && f.rating)
      .map(f => f.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : null;

    // Get active sessions
    const activeSessions = Array.from(this.sessions.values()).filter(
      s => now - s.lastEventTime < windowMs
    );

    return {
      timeWindow: `${windowMs / (1000 * 60 * 60)} hours`,
      totalEvents: recentEvents.length,
      totalSessions: activeSessions.length,
      totalFeedback: recentFeedback.length,
      eventTypes: eventTypeCounts,
      feedbackTypes: feedbackTypeCounts,
      topStates,
      averageRating: averageRating ? averageRating.toFixed(2) : null,
      activeSessions: activeSessions.length,
    };
  }

  /**
   * Get engagement metrics
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} Engagement metrics
   */
  getEngagementMetrics(windowMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const recentEvents = this.events.filter(e => now - e.timestamp < windowMs);

    // Count unique sessions
    const uniqueSessions = new Set(recentEvents.map(e => e.sessionId)).size;

    // Count interactions
    const interactions = {
      stateSelections: recentEvents.filter(e => e.type === 'select_state').length,
      stateViews: recentEvents.filter(e => e.type === 'view_state').length,
      linkCopies: recentEvents.filter(e => e.type === 'copy_link').length,
      resourceClicks: recentEvents.filter(e => e.type === 'click_resource').length,
      newsletterClicks: recentEvents.filter(e => e.type === 'click_newsletter_cta').length,
      relatedContentClicks: recentEvents.filter(e => e.type === 'click_related_content').length,
      errors: recentEvents.filter(e => e.type === 'error').length,
    };

    // Calculate conversion rates
    const conversionRates = {
      viewToShare: interactions.stateViews > 0 ? ((interactions.linkCopies / interactions.stateViews) * 100).toFixed(2) : 0,
      viewToNewsletter: interactions.stateViews > 0 ? ((interactions.newsletterClicks / interactions.stateViews) * 100).toFixed(2) : 0,
      viewToRelatedContent: interactions.stateViews > 0 ? ((interactions.relatedContentClicks / interactions.stateViews) * 100).toFixed(2) : 0,
    };

    return {
      uniqueSessions,
      totalInteractions: recentEvents.length,
      interactions,
      conversionRates,
    };
  }

  /**
   * Get feedback summary
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} Feedback summary
   */
  getFeedbackSummary(windowMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const recentFeedback = this.feedback.filter(f => now - f.recordedAt < windowMs);

    const summary = {
      totalFeedback: recentFeedback.length,
      byType: {},
      ratings: {
        average: null,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      suggestions: [],
      bugReports: [],
    };

    recentFeedback.forEach(feedback => {
      // Count by type
      summary.byType[feedback.type] = (summary.byType[feedback.type] || 0) + 1;

      // Process ratings
      if (feedback.type === 'rating' && feedback.rating) {
        summary.ratings.distribution[feedback.rating]++;
      }

      // Collect suggestions
      if (feedback.type === 'suggestion' && feedback.message) {
        summary.suggestions.push({
          message: feedback.message,
          stateCode: feedback.stateCode,
          timestamp: feedback.timestamp,
        });
      }

      // Collect bug reports
      if (feedback.type === 'bug_report' && feedback.message) {
        summary.bugReports.push({
          message: feedback.message,
          stateCode: feedback.stateCode,
          email: feedback.email,
          timestamp: feedback.timestamp,
        });
      }
    });

    // Calculate average rating
    const ratings = recentFeedback
      .filter(f => f.type === 'rating' && f.rating)
      .map(f => f.rating);
    if (ratings.length > 0) {
      summary.ratings.average = (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(2);
    }

    return summary;
  }

  /**
   * Get recent events
   * @param {number} limit - Number of recent events to return
   * @returns {array} Recent events
   */
  getRecentEvents(limit = 100) {
    return this.events.slice(-limit);
  }

  /**
   * Get recent feedback
   * @param {number} limit - Number of recent feedback to return
   * @returns {array} Recent feedback
   */
  getRecentFeedback(limit = 50) {
    return this.feedback.slice(-limit);
  }

  /**
   * Get session info
   * @param {string} sessionId - Session ID
   * @returns {object|null} Session info or null
   */
  getSessionInfo(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   * @param {number} windowMs - Time window for active sessions
   * @returns {array} Active sessions
   */
  getActiveSessions(windowMs = 60 * 60 * 1000) {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      s => now - s.lastEventTime < windowMs
    );
  }

  /**
   * Reset analytics data
   */
  reset() {
    this.events = [];
    this.feedback = [];
    this.sessions.clear();
  }
}

export default AnalyticsService;
