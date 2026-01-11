"use strict";
/**
 * Zod validation schemas for all memory entities.
 * These provide runtime validation and type inference.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationParamsSchema = exports.queryContextRequestSchema = exports.addTimelineEntryRequestSchema = exports.updateProfileEntryRequestSchema = exports.addProfileEntryRequestSchema = exports.promoteNoteRequestSchema = exports.updateNoteRequestSchema = exports.addNoteRequestSchema = exports.updateFactRequestSchema = exports.addFactRequestSchema = exports.updateSpaceRequestSchema = exports.createSpaceRequestSchema = exports.timelineSchema = exports.timelineEntrySchema = exports.timelineEventTypeSchema = exports.notesSchema = exports.noteSchema = exports.noteImportanceSchema = exports.factsSchema = exports.factSchema = exports.profileSchema = exports.profileEntrySchema = exports.spaceMetadataSchema = exports.spaceRulesSchema = exports.sourceSchema = exports.sourceTypeSchema = exports.confidenceLevelSchema = exports.timestampSchema = exports.entityIdSchema = void 0;
const zod_1 = require("zod");
// Base schemas
exports.entityIdSchema = zod_1.z.string().uuid();
exports.timestampSchema = zod_1.z.string().datetime();
exports.confidenceLevelSchema = zod_1.z.enum(['low', 'medium', 'high', 'verified']);
exports.sourceTypeSchema = zod_1.z.enum(['user_input', 'inference', 'external', 'observation']);
exports.sourceSchema = zod_1.z.object({
    type: exports.sourceTypeSchema,
    reference: zod_1.z.string().optional(),
    timestamp: exports.timestampSchema,
});
// Space rules
exports.spaceRulesSchema = zod_1.z.object({
    allowHealthData: zod_1.z.boolean(),
    noteRetentionDays: zod_1.z.number().int().min(0),
    requireFactConfirmation: zod_1.z.boolean(),
    customInstructions: zod_1.z.string().max(2000).optional(),
});
// Space metadata
exports.spaceMetadataSchema = zod_1.z.object({
    id: exports.entityIdSchema,
    createdAt: exports.timestampSchema,
    updatedAt: exports.timestampSchema,
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500),
    icon: zod_1.z.string().max(50).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20),
    rules: exports.spaceRulesSchema,
    isActive: zod_1.z.boolean(),
});
// Profile
exports.profileEntrySchema = zod_1.z.object({
    id: exports.entityIdSchema,
    createdAt: exports.timestampSchema,
    updatedAt: exports.timestampSchema,
    category: zod_1.z.string().min(1).max(50),
    key: zod_1.z.string().min(1).max(100),
    value: zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.number(),
        zod_1.z.boolean(),
        zod_1.z.array(zod_1.z.string()),
    ]),
    source: exports.sourceSchema,
    validFrom: exports.timestampSchema.optional(),
    validUntil: exports.timestampSchema.optional(),
});
exports.profileSchema = zod_1.z.object({
    entries: zod_1.z.array(exports.profileEntrySchema),
    lastUpdated: exports.timestampSchema,
});
// Facts
exports.factSchema = zod_1.z.object({
    id: exports.entityIdSchema,
    createdAt: exports.timestampSchema,
    updatedAt: exports.timestampSchema,
    category: zod_1.z.string().min(1).max(50),
    statement: zod_1.z.string().min(1).max(1000),
    confidence: exports.confidenceLevelSchema,
    source: exports.sourceSchema,
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20),
    relatedFactIds: zod_1.z.array(exports.entityIdSchema),
    embedding: zod_1.z.array(zod_1.z.number()).optional(),
});
exports.factsSchema = zod_1.z.object({
    items: zod_1.z.array(exports.factSchema),
    lastUpdated: exports.timestampSchema,
});
// Notes
exports.noteImportanceSchema = zod_1.z.enum(['low', 'medium', 'high']);
exports.noteSchema = zod_1.z.object({
    id: exports.entityIdSchema,
    createdAt: exports.timestampSchema,
    updatedAt: exports.timestampSchema,
    content: zod_1.z.string().min(1).max(5000),
    category: zod_1.z.string().max(50).optional(),
    importance: exports.noteImportanceSchema,
    source: exports.sourceSchema,
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20),
    factCandidate: zod_1.z.boolean(),
    promotedToFactId: exports.entityIdSchema.optional(),
    embedding: zod_1.z.array(zod_1.z.number()).optional(),
});
exports.notesSchema = zod_1.z.object({
    items: zod_1.z.array(exports.noteSchema),
    lastUpdated: exports.timestampSchema,
});
// Timeline
exports.timelineEventTypeSchema = zod_1.z.enum([
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
exports.timelineEntrySchema = zod_1.z.object({
    id: exports.entityIdSchema,
    createdAt: exports.timestampSchema,
    updatedAt: exports.timestampSchema,
    timestamp: exports.timestampSchema,
    eventType: exports.timelineEventTypeSchema,
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    relatedEntityId: exports.entityIdSchema.optional(),
    relatedEntityType: zod_1.z.enum(['fact', 'note', 'profile']).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20),
});
exports.timelineSchema = zod_1.z.object({
    entries: zod_1.z.array(exports.timelineEntrySchema),
    lastUpdated: exports.timestampSchema,
});
// API Request schemas
exports.createSpaceRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500),
    icon: zod_1.z.string().max(50).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    rules: exports.spaceRulesSchema.partial().optional(),
});
exports.updateSpaceRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    icon: zod_1.z.string().max(50).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    rules: exports.spaceRulesSchema.partial().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.addFactRequestSchema = zod_1.z.object({
    category: zod_1.z.string().min(1).max(50),
    statement: zod_1.z.string().min(1).max(1000),
    confidence: exports.confidenceLevelSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    relatedFactIds: zod_1.z.array(exports.entityIdSchema).optional(),
    sourceType: exports.sourceTypeSchema.optional(),
    sourceReference: zod_1.z.string().max(500).optional(),
});
exports.updateFactRequestSchema = zod_1.z.object({
    category: zod_1.z.string().min(1).max(50).optional(),
    statement: zod_1.z.string().min(1).max(1000).optional(),
    confidence: exports.confidenceLevelSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    relatedFactIds: zod_1.z.array(exports.entityIdSchema).optional(),
});
exports.addNoteRequestSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
    category: zod_1.z.string().max(50).optional(),
    importance: exports.noteImportanceSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    factCandidate: zod_1.z.boolean().optional(),
    sourceType: exports.sourceTypeSchema.optional(),
    sourceReference: zod_1.z.string().max(500).optional(),
});
exports.updateNoteRequestSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000).optional(),
    category: zod_1.z.string().max(50).optional(),
    importance: exports.noteImportanceSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    factCandidate: zod_1.z.boolean().optional(),
});
exports.promoteNoteRequestSchema = zod_1.z.object({
    category: zod_1.z.string().min(1).max(50),
    statement: zod_1.z.string().min(1).max(1000),
    confidence: exports.confidenceLevelSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
});
exports.addProfileEntryRequestSchema = zod_1.z.object({
    category: zod_1.z.string().min(1).max(50),
    key: zod_1.z.string().min(1).max(100),
    value: zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.number(),
        zod_1.z.boolean(),
        zod_1.z.array(zod_1.z.string()),
    ]),
    sourceType: exports.sourceTypeSchema.optional(),
    sourceReference: zod_1.z.string().max(500).optional(),
    validFrom: exports.timestampSchema.optional(),
    validUntil: exports.timestampSchema.optional(),
});
exports.updateProfileEntryRequestSchema = zod_1.z.object({
    value: zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.number(),
        zod_1.z.boolean(),
        zod_1.z.array(zod_1.z.string()),
    ]).optional(),
    validFrom: exports.timestampSchema.optional(),
    validUntil: exports.timestampSchema.optional(),
});
exports.addTimelineEntryRequestSchema = zod_1.z.object({
    eventType: exports.timelineEventTypeSchema,
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    relatedEntityId: exports.entityIdSchema.optional(),
    relatedEntityType: zod_1.z.enum(['fact', 'note', 'profile']).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    timestamp: exports.timestampSchema.optional(),
});
exports.queryContextRequestSchema = zod_1.z.object({
    spaceId: exports.entityIdSchema,
    query: zod_1.z.string().max(1000).optional(),
    categories: zod_1.z.array(zod_1.z.string().max(50)).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).optional(),
    includeNotes: zod_1.z.boolean().optional(),
    maxFacts: zod_1.z.number().int().min(1).max(100).optional(),
    maxNotes: zod_1.z.number().int().min(1).max(50).optional(),
    maxTimelineEntries: zod_1.z.number().int().min(1).max(50).optional(),
});
exports.paginationParamsSchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    offset: zod_1.z.number().int().min(0).default(0),
});
//# sourceMappingURL=validation.js.map