/**
 * Zod validation schemas for all memory entities.
 * These provide runtime validation and type inference.
 */
import { z } from 'zod';
// Base schemas
export const entityIdSchema = z.string().uuid();
export const timestampSchema = z.string().datetime();
export const confidenceLevelSchema = z.enum(['low', 'medium', 'high', 'verified']);
export const sourceTypeSchema = z.enum(['user_input', 'inference', 'external', 'observation']);
export const sourceSchema = z.object({
    type: sourceTypeSchema,
    reference: z.string().optional(),
    timestamp: timestampSchema,
});
// Space rules
export const spaceRulesSchema = z.object({
    allowHealthData: z.boolean(),
    noteRetentionDays: z.number().int().min(0),
    requireFactConfirmation: z.boolean(),
    customInstructions: z.string().max(2000).optional(),
});
// Space metadata
export const spaceMetadataSchema = z.object({
    id: entityIdSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    name: z.string().min(1).max(100),
    description: z.string().max(20000),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: z.array(z.string().max(50)).max(20),
    rules: spaceRulesSchema,
    isActive: z.boolean(),
});
// Profile
export const profileEntrySchema = z.object({
    id: entityIdSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    category: z.string().min(1).max(50),
    key: z.string().min(1).max(100),
    value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
    ]),
    source: sourceSchema,
    validFrom: timestampSchema.optional(),
    validUntil: timestampSchema.optional(),
});
export const profileSchema = z.object({
    entries: z.array(profileEntrySchema),
    lastUpdated: timestampSchema,
});
// Facts
export const factSchema = z.object({
    id: entityIdSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    category: z.string().min(1).max(50),
    statement: z.string().min(1).max(1000),
    confidence: confidenceLevelSchema,
    source: sourceSchema,
    tags: z.array(z.string().max(50)).max(20),
    relatedFactIds: z.array(entityIdSchema),
    embedding: z.array(z.number()).optional(),
});
export const factsSchema = z.object({
    items: z.array(factSchema),
    lastUpdated: timestampSchema,
});
// Notes
export const noteImportanceSchema = z.enum(['low', 'medium', 'high']);
export const noteSchema = z.object({
    id: entityIdSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    content: z.string().min(1).max(5000),
    category: z.string().max(50).optional(),
    importance: noteImportanceSchema,
    source: sourceSchema,
    tags: z.array(z.string().max(50)).max(20),
    factCandidate: z.boolean(),
    promotedToFactId: entityIdSchema.optional(),
    embedding: z.array(z.number()).optional(),
});
export const notesSchema = z.object({
    items: z.array(noteSchema),
    lastUpdated: timestampSchema,
});
// Timeline
export const timelineEventTypeSchema = z.enum([
    'fact_added',
    'fact_updated',
    'fact_removed',
    'note_added',
    'note_promoted',
    'profile_updated',
    'milestone',
    'observation',
    'custom',
]);
export const timelineEntrySchema = z.object({
    id: entityIdSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    timestamp: timestampSchema,
    eventType: timelineEventTypeSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    relatedEntityId: entityIdSchema.optional(),
    relatedEntityType: z.enum(['fact', 'note', 'profile']).optional(),
    metadata: z.record(z.unknown()).optional(),
    tags: z.array(z.string().max(50)).max(20),
});
export const timelineSchema = z.object({
    entries: z.array(timelineEntrySchema),
    lastUpdated: timestampSchema,
});
// API Request schemas
export const createSpaceRequestSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(20000),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    rules: spaceRulesSchema.partial().optional(),
});
export const updateSpaceRequestSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(20000).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    rules: spaceRulesSchema.partial().optional(),
    isActive: z.boolean().optional(),
});
export const addFactRequestSchema = z.object({
    category: z.string().min(1).max(50),
    statement: z.string().min(1).max(1000),
    confidence: confidenceLevelSchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    relatedFactIds: z.array(entityIdSchema).optional(),
    sourceType: sourceTypeSchema.optional(),
    sourceReference: z.string().max(500).optional(),
});
export const updateFactRequestSchema = z.object({
    category: z.string().min(1).max(50).optional(),
    statement: z.string().min(1).max(1000).optional(),
    confidence: confidenceLevelSchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    relatedFactIds: z.array(entityIdSchema).optional(),
});
export const addNoteRequestSchema = z.object({
    content: z.string().min(1).max(5000),
    category: z.string().max(50).optional(),
    importance: noteImportanceSchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    factCandidate: z.boolean().optional(),
    sourceType: sourceTypeSchema.optional(),
    sourceReference: z.string().max(500).optional(),
});
export const updateNoteRequestSchema = z.object({
    content: z.string().min(1).max(5000).optional(),
    category: z.string().max(50).optional(),
    importance: noteImportanceSchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    factCandidate: z.boolean().optional(),
});
export const promoteNoteRequestSchema = z.object({
    category: z.string().min(1).max(50),
    statement: z.string().min(1).max(1000),
    confidence: confidenceLevelSchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
});
export const addProfileEntryRequestSchema = z.object({
    category: z.string().min(1).max(50),
    key: z.string().min(1).max(100),
    value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
    ]),
    sourceType: sourceTypeSchema.optional(),
    sourceReference: z.string().max(500).optional(),
    validFrom: timestampSchema.optional(),
    validUntil: timestampSchema.optional(),
});
export const updateProfileEntryRequestSchema = z.object({
    value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
    ]).optional(),
    validFrom: timestampSchema.optional(),
    validUntil: timestampSchema.optional(),
});
export const addTimelineEntryRequestSchema = z.object({
    eventType: timelineEventTypeSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    relatedEntityId: entityIdSchema.optional(),
    relatedEntityType: z.enum(['fact', 'note', 'profile']).optional(),
    metadata: z.record(z.unknown()).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    timestamp: timestampSchema.optional(),
});
export const queryContextRequestSchema = z.object({
    spaceId: entityIdSchema,
    query: z.string().max(1000).optional(),
    categories: z.array(z.string().max(50)).optional(),
    tags: z.array(z.string().max(50)).optional(),
    includeNotes: z.boolean().optional(),
    maxFacts: z.number().int().min(1).max(100).optional(),
    maxNotes: z.number().int().min(1).max(50).optional(),
    maxTimelineEntries: z.number().int().min(1).max(50).optional(),
});
export const paginationParamsSchema = z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
});
// Chat request schema (accepts legacy and simplified payloads)
const chatMessageItemSchema = z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1).max(10000),
});
// Chat attachment schema
const chatAttachmentSchema = z.object({
    type: z.enum(['image', 'file']),
    url: z.string(),
    name: z.string(),
    mimeType: z.string(),
});
const simpleChatRequestSchema = z.object({
    message: z.string().min(1).max(10000),
    spaceId: z.preprocess((val) => (val === null || val === undefined) ? undefined : val, z.string().uuid().optional()),
    sessionId: z.preprocess((val) => (val === null || val === undefined) ? undefined : val, z.string().uuid().optional()),
    attachments: z.array(chatAttachmentSchema).optional(),
});
const structuredChatRequestSchema = z.object({
    spaceId: z.preprocess((val) => (val === null || val === undefined) ? undefined : val, z.string().uuid().optional()),
    messages: z.array(chatMessageItemSchema).min(1),
    sessionId: z.preprocess((val) => (val === null || val === undefined) ? undefined : val, z.string().uuid().optional()),
    attachments: z.array(chatAttachmentSchema).optional(),
});
export const chatRequestSchema = z.union([
    simpleChatRequestSchema,
    structuredChatRequestSchema,
]);
//# sourceMappingURL=validation.js.map