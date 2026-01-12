/**
 * Timeline routes.
 */

import { Router } from 'express';
import { spaceService } from '../../domain/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
} from '../middleware.js';
import { addTimelineEntryRequestSchema } from '../../schemas/index.js';

export const timelineRouter = Router({ mergeParams: true });

// Get timeline for a space
timelineRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50;
    const entries = await spaceService.getTimeline(req.params['spaceId']!, limit);
    res.json(createSuccessResponse(entries));
  })
);

// Add custom timeline entry
timelineRouter.post(
  '/',
  validateBody(addTimelineEntryRequestSchema),
  asyncHandler(async (req, res) => {
    const entry = await spaceService.addTimelineEntry(req.params['spaceId']!, req.body);
    res.status(201).json(createSuccessResponse(entry));
  })
);
