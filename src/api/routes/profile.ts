/**
 * Profile management routes.
 */

import { Router } from 'express';
import { spaceService } from '../../domain/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
} from '../middleware.js';
import {
  addProfileEntryRequestSchema,
  updateProfileEntryRequestSchema,
} from '../../schemas/index.js';

export const profileRouter = Router({ mergeParams: true });

// Get profile for a space
profileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const entries = await spaceService.getProfile(req.params['spaceId']!);
    res.json(createSuccessResponse(entries));
  })
);

// Add new profile entry
profileRouter.post(
  '/',
  validateBody(addProfileEntryRequestSchema),
  asyncHandler(async (req, res) => {
    const entry = await spaceService.addProfileEntry(req.params['spaceId']!, req.body);
    res.status(201).json(createSuccessResponse(entry));
  })
);

// Update profile entry
profileRouter.patch(
  '/:entryId',
  validateBody(updateProfileEntryRequestSchema),
  asyncHandler(async (req, res) => {
    const entry = await spaceService.updateProfileEntry(
      req.params['spaceId']!,
      req.params['entryId']!,
      req.body
    );
    res.json(createSuccessResponse(entry));
  })
);

// Delete profile entry
profileRouter.delete(
  '/:entryId',
  asyncHandler(async (req, res) => {
    await spaceService.deleteProfileEntry(req.params['spaceId']!, req.params['entryId']!);
    res.status(204).send();
  })
);
