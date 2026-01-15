"use strict";
/**
 * Chat API routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
// CHANGE: Added setModel and SUPPORTED_MODELS imports
const index_js_1 = require("../../ai/index.js");
const middleware_js_1 = require("../middleware.js");
const index_js_2 = require("../../schemas/index.js");
const index_js_3 = require("../../domain/index.js");
exports.chatRouter = (0, express_1.Router)();
async function resolveSpaceId(preferredSpaceId) {
    if (preferredSpaceId && await index_js_3.storage.spaceExists(preferredSpaceId)) {
        return preferredSpaceId;
    }
    const spaces = await index_js_3.spaceService.listSpaces();
    const activeSpace = spaces.find((space) => space.isActive);
    if (activeSpace) {
        return activeSpace.id;
    }
    if (spaces.length > 0) {
        return spaces[0].id;
    }
    const defaultSpace = await index_js_3.spaceService.createSpace({
        name: 'Default Space',
        description: 'Auto-created for chat requests without a space.',
        icon: 'chat',
        color: '#4f46e5',
    });
    return defaultSpace.id;
}
function normalizeChatRequest(body) {
    // Backward compatibility: support legacy { message } shape alongside structured { messages } payloads.
    if ('message' in body) {
        return {
            spaceId: body.spaceId ?? undefined,
            message: body.message,
            sessionId: body.sessionId ?? undefined,
        };
    }
    const lastUserMessage = [...body.messages].reverse().find(m => m.role === 'user');
    const lastMessage = lastUserMessage ?? body.messages[body.messages.length - 1];
    if (!lastMessage) {
        throw new Error('No messages found in request');
    }
    return {
        spaceId: body.spaceId ?? undefined,
        message: lastMessage.content,
        sessionId: body.sessionId ?? undefined,
    };
}
function logParsedChatRequest(request) {
    console.debug('[chat] parsed request', {
        spaceId: request.spaceId,
        sessionId: request.sessionId,
        messagePreview: request.message.slice(0, 80),
    });
}
// Check AI status
// CHANGE: Added supportedModels to status response
exports.chatRouter.get('/status', (0, middleware_js_1.asyncHandler)(async (_req, res) => {
    const configured = (0, index_js_1.isAIConfigured)();
    const config = (0, index_js_1.getAIConfig)();
    res.json((0, middleware_js_1.createSuccessResponse)({
        configured,
        provider: config.provider,
        model: config.model,
        supportedModels: index_js_1.SUPPORTED_MODELS,
    }));
}));
// Send chat message
exports.chatRouter.post('/', (0, middleware_js_1.validateBody)(index_js_2.chatRequestSchema), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    if (!(0, index_js_1.isAIConfigured)()) {
        res.status(503).json((0, middleware_js_1.createErrorResponse)({
            code: 'AI_NOT_CONFIGURED',
            message: 'AI provider not configured. Please set OPENAI_API_KEY environment variable.',
        }));
        return;
    }
    const normalized = normalizeChatRequest(req.body);
    const resolvedSpaceId = await resolveSpaceId(normalized.spaceId);
    const response = await (0, index_js_1.chat)({
        ...normalized,
        spaceId: resolvedSpaceId,
    });
    logParsedChatRequest({ ...normalized, spaceId: resolvedSpaceId });
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
// Update session (e.g., rename)
exports.chatRouter.patch('/sessions/:sessionId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const sessionId = req.params['sessionId'];
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        res.status(400).json((0, middleware_js_1.createErrorResponse)({
            code: 'INVALID_REQUEST',
            message: 'Name is required',
        }));
        return;
    }
    const updated = (0, index_js_1.updateSession)(sessionId, { name });
    if (!updated) {
        res.status(404).json((0, middleware_js_1.createErrorResponse)({
            code: 'SESSION_NOT_FOUND',
            message: 'Chat session not found',
        }));
        return;
    }
    res.json((0, middleware_js_1.createSuccessResponse)(updated));
}));
// Get chat history for session
exports.chatRouter.get('/sessions/:sessionId/messages', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const sessionId = req.params['sessionId'];
    const messages = (0, index_js_1.getChatHistory)(sessionId);
    res.json((0, middleware_js_1.createSuccessResponse)(messages));
}));
// List sessions (can filter by spaceId via query param)
exports.chatRouter.get('/sessions', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const spaceId = req.query['spaceId'];
    if (!spaceId) {
        res.status(400).json((0, middleware_js_1.createErrorResponse)({
            code: 'INVALID_REQUEST',
            message: 'spaceId query parameter is required',
        }));
        return;
    }
    const sessions = (0, index_js_1.listSessions)(spaceId);
    res.json((0, middleware_js_1.createSuccessResponse)(sessions.map((s) => ({
        sessionId: s.id,
        name: s.name,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))));
}));
// List sessions for a space (legacy route for compatibility)
exports.chatRouter.get('/spaces/:spaceId/sessions', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const spaceId = req.params['spaceId'];
    const sessions = (0, index_js_1.listSessions)(spaceId);
    res.json((0, middleware_js_1.createSuccessResponse)(sessions.map((s) => ({
        sessionId: s.id,
        name: s.name,
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
    res.json((0, middleware_js_1.createSuccessResponse)({ deleted: true }));
}));
// CHANGE: New endpoint to change OpenAI model dynamically
// Set AI model
exports.chatRouter.put('/model', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const { model } = req.body;
    if (!model || typeof model !== 'string') {
        res.status(400).json((0, middleware_js_1.createErrorResponse)({
            code: 'INVALID_REQUEST',
            message: 'Model name is required',
        }));
        return;
    }
    try {
        (0, index_js_1.setModel)(model);
        const config = (0, index_js_1.getAIConfig)();
        res.json((0, middleware_js_1.createSuccessResponse)({
            model: config.model,
            message: `Model changed to ${model}`,
        }));
    }
    catch (error) {
        res.status(400).json((0, middleware_js_1.createErrorResponse)({
            code: 'UNSUPPORTED_MODEL',
            message: error instanceof Error ? error.message : 'Invalid model',
        }));
    }
}));
//# sourceMappingURL=chat.js.map