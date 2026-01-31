/**
 * Zod validation schemas for all memory entities.
 * These provide runtime validation and type inference.
 */
import { z } from 'zod';
export declare const entityIdSchema: z.ZodString;
export declare const timestampSchema: z.ZodString;
export declare const confidenceLevelSchema: z.ZodEnum<{
    low: "low";
    medium: "medium";
    high: "high";
    verified: "verified";
}>;
export declare const sourceTypeSchema: z.ZodEnum<{
    user_input: "user_input";
    inference: "inference";
    external: "external";
    observation: "observation";
}>;
export declare const sourceSchema: z.ZodObject<{
    type: z.ZodEnum<{
        user_input: "user_input";
        inference: "inference";
        external: "external";
        observation: "observation";
    }>;
    reference: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, z.core.$strip>;
export declare const spaceRulesSchema: z.ZodObject<{
    allowHealthData: z.ZodBoolean;
    noteRetentionDays: z.ZodNumber;
    requireFactConfirmation: z.ZodBoolean;
    customInstructions: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const spaceMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString>;
    rules: z.ZodObject<{
        allowHealthData: z.ZodBoolean;
        noteRetentionDays: z.ZodNumber;
        requireFactConfirmation: z.ZodBoolean;
        customInstructions: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    isActive: z.ZodBoolean;
}, z.core.$strip>;
export declare const profileEntrySchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    category: z.ZodString;
    key: z.ZodString;
    value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString>]>;
    source: z.ZodObject<{
        type: z.ZodEnum<{
            user_input: "user_input";
            inference: "inference";
            external: "external";
            observation: "observation";
        }>;
        reference: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, z.core.$strip>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const profileSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        category: z.ZodString;
        key: z.ZodString;
        value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString>]>;
        source: z.ZodObject<{
            type: z.ZodEnum<{
                user_input: "user_input";
                inference: "inference";
                external: "external";
                observation: "observation";
            }>;
            reference: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
        }, z.core.$strip>;
        validFrom: z.ZodOptional<z.ZodString>;
        validUntil: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    lastUpdated: z.ZodString;
}, z.core.$strip>;
export declare const factSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    category: z.ZodString;
    statement: z.ZodString;
    confidence: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        verified: "verified";
    }>;
    source: z.ZodObject<{
        type: z.ZodEnum<{
            user_input: "user_input";
            inference: "inference";
            external: "external";
            observation: "observation";
        }>;
        reference: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, z.core.$strip>;
    tags: z.ZodArray<z.ZodString>;
    relatedFactIds: z.ZodArray<z.ZodString>;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
}, z.core.$strip>;
export declare const factsSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        category: z.ZodString;
        statement: z.ZodString;
        confidence: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            verified: "verified";
        }>;
        source: z.ZodObject<{
            type: z.ZodEnum<{
                user_input: "user_input";
                inference: "inference";
                external: "external";
                observation: "observation";
            }>;
            reference: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
        }, z.core.$strip>;
        tags: z.ZodArray<z.ZodString>;
        relatedFactIds: z.ZodArray<z.ZodString>;
        embedding: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strip>>;
    lastUpdated: z.ZodString;
}, z.core.$strip>;
export declare const noteImportanceSchema: z.ZodEnum<{
    low: "low";
    medium: "medium";
    high: "high";
}>;
export declare const noteSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    content: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    importance: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    source: z.ZodObject<{
        type: z.ZodEnum<{
            user_input: "user_input";
            inference: "inference";
            external: "external";
            observation: "observation";
        }>;
        reference: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, z.core.$strip>;
    tags: z.ZodArray<z.ZodString>;
    factCandidate: z.ZodBoolean;
    promotedToFactId: z.ZodOptional<z.ZodString>;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
}, z.core.$strip>;
export declare const notesSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        content: z.ZodString;
        category: z.ZodOptional<z.ZodString>;
        importance: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        source: z.ZodObject<{
            type: z.ZodEnum<{
                user_input: "user_input";
                inference: "inference";
                external: "external";
                observation: "observation";
            }>;
            reference: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
        }, z.core.$strip>;
        tags: z.ZodArray<z.ZodString>;
        factCandidate: z.ZodBoolean;
        promotedToFactId: z.ZodOptional<z.ZodString>;
        embedding: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strip>>;
    lastUpdated: z.ZodString;
}, z.core.$strip>;
export declare const timelineEventTypeSchema: z.ZodEnum<{
    observation: "observation";
    fact_added: "fact_added";
    fact_updated: "fact_updated";
    fact_removed: "fact_removed";
    note_added: "note_added";
    note_promoted: "note_promoted";
    profile_updated: "profile_updated";
    milestone: "milestone";
    custom: "custom";
}>;
export declare const timelineEntrySchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    timestamp: z.ZodString;
    eventType: z.ZodEnum<{
        observation: "observation";
        fact_added: "fact_added";
        fact_updated: "fact_updated";
        fact_removed: "fact_removed";
        note_added: "note_added";
        note_promoted: "note_promoted";
        profile_updated: "profile_updated";
        milestone: "milestone";
        custom: "custom";
    }>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    relatedEntityId: z.ZodOptional<z.ZodString>;
    relatedEntityType: z.ZodOptional<z.ZodEnum<{
        fact: "fact";
        note: "note";
        profile: "profile";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tags: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const timelineSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        timestamp: z.ZodString;
        eventType: z.ZodEnum<{
            observation: "observation";
            fact_added: "fact_added";
            fact_updated: "fact_updated";
            fact_removed: "fact_removed";
            note_added: "note_added";
            note_promoted: "note_promoted";
            profile_updated: "profile_updated";
            milestone: "milestone";
            custom: "custom";
        }>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        relatedEntityId: z.ZodOptional<z.ZodString>;
        relatedEntityType: z.ZodOptional<z.ZodEnum<{
            fact: "fact";
            note: "note";
            profile: "profile";
        }>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        tags: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    lastUpdated: z.ZodString;
}, z.core.$strip>;
export declare const createSpaceRequestSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    rules: z.ZodOptional<z.ZodObject<{
        allowHealthData: z.ZodOptional<z.ZodBoolean>;
        noteRetentionDays: z.ZodOptional<z.ZodNumber>;
        requireFactConfirmation: z.ZodOptional<z.ZodBoolean>;
        customInstructions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const updateSpaceRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    rules: z.ZodOptional<z.ZodObject<{
        allowHealthData: z.ZodOptional<z.ZodBoolean>;
        noteRetentionDays: z.ZodOptional<z.ZodNumber>;
        requireFactConfirmation: z.ZodOptional<z.ZodBoolean>;
        customInstructions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const addFactRequestSchema: z.ZodObject<{
    category: z.ZodString;
    statement: z.ZodString;
    confidence: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        verified: "verified";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    relatedFactIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    sourceType: z.ZodOptional<z.ZodEnum<{
        user_input: "user_input";
        inference: "inference";
        external: "external";
        observation: "observation";
    }>>;
    sourceReference: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateFactRequestSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    statement: z.ZodOptional<z.ZodString>;
    confidence: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        verified: "verified";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    relatedFactIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const addNoteRequestSchema: z.ZodObject<{
    content: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    importance: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    factCandidate: z.ZodOptional<z.ZodBoolean>;
    sourceType: z.ZodOptional<z.ZodEnum<{
        user_input: "user_input";
        inference: "inference";
        external: "external";
        observation: "observation";
    }>>;
    sourceReference: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateNoteRequestSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    importance: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    factCandidate: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const promoteNoteRequestSchema: z.ZodObject<{
    category: z.ZodString;
    statement: z.ZodString;
    confidence: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        verified: "verified";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const addProfileEntryRequestSchema: z.ZodObject<{
    category: z.ZodString;
    key: z.ZodString;
    value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString>]>;
    sourceType: z.ZodOptional<z.ZodEnum<{
        user_input: "user_input";
        inference: "inference";
        external: "external";
        observation: "observation";
    }>>;
    sourceReference: z.ZodOptional<z.ZodString>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateProfileEntryRequestSchema: z.ZodObject<{
    value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addTimelineEntryRequestSchema: z.ZodObject<{
    eventType: z.ZodEnum<{
        observation: "observation";
        fact_added: "fact_added";
        fact_updated: "fact_updated";
        fact_removed: "fact_removed";
        note_added: "note_added";
        note_promoted: "note_promoted";
        profile_updated: "profile_updated";
        milestone: "milestone";
        custom: "custom";
    }>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    relatedEntityId: z.ZodOptional<z.ZodString>;
    relatedEntityType: z.ZodOptional<z.ZodEnum<{
        fact: "fact";
        note: "note";
        profile: "profile";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    timestamp: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const queryContextRequestSchema: z.ZodObject<{
    spaceId: z.ZodString;
    query: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    includeNotes: z.ZodOptional<z.ZodBoolean>;
    maxFacts: z.ZodOptional<z.ZodNumber>;
    maxNotes: z.ZodOptional<z.ZodNumber>;
    maxTimelineEntries: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const paginationParamsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const chatRequestSchema: z.ZodUnion<readonly [z.ZodObject<{
    message: z.ZodString;
    spaceId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    sessionId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            image: "image";
            file: "file";
        }>;
        url: z.ZodString;
        name: z.ZodString;
        mimeType: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>, z.ZodObject<{
    spaceId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            system: "system";
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>;
    sessionId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodOptional<z.ZodString>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            image: "image";
            file: "file";
        }>;
        url: z.ZodString;
        name: z.ZodString;
        mimeType: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>]>;
//# sourceMappingURL=validation.d.ts.map