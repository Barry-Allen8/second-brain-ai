"use strict";
/**
 * Profile management routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../../services/index.js");
const middleware_js_1 = require("../middleware.js");
const index_js_2 = require("../../schemas/index.js");
exports.profileRouter = (0, express_1.Router)({ mergeParams: true });
// Get profile for a space
exports.profileRouter.get('/', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const entries = await index_js_1.spaceService.getProfile(req.params['spaceId']);
    res.json((0, middleware_js_1.createSuccessResponse)(entries));
}));
// Add new profile entry
exports.profileRouter.post('/', (0, middleware_js_1.validateBody)(index_js_2.addProfileEntryRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const entry = await index_js_1.spaceService.addProfileEntry(req.params['spaceId'], req.body);
    res.status(201).json((0, middleware_js_1.createSuccessResponse)(entry));
}));
// Update profile entry
exports.profileRouter.patch('/:entryId', (0, middleware_js_1.validateBody)(index_js_2.updateProfileEntryRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const entry = await index_js_1.spaceService.updateProfileEntry(req.params['spaceId'], req.params['entryId'], req.body);
    res.json((0, middleware_js_1.createSuccessResponse)(entry));
}));
// Delete profile entry
exports.profileRouter.delete('/:entryId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    await index_js_1.spaceService.deleteProfileEntry(req.params['spaceId'], req.params['entryId']);
    res.status(204).send();
}));
//# sourceMappingURL=profile.js.map