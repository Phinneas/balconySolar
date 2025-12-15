/**
 * Tests for Backend Analytics Service
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import AnalyticsService from '../src/analytics.js';

describe('AnalyticsService', () => {
  let analytics;

  beforeEach(() => {
    analytics = new AnalyticsService({
      maxEventsInMemory: 1000,
      maxFeedbackInMemory: 500,
    });
  });

  describe('Event Recording', () => {
    test('records events for a session', () => {
      const events = [
        {
          type: 'view_state',
          timestamp: Date.now(),
          sessionId: 'session-1',
          data: { stateCode: 'ca', isLegal: true },
        },
        {
          type: 'copy_link',
          timestamp: Date.now(),
          sessionId: 'session-1',
          data: { stateCode: 'ca' },
        },
      ];

      analytics.recordEvents('session-1', events);

      expect(analytics.events.length).toBe(2);
    });

    test('tracks session information', () => {
      const events = [
        {
          type: 'view_state',
          timestamp: Date.now(),
          sessionId: 'session-1',
          data: { stateCode: 'ca' },
        },
      ];

      analytics.recordEvents('session-1', events);

      const session = analytics.getSessionInfo('session-1');
      expect(session).not.toBeNull();
      expect(session.sessionId).toBe('session-1');
      expect(session.eventCount).toBe(1);
    });

    test('throws error for non-array events', () => {
      expect(() => {
        analytics.recordEvents('session-1', { type: 'view_state' });
      }).toThrow('Events must be an array');
    });

    test('maintains event history limit', () => {
      const events = [];
      for (let i = 0; i < 1100; i++) {
        events.push({
          type: 'view_state',
          timestamp: Date.now(),
          sessionId: 'session-1',
          data: { stateCode: 'ca' },
        });
      }

      analytics.recordEvents('session-1', events);

      expect(analytics.events.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Feedback Recording', () => {
    test('records feedback', () => {
      const feedback = {
        type: 'rating',
        rating: 5,
        stateCode: 'ca',
        timestamp: new Date().toISOString(),
      };

      analytics.recordFeedback(feedback);

      expect(analytics.feedback.length).toBe(1);
      expect(analytics.feedback[0].type).toBe('rating');
    });

    test('maintains feedback history limit', () => {
      for (let i = 0; i < 600; i++) {
        analytics.recordFeedback({
          type: 'rating',
          rating: 5,
          timestamp: new Date().toISOString(),
        });
      }

      expect(analytics.feedback.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Analytics Summary', () => {
    test('returns analytics summary', () => {
      const events = [
        {
          type: 'view_state',
          timestamp: Date.now(),
          sessionId: 'session-1',
          data: { stateCode: 'ca', isLegal: true },
        },
        {
          type: 'select_state',
          timestamp: Date.now(),
          sessionId: 'session-1',
          data: { stateCode: 'ca' },
        },
      ];

      analytics.recordEvents('session-1', events);

      const summary = analytics.getAnalyticsSummary();

      expect(summary).toHaveProperty('totalEvents');
      expect(summary).toHaveProperty('totalSessions');
      expect(summary).toHaveProperty('eventTypes');
      expect(summary.totalEvents).toBe(2);
    });

    test('counts event types correctly', () => {
      const events = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ny' } },
        { type: 'copy_link', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
      ];

      analytics.recordEvents('session-1', events);

      const summary = analytics.getAnalyticsSummary();

      expect(summary.eventTypes.view_state).toBe(2);
      expect(summary.eventTypes.copy_link).toBe(1);
    });

    test('identifies top viewed states', () => {
      const events = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ny' } },
      ];

      analytics.recordEvents('session-1', events);

      const summary = analytics.getAnalyticsSummary();

      expect(summary.topStates.length).toBeGreaterThan(0);
      expect(summary.topStates[0].code).toBe('ca');
      expect(summary.topStates[0].count).toBe(2);
    });

    test('calculates average rating', () => {
      analytics.recordFeedback({
        type: 'rating',
        rating: 5,
        timestamp: new Date().toISOString(),
      });
      analytics.recordFeedback({
        type: 'rating',
        rating: 3,
        timestamp: new Date().toISOString(),
      });

      const summary = analytics.getAnalyticsSummary();

      expect(summary.averageRating).toBe('4.00');
    });

    test('respects time window', () => {
      const now = Date.now();
      const oldEvent = {
        type: 'view_state',
        timestamp: now - 48 * 60 * 60 * 1000, // 48 hours ago
        sessionId: 'session-1',
        data: { stateCode: 'ca' },
      };
      const recentEvent = {
        type: 'view_state',
        timestamp: now,
        sessionId: 'session-1',
        data: { stateCode: 'ny' },
      };

      analytics.events.push(oldEvent);
      analytics.events.push(recentEvent);

      const summary = analytics.getAnalyticsSummary(24 * 60 * 60 * 1000); // 24 hour window

      expect(summary.totalEvents).toBe(1);
    });
  });

  describe('Engagement Metrics', () => {
    test('returns engagement metrics', () => {
      const events = [
        { type: 'select_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'copy_link', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
      ];

      analytics.recordEvents('session-1', events);

      const metrics = analytics.getEngagementMetrics();

      expect(metrics).toHaveProperty('uniqueSessions');
      expect(metrics).toHaveProperty('totalInteractions');
      expect(metrics).toHaveProperty('interactions');
      expect(metrics).toHaveProperty('conversionRates');
    });

    test('counts interactions correctly', () => {
      const events = [
        { type: 'select_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'copy_link', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'click_resource', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
      ];

      analytics.recordEvents('session-1', events);

      const metrics = analytics.getEngagementMetrics();

      expect(metrics.interactions.stateSelections).toBe(1);
      expect(metrics.interactions.stateViews).toBe(1);
      expect(metrics.interactions.linkCopies).toBe(1);
      expect(metrics.interactions.resourceClicks).toBe(1);
    });

    test('calculates conversion rates', () => {
      const events = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ny' } },
        { type: 'copy_link', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
      ];

      analytics.recordEvents('session-1', events);

      const metrics = analytics.getEngagementMetrics();

      expect(parseFloat(metrics.conversionRates.viewToShare)).toBe(50);
    });

    test('counts unique sessions', () => {
      const events1 = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
      ];
      const events2 = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-2', data: { stateCode: 'ny' } },
      ];

      analytics.recordEvents('session-1', events1);
      analytics.recordEvents('session-2', events2);

      const metrics = analytics.getEngagementMetrics();

      expect(metrics.uniqueSessions).toBe(2);
    });
  });

  describe('Feedback Summary', () => {
    test('returns feedback summary', () => {
      analytics.recordFeedback({
        type: 'rating',
        rating: 5,
        timestamp: new Date().toISOString(),
      });

      const summary = analytics.getFeedbackSummary();

      expect(summary).toHaveProperty('totalFeedback');
      expect(summary).toHaveProperty('byType');
      expect(summary).toHaveProperty('ratings');
      expect(summary).toHaveProperty('suggestions');
      expect(summary).toHaveProperty('bugReports');
    });

    test('counts feedback by type', () => {
      analytics.recordFeedback({
        type: 'rating',
        rating: 5,
        timestamp: new Date().toISOString(),
      });
      analytics.recordFeedback({
        type: 'suggestion',
        message: 'Add more states',
        timestamp: new Date().toISOString(),
      });

      const summary = analytics.getFeedbackSummary();

      expect(summary.byType.rating).toBe(1);
      expect(summary.byType.suggestion).toBe(1);
    });

    test('collects suggestions', () => {
      analytics.recordFeedback({
        type: 'suggestion',
        message: 'Add more states',
        stateCode: 'ca',
        timestamp: new Date().toISOString(),
      });

      const summary = analytics.getFeedbackSummary();

      expect(summary.suggestions.length).toBe(1);
      expect(summary.suggestions[0].message).toBe('Add more states');
    });

    test('collects bug reports', () => {
      analytics.recordFeedback({
        type: 'bug_report',
        message: 'Link not working',
        stateCode: 'ny',
        email: 'user@example.com',
        timestamp: new Date().toISOString(),
      });

      const summary = analytics.getFeedbackSummary();

      expect(summary.bugReports.length).toBe(1);
      expect(summary.bugReports[0].message).toBe('Link not working');
    });

    test('calculates rating distribution', () => {
      for (let i = 1; i <= 5; i++) {
        analytics.recordFeedback({
          type: 'rating',
          rating: i,
          timestamp: new Date().toISOString(),
        });
      }

      const summary = analytics.getFeedbackSummary();

      expect(summary.ratings.distribution[1]).toBe(1);
      expect(summary.ratings.distribution[5]).toBe(1);
      expect(summary.ratings.average).toBe('3.00');
    });
  });

  describe('Data Access', () => {
    test('returns recent events', () => {
      const events = [];
      for (let i = 0; i < 20; i++) {
        events.push({
          type: 'view_state',
          timestamp: Date.now(),
          sessionId: 'session-1',
          data: { stateCode: 'ca' },
        });
      }

      analytics.recordEvents('session-1', events);

      const recent = analytics.getRecentEvents(5);
      expect(recent.length).toBe(5);
    });

    test('returns recent feedback', () => {
      for (let i = 0; i < 20; i++) {
        analytics.recordFeedback({
          type: 'rating',
          rating: 5,
          timestamp: new Date().toISOString(),
        });
      }

      const recent = analytics.getRecentFeedback(5);
      expect(recent.length).toBe(5);
    });

    test('returns session info', () => {
      const events = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
      ];

      analytics.recordEvents('session-1', events);

      const session = analytics.getSessionInfo('session-1');
      expect(session).not.toBeNull();
      expect(session.sessionId).toBe('session-1');
    });

    test('returns null for non-existent session', () => {
      const session = analytics.getSessionInfo('non-existent');
      expect(session).toBeNull();
    });

    test('returns active sessions', () => {
      const events = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-2', data: { stateCode: 'ny' } },
      ];

      analytics.recordEvents('session-1', events);
      analytics.recordEvents('session-2', events);

      const activeSessions = analytics.getActiveSessions();
      expect(activeSessions.length).toBe(2);
    });
  });

  describe('Reset', () => {
    test('resets all data', () => {
      const events = [
        { type: 'view_state', timestamp: Date.now(), sessionId: 'session-1', data: { stateCode: 'ca' } },
      ];

      analytics.recordEvents('session-1', events);
      analytics.recordFeedback({
        type: 'rating',
        rating: 5,
        timestamp: new Date().toISOString(),
      });

      analytics.reset();

      expect(analytics.events.length).toBe(0);
      expect(analytics.feedback.length).toBe(0);
      expect(analytics.sessions.size).toBe(0);
    });
  });
});
