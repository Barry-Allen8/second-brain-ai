/**
 * Express middleware for validation and error handling.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import type { ApiResponse, ApiError } from '../types/index.js';
import { StorageError } from '../services/index.js';

/** Wrap async route handlers to catch errors */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Validate request body against Zod schema */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = formatZodError(result.error);
      res.status(400).json(createErrorResponse(error));
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Validate request query against Zod schema */
export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const error = formatZodError(result.error);
      res.status(400).json(createErrorResponse(error));
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}

function formatZodError(error: ZodError): ApiError {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    details[path] = issue.message;
  }
  return {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details,
  };
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(error: ApiError): ApiResponse<never> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

/** Global error handler middleware */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof StorageError) {
    const statusMap: Record<StorageError['code'], number> = {
      NOT_FOUND: 404,
      ALREADY_EXISTS: 409,
      IO_ERROR: 500,
      PARSE_ERROR: 500,
    };

    res.status(statusMap[err.code]).json(
      createErrorResponse({
        code: err.code,
        message: err.message,
      })
    );
    return;
  }

  res.status(500).json(
    createErrorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  );
}
