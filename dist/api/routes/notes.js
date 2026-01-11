"use strict";
/**
 * Notes management routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notesRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../../services/index.js");
const middleware_js_1 = require("../middleware.js");
const index_js_2 = require("../../schemas/index.js");
exports.notesRouter = (0, express_1.Router)({ mergeParams: true });
// Get all notes for a space
exports.notesRouter.get('/', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const notes = await index_js_1.spaceService.getNotes(req.params['spaceId']);
    res.json((0, middleware_js_1.createSuccessResponse)(notes));
}));
// Add new note
exports.notesRouter.post('/', (0, middleware_js_1.validateBody)(index_js_2.addNoteRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const note = await index_js_1.spaceService.addNote(req.params['spaceId'], req.body);
    res.status(201).json((0, middleware_js_1.createSuccessResponse)(note));
}));
// Update note
exports.notesRouter.patch('/:noteId', (0, middleware_js_1.validateBody)(index_js_2.updateNoteRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const note = await index_js_1.spaceService.updateNote(req.params['spaceId'], req.params['noteId'], req.body);
    res.json((0, middleware_js_1.createSuccessResponse)(note));
}));
// Delete note
exports.notesRouter.delete('/:noteId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    await index_js_1.spaceService.deleteNote(req.params['spaceId'], req.params['noteId']);
    res.status(204).send();
}));
// Promote note to fact
exports.notesRouter.post('/:noteId/promote', (0, middleware_js_1.validateBody)(index_js_2.promoteNoteRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const fact = await index_js_1.spaceService.promoteNoteToFact(req.params['spaceId'], req.params['noteId'], req.body);
    res.status(201).json((0, middleware_js_1.createSuccessResponse)(fact));
}));
//# sourceMappingURL=notes.js.map