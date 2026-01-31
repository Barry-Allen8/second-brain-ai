/**
 * Express middleware for validation and error handling.
 */
import { StorageError } from '../domain/index.js';
import { isAIConfigured } from '../ai/index.js';
import { auth } from '../lib/firebase.js';
/** Wrap async route handlers to catch errors */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/** Middleware to require AI configuration - returns 503 if not configured */
export function requireAI() {
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
/** Middleware to require authenticated user */
export function requireAuth() {
    return async (req, res, next) => {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            res.status(401).json(createErrorResponse({
                code: 'UNAUTHORIZED',
                message: 'Authorization required',
            }));
            return;
        }
        const token = header.slice('Bearer '.length).trim();
        if (!token) {
            res.status(401).json(createErrorResponse({
                code: 'UNAUTHORIZED',
                message: 'Authorization token missing',
            }));
            return;
        }
        try {
            const decoded = await auth.verifyIdToken(token);
            res.locals.auth = decoded;
            next();
        }
        catch (error) {
            console.warn('[auth] Token verification failed', error);
            res.status(401).json(createErrorResponse({
                code: 'UNAUTHORIZED',
                message: 'Invalid or expired token',
            }));
        }
    };
}
/** Validate request body against Zod schema */
export function validateBody(schema) {
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
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const error = formatZodError(result.error);
            res.status(400).json(createErrorResponse(error));
            return;
        }
        req.query = result.data;
        next();
    };
}
function formatZodError(error) {
    const details = {};
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
export function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}
export function createErrorResponse(error) {
    return {
        success: false,
        error,
        timestamp: new Date().toISOString(),
    };
}
/** Global error handler middleware */
export function errorHandler(err, req, res, _next) {
    console.error('[error] Unhandled error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
    });
    if (err instanceof StorageError) {
        const statusMap = {
            NOT_FOUND: 404,
            ALREADY_EXISTS: 409,
            IO_ERROR: 500,
            PARSE_ERROR: 500,
        };
        res.status(statusMap[err.code]).json(createErrorResponse({
            code: err.code,
            message: err.message,
        }));
        return;
    }
    res.status(500).json(createErrorResponse({
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
    }));
}
//# sourceMappingURL=middleware.js.map