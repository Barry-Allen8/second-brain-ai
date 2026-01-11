/**
 * Context Space management service.
 * Handles CRUD operations for spaces and their components.
 */
import type { EntityId, SpaceMetadata, Fact, Note, ProfileEntry, TimelineEntry, CompactContext, ContextSpace } from '../types/index.js';
import type { CreateSpaceRequest, UpdateSpaceRequest, AddFactRequest, UpdateFactRequest, AddNoteRequest, UpdateNoteRequest, PromoteNoteRequest, AddProfileEntryRequest, UpdateProfileEntryRequest, AddTimelineEntryRequest, SpaceListItem, QueryContextRequest } from '../types/api.js';
export declare class SpaceService {
    init(): Promise<void>;
    createSpace(request: CreateSpaceRequest): Promise<SpaceMetadata>;
    getSpace(spaceId: EntityId): Promise<ContextSpace>;
    updateSpace(spaceId: EntityId, request: UpdateSpaceRequest): Promise<SpaceMetadata>;
    deleteSpace(spaceId: EntityId): Promise<void>;
    listSpaces(): Promise<SpaceListItem[]>;
    addFact(spaceId: EntityId, request: AddFactRequest): Promise<Fact>;
    updateFact(spaceId: EntityId, factId: EntityId, request: UpdateFactRequest): Promise<Fact>;
    deleteFact(spaceId: EntityId, factId: EntityId): Promise<void>;
    getFacts(spaceId: EntityId): Promise<Fact[]>;
    addNote(spaceId: EntityId, request: AddNoteRequest): Promise<Note>;
    updateNote(spaceId: EntityId, noteId: EntityId, request: UpdateNoteRequest): Promise<Note>;
    deleteNote(spaceId: EntityId, noteId: EntityId): Promise<void>;
    getNotes(spaceId: EntityId): Promise<Note[]>;
    promoteNoteToFact(spaceId: EntityId, noteId: EntityId, request: PromoteNoteRequest): Promise<Fact>;
    addProfileEntry(spaceId: EntityId, request: AddProfileEntryRequest): Promise<ProfileEntry>;
    updateProfileEntry(spaceId: EntityId, entryId: EntityId, request: UpdateProfileEntryRequest): Promise<ProfileEntry>;
    deleteProfileEntry(spaceId: EntityId, entryId: EntityId): Promise<void>;
    getProfile(spaceId: EntityId): Promise<ProfileEntry[]>;
    addTimelineEntry(spaceId: EntityId, request: AddTimelineEntryRequest): Promise<TimelineEntry>;
    getTimeline(spaceId: EntityId, limit?: number): Promise<TimelineEntry[]>;
    queryContext(request: QueryContextRequest): Promise<CompactContext>;
    /** Estimate token count for a context (rough approximation) */
    estimateTokens(context: CompactContext): number;
}
export declare const spaceService: SpaceService;
//# sourceMappingURL=space.d.ts.map