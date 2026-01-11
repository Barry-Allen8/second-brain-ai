/**
 * File-based storage service for context spaces.
 * Designed for single-node deployment with future migration path to distributed storage.
 */
import type { EntityId, SpaceMetadata, Profile, Facts, Notes, Timeline } from '../types/index.js';
export declare class StorageError extends Error {
    readonly code: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'IO_ERROR' | 'PARSE_ERROR';
    readonly cause?: unknown | undefined;
    constructor(message: string, code: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'IO_ERROR' | 'PARSE_ERROR', cause?: unknown | undefined);
}
export declare const storage: {
    /** Initialize storage directory */
    init(): Promise<void>;
    /** Check if a space exists */
    spaceExists(spaceId: EntityId): Promise<boolean>;
    /** List all space IDs */
    listSpaceIds(): Promise<EntityId[]>;
    /** Create a new space directory with initial files */
    createSpace(spaceId: EntityId, metadata: SpaceMetadata, profile: Profile, facts: Facts, notes: Notes, timeline: Timeline): Promise<void>;
    /** Delete a space and all its files */
    deleteSpace(spaceId: EntityId): Promise<void>;
    readMetadata(spaceId: EntityId): Promise<SpaceMetadata>;
    writeMetadata(spaceId: EntityId, metadata: SpaceMetadata): Promise<void>;
    readProfile(spaceId: EntityId): Promise<Profile>;
    writeProfile(spaceId: EntityId, profile: Profile): Promise<void>;
    readFacts(spaceId: EntityId): Promise<Facts>;
    writeFacts(spaceId: EntityId, facts: Facts): Promise<void>;
    readNotes(spaceId: EntityId): Promise<Notes>;
    writeNotes(spaceId: EntityId, notes: Notes): Promise<void>;
    readTimeline(spaceId: EntityId): Promise<Timeline>;
    writeTimeline(spaceId: EntityId, timeline: Timeline): Promise<void>;
};
//# sourceMappingURL=storage.d.ts.map