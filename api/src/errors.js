/**
 * Error handling for Balcony Solar Checker API
 */

export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends APIError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

export class TimeoutError extends APIError {
  constructor(message = 'Request timeout') {
    super(message, 504, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

export class ExternalServiceError extends APIError {
  constructor(message = 'External service error', statusCode = 502) {
    super(message, statusCode, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

export function formatErrorResponse(error) {
  if (error instanceof APIError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      statusCode: error.statusCode,
    };
  }

  // Unknown error
  return {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
    statusCode: 500,
  };
}
