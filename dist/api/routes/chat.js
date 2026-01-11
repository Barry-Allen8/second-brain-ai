"use strict";
/**
 * Chat API routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const index_js_1 = require("../../services/index.js");
const middleware_js_1 = require("../middleware.js");
exports.chatRouter = (0, express_1.Router)();
// Chat request schema
const chatRequestSchema = zod_1.z.object({
    spaceId: zod_1.z.string().uuid(),
    message: zod_1.z.string().min(1).max(10000),
    sessionId: zod_1.z.string().uuid().optional(),
});
// Check AI status
exports.chatRouter.get('/status', (0, middleware_js_1.asyncHandler)(async (_req, res) => {
    const configured = (0, index_js_1.isAIConfigured)();
    const config = (0, index_js_1.getAIConfig)();
    res.json((0, middleware_js_1.createSuccessResponse)({
        configured,
        provider: config.provider,
        model: config.model,
    }));
}));
// Send chat message
exports.chatRouter.post('/', (0, middleware_js_1.validateBody)(chatRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    if (!(0, index_js_1.isAIConfigured)()) {
        res.status(503).json((0, middleware_js_1.createErrorResponse)({
            code: 'AI_NOT_CONFIGURED',
            message: 'AI provider not configured. Please set OPENAI_API_KEY environment variable.',
        }));
        return;
    }
    const response = await (0, index_js_1.chat)(req.body);
    res.json((0, middleware_js_1.createSuccessResponse)(response));
}));
// Get session history
exports.chatRouter.get('/sessions/:sessionId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const sessionId = req.params['sessionId'];
    const session = (0, index_js_1.getSession)(sessionId);
    if (!session) {
        res.status(404).json((0, middleware_js_1.createErrorResponse)({
            code: 'SESSION_NOT_FOUND',
            message: 'Chat session not found',
        }));
        return;
    }
    res.json((0, middleware_js_1.createSuccessResponse)(session));
}));
// Get chat history for session
exports.chatRouter.get('/sessions/:sessionId/messages', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const sessionId = req.params['sessionId'];
    const messages = (0, index_js_1.getChatHistory)(sessionId);
    res.json((0, middleware_js_1.createSuccessResponse)(messages));
}));
// List sessions for a space
exports.chatRouter.get('/spaces/:spaceId/sessions', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const spaceId = req.params['spaceId'];
    const sessions = (0, index_js_1.listSessions)(spaceId);
    res.json((0, middleware_js_1.createSuccessResponse)(sessions.map((s) => ({
        id: s.id,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))));
}));
// Delete session
exports.chatRouter.delete('/sessions/:sessionId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const sessionId = req.params['sessionId'];
    const deleted = (0, index_js_1.deleteSession)(sessionId);
    if (!deleted) {
        res.status(404).json((0, middleware_js_1.createErrorResponse)({
            code: 'SESSION_NOT_FOUND',
            message: 'Chat session not found',
        }));
        return;
    }
    res.status(204).send();
}));
//# sourceMappingURL=chat.js.map