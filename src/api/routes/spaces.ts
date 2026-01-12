/**
 * Space management routes.
 */

import { Router } from 'express';
import { spaceService } from '../../domain/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
} from '../middleware.js';
import {
  createSpaceRequestSchema,
  updateSpaceRequestSchema,
  queryContextRequestSchema,
} from '../../schemas/index.js';

export const spacesRouter = Router();

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
    const space = await spaceService.getSpace(req.params['spaceId']!);
    res.json(createSuccessResponse(space));
  })
);

// Update space
spacesRouter.patch(
  '/:spaceId',
  validateBody(updateSpaceRequestSchema),
  asyncHandler(async (req, res) => {
    const space = await spaceService.updateSpace(req.params['spaceId']!, req.body);
    res.json(createSuccessResponse(space));
  })
);

// Delete space
spacesRouter.delete(
  '/:spaceId',
  asyncHandler(async (req, res) => {
    await spaceService.deleteSpace(req.params['spaceId']!);
    res.status(204).send();
  })
);

// Query context for AI prompt construction
spacesRouter.post(
  '/:spaceId/context',
  validateBody(queryContextRequestSchema.omit({ spaceId: true })),
  asyncHandler(async (req, res) => {
    const context = await spaceService.queryContext({
      spaceId: req.params['spaceId']!,
      ...req.body,
    });
    const tokensEstimate = spaceService.estimateTokens(context);
    res.json(createSuccessResponse({ context, tokensEstimate }));
  })
);
