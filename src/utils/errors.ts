/**
 * Standardized error classes for the application
 */

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "BAD_REQUEST",
  INVALID_INPUT = "INVALID_INPUT",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, ErrorCode.NOT_FOUND, { resource, identifier });
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, ErrorCode.BAD_REQUEST, details);
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string, field?: string, details?: Record<string, any>) {
    super(message, 400, ErrorCode.INVALID_INPUT, { field, ...details });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: Record<string, any>) {
    super(`${service} is currently unavailable`, 503, ErrorCode.SERVICE_UNAVAILABLE, {
      service,
      ...details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 401, ErrorCode.UNAUTHORIZED, details);
  }
}

