"use strict";
/**
 * Space management routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.spacesRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../../domain/index.js");
const middleware_js_1 = require("../middleware.js");
const index_js_2 = require("../../schemas/index.js");
exports.spacesRouter = (0, express_1.Router)();
// List all spaces
exports.spacesRouter.get('/', (0, middleware_js_1.asyncHandler)(async (_req, res) => {
    const spaces = await index_js_1.spaceService.listSpaces();
    res.json((0, middleware_js_1.createSuccessResponse)(spaces));
}));
// Create new space
exports.spacesRouter.post('/', (0, middleware_js_1.validateBody)(index_js_2.createSpaceRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const space = await index_js_1.spaceService.createSpace(req.body);
    res.status(201).json((0, middleware_js_1.createSuccessResponse)(space));
}));
// Get space by ID
exports.spacesRouter.get('/:spaceId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const space = await index_js_1.spaceService.getSpace(req.params['spaceId']);
    res.json((0, middleware_js_1.createSuccessResponse)(space));
}));
// Update space
exports.spacesRouter.patch('/:spaceId', (0, middleware_js_1.validateBody)(index_js_2.updateSpaceRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const space = await index_js_1.spaceService.updateSpace(req.params['spaceId'], req.body);
    res.json((0, middleware_js_1.createSuccessResponse)(space));
}));
// Delete space
exports.spacesRouter.delete('/:spaceId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    await index_js_1.spaceService.deleteSpace(req.params['spaceId']);
    res.json((0, middleware_js_1.createSuccessResponse)({ deleted: true }));
}));
// Query context for AI prompt construction
exports.spacesRouter.post('/:spaceId/context', (0, middleware_js_1.validateBody)(index_js_2.queryContextRequestSchema.omit({ spaceId: true })), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const context = await index_js_1.spaceService.queryContext({
        spaceId: req.params['spaceId'],
        ...req.body,
    });
    const tokensEstimate = index_js_1.spaceService.estimateTokens(context);
    res.json((0, middleware_js_1.createSuccessResponse)({ context, tokensEstimate }));
}));
//# sourceMappingURL=spaces.js.map