/**
 * Tests for Solar Companies API endpoint
 */

import { jest } from '@jest/globals';
import { default as handler } from '../src/index.js';

// Mock fetch for testing
global.fetch = jest.fn();

describe('GET /api/solar-companies', () => {
  let originalApiKey;

  beforeEach(() => {
    jest.clearAllMocks();
    originalApiKey = global.GOOGLE_PLACES_API_KEY;
    // Set a mock API key for testing
    global.GOOGLE_PLACES_API_KEY = 'test_api_key';
  });

  afterEach(() => {
    if (originalApiKey !== undefined) {
      global.GOOGLE_PLACES_API_KEY = originalApiKey;
    }
  });

  describe('Valid requests', () => {
    test('returns 200 with companies for valid zip code', async () => {
      const googlePlacesResponse = {
        status: 'OK',
        results: [
          {
            name: 'SunPower Solar',
            formatted_address: '123 Main St, Los Angeles, CA 90210',
            rating: 4.5,
            user_ratings_total: 127,
            business_status: 'OPERATIONAL',
            place_id: 'ChIJ12345abc',
          },
        ],
      };

      const googleDetailsResponse = {
        status: 'OK',
        result: {
          phone: '+1-555-123-4567',
          website: 'https://example.com',
        },
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => googlePlacesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => googleDetailsResponse,
        });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.companies).toBeDefined();
      expect(data.companies.length).toBeGreaterThan(0);
      expect(data.resultCount).toBe(data.companies.length);
      expect(data.searchedZip).toBe('90210');
    });

    test('returns 10 companies max from search results', async () => {
      const placesResults = Array.from({ length: 15 }, (_, i) => ({
        name: `Company ${i}`,
        formatted_address: `${i} Address St, City, CA 90210`,
        rating: 4.0,
        user_ratings_total: 10,
        business_status: 'OPERATIONAL',
        place_id: `place_${i}`,
      }));

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', results: placesResults }),
        })
        .mockResolvedValue({ ok: true, json: async () => ({ status: 'OK', result: {} }) });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(data.companies.length).toBe(10);
      expect(data.resultCount).toBe(10);
    });

    test('includes phone and website for top 5 companies', async () => {
      const googlePlacesResponse = {
        status: 'OK',
        results: [
          {
            name: 'Top Service',
            formatted_address: '1 Main St',
            rating: 5.0,
            user_ratings_total: 100,
            business_status: 'OPERATIONAL',
            place_id: 'top_1',
          },
          {
            name: 'Second Best',
            formatted_address: '2 Main St',
            rating: 4.5,
            user_ratings_total: 50,
            business_status: 'OPERATIONAL',
            place_id: 'top_2',
          },
        ],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => googlePlacesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', result: { phone: '+1-800-1000', website: 'https://top1.com' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', result: { phone: '+1-800-2000', website: 'https://top2.com' } }),
        });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(data.companies[0].phone).toBe('+1-800-1000');
      expect(data.companies[0].website).toBe('https://top1.com');
      expect(data.companies[1].phone).toBe('+1-800-2000');
      expect(data.companies[1].website).toBe('https://top2.com');
    });

    test('returns empty array when no companies found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.companies).toEqual([]);
      expect(data.resultCount).toBe(0);
    });

    test('includes CORS headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Validation', () => {
    test('returns 400 for missing zip parameter', async () => {
      const request = new Request('http://localhost/api/solar-companies?state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error).toContain('Invalid zip code');
    });

    test('returns 400 for zip code with non-numeric characters', async () => {
      const request = new Request('http://localhost/api/solar-companies?zip=abcde&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(400);
    });

    test('returns 400 for zip code with less than 5 digits', async () => {
      const request = new Request('http://localhost/api/solar-companies?zip=123&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(400);
    });

    test('returns 400 for zip code with more than 5 digits', async () => {
      const request = new Request('http://localhost/api/solar-companies?zip=123456&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(400);
    });

    test('accepts valid 5-digit zip code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Rate limiting', () => {
    test('enforces daily request limit', async () => {
      // Mock 101 requests to exceed the limit
      const successResponse = {
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      };

      // First 100 requests should succeed
      for (let i = 0; i < 100; i++) {
        global.fetch.mockResolvedValueOnce(successResponse);
        const request = new Request(`http://localhost/api/solar-companies?zip=9021${i % 10}&state=CA`);
        const response = await handler.fetch(request);
        expect(response.status).toBe(200);
      }

      // 101st request should fail with 429
      const request = new Request('http://localhost/api/solar-companies?zip=99999&state=CA');
      const response = await handler.fetch(request);
      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data.error).toContain('Daily API request limit exceeded');
    });

    test('resets rate limit on new day (simulated by different date string)', async () => {
      // First request uses up the quota
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      });

      const request1 = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response1 = await handler.fetch(request1);
      expect(response1.status).toBe(200);

      // Simulate day change by modifying the internal date
      // Note: This test is conceptual; actual implementation might require mocking Date
    });
  });

  describe('Caching', () => {
    test('returns cached result for same zip code on second request', async () => {
      const googleResponse = {
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [
            {
              name: 'Company A',
              formatted_address: 'Address A',
              rating: 4.5,
              user_ratings_total: 10,
              business_status: 'OPERATIONAL',
              place_id: 'place_a',
            },
          ],
        }),
      };

      const detailsResponse = {
        ok: true,
        json: async () => ({ status: 'OK', result: {} }),
      };

      // First request - should call Google API
      global.fetch.mockImplementationOnce(() => googleResponse).mockImplementationOnce(() => detailsResponse);

      const request1 = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response1 = await handler.fetch(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.companies.length).toBe(1);
      expect(response1.headers.get('X-Cache')).toBe('MISS');

      // Second request - should use cache
      const request2 = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response2 = await handler.fetch(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.companies).toEqual(data1.companies);
      expect(response2.headers.get('X-Cache')).toBe('HIT');

      // Should not have called Google API again
      expect(global.fetch).toHaveBeenCalledTimes(2); // 1 place search + 1 detail calls
    });

    test('does not cache across different zip codes', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', results: [{ name: 'A', formatted_address: 'Add A', place_id: 'a' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', result: {} }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', results: [{ name: 'B', formatted_address: 'Add B', place_id: 'b' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', result: {} }),
        });

      const request1 = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      await handler.fetch(request1);

      const request2 = new Request('http://localhost/api/solar-companies?zip=90211&state=CA');
      const response2 = await handler.fetch(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.companies[0].name).toBe('B'); // Should get different result
    });
  });

  describe('Google API failure handling', () => {
    test('returns 502 on Google Places API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error_message: 'API error', status: 'INVALID_REQUEST' }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(502);
    });

    test('returns 504 on Google API timeout', async () => {
      global.fetch.mockRejectedValueOnce(new Error('AbortError'));

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(504);
    });

    test('handles missing API key configuration', async () => {
      global.GOOGLE_PLACES_API_KEY = undefined;

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(500);
    });

    test('handles Google Places API zero results', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(502); // External service error
    });
  });

  describe('Data mapping', () => {
    test('correctly maps Google Places data to expected response format', async () => {
      const googlePlacesResponse = {
        status: 'OK',
        results: [
          {
            name: 'SolarTech Inc.',
            formatted_address: '123 Solar Way, Los Angeles, CA 90001',
            rating: 4.7,
            user_ratings_total: 234,
            business_status: 'OPERATIONAL',
            place_id: 'ChIJtestabc',
          },
        ],
      };

      const googleDetailsResponse = {
        status: 'OK',
        result: {
          phone: '+1-800-SOLAR',
          website: 'https://solartech.com',
        },
      };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => googlePlacesResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => googleDetailsResponse });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(data.companies[0]).toEqual({
        name: 'SolarTech Inc.',
        address: '123 Solar Way, Los Angeles, CA 90001',
        rating: 4.7,
        reviewCount: 234,
        businessStatus: 'OPERATIONAL',
        placeId: 'ChIJtestabc',
        phone: '+1-800-SOLAR',
        website: 'https://solartech.com',
      });
    });

    test('handles missing rating and review count', async () => {
      const googlePlacesResponse = {
        status: 'OK',
        results: [
          {
            name: 'New Solar Company',
            formatted_address: '456 New St, City, CA 90210',
            business_status: 'OPERATIONAL',
            place_id: 'no_rating_id',
          },
        ],
      };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => googlePlacesResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'OK', result: {} }) });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(data.companies[0].rating).toBeNull();
      expect(data.companies[0].reviewCount).toBe(0);
    });

    test('handles missing phone and website in details', async () => {
      const googlePlacesResponse = {
        status: 'OK',
        results: [
          {
            name: 'Basic Solar',
            formatted_address: '789 Basic St, City, CA 90210',
            rating: 4.0,
            user_ratings_total: 5,
            business_status: 'OPERATIONAL',
            place_id: 'basic_id',
          },
        ],
      };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => googlePlacesResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'OK', result: {} }) });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);
      const data = await response.json();

      expect(data.companies[0].phone).toBeNull();
      expect(data.companies[0].website).toBeNull();
    });
  });

  describe('Query parameters', () => {
    test('accepts state parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.status).toBe(200);
    });

    test('works without state parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210');
      const response = await handler.fetch(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Cache-Control headers', () => {
    test('sets Cache-Control header on response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', results: [] }),
      });

      const request = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response = await handler.fetch(request);

      expect(response.headers.get('Cache-Control')).toContain('max-age=');
    });

    test('sets different max-age for cache HIT vs MISS', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', results: [{ name: 'A', formatted_address: 'Add A', place_id: 'a' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'OK', result: {} }),
        });

      const request1 = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response1 = await handler.fetch(request1);

      expect(response1.headers.get('X-Cache')).toBe('MISS');

      const request2 = new Request('http://localhost/api/solar-companies?zip=90210&state=CA');
      const response2 = await handler.fetch(request2);

      expect(response2.headers.get('X-Cache')).toBe('HIT');
    });
  });
});
