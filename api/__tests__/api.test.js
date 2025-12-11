/**
 * Tests for Balcony Solar Checker REST API
 */

import { jest } from '@jest/globals';
import { default as handler } from '../src/index.js';

// Mock fetch for testing
global.fetch = jest.fn();

describe('REST API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/states', () => {
    test('returns all states with basic info', async () => {
      const mockResponse = {
        records: [
          {
            fields: {
              code: 'ca',
              name: 'California',
              abbreviation: 'CA',
              isLegal: true,
              maxWattage: 800,
              keyLaw: 'SB 709',
              lastUpdated: '2024-12-09',
            },
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request = new Request('http://localhost/api/states');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.states).toBeDefined();
      expect(data.states.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/states/:code', () => {
    test('returns single state with details and resources', async () => {
      const stateResponse = {
        records: [
          {
            fields: {
              code: 'ca',
              name: 'California',
              abbreviation: 'CA',
              isLegal: true,
              maxWattage: 800,
              keyLaw: 'SB 709',
              lastUpdated: '2024-12-09',
            },
          },
        ],
      };

      const detailsResponse = {
        records: [
          {
            fields: {
              category: 'interconnection',
              required: false,
              description: 'No formal agreement needed',
            },
          },
        ],
      };

      const resourcesResponse = {
        records: [
          {
            fields: {
              title: 'CPUC',
              url: 'https://www.cpuc.ca.gov/',
              resourceType: 'official',
            },
          },
        ],
      };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => stateResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => detailsResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => resourcesResponse });

      const request = new Request('http://localhost/api/states/ca');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.state).toBeDefined();
      expect(data.state.code).toBe('ca');
      expect(data.state.details).toBeDefined();
      expect(data.state.resources).toBeDefined();
    });

    test('returns 404 for non-existent state', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const request = new Request('http://localhost/api/states/xx');
      const response = await handler.fetch(request);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/health', () => {
    test('returns health status', async () => {
      const request = new Request('http://localhost/api/health');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('POST /api/cache-invalidate', () => {
    test('invalidates cache with valid token', async () => {
      const request = new Request('http://localhost/api/cache-invalidate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer cache_invalidate_token_secret_key_12345',
        },
        body: JSON.stringify({ pattern: 'state-' }),
      });

      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('cache invalidated');
      expect(data.timestamp).toBeDefined();
    });

    test('rejects cache invalidation without token', async () => {
      const request = new Request('http://localhost/api/cache-invalidate', {
        method: 'POST',
        body: JSON.stringify({ pattern: 'state-' }),
      });

      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('rejects cache invalidation with invalid token', async () => {
      const request = new Request('http://localhost/api/cache-invalidate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid_token',
        },
        body: JSON.stringify({ pattern: 'state-' }),
      });

      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('CORS', () => {
    test('handles OPTIONS requests', async () => {
      const request = new Request('http://localhost/api/states', {
        method: 'OPTIONS',
      });

      const response = await handler.fetch(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Error handling', () => {
    test('returns 404 for unknown routes', async () => {
      const request = new Request('http://localhost/api/unknown');
      const response = await handler.fetch(request);

      expect(response.status).toBe(404);
    });
  });
});
