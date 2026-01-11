/**
 * Notes management routes.
 */

import { Router } from 'express';
import { spaceService } from '../../services/index.js';
import {
  asyncHandler,
  validateBody,
  createSuccessResponse,
} from '../middleware.js';
import {
  addNoteRequestSchema,
  updateNoteRequestSchema,
  promoteNoteRequestSchema,
} from '../../schemas/index.js';

export const notesRouter = Router({ mergeParams: true });

// Get all notes for a space
notesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const notes = await spaceService.getNotes(req.params['spaceId']!);
    res.json(createSuccessResponse(notes));
  })
);

// Add new note
notesRouter.post(
  '/',
  validateBody(addNoteRequestSchema),
  asyncHandler(async (req, res) => {
    const note = await spaceService.addNote(req.params['spaceId']!, req.body);
    res.status(201).json(createSuccessResponse(note));
  })
);

// Update note
notesRouter.patch(
  '/:noteId',
  validateBody(updateNoteRequestSchema),
  asyncHandler(async (req, res) => {
    const note = await spaceService.updateNote(
      req.params['spaceId']!,
      req.params['noteId']!,
      req.body
    );
    res.json(createSuccessResponse(note));
  })
);

// Delete note
notesRouter.delete(
  '/:noteId',
  asyncHandler(async (req, res) => {
    await spaceService.deleteNote(req.params['spaceId']!, req.params['noteId']!);
    res.status(204).send();
  })
);

// Promote note to fact
notesRouter.post(
  '/:noteId/promote',
  validateBody(promoteNoteRequestSchema),
  asyncHandler(async (req, res) => {
    const fact = await spaceService.promoteNoteToFact(
      req.params['spaceId']!,
      req.params['noteId']!,
      req.body
    );
    res.status(201).json(createSuccessResponse(fact));
  })
);
