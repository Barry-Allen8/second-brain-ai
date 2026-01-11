"use strict";
/**
 * Timeline routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.timelineRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../../services/index.js");
const middleware_js_1 = require("../middleware.js");
const index_js_2 = require("../../schemas/index.js");
exports.timelineRouter = (0, express_1.Router)({ mergeParams: true });
// Get timeline for a space
exports.timelineRouter.get('/', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const limit = req.query['limit'] ? parseInt(req.query['limit'], 10) : 50;
    const entries = await index_js_1.spaceService.getTimeline(req.params['spaceId'], limit);
    res.json((0, middleware_js_1.createSuccessResponse)(entries));
}));
// Add custom timeline entry
exports.timelineRouter.post('/', (0, middleware_js_1.validateBody)(index_js_2.addTimelineEntryRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const entry = await index_js_1.spaceService.addTimelineEntry(req.params['spaceId'], req.body);
    res.status(201).json((0, middleware_js_1.createSuccessResponse)(entry));
}));
//# sourceMappingURL=timeline.js.map