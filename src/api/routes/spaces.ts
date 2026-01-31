/**
 * Space management routes.
 */

import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { spaceService } from '../../domain/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
} from '../middleware.js';
import {
  createSpaceRequestSchema,
  updateSpaceRequestSchema,
  queryContextRequestSchema,
} from '../../schemas/index.js';

export const spacesRouter: ExpressRouter = Router();

function getRouteParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

// List all spaces
spacesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const spaces = await spaceService.listSpaces();
    res.json(createSuccessResponse(spaces));
  })
);

// Create new space
spacesRouter.post(
  '/',
  validateBody(createSpaceRequestSchema),
  asyncHandler(async (req, res) => {
    const space = await spaceService.createSpace(req.body);
    res.status(201).json(createSuccessResponse(space));
  })
);

// Get space by ID
spacesRouter.get(
  '/:spaceId',
  asyncHandler(async (req, res) => {
    const spaceId = getRouteParam(req.params['spaceId']);
    if (!spaceId) {
      res.status(400).json(createErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'spaceId is required',
      }));
      return;
    }
    const space = await spaceService.getSpace(spaceId);
    res.json(createSuccessResponse(space));
  })
);

// Update space
spacesRouter.patch(
  '/:spaceId',
  validateBody(updateSpaceRequestSchema),
  asyncHandler(async (req, res) => {
    const spaceId = getRouteParam(req.params['spaceId']);
    if (!spaceId) {
      res.status(400).json(createErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'spaceId is required',
      }));
      return;
    }
    const space = await spaceService.updateSpace(spaceId, req.body);
    res.json(createSuccessResponse(space));
  })
);

// Delete space
spacesRouter.delete(
  '/:spaceId',
  asyncHandler(async (req, res) => {
    const spaceId = getRouteParam(req.params['spaceId']);
    if (!spaceId) {
      res.status(400).json(createErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'spaceId is required',
      }));
      return;
    }
    await spaceService.deleteSpace(spaceId);
    res.json(createSuccessResponse({ deleted: true }));
  })
);

// Query context for AI prompt construction
spacesRouter.post(
  '/:spaceId/context',
  validateBody(queryContextRequestSchema.omit({ spaceId: true })),
  asyncHandler(async (req, res) => {
    const spaceId = getRouteParam(req.params['spaceId']);
    if (!spaceId) {
      res.status(400).json(createErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'spaceId is required',
      }));
      return;
    }
    const context = await spaceService.queryContext({
      spaceId,
      ...req.body,
    });
    const tokensEstimate = spaceService.estimateTokens(context);
    res.json(createSuccessResponse({ context, tokensEstimate }));
  })
);
