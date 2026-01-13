/**
 * Chat API routes
 */

import { Router } from 'express';
import type { z } from 'zod';
import type { ChatSession, EntityId } from '../../types/index.js';
// CHANGE: Added setModel and SUPPORTED_MODELS imports
import {
  chat,
  getSession,
  listSessions,
  updateSession,
  deleteSession,
  getChatHistory,
  isAIConfigured,
  getAIConfig,
  setModel,
  SUPPORTED_MODELS,
} from '../../ai/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
} from '../middleware.js';
import { chatRequestSchema } from '../../schemas/index.js';
import { spaceService, storage } from '../../domain/index.js';

export const chatRouter = Router();

type ChatRequestInput = z.infer<typeof chatRequestSchema>;

type NormalizedChatRequest = {
  spaceId?: EntityId;
  message: string;
  sessionId?: EntityId;
};

async function resolveSpaceId(preferredSpaceId?: EntityId): Promise<EntityId> {
  if (preferredSpaceId && await storage.spaceExists(preferredSpaceId)) {
    return preferredSpaceId;
  }

  const spaces = await spaceService.listSpaces();

  const activeSpace = spaces.find((space) => space.isActive);
  if (activeSpace) {
    return activeSpace.id;
  }

  if (spaces.length > 0) {
    return spaces[0]!.id;
  }

  const defaultSpace = await spaceService.createSpace({
    name: 'Default Space',
    description: 'Auto-created for chat requests without a space.',
    icon: 'chat',
    color: '#4f46e5',
  });

  return defaultSpace.id;
}

function normalizeChatRequest(body: ChatRequestInput): NormalizedChatRequest {
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

function logParsedChatRequest(request: NormalizedChatRequest & { spaceId: EntityId }): void {
  console.debug('[chat] parsed request', {
    spaceId: request.spaceId,
    sessionId: request.sessionId,
    messagePreview: request.message.slice(0, 80),
  });
}

// Check AI status
// CHANGE: Added supportedModels to status response
chatRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const configured = isAIConfigured();
    const config = getAIConfig();
    
    res.json(createSuccessResponse({
      configured,
      provider: config.provider,
      model: config.model,
      supportedModels: SUPPORTED_MODELS,
    }));
  })
);

// Send chat message
chatRouter.post(
  '/',
  validateBody(chatRequestSchema),
  asyncHandler(async (req, res) => {
    if (!isAIConfigured()) {
      res.status(503).json(createErrorResponse({
        code: 'AI_NOT_CONFIGURED',
        message: 'AI provider not configured. Please set OPENAI_API_KEY environment variable.',
      }));
      return;
    }

    const normalized = normalizeChatRequest(req.body as ChatRequestInput);
    const resolvedSpaceId = await resolveSpaceId(normalized.spaceId);
    const response = await chat({
      ...normalized,
      spaceId: resolvedSpaceId,
    });

    logParsedChatRequest({ ...normalized, spaceId: resolvedSpaceId });
    res.json(createSuccessResponse(response));
  })
);

// Get session history
chatRouter.get(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const sessionId = req.params['sessionId']!;
    const session = getSession(sessionId);
    
    if (!session) {
      res.status(404).json(createErrorResponse({
        code: 'SESSION_NOT_FOUND',
        message: 'Chat session not found',
      }));
      return;
    }

    res.json(createSuccessResponse(session));
  })
);

// Update session (e.g., rename)
chatRouter.patch(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const sessionId = req.params['sessionId']!;
    const { name } = req.body as { name?: string };
    
    if (!name || typeof name !== 'string') {
      res.status(400).json(createErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'Name is required',
      }));
      return;
    }
    
    const updated = updateSession(sessionId, { name });
    
    if (!updated) {
      res.status(404).json(createErrorResponse({
        code: 'SESSION_NOT_FOUND',
        message: 'Chat session not found',
      }));
      return;
    }

    res.json(createSuccessResponse(updated));
  })
);

// Get chat history for session
chatRouter.get(
  '/sessions/:sessionId/messages',
  asyncHandler(async (req, res) => {
    const sessionId = req.params['sessionId']!;
    const messages = getChatHistory(sessionId);
    
    res.json(createSuccessResponse(messages));
  })
);

// List sessions (can filter by spaceId via query param)
chatRouter.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const spaceId = req.query['spaceId'] as EntityId | undefined;
    
    if (!spaceId) {
      res.status(400).json(createErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'spaceId query parameter is required',
      }));
      return;
    }
    
    const sessions = listSessions(spaceId);
    
    res.json(createSuccessResponse(sessions.map((s: ChatSession) => ({
      sessionId: s.id,
      name: s.name,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))));
  })
);

// List sessions for a space (legacy route for compatibility)
chatRouter.get(
  '/spaces/:spaceId/sessions',
  asyncHandler(async (req, res) => {
    const spaceId = req.params['spaceId']!;
    const sessions = listSessions(spaceId);
    
    res.json(createSuccessResponse(sessions.map((s: ChatSession) => ({
      sessionId: s.id,
      name: s.name,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))));
  })
);

// Delete session
chatRouter.delete(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const sessionId = req.params['sessionId']!;
    const deleted = deleteSession(sessionId);
    
    if (!deleted) {
      res.status(404).json(createErrorResponse({
        code: 'SESSION_NOT_FOUND',
        message: 'Chat session not found',
      }));
      return;
    }

    res.status(204).send();
  })
);

// CHANGE: New endpoint to change OpenAI model dynamically
// Set AI model
chatRouter.put(
  '/model',
  asyncHandler(async (req, res) => {
    const { model } = req.body as { model?: string };
    
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
    } catch (error) {
      res.status(400).json(createErrorResponse({
        code: 'UNSUPPORTED_MODEL',
        message: error instanceof Error ? error.message : 'Invalid model',
      }));
    }
  })
);
