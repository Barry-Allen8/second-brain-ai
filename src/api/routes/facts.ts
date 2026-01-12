/**
 * Facts management routes.
 */

import { Router } from 'express';
import { spaceService } from '../../domain/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
} from '../middleware.js';
import {
  addFactRequestSchema,
  updateFactRequestSchema,
} from '../../schemas/index.js';

export const factsRouter = Router({ mergeParams: true });

// Get all facts for a space
factsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const facts = await spaceService.getFacts(req.params['spaceId']!);
    res.json(createSuccessResponse(facts));
  })
);

// Add new fact
factsRouter.post(
  '/',
  validateBody(addFactRequestSchema),
  asyncHandler(async (req, res) => {
    const fact = await spaceService.addFact(req.params['spaceId']!, req.body);
    res.status(201).json(createSuccessResponse(fact));
  })
);

// Update fact
factsRouter.patch(
  '/:factId',
  validateBody(updateFactRequestSchema),
  asyncHandler(async (req, res) => {
    const fact = await spaceService.updateFact(
      req.params['spaceId']!,
      req.params['factId']!,
      req.body
    );
    res.json(createSuccessResponse(fact));
  })
);

// Delete fact
factsRouter.delete(
  '/:factId',
  asyncHandler(async (req, res) => {
    await spaceService.deleteFact(req.params['spaceId']!, req.params['factId']!);
    res.status(204).send();
  })
);
