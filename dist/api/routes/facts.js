"use strict";
/**
 * Facts management routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.factsRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../../domain/index.js");
const middleware_js_1 = require("../middleware.js");
const index_js_2 = require("../../schemas/index.js");
exports.factsRouter = (0, express_1.Router)({ mergeParams: true });
// Get all facts for a space
exports.factsRouter.get('/', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const facts = await index_js_1.spaceService.getFacts(req.params['spaceId']);
    res.json((0, middleware_js_1.createSuccessResponse)(facts));
}));
// Add new fact
exports.factsRouter.post('/', (0, middleware_js_1.validateBody)(index_js_2.addFactRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const fact = await index_js_1.spaceService.addFact(req.params['spaceId'], req.body);
    res.status(201).json((0, middleware_js_1.createSuccessResponse)(fact));
}));
// Update fact
exports.factsRouter.patch('/:factId', (0, middleware_js_1.validateBody)(index_js_2.updateFactRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const fact = await index_js_1.spaceService.updateFact(req.params['spaceId'], req.params['factId'], req.body);
    res.json((0, middleware_js_1.createSuccessResponse)(fact));
}));
// Delete fact
exports.factsRouter.delete('/:factId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    await index_js_1.spaceService.deleteFact(req.params['spaceId'], req.params['factId']);
    res.status(204).send();
}));
//# sourceMappingURL=facts.js.map