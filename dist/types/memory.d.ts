/**
 * Core type definitions for the memory system.
 * All types are designed for future vector search compatibility.
 */
/** Unique identifier for entities */
export type EntityId = string;
/** ISO 8601 timestamp */
export type Timestamp = string;
/** Confidence level for facts and notes */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'verified';
/** Source of information */
export interface Source {
    type: 'user_input' | 'inference' | 'external' | 'observation';
    reference?: string;
    timestamp: Timestamp;
}
/** Base entity with common fields */
export interface BaseEntity {
    id: EntityId;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
/** Context space metadata and rules */
export interface SpaceMetadata extends BaseEntity {
    name: string;
    description: string;
    icon?: string | null;
    color?: string | null;
    tags: string[];
    rules: SpaceRules;
    isActive: boolean;
}
/** Rules that govern context space behavior */
export interface SpaceRules {
    /** Allow health-related data (requires extra privacy handling) */
    allowHealthData: boolean;
    /** Maximum age of notes before auto-archive (days, 0 = never) */
    noteRetentionDays: number;
    /** Require explicit confirmation before promoting notes to facts */
    requireFactConfirmation: boolean;
    /** Custom instructions for AI when using this space */
    customInstructions?: string;
}
/** Stable profile characteristics */
export interface ProfileEntry extends BaseEntity {
    category: string;
    key: string;
    value: string | number | boolean | string[];
    source: Source;
    validFrom?: Timestamp;
    validUntil?: Timestamp;
}
/** Profile container */
export interface Profile {
    entries: ProfileEntry[];
    lastUpdated: Timestamp;
}
/** Verified factual statement */
export interface Fact extends BaseEntity {
    category: string;
    statement: string;
    confidence: ConfidenceLevel;
    source: Source;
    tags: string[];
    relatedFactIds: EntityId[];
    /** For future embedding support */
    embedding?: number[];
}
/** Facts container */
export interface Facts {
    items: Fact[];
    lastUpdated: Timestamp;
}
/** Unverified observation or note */
export interface Note extends BaseEntity {
    content: string;
    category?: string;
    importance: 'low' | 'medium' | 'high';
    source: Source;
    tags: string[];
    /** Whether this note is a candidate for fact promotion */
    factCandidate: boolean;
    /** Reference to promoted fact if promoted */
    promotedToFactId?: EntityId;
    /** For future embedding support */
    embedding?: number[];
}
/** Notes container */
export interface Notes {
    items: Note[];
    lastUpdated: Timestamp;
}
/** Timeline event types */
export type TimelineEventType = 'fact_added' | 'fact_updated' | 'fact_removed' | 'note_added' | 'note_promoted' | 'profile_updated' | 'milestone' | 'observation' | 'custom';
/** Timeline entry for tracking changes over time */
export interface TimelineEntry extends BaseEntity {
    timestamp: Timestamp;
    eventType: TimelineEventType;
    title: string;
    description?: string;
    relatedEntityId?: EntityId;
    relatedEntityType?: 'fact' | 'note' | 'profile';
    metadata?: Record<string, unknown>;
    tags: string[];
}
/** Timeline container */
export interface Timeline {
    entries: TimelineEntry[];
    lastUpdated: Timestamp;
}
/** Complete context space structure */
export interface ContextSpace {
    metadata: SpaceMetadata;
    profile: Profile;
    facts: Facts;
    notes: Notes;
    timeline: Timeline;
}
/** Compact context for prompt construction */
export interface CompactContext {
    spaceId: EntityId;
    spaceName: string;
    profileSummary: Pick<ProfileEntry, 'category' | 'key' | 'value'>[];
    relevantFacts: Pick<Fact, 'category' | 'statement' | 'confidence'>[];
    relevantNotes: Pick<Note, 'content' | 'importance'>[];
    recentTimeline: Pick<TimelineEntry, 'timestamp' | 'title' | 'eventType'>[];
}
//# sourceMappingURL=memory.d.ts.map