/**
 * Chat API routes
 */
import { Router } from 'express';
import multer from 'multer';
import { extractTextFromPdf } from '../../utils/index.js';
import { Readable } from 'stream';
// CHANGE: Added setModel and SUPPORTED_MODELS imports
import { chat, getSession, listSessions, updateSession, deleteSession, getChatHistory, isAIConfigured, getAIConfig, setModel, SUPPORTED_MODELS, } from '../../ai/index.js';
import { asyncHandler, createSuccessResponse, createErrorResponse, requireAI, } from '../middleware.js';
import { spaceService, storage } from '../../domain/index.js';
const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const uploadAttachments = upload.array('attachments');
export const chatRouter = Router();
async function resolveSpaceId(preferredSpaceId) {
    if (preferredSpaceId && await storage.spaceExists(preferredSpaceId)) {
        return preferredSpaceId;
    }
    const spaces = await spaceService.listSpaces();
    const activeSpace = spaces.find((space) => space.isActive);
    if (activeSpace) {
        return activeSpace.id;
    }
    if (spaces.length > 0) {
        return spaces[0].id;
    }
    const defaultSpace = await spaceService.createSpace({
        name: 'Default Space',
        description: 'Auto-created for chat requests without a space.',
        icon: 'chat',
        color: '#4f46e5',
    });
    return defaultSpace.id;
}
function normalizeChatRequest(body) {
    // Backward compatibility: support legacy { message } shape alongside structured { messages } payloads.
    if (isSimpleChatRequest(body)) {
        return {
            spaceId: body.spaceId ?? undefined,
            message: body.message,
            sessionId: body.sessionId ?? undefined,
            attachments: body.attachments,
        };
    }
    const messages = body.messages || [];
    if (!messages.length) {
        // Fallback if no messages found
        throw new Error('No messages found in request');
    }
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const lastMessage = lastUserMessage ?? messages[messages.length - 1];
    if (!lastMessage) {
        throw new Error('No messages found in request');
    }
    return {
        spaceId: body.spaceId ?? undefined,
        message: lastMessage.content,
        sessionId: body.sessionId ?? undefined,
        attachments: body.attachments,
    };
}
function getRouteParam(value) {
    if (!value)
        return null;
    return Array.isArray(value) ? value[0] ?? null : value;
}
function isSimpleChatRequest(body) {
    return typeof body.message === 'string';
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
chatRouter.get('/status', asyncHandler(async (_req, res) => {
    const configured = isAIConfigured();
    const config = getAIConfig();
    res.json(createSuccessResponse({
        configured,
        provider: config.provider,
        model: config.model,
        supportedModels: SUPPORTED_MODELS,
    }));
}));
// Wrapper to only run multer if content-type is multipart
const multipartMiddleware = (req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Cloud Functions workaround: req.body might be a Buffer if already parsed
        if (req.body && Buffer.isBuffer(req.body)) {
            const stream = Readable.from(req.body);
            req.pipe = (dest) => stream.pipe(dest);
        }
        uploadAttachments(req, res, next);
        return;
    }
    next();
};
// Send chat message
chatRouter.post('/', multipartMiddleware, requireAI(), asyncHandler(async (req, res) => {
    const { messages, message, spaceId, sessionId } = req.body;
    // Manual validation since multer parses body
    if (!message && (!messages || !messages.length)) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'Message content is required',
        }));
        return;
    }
    const attachments = [];
    if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
            if (file.mimetype === 'application/pdf') {
                try {
                    const text = await extractTextFromPdf(file.buffer);
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
        let hasFileContent = false;
        let attachmentsContext = '\n\n[Attached Files]:\n';
        for (const att of attachments) {
            if (att.type === 'file' && att.content) {
                attachmentsContext += `File: ${att.name}\nContent:\n${att.content}\n---\n`;
                hasFileContent = true;
            }
            // Images are now handled via native Vision API in ChatService
        }
        if (hasFileContent) {
            normalized.message += attachmentsContext;
        }
    }
    const resolvedSpaceId = await resolveSpaceId(normalized.spaceId);
    // Pass image URLs if needed. For now simple text append.
    // If we want real vision support, we need to pass message array to ChatService.
    // But ChatService builds `ChatMessage` which has `content` string.
    // So modifying content is the way for now unless I refactor ChatService significantly.
    const response = await chat({
        ...normalized,
        spaceId: resolvedSpaceId,
        attachments // passing attachments just in case
    });
    logParsedChatRequest({ ...normalized, spaceId: resolvedSpaceId });
    res.json(createSuccessResponse(response));
}));
// Get session history
chatRouter.get('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const sessionId = getRouteParam(req.params['sessionId']);
    if (!sessionId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'sessionId is required',
        }));
        return;
    }
    const session = await getSession(sessionId);
    if (!session) {
        res.status(404).json(createErrorResponse({
            code: 'SESSION_NOT_FOUND',
            message: 'Chat session not found',
        }));
        return;
    }
    res.json(createSuccessResponse(session));
}));
// Update session (e.g., rename)
chatRouter.patch('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const sessionId = getRouteParam(req.params['sessionId']);
    if (!sessionId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'sessionId is required',
        }));
        return;
    }
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'Name is required',
        }));
        return;
    }
    const updated = await updateSession(sessionId, { name });
    if (!updated) {
        res.status(404).json(createErrorResponse({
            code: 'SESSION_NOT_FOUND',
            message: 'Chat session not found',
        }));
        return;
    }
    res.json(createSuccessResponse(updated));
}));
// Get chat history for session
chatRouter.get('/sessions/:sessionId/messages', asyncHandler(async (req, res) => {
    const sessionId = getRouteParam(req.params['sessionId']);
    if (!sessionId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'sessionId is required',
        }));
        return;
    }
    const messages = await getChatHistory(sessionId);
    res.json(createSuccessResponse(messages));
}));
// List sessions for space (Path param version - more robust)
chatRouter.get('/sessions/space/:spaceId', asyncHandler(async (req, res) => {
    const spaceId = getRouteParam(req.params['spaceId']);
    console.log(`[Sessions] Listing sessions for space (path param): ${spaceId}`);
    if (!spaceId) {
        // Should not happen with express routing but good for safety
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'spaceId is required',
        }));
        return;
    }
    const sessions = await listSessions(spaceId);
    // Map to lightweight summary (avoid sending full message history)
    res.json(createSuccessResponse(sessions.map((s) => ({
        sessionId: s.id,
        name: s.name,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))));
}));
// List sessions (Legacy query param version)
chatRouter.get('/sessions', asyncHandler(async (req, res) => {
    const query = req.query || {};
    console.log('[Sessions] List request query:', query);
    const rawSpaceId = query['spaceId'];
    const spaceId = getRouteParam(rawSpaceId);
    if (!spaceId) {
        console.warn('[Sessions] Missing spaceId in query');
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'spaceId query parameter is required',
        }));
        return;
    }
    const sessions = await listSessions(spaceId);
    res.json(createSuccessResponse(sessions.map((s) => ({
        sessionId: s.id,
        name: s.name,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))));
}));
// List sessions for a space (legacy route for compatibility)
chatRouter.get('/spaces/:spaceId/sessions', asyncHandler(async (req, res) => {
    const spaceId = getRouteParam(req.params['spaceId']);
    if (!spaceId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'spaceId is required',
        }));
        return;
    }
    const sessions = await listSessions(spaceId);
    res.json(createSuccessResponse(sessions.map((s) => ({
        sessionId: s.id,
        name: s.name,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))));
}));
// Delete session
chatRouter.delete('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const sessionId = getRouteParam(req.params['sessionId']);
    if (!sessionId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'sessionId is required',
        }));
        return;
    }
    const deleted = await deleteSession(sessionId);
    if (!deleted) {
        res.status(404).json(createErrorResponse({
            code: 'SESSION_NOT_FOUND',
            message: 'Chat session not found',
        }));
        return;
    }
    res.json(createSuccessResponse({ deleted: true }));
}));
// CHANGE: New endpoint to change OpenAI model dynamically
// Set AI model
chatRouter.put('/model', requireAI(), asyncHandler(async (req, res) => {
    const { model } = req.body;
    if (!model || typeof model !== 'string') {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'Model name is required',
        }));
        return;
    }
    try {
        setModel(model);
        const config = getAIConfig();
        res.json(createSuccessResponse({
            model: config.model,
            message: `Model changed to ${model}`,
        }));
    }
    catch (error) {
        res.status(400).json(createErrorResponse({
            code: 'UNSUPPORTED_MODEL',
            message: error instanceof Error ? error.message : 'Invalid model',
        }));
    }
}));
//# sourceMappingURL=chat.js.map