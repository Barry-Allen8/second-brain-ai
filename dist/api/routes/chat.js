"use strict";
/**
 * Chat API routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const index_js_1 = require("../../utils/index.js");
// CHANGE: Added setModel and SUPPORTED_MODELS imports
const index_js_2 = require("../../ai/index.js");
const middleware_js_1 = require("../middleware.js");
const index_js_3 = require("../../domain/index.js");
const upload = (0, multer_1.default)({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
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
            attachments: body.attachments,
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
        attachments: body.attachments
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
    const configured = (0, index_js_2.isAIConfigured)();
    const config = (0, index_js_2.getAIConfig)();
    res.json((0, middleware_js_1.createSuccessResponse)({
        configured,
        provider: config.provider,
        model: config.model,
        supportedModels: index_js_2.SUPPORTED_MODELS,
    }));
}));
// Send chat message
exports.chatRouter.post('/', upload.array('attachments'), (0, middleware_js_1.asyncHandler)(async (req, res) => {
    if (!(0, index_js_2.isAIConfigured)()) {
        res.status(503).json((0, middleware_js_1.createErrorResponse)({
            code: 'AI_NOT_CONFIGURED',
            message: 'AI provider not configured. Please set OPENAI_API_KEY environment variable.',
        }));
        return;
    }
    const { messages, message, spaceId, sessionId } = req.body;
    // Manual validation since multer parses body
    if (!message && (!messages || !messages.length)) {
        // if attachments are present, message can be empty? Let's treat it as empty text.
        // But normalizedRequest expects message.
    }
    const attachments = [];
    if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
            if (file.mimetype === 'application/pdf') {
                try {
                    const text = await (0, index_js_1.extractTextFromPdf)(file.buffer);
                    attachments.push({
                        type: 'file',
                        name: file.originalname,
                        mimeType: file.mimetype,
                        url: '', // Not storing file permanently for now
                        content: text // Attaching extracted text
                    });
                }
                catch (e) {
                    console.error('Failed to parse PDF', e);
                }
            }
            else if (file.mimetype.startsWith('image/')) {
                const base64 = file.buffer.toString('base64');
                attachments.push({
                    type: 'image',
                    name: file.originalname,
                    mimeType: file.mimetype,
                    url: `data:${file.mimetype};base64,${base64}`
                });
            }
        }
    }
    const normalized = normalizeChatRequest({ ...req.body, attachments });
    // Append attachments info to message for AI context
    if (attachments.length > 0) {
        // Logic to append file content to the message
        let attachmentsContext = '\n\n[Attached Files]:\n';
        for (const att of attachments) {
            if (att.type === 'file' && att.content) {
                attachmentsContext += `File: ${att.name}\nContent:\n${att.content}\n---\n`;
            }
            else if (att.type === 'image') {
                // Images are handled via vision if supported, but here we just mention it
                attachmentsContext += `Image: ${att.name}\n`;
            }
        }
        normalized.message += attachmentsContext;
    }
    const resolvedSpaceId = await resolveSpaceId(normalized.spaceId);
    // Pass image URLs if needed. For now simple text append.
    // If we want real vision support, we need to pass message array to ChatService.
    // But ChatService builds `ChatMessage` which has `content` string.
    // So modifying content is the way for now unless I refactor ChatService significantly.
    const response = await (0, index_js_2.chat)({
        ...normalized,
        spaceId: resolvedSpaceId,
        attachments // passing attachments just in case
    });
    logParsedChatRequest({ ...normalized, spaceId: resolvedSpaceId });
    res.json((0, middleware_js_1.createSuccessResponse)(response));
}));
// Get session history
exports.chatRouter.get('/sessions/:sessionId', (0, middleware_js_1.asyncHandler)(async (req, res) => {
    const sessionId = req.params['sessionId'];
    const session = (0, index_js_2.getSession)(sessionId);
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
    const updated = (0, index_js_2.updateSession)(sessionId, { name });
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
    const messages = (0, index_js_2.getChatHistory)(sessionId);
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
    const sessions = (0, index_js_2.listSessions)(spaceId);
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
    const sessions = (0, index_js_2.listSessions)(spaceId);
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
    const deleted = (0, index_js_2.deleteSession)(sessionId);
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
        (0, index_js_2.setModel)(model);
        const config = (0, index_js_2.getAIConfig)();
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