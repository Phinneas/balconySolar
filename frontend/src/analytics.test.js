/**
 * Tests for Frontend Analytics Tracker
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import AnalyticsTracker from './analytics.js';

describe('AnalyticsTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new AnalyticsTracker({
      apiUrl: 'http://localhost:8787',
      maxEventsBeforeSend: 10,
      sendIntervalMs: 1000,
      enabled: true,
    });

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    tracker.stopPeriodicSend();
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    test('generates unique session ID', () => {
      const tracker1 = new AnalyticsTracker();
      const tracker2 = new AnalyticsTracker();

      expect(tracker1.sessionId).not.toBe(tracker2.sessionId);
      expect(tracker1.sessionId).toMatch(/^session-/);
    });

    test('tracks session start time', () => {
      const before = Date.now();
      const newTracker = new AnalyticsTracker();
      const after = Date.now();

      expect(newTracker.sessionStartTime).toBeGreaterThanOrEqual(before);
      expect(newTracker.sessionStartTime).toBeLessThanOrEqual(after);
    });

    test('returns session info', () => {
      const info = tracker.getSessionInfo();

      expect(info).toHaveProperty('sessionId');
      expect(info).toHaveProperty('startTime');
      expect(info).toHaveProperty('duration');
      expect(info).toHaveProperty('eventCount');
    });
  });

  describe('Event Tracking', () => {
    test('tracks state selection', () => {
      tracker.trackStateSelection('ca');

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('select_state');
      expect(tracker.events[0].data.stateCode).toBe('ca');
    });

    test('tracks state view', () => {
      tracker.trackStateView('ny', true);

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('view_state');
      expect(tracker.events[0].data.stateCode).toBe('ny');
      expect(tracker.events[0].data.isLegal).toBe(true);
    });

    test('tracks link copy', () => {
      tracker.trackLinkCopy('tx');

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('copy_link');
      expect(tracker.events[0].data.stateCode).toBe('tx');
    });

    test('tracks resource click', () => {
      tracker.trackResourceClick('ca', 'CPUC', 'https://cpuc.ca.gov');

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('click_resource');
      expect(tracker.events[0].data.resourceTitle).toBe('CPUC');
    });

    test('tracks newsletter click', () => {
      tracker.trackNewsletterClick('wa');

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('click_newsletter_cta');
    });

    test('tracks related content click', () => {
      tracker.trackRelatedContentClick('guide', 'or');

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('click_related_content');
      expect(tracker.events[0].data.linkType).toBe('guide');
    });

    test('tracks error', () => {
      tracker.trackError('NETWORK_ERROR', 'Failed to fetch');

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('error');
      expect(tracker.events[0].data.errorType).toBe('NETWORK_ERROR');
    });

    test('tracks page view', () => {
      tracker.trackPageView();

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('page_view');
    });

    test('tracks session end', () => {
      tracker.trackSessionEnd();

      expect(tracker.events.length).toBe(1);
      expect(tracker.events[0].type).toBe('session_end');
      expect(tracker.events[0].data).toHaveProperty('sessionDuration');
    });

    test('includes session ID in all events', () => {
      tracker.trackStateSelection('ca');
      tracker.trackStateView('ny', true);

      tracker.events.forEach(event => {
        expect(event.sessionId).toBe(tracker.sessionId);
      });
    });

    test('includes timestamp in all events', () => {
      tracker.trackStateSelection('ca');

      expect(tracker.events[0]).toHaveProperty('timestamp');
      expect(typeof tracker.events[0].timestamp).toBe('number');
    });
  });

  describe('Event Sending', () => {
    test('sends events when threshold is reached', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Track 10 events to reach threshold
      for (let i = 0; i < 10; i++) {
        tracker.trackStateSelection(`state-${i}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(tracker.events.length).toBe(0);
    });

    test('clears events after successful send', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      tracker.trackStateSelection('ca');
      tracker.trackStateSelection('ny');

      await tracker.sendEvents();

      expect(tracker.events.length).toBe(0);
    });

    test('retains events if send fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      tracker.trackStateSelection('ca');
      const eventsBefore = tracker.events.length;

      await tracker.sendEvents();

      expect(tracker.events.length).toBe(eventsBefore);
    });

    test('handles network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      tracker.trackStateSelection('ca');
      const eventsBefore = tracker.events.length;

      await tracker.sendEvents();

      expect(tracker.events.length).toBe(eventsBefore);
    });
  });

  describe('Periodic Sending', () => {
    test('sends events periodically', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      tracker.trackStateSelection('ca');

      // Wait for periodic send
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(global.fetch).toHaveBeenCalled();
    });

    test('stops periodic sending', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      tracker.stopPeriodicSend();
      tracker.trackStateSelection('ca');

      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should not have been called due to periodic send
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Flush', () => {
    test('flushes all events immediately', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      tracker.trackStateSelection('ca');
      tracker.trackStateSelection('ny');

      await tracker.flush();

      expect(tracker.events.length).toBe(0);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Disabled Tracker', () => {
    test('does not track events when disabled', () => {
      const disabledTracker = new AnalyticsTracker({ enabled: false });

      disabledTracker.trackStateSelection('ca');

      expect(disabledTracker.events.length).toBe(0);
    });
  });

  describe('Reset', () => {
    test('resets all data', () => {
      tracker.trackStateSelection('ca');
      tracker.trackStateView('ny', true);

      const oldSessionId = tracker.sessionId;
      tracker.reset();

      expect(tracker.events.length).toBe(0);
      expect(tracker.sessionId).not.toBe(oldSessionId);
    });
  });
});
