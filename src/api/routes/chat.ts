/**
 * Chat API routes
 */

import { Router } from 'express';
import { z } from 'zod';
import type { ChatSession } from '../../types/index.js';
import {
  chat,
  getSession,
  listSessions,
  deleteSession,
  getChatHistory,
  isAIConfigured,
  getAIConfig,
} from '../../services/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
} from '../middleware.js';

export const chatRouter = Router();

// Chat request schema
const chatRequestSchema = z.object({
  spaceId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  sessionId: z.string().uuid().optional(),
});

// Check AI status
chatRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const configured = isAIConfigured();
    const config = getAIConfig();
    
    res.json(createSuccessResponse({
      configured,
      provider: config.provider,
      model: config.model,
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

    const response = await chat(req.body);
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

// Get chat history for session
chatRouter.get(
  '/sessions/:sessionId/messages',
  asyncHandler(async (req, res) => {
    const sessionId = req.params['sessionId']!;
    const messages = getChatHistory(sessionId);
    
    res.json(createSuccessResponse(messages));
  })
);

// List sessions for a space
chatRouter.get(
  '/spaces/:spaceId/sessions',
  asyncHandler(async (req, res) => {
    const spaceId = req.params['spaceId']!;
    const sessions = listSessions(spaceId);
    
    res.json(createSuccessResponse(sessions.map((s: ChatSession) => ({
      id: s.id,
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
