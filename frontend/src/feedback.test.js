/**
 * Tests for Feedback Collector
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import FeedbackCollector from './feedback.js';

describe('FeedbackCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new FeedbackCollector({
      apiUrl: 'http://localhost:8787',
      enabled: true,
    });

    global.fetch = vi.fn();
  });

  describe('Feedback Submission', () => {
    test('submits general feedback', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, feedbackId: '123' }),
      });

      const result = await collector.submitFeedback({
        type: 'general',
        message: 'Great tool!',
        stateCode: 'ca',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/feedback',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('includes required fields in submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await collector.submitFeedback({
        type: 'general',
        message: 'Test feedback',
        stateCode: 'ny',
        email: 'user@example.com',
      });

      const callArgs = global.fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toHaveProperty('type');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('stateCode');
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('userAgent');
      expect(body).toHaveProperty('url');
    });

    test('handles submission errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await collector.submitFeedback({
        type: 'general',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await collector.submitFeedback({
        type: 'general',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Rating Submission', () => {
    test('submits rating', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await collector.submitRating(5, 'ca');

      expect(result.success).toBe(true);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.type).toBe('rating');
      expect(body.rating).toBe(5);
    });

    test('validates rating range', async () => {
      const result1 = await collector.submitRating(0, 'ca');
      expect(result1.success).toBe(false);

      const result2 = await collector.submitRating(6, 'ca');
      expect(result2.success).toBe(false);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result3 = await collector.submitRating(3, 'ca');
      expect(result3.success).toBe(true);
    });
  });

  describe('Suggestion Submission', () => {
    test('submits suggestion', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await collector.submitSuggestion('Add more states', 'ca');

      expect(result.success).toBe(true);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.type).toBe('suggestion');
      expect(body.message).toBe('Add more states');
    });
  });

  describe('Bug Report Submission', () => {
    test('submits bug report', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await collector.submitBugReport(
        'Link not working',
        'ny',
        'user@example.com'
      );

      expect(result.success).toBe(true);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.type).toBe('bug_report');
      expect(body.message).toBe('Link not working');
      expect(body.email).toBe('user@example.com');
    });
  });

  describe('General Feedback Submission', () => {
    test('submits general feedback with email', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await collector.submitGeneralFeedback(
        'Love this tool!',
        'tx',
        'user@example.com'
      );

      expect(result.success).toBe(true);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.type).toBe('general');
      expect(body.message).toBe('Love this tool!');
    });
  });

  describe('Disabled Collector', () => {
    test('does not submit when disabled', async () => {
      const disabledCollector = new FeedbackCollector({ enabled: false });

      const result = await disabledCollector.submitFeedback({
        type: 'general',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
