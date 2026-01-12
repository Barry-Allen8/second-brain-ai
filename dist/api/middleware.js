"use strict";
/**
 * Express middleware for validation and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.errorHandler = errorHandler;
const index_js_1 = require("../domain/index.js");
/** Wrap async route handlers to catch errors */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/** Validate request body against Zod schema */
function validateBody(schema) {
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
function validateQuery(schema) {
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
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}
function createErrorResponse(error) {
    return {
        success: false,
        error,
        timestamp: new Date().toISOString(),
    };
}
/** Global error handler middleware */
function errorHandler(err, req, res, _next) {
    console.error('[error] Unhandled error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
    });
    if (err instanceof index_js_1.StorageError) {
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