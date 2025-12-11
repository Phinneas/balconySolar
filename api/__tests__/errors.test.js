/**
 * Tests for Error Handling
 * Feature: balcony-solar-checker
 * Validates: Requirements 5.5, 7.4
 */

import {
  APIError,
  NotFoundError,
  BadRequestError,
  TimeoutError,
  ExternalServiceError,
  formatErrorResponse,
} from '../src/errors.js';

describe('Error Classes', () => {
  describe('APIError', () => {
    test('creates error with default values', () => {
      const error = new APIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    test('creates error with custom values', () => {
      const error = new APIError('Custom error', 400, 'CUSTOM_CODE');
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_CODE');
    });
  });

  describe('NotFoundError', () => {
    test('creates 404 error', () => {
      const error = new NotFoundError('State not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('BadRequestError', () => {
    test('creates 400 error', () => {
      const error = new BadRequestError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('TimeoutError', () => {
    test('creates 504 error', () => {
      const error = new TimeoutError('Request timeout');
      expect(error.statusCode).toBe(504);
      expect(error.code).toBe('TIMEOUT');
    });
  });

  describe('ExternalServiceError', () => {
    test('creates 502 error by default', () => {
      const error = new ExternalServiceError('Service unavailable');
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
    });

    test('creates error with custom status code', () => {
      const error = new ExternalServiceError('Service error', 503);
      expect(error.statusCode).toBe(503);
    });
  });
});

describe('Error Formatting', () => {
  test('formats APIError correctly', () => {
    const error = new NotFoundError('State not found');
    const formatted = formatErrorResponse(error);

    expect(formatted.statusCode).toBe(404);
    expect(formatted.error.code).toBe('NOT_FOUND');
    expect(formatted.error.message).toBe('State not found');
  });

  test('formats unknown error as 500', () => {
    const error = new Error('Unknown error');
    const formatted = formatErrorResponse(error);

    expect(formatted.statusCode).toBe(500);
    expect(formatted.error.code).toBe('INTERNAL_ERROR');
  });

  test('includes all error fields', () => {
    const error = new TimeoutError('API timeout');
    const formatted = formatErrorResponse(error);

    expect(formatted.error).toHaveProperty('message');
    expect(formatted.error).toHaveProperty('code');
    expect(formatted.error).toHaveProperty('statusCode');
  });
});

describe('Error Handling Scenarios', () => {
  test('handles Teable API unavailability', () => {
    const error = new ExternalServiceError('Teable API unavailable', 503);
    const formatted = formatErrorResponse(error);

    expect(formatted.statusCode).toBe(503);
    expect(formatted.error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  test('handles timeout errors', () => {
    const error = new TimeoutError('Request exceeded 5 seconds');
    const formatted = formatErrorResponse(error);

    expect(formatted.statusCode).toBe(504);
    expect(formatted.error.code).toBe('TIMEOUT');
  });

  test('handles invalid state code', () => {
    const error = new NotFoundError('State code "xx" not found');
    const formatted = formatErrorResponse(error);

    expect(formatted.statusCode).toBe(404);
    expect(formatted.error.message).toContain('xx');
  });

  test('handles incomplete data', () => {
    const error = new APIError('State data incomplete', 422, 'INCOMPLETE_DATA');
    const formatted = formatErrorResponse(error);

    expect(formatted.statusCode).toBe(422);
    expect(formatted.error.code).toBe('INCOMPLETE_DATA');
  });
});
