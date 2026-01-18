/**
 * Express middleware for validation and error handling.
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import type { ApiResponse, ApiError } from '../types/index.js';
/** Wrap async route handlers to catch errors */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler;
/** Middleware to require AI configuration - returns 503 if not configured */
export declare function requireAI(): RequestHandler;
/** Validate request body against Zod schema */
export declare function validateBody<T>(schema: ZodSchema<T>): RequestHandler;
/** Validate request query against Zod schema */
export declare function validateQuery<T>(schema: ZodSchema<T>): RequestHandler;
export declare function createSuccessResponse<T>(data: T): ApiResponse<T>;
export declare function createErrorResponse(error: ApiError): ApiResponse<never>;
/** Global error handler middleware */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=middleware.d.ts.map