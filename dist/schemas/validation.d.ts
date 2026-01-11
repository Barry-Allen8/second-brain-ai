/**
 * Zod validation schemas for all memory entities.
 * These provide runtime validation and type inference.
 */
import { z } from 'zod';
export declare const entityIdSchema: z.ZodString;
export declare const timestampSchema: z.ZodString;
export declare const confidenceLevelSchema: z.ZodEnum<["low", "medium", "high", "verified"]>;
export declare const sourceTypeSchema: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
export declare const sourceSchema: z.ZodObject<{
    type: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
    reference: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    type: "user_input" | "inference" | "external" | "observation";
    reference?: string | undefined;
}, {
    timestamp: string;
    type: "user_input" | "inference" | "external" | "observation";
    reference?: string | undefined;
}>;
export declare const spaceRulesSchema: z.ZodObject<{
    allowHealthData: z.ZodBoolean;
    noteRetentionDays: z.ZodNumber;
    requireFactConfirmation: z.ZodBoolean;
    customInstructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    allowHealthData: boolean;
    noteRetentionDays: number;
    requireFactConfirmation: boolean;
    customInstructions?: string | undefined;
}, {
    allowHealthData: boolean;
    noteRetentionDays: number;
    requireFactConfirmation: boolean;
    customInstructions?: string | undefined;
}>;
export declare const spaceMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString, "many">;
    rules: z.ZodObject<{
        allowHealthData: z.ZodBoolean;
        noteRetentionDays: z.ZodNumber;
        requireFactConfirmation: z.ZodBoolean;
        customInstructions: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        allowHealthData: boolean;
        noteRetentionDays: number;
        requireFactConfirmation: boolean;
        customInstructions?: string | undefined;
    }, {
        allowHealthData: boolean;
        noteRetentionDays: number;
        requireFactConfirmation: boolean;
        customInstructions?: string | undefined;
    }>;
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    description: string;
    rules: {
        allowHealthData: boolean;
        noteRetentionDays: number;
        requireFactConfirmation: boolean;
        customInstructions?: string | undefined;
    };
    name: string;
    isActive: boolean;
    icon?: string | undefined;
    color?: string | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    description: string;
    rules: {
        allowHealthData: boolean;
        noteRetentionDays: number;
        requireFactConfirmation: boolean;
        customInstructions?: string | undefined;
    };
    name: string;
    isActive: boolean;
    icon?: string | undefined;
    color?: string | undefined;
}>;
export declare const profileEntrySchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    category: z.ZodString;
    key: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString, "many">]>;
    source: z.ZodObject<{
        type: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
        reference: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    }, {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    }>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: string;
    key: string;
    value: string | number | boolean | string[];
    source: {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}, {
    category: string;
    key: string;
    value: string | number | boolean | string[];
    source: {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}>;
export declare const profileSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        category: z.ZodString;
        key: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString, "many">]>;
        source: z.ZodObject<{
            type: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
            reference: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        }, {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        }>;
        validFrom: z.ZodOptional<z.ZodString>;
        validUntil: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        category: string;
        key: string;
        value: string | number | boolean | string[];
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        validFrom?: string | undefined;
        validUntil?: string | undefined;
    }, {
        category: string;
        key: string;
        value: string | number | boolean | string[];
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        validFrom?: string | undefined;
        validUntil?: string | undefined;
    }>, "many">;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entries: {
        category: string;
        key: string;
        value: string | number | boolean | string[];
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        validFrom?: string | undefined;
        validUntil?: string | undefined;
    }[];
    lastUpdated: string;
}, {
    entries: {
        category: string;
        key: string;
        value: string | number | boolean | string[];
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        validFrom?: string | undefined;
        validUntil?: string | undefined;
    }[];
    lastUpdated: string;
}>;
export declare const factSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    category: z.ZodString;
    statement: z.ZodString;
    confidence: z.ZodEnum<["low", "medium", "high", "verified"]>;
    source: z.ZodObject<{
        type: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
        reference: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    }, {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    }>;
    tags: z.ZodArray<z.ZodString, "many">;
    relatedFactIds: z.ZodArray<z.ZodString, "many">;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    category: string;
    source: {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    statement: string;
    confidence: "low" | "medium" | "high" | "verified";
    tags: string[];
    relatedFactIds: string[];
    embedding?: number[] | undefined;
}, {
    category: string;
    source: {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    statement: string;
    confidence: "low" | "medium" | "high" | "verified";
    tags: string[];
    relatedFactIds: string[];
    embedding?: number[] | undefined;
}>;
export declare const factsSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        category: z.ZodString;
        statement: z.ZodString;
        confidence: z.ZodEnum<["low", "medium", "high", "verified"]>;
        source: z.ZodObject<{
            type: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
            reference: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        }, {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        }>;
        tags: z.ZodArray<z.ZodString, "many">;
        relatedFactIds: z.ZodArray<z.ZodString, "many">;
        embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        category: string;
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        statement: string;
        confidence: "low" | "medium" | "high" | "verified";
        tags: string[];
        relatedFactIds: string[];
        embedding?: number[] | undefined;
    }, {
        category: string;
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        statement: string;
        confidence: "low" | "medium" | "high" | "verified";
        tags: string[];
        relatedFactIds: string[];
        embedding?: number[] | undefined;
    }>, "many">;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    lastUpdated: string;
    items: {
        category: string;
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        statement: string;
        confidence: "low" | "medium" | "high" | "verified";
        tags: string[];
        relatedFactIds: string[];
        embedding?: number[] | undefined;
    }[];
}, {
    lastUpdated: string;
    items: {
        category: string;
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        statement: string;
        confidence: "low" | "medium" | "high" | "verified";
        tags: string[];
        relatedFactIds: string[];
        embedding?: number[] | undefined;
    }[];
}>;
export declare const noteImportanceSchema: z.ZodEnum<["low", "medium", "high"]>;
export declare const noteSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    content: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    importance: z.ZodEnum<["low", "medium", "high"]>;
    source: z.ZodObject<{
        type: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
        reference: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    }, {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    }>;
    tags: z.ZodArray<z.ZodString, "many">;
    factCandidate: z.ZodBoolean;
    promotedToFactId: z.ZodOptional<z.ZodString>;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    source: {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    content: string;
    importance: "low" | "medium" | "high";
    factCandidate: boolean;
    category?: string | undefined;
    embedding?: number[] | undefined;
    promotedToFactId?: string | undefined;
}, {
    source: {
        timestamp: string;
        type: "user_input" | "inference" | "external" | "observation";
        reference?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    content: string;
    importance: "low" | "medium" | "high";
    factCandidate: boolean;
    category?: string | undefined;
    embedding?: number[] | undefined;
    promotedToFactId?: string | undefined;
}>;
export declare const notesSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        content: z.ZodString;
        category: z.ZodOptional<z.ZodString>;
        importance: z.ZodEnum<["low", "medium", "high"]>;
        source: z.ZodObject<{
            type: z.ZodEnum<["user_input", "inference", "external", "observation"]>;
            reference: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        }, {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        }>;
        tags: z.ZodArray<z.ZodString, "many">;
        factCandidate: z.ZodBoolean;
        promotedToFactId: z.ZodOptional<z.ZodString>;
        embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        content: string;
        importance: "low" | "medium" | "high";
        factCandidate: boolean;
        category?: string | undefined;
        embedding?: number[] | undefined;
        promotedToFactId?: string | undefined;
    }, {
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        content: string;
        importance: "low" | "medium" | "high";
        factCandidate: boolean;
        category?: string | undefined;
        embedding?: number[] | undefined;
        promotedToFactId?: string | undefined;
    }>, "many">;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    lastUpdated: string;
    items: {
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        content: string;
        importance: "low" | "medium" | "high";
        factCandidate: boolean;
        category?: string | undefined;
        embedding?: number[] | undefined;
        promotedToFactId?: string | undefined;
    }[];
}, {
    lastUpdated: string;
    items: {
        source: {
            timestamp: string;
            type: "user_input" | "inference" | "external" | "observation";
            reference?: string | undefined;
        };
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        content: string;
        importance: "low" | "medium" | "high";
        factCandidate: boolean;
        category?: string | undefined;
        embedding?: number[] | undefined;
        promotedToFactId?: string | undefined;
    }[];
}>;
export declare const timelineEventTypeSchema: z.ZodEnum<["fact_added", "fact_updated", "fact_removed", "note_added", "note_promoted", "profile_updated", "milestone", "observation", "custom"]>;
export declare const timelineEntrySchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    timestamp: z.ZodString;
    eventType: z.ZodEnum<["fact_added", "fact_updated", "fact_removed", "note_added", "note_promoted", "profile_updated", "milestone", "observation", "custom"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    relatedEntityId: z.ZodOptional<z.ZodString>;
    relatedEntityType: z.ZodOptional<z.ZodEnum<["fact", "note", "profile"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tags: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    timestamp: string;
    title: string;
    eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
    description?: string | undefined;
    relatedEntityId?: string | undefined;
    relatedEntityType?: "fact" | "note" | "profile" | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    timestamp: string;
    title: string;
    eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
    description?: string | undefined;
    relatedEntityId?: string | undefined;
    relatedEntityType?: "fact" | "note" | "profile" | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const timelineSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        timestamp: z.ZodString;
        eventType: z.ZodEnum<["fact_added", "fact_updated", "fact_removed", "note_added", "note_promoted", "profile_updated", "milestone", "observation", "custom"]>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        relatedEntityId: z.ZodOptional<z.ZodString>;
        relatedEntityType: z.ZodOptional<z.ZodEnum<["fact", "note", "profile"]>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        tags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        timestamp: string;
        title: string;
        eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
        description?: string | undefined;
        relatedEntityId?: string | undefined;
        relatedEntityType?: "fact" | "note" | "profile" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        timestamp: string;
        title: string;
        eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
        description?: string | undefined;
        relatedEntityId?: string | undefined;
        relatedEntityType?: "fact" | "note" | "profile" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entries: {
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        timestamp: string;
        title: string;
        eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
        description?: string | undefined;
        relatedEntityId?: string | undefined;
        relatedEntityType?: "fact" | "note" | "profile" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    lastUpdated: string;
}, {
    entries: {
        id: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        timestamp: string;
        title: string;
        eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
        description?: string | undefined;
        relatedEntityId?: string | undefined;
        relatedEntityType?: "fact" | "note" | "profile" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    lastUpdated: string;
}>;
export declare const createSpaceRequestSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    rules: z.ZodOptional<z.ZodObject<{
        allowHealthData: z.ZodOptional<z.ZodBoolean>;
        noteRetentionDays: z.ZodOptional<z.ZodNumber>;
        requireFactConfirmation: z.ZodOptional<z.ZodBoolean>;
        customInstructions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    }, {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    tags?: string[] | undefined;
    rules?: {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    } | undefined;
    icon?: string | undefined;
    color?: string | undefined;
}, {
    description: string;
    name: string;
    tags?: string[] | undefined;
    rules?: {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    } | undefined;
    icon?: string | undefined;
    color?: string | undefined;
}>;
export declare const updateSpaceRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    rules: z.ZodOptional<z.ZodObject<{
        allowHealthData: z.ZodOptional<z.ZodBoolean>;
        noteRetentionDays: z.ZodOptional<z.ZodNumber>;
        requireFactConfirmation: z.ZodOptional<z.ZodBoolean>;
        customInstructions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    }, {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    }>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tags?: string[] | undefined;
    description?: string | undefined;
    rules?: {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    } | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    isActive?: boolean | undefined;
}, {
    tags?: string[] | undefined;
    description?: string | undefined;
    rules?: {
        allowHealthData?: boolean | undefined;
        noteRetentionDays?: number | undefined;
        requireFactConfirmation?: boolean | undefined;
        customInstructions?: string | undefined;
    } | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const addFactRequestSchema: z.ZodObject<{
    category: z.ZodString;
    statement: z.ZodString;
    confidence: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "verified"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relatedFactIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sourceType: z.ZodOptional<z.ZodEnum<["user_input", "inference", "external", "observation"]>>;
    sourceReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: string;
    statement: string;
    confidence?: "low" | "medium" | "high" | "verified" | undefined;
    tags?: string[] | undefined;
    relatedFactIds?: string[] | undefined;
    sourceType?: "user_input" | "inference" | "external" | "observation" | undefined;
    sourceReference?: string | undefined;
}, {
    category: string;
    statement: string;
    confidence?: "low" | "medium" | "high" | "verified" | undefined;
    tags?: string[] | undefined;
    relatedFactIds?: string[] | undefined;
    sourceType?: "user_input" | "inference" | "external" | "observation" | undefined;
    sourceReference?: string | undefined;
}>;
export declare const updateFactRequestSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    statement: z.ZodOptional<z.ZodString>;
    confidence: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "verified"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relatedFactIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    category?: string | undefined;
    statement?: string | undefined;
    confidence?: "low" | "medium" | "high" | "verified" | undefined;
    tags?: string[] | undefined;
    relatedFactIds?: string[] | undefined;
}, {
    category?: string | undefined;
    statement?: string | undefined;
    confidence?: "low" | "medium" | "high" | "verified" | undefined;
    tags?: string[] | undefined;
    relatedFactIds?: string[] | undefined;
}>;
export declare const addNoteRequestSchema: z.ZodObject<{
    content: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    importance: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    factCandidate: z.ZodOptional<z.ZodBoolean>;
    sourceType: z.ZodOptional<z.ZodEnum<["user_input", "inference", "external", "observation"]>>;
    sourceReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    category?: string | undefined;
    tags?: string[] | undefined;
    importance?: "low" | "medium" | "high" | undefined;
    factCandidate?: boolean | undefined;
    sourceType?: "user_input" | "inference" | "external" | "observation" | undefined;
    sourceReference?: string | undefined;
}, {
    content: string;
    category?: string | undefined;
    tags?: string[] | undefined;
    importance?: "low" | "medium" | "high" | undefined;
    factCandidate?: boolean | undefined;
    sourceType?: "user_input" | "inference" | "external" | "observation" | undefined;
    sourceReference?: string | undefined;
}>;
export declare const updateNoteRequestSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    importance: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    factCandidate: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    category?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    importance?: "low" | "medium" | "high" | undefined;
    factCandidate?: boolean | undefined;
}, {
    category?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    importance?: "low" | "medium" | "high" | undefined;
    factCandidate?: boolean | undefined;
}>;
export declare const promoteNoteRequestSchema: z.ZodObject<{
    category: z.ZodString;
    statement: z.ZodString;
    confidence: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "verified"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    category: string;
    statement: string;
    confidence?: "low" | "medium" | "high" | "verified" | undefined;
    tags?: string[] | undefined;
}, {
    category: string;
    statement: string;
    confidence?: "low" | "medium" | "high" | "verified" | undefined;
    tags?: string[] | undefined;
}>;
export declare const addProfileEntryRequestSchema: z.ZodObject<{
    category: z.ZodString;
    key: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString, "many">]>;
    sourceType: z.ZodOptional<z.ZodEnum<["user_input", "inference", "external", "observation"]>>;
    sourceReference: z.ZodOptional<z.ZodString>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: string;
    key: string;
    value: string | number | boolean | string[];
    validFrom?: string | undefined;
    validUntil?: string | undefined;
    sourceType?: "user_input" | "inference" | "external" | "observation" | undefined;
    sourceReference?: string | undefined;
}, {
    category: string;
    key: string;
    value: string | number | boolean | string[];
    validFrom?: string | undefined;
    validUntil?: string | undefined;
    sourceType?: "user_input" | "inference" | "external" | "observation" | undefined;
    sourceReference?: string | undefined;
}>;
export declare const updateProfileEntryRequestSchema: z.ZodObject<{
    value: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString, "many">]>>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value?: string | number | boolean | string[] | undefined;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}, {
    value?: string | number | boolean | string[] | undefined;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}>;
export declare const addTimelineEntryRequestSchema: z.ZodObject<{
    eventType: z.ZodEnum<["fact_added", "fact_updated", "fact_removed", "note_added", "note_promoted", "profile_updated", "milestone", "observation", "custom"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    relatedEntityId: z.ZodOptional<z.ZodString>;
    relatedEntityType: z.ZodOptional<z.ZodEnum<["fact", "note", "profile"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
    tags?: string[] | undefined;
    timestamp?: string | undefined;
    description?: string | undefined;
    relatedEntityId?: string | undefined;
    relatedEntityType?: "fact" | "note" | "profile" | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    title: string;
    eventType: "observation" | "fact_added" | "fact_updated" | "fact_removed" | "note_added" | "note_promoted" | "profile_updated" | "milestone" | "custom";
    tags?: string[] | undefined;
    timestamp?: string | undefined;
    description?: string | undefined;
    relatedEntityId?: string | undefined;
    relatedEntityType?: "fact" | "note" | "profile" | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const queryContextRequestSchema: z.ZodObject<{
    spaceId: z.ZodString;
    query: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeNotes: z.ZodOptional<z.ZodBoolean>;
    maxFacts: z.ZodOptional<z.ZodNumber>;
    maxNotes: z.ZodOptional<z.ZodNumber>;
    maxTimelineEntries: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    spaceId: string;
    tags?: string[] | undefined;
    query?: string | undefined;
    categories?: string[] | undefined;
    includeNotes?: boolean | undefined;
    maxFacts?: number | undefined;
    maxNotes?: number | undefined;
    maxTimelineEntries?: number | undefined;
}, {
    spaceId: string;
    tags?: string[] | undefined;
    query?: string | undefined;
    categories?: string[] | undefined;
    includeNotes?: boolean | undefined;
    maxFacts?: number | undefined;
    maxNotes?: number | undefined;
    maxTimelineEntries?: number | undefined;
}>;
export declare const paginationParamsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
//# sourceMappingURL=validation.d.ts.map