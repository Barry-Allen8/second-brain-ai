/**
 * Express middleware for validation and error handling.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import type { ApiResponse, ApiError } from '../types/index.js';
import { StorageError } from '../domain/index.js';
import { isAIConfigured } from '../ai/index.js';

/** Wrap async route handlers to catch errors */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Middleware to require AI configuration - returns 503 if not configured */
export function requireAI(): RequestHandler {
  return (_req, res, next) => {
    if (!isAIConfigured()) {
      res.status(503).json(createErrorResponse({
        code: 'AI_NOT_CONFIGURED',
        message: 'AI service unavailable. OPENAI_API_KEY environment variable is not set.',
      }));
      return;
    }
    next();
  };
}

/** Validate request body against Zod schema */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = formatZodError(result.error);
      console.error('[validation] Request validation failed:', {
        path: req.path,
        method: req.method,
        body: req.body,
        errors: error.details,
      });
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
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error] Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

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
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    })
  );
}
