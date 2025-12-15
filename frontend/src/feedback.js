/**
 * User Feedback Collection System
 * Collects user feedback, ratings, and suggestions
 */

class FeedbackCollector {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'http://localhost:8787';
    this.enabled = options.enabled !== false;
  }

  /**
   * Submit feedback
   * @param {object} feedbackData - Feedback data
   * @returns {Promise<object>} Response from server
   */
  async submitFeedback(feedbackData) {
    if (!this.enabled) {
      return { success: false, message: 'Feedback collection is disabled' };
    }

    try {
      const payload = {
        type: feedbackData.type || 'general',
        rating: feedbackData.rating || null,
        message: feedbackData.message || '',
        stateCode: feedbackData.stateCode || null,
        email: feedbackData.email || null,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const response = await fetch(`${this.apiUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to submit feedback`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit a rating
   * @param {number} rating - Rating from 1-5
   * @param {string} stateCode - State code being rated
   * @returns {Promise<object>} Response from server
   */
  async submitRating(rating, stateCode) {
    if (rating < 1 || rating > 5) {
      return { success: false, message: 'Rating must be between 1 and 5' };
    }

    return this.submitFeedback({
      type: 'rating',
      rating,
      stateCode,
    });
  }

  /**
   * Submit a suggestion
   * @param {string} suggestion - Suggestion text
   * @param {string} stateCode - State code related to suggestion
   * @returns {Promise<object>} Response from server
   */
  async submitSuggestion(suggestion, stateCode) {
    return this.submitFeedback({
      type: 'suggestion',
      message: suggestion,
      stateCode,
    });
  }

  /**
   * Submit a bug report
   * @param {string} bugDescription - Description of the bug
   * @param {string} stateCode - State code where bug occurred
   * @param {string} email - User's email for follow-up
   * @returns {Promise<object>} Response from server
   */
  async submitBugReport(bugDescription, stateCode, email) {
    return this.submitFeedback({
      type: 'bug_report',
      message: bugDescription,
      stateCode,
      email,
    });
  }

  /**
   * Submit general feedback
   * @param {string} message - Feedback message
   * @param {string} stateCode - State code related to feedback
   * @param {string} email - User's email for follow-up
   * @returns {Promise<object>} Response from server
   */
  async submitGeneralFeedback(message, stateCode, email) {
    return this.submitFeedback({
      type: 'general',
      message,
      stateCode,
      email,
    });
  }
}

export default FeedbackCollector;
