/**
 * Chat API routes
 */
import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from '../../utils/index.js';
import { Readable } from 'stream';
import { storage } from '../../lib/firebase.js';
// CHANGE: Added setModel and SUPPORTED_MODELS imports
import { chat, getSession, listSessions, updateSession, deleteSession, getChatHistory, isAIConfigured, getAIConfig, setModel, SUPPORTED_MODELS, } from '../../ai/index.js';
import { asyncHandler, createSuccessResponse, createErrorResponse, requireAI, requireAuth, } from '../middleware.js';
import { spaceService } from '../../domain/index.js';
const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const uploadAttachments = upload.array('attachments');
const CHAT_ATTACHMENT_FOLDER = 'chat-attachments';
export const chatRouter = Router();
async function resolveSpaceId(preferredSpaceId, userId) {
    if (preferredSpaceId) {
        try {
            await spaceService.getSpace(preferredSpaceId, userId);
            return preferredSpaceId;
        }
        catch {
            // Fall through to resolve from user's spaces
        }
    }
    const spaces = await spaceService.listSpaces(userId);
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
    }, userId);
    return defaultSpace.id;
}
function requireUserId(res) {
    const userId = res.locals.auth?.uid;
    if (!userId) {
        throw new Error('UNAUTHORIZED');
    }
    return userId;
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
function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
async function uploadImageAttachment(file, userId) {
    try {
        const bucket = storage.bucket();
        const id = uuidv4();
        const safeFilename = sanitizeFilename(file.originalname || 'image');
        const objectPath = `${CHAT_ATTACHMENT_FOLDER}/${userId}/${Date.now()}-${id}-${safeFilename}`;
        const object = bucket.file(objectPath);
        await object.save(file.buffer, {
            resumable: false,
            metadata: {
                contentType: file.mimetype,
                cacheControl: 'public,max-age=31536000,immutable',
                metadata: {
                    originalName: file.originalname,
                    uploadedBy: userId,
                },
            },
        });
        const [signedUrl] = await object.getSignedUrl({
            action: 'read',
            // Long-lived URL for chat history rendering and model access.
            // GCS V2 signed URLs can exceed the 7-day V4 limit.
            version: 'v2',
            expires: new Date('2038-01-01T00:00:00.000Z'),
        });
        return signedUrl;
    }
    catch (error) {
        console.error('Failed to upload image attachment to Firebase Storage', error);
        return null;
    }
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
chatRouter.post('/', multipartMiddleware, requireAuth(), requireAI(), asyncHandler(async (req, res) => {
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const { messages, message } = req.body;
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
                const uploadedUrl = await uploadImageAttachment(file, userId);
                const fallbackUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                attachments.push({
                    type: 'image',
                    name: file.originalname,
                    mimeType: file.mimetype,
                    url: uploadedUrl || fallbackUrl,
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
    const resolvedSpaceId = await resolveSpaceId(normalized.spaceId, userId);
    // Image attachments are uploaded to Firebase Storage and passed as remote URLs.
    // ChatService converts them into multimodal `image_url` parts for Vision models.
    const response = await chat({
        ...normalized,
        spaceId: resolvedSpaceId,
        attachments // passing attachments just in case
    }, userId);
    logParsedChatRequest({ ...normalized, spaceId: resolvedSpaceId });
    res.json(createSuccessResponse(response));
}));
// Get session history
chatRouter.get('/sessions/:sessionId', requireAuth(), asyncHandler(async (req, res) => {
    const sessionId = getRouteParam(req.params['sessionId']);
    if (!sessionId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'sessionId is required',
        }));
        return;
    }
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const session = await getSession(sessionId, userId);
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
chatRouter.patch('/sessions/:sessionId', requireAuth(), asyncHandler(async (req, res) => {
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
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const updated = await updateSession(sessionId, { name }, userId);
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
chatRouter.get('/sessions/:sessionId/messages', requireAuth(), asyncHandler(async (req, res) => {
    const sessionId = getRouteParam(req.params['sessionId']);
    if (!sessionId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'sessionId is required',
        }));
        return;
    }
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const messages = await getChatHistory(sessionId, userId);
    res.json(createSuccessResponse(messages));
}));
// List sessions for space (Path param version - more robust)
chatRouter.get('/sessions/space/:spaceId', requireAuth(), asyncHandler(async (req, res) => {
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
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const sessions = await listSessions(spaceId, userId);
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
chatRouter.get('/sessions', requireAuth(), asyncHandler(async (req, res) => {
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
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const sessions = await listSessions(spaceId, userId);
    res.json(createSuccessResponse(sessions.map((s) => ({
        sessionId: s.id,
        name: s.name,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))));
}));
// List sessions for a space (legacy route for compatibility)
chatRouter.get('/spaces/:spaceId/sessions', requireAuth(), asyncHandler(async (req, res) => {
    const spaceId = getRouteParam(req.params['spaceId']);
    if (!spaceId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'spaceId is required',
        }));
        return;
    }
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const sessions = await listSessions(spaceId, userId);
    res.json(createSuccessResponse(sessions.map((s) => ({
        sessionId: s.id,
        name: s.name,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))));
}));
// Delete session
chatRouter.delete('/sessions/:sessionId', requireAuth(), asyncHandler(async (req, res) => {
    const sessionId = getRouteParam(req.params['sessionId']);
    if (!sessionId) {
        res.status(400).json(createErrorResponse({
            code: 'INVALID_REQUEST',
            message: 'sessionId is required',
        }));
        return;
    }
    let userId;
    try {
        userId = requireUserId(res);
    }
    catch {
        res.status(401).json(createErrorResponse({
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
        }));
        return;
    }
    const deleted = await deleteSession(sessionId, userId);
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
chatRouter.put('/model', requireAuth(), requireAI(), asyncHandler(async (req, res) => {
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