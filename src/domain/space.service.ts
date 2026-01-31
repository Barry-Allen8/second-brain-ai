/**
 * Context Space management service.
 * Handles CRUD operations for spaces and their components.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  EntityId,
  SpaceMetadata,
  Profile,
  Facts,
  Notes,
  Timeline,
  Fact,
  Note,
  ProfileEntry,
  TimelineEntry,
  SpaceRules,
  CompactContext,
  ContextSpace,
} from '../types/index.js';
import type {
  CreateSpaceRequest,
  UpdateSpaceRequest,
  AddFactRequest,
  UpdateFactRequest,
  AddNoteRequest,
  UpdateNoteRequest,
  PromoteNoteRequest,
  AddProfileEntryRequest,
  UpdateProfileEntryRequest,
  AddTimelineEntryRequest,
  SpaceListItem,
  QueryContextRequest,
} from '../types/api.js';
import { storage, StorageError } from './storage.service.js';
import { now } from '../utils/index.js';

function createDefaultRules(): SpaceRules {
  return {
    allowHealthData: false,
    noteRetentionDays: 90,
    requireFactConfirmation: true,
  };
}

function createEmptyProfile(): Profile {
  return { entries: [], lastUpdated: now() };
}

function createEmptyFacts(): Facts {
  return { items: [], lastUpdated: now() };
}

function createEmptyNotes(): Notes {
  return { items: [], lastUpdated: now() };
}

function createEmptyTimeline(): Timeline {
  return { entries: [], lastUpdated: now() };
}

export class SpaceService {
  async init(): Promise<void> {
    await storage.init();
  }

  // ─────────────────────────────────────────────────────────────────
  // Space CRUD
  // ─────────────────────────────────────────────────────────────────

  async createSpace(request: CreateSpaceRequest): Promise<SpaceMetadata> {
    const spaceId = uuidv4();
    const timestamp = now();

    const metadata: SpaceMetadata = {
      id: spaceId,
      createdAt: timestamp,
      updatedAt: timestamp,
      name: request.name,
      description: request.description,
      icon: request.icon ?? null,
      color: request.color ?? null,
      tags: request.tags ?? [],
      rules: { ...createDefaultRules(), ...request.rules },
      isActive: true,
    };

    await storage.createSpace(
      spaceId,
      metadata,
      createEmptyProfile(),
      createEmptyFacts(),
      createEmptyNotes(),
      createEmptyTimeline()
    );

    return metadata;
  }

  async getSpace(spaceId: EntityId): Promise<ContextSpace> {
    const [metadata, profile, facts, notes, timeline] = await Promise.all([
      storage.readMetadata(spaceId),
      storage.readProfile(spaceId),
      storage.readFacts(spaceId),
      storage.readNotes(spaceId),
      storage.readTimeline(spaceId),
    ]);

    return { metadata, profile, facts, notes, timeline };
  }

  async updateSpace(spaceId: EntityId, request: UpdateSpaceRequest): Promise<SpaceMetadata> {
    const metadata = await storage.readMetadata(spaceId);
    const timestamp = now();

    const updated: SpaceMetadata = {
      ...metadata,
      updatedAt: timestamp,
      name: request.name ?? metadata.name,
      description: request.description ?? metadata.description,
      icon: request.icon ?? metadata.icon,
      color: request.color ?? metadata.color,
      tags: request.tags ?? metadata.tags,
      rules: request.rules ? { ...metadata.rules, ...request.rules } : metadata.rules,
      isActive: request.isActive ?? metadata.isActive,
    };

    await storage.writeMetadata(spaceId, updated);
    return updated;
  }

  async deleteSpace(spaceId: EntityId): Promise<void> {
    await storage.deleteSpace(spaceId);
  }

  async listSpaces(): Promise<SpaceListItem[]> {
    const spaceIds = await storage.listSpaceIds();
    const spaces: SpaceListItem[] = [];

    for (const id of spaceIds) {
      try {
        const metadata = await storage.readMetadata(id);

        spaces.push({
          id: metadata.id,
          name: metadata.name,
          description: metadata.description,
          icon: metadata.icon,
          color: metadata.color,
          tags: metadata.tags,
          isActive: metadata.isActive,
          factCount: 0, // Deprecated but kept for compatibility
          noteCount: 0, // Deprecated but kept for compatibility
          lastUpdated: metadata.updatedAt,
        });
      } catch (error) {
        if (error instanceof StorageError && error.code === 'NOT_FOUND') {
          continue;
        }
        throw error;
      }
    }

    return spaces.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }

  // ─────────────────────────────────────────────────────────────────
  // Facts
  // ─────────────────────────────────────────────────────────────────

  async addFact(spaceId: EntityId, request: AddFactRequest): Promise<Fact> {
    const facts = await storage.readFacts(spaceId);
    const timestamp = now();

    const fact: Fact = {
      id: uuidv4(),
      createdAt: timestamp,
      updatedAt: timestamp,
      category: request.category,
      statement: request.statement,
      confidence: request.confidence ?? 'medium',
      source: {
        type: request.sourceType ?? 'user_input',
        reference: request.sourceReference,
        timestamp,
      },
      tags: request.tags ?? [],
      relatedFactIds: request.relatedFactIds ?? [],
    };

    facts.items.push(fact);
    facts.lastUpdated = timestamp;

    await storage.writeFacts(spaceId, facts);
    await this.addTimelineEntry(spaceId, {
      eventType: 'fact_added',
      title: `Fact added: ${fact.statement.slice(0, 50)}...`,
      relatedEntityId: fact.id,
      relatedEntityType: 'fact',
      tags: fact.tags,
    });

    return fact;
  }

  async updateFact(spaceId: EntityId, factId: EntityId, request: UpdateFactRequest): Promise<Fact> {
    const facts = await storage.readFacts(spaceId);
    const index = facts.items.findIndex(f => f.id === factId);

    if (index === -1) {
      throw new StorageError(`Fact not found: ${factId}`, 'NOT_FOUND');
    }

    const existing = facts.items[index]!;
    const timestamp = now();

    const updated: Fact = {
      ...existing,
      updatedAt: timestamp,
      category: request.category ?? existing.category,
      statement: request.statement ?? existing.statement,
      confidence: request.confidence ?? existing.confidence,
      tags: request.tags ?? existing.tags,
      relatedFactIds: request.relatedFactIds ?? existing.relatedFactIds,
    };

    facts.items[index] = updated;
    facts.lastUpdated = timestamp;

    await storage.writeFacts(spaceId, facts);
    await this.addTimelineEntry(spaceId, {
      eventType: 'fact_updated',
      title: `Fact updated: ${updated.statement.slice(0, 50)}...`,
      relatedEntityId: updated.id,
      relatedEntityType: 'fact',
      tags: updated.tags,
    });

    return updated;
  }

  async deleteFact(spaceId: EntityId, factId: EntityId): Promise<void> {
    const facts = await storage.readFacts(spaceId);
    const index = facts.items.findIndex(f => f.id === factId);

    if (index === -1) {
      throw new StorageError(`Fact not found: ${factId}`, 'NOT_FOUND');
    }

    const removed = facts.items[index]!;
    facts.items.splice(index, 1);
    facts.lastUpdated = now();

    await storage.writeFacts(spaceId, facts);
    await this.addTimelineEntry(spaceId, {
      eventType: 'fact_removed',
      title: `Fact removed: ${removed.statement.slice(0, 50)}...`,
      tags: removed.tags,
    });
  }

  async getFacts(spaceId: EntityId): Promise<Fact[]> {
    const facts = await storage.readFacts(spaceId);
    return facts.items;
  }

  // ─────────────────────────────────────────────────────────────────
  // Notes
  // ─────────────────────────────────────────────────────────────────

  async addNote(spaceId: EntityId, request: AddNoteRequest): Promise<Note> {
    const notes = await storage.readNotes(spaceId);
    const timestamp = now();

    const note: Note = {
      id: uuidv4(),
      createdAt: timestamp,
      updatedAt: timestamp,
      content: request.content,
      category: request.category,
      importance: request.importance ?? 'medium',
      source: {
        type: request.sourceType ?? 'user_input',
        reference: request.sourceReference,
        timestamp,
      },
      tags: request.tags ?? [],
      factCandidate: request.factCandidate ?? false,
    };

    notes.items.push(note);
    notes.lastUpdated = timestamp;

    await storage.writeNotes(spaceId, notes);
    await this.addTimelineEntry(spaceId, {
      eventType: 'note_added',
      title: `Note added: ${note.content.slice(0, 50)}...`,
      relatedEntityId: note.id,
      relatedEntityType: 'note',
      tags: note.tags,
    });

    return note;
  }

  async updateNote(spaceId: EntityId, noteId: EntityId, request: UpdateNoteRequest): Promise<Note> {
    const notes = await storage.readNotes(spaceId);
    const index = notes.items.findIndex(n => n.id === noteId);

    if (index === -1) {
      throw new StorageError(`Note not found: ${noteId}`, 'NOT_FOUND');
    }

    const existing = notes.items[index]!;
    const timestamp = now();

    const updated: Note = {
      ...existing,
      updatedAt: timestamp,
      content: request.content ?? existing.content,
      category: request.category ?? existing.category,
      importance: request.importance ?? existing.importance,
      tags: request.tags ?? existing.tags,
      factCandidate: request.factCandidate ?? existing.factCandidate,
    };

    notes.items[index] = updated;
    notes.lastUpdated = timestamp;

    await storage.writeNotes(spaceId, notes);
    return updated;
  }

  async deleteNote(spaceId: EntityId, noteId: EntityId): Promise<void> {
    const notes = await storage.readNotes(spaceId);
    const index = notes.items.findIndex(n => n.id === noteId);

    if (index === -1) {
      throw new StorageError(`Note not found: ${noteId}`, 'NOT_FOUND');
    }

    notes.items.splice(index, 1);
    notes.lastUpdated = now();

    await storage.writeNotes(spaceId, notes);
  }

  async getNotes(spaceId: EntityId): Promise<Note[]> {
    const notes = await storage.readNotes(spaceId);
    return notes.items;
  }

  async promoteNoteToFact(
    spaceId: EntityId,
    noteId: EntityId,
    request: PromoteNoteRequest
  ): Promise<Fact> {
    const notes = await storage.readNotes(spaceId);
    const noteIndex = notes.items.findIndex(n => n.id === noteId);

    if (noteIndex === -1) {
      throw new StorageError(`Note not found: ${noteId}`, 'NOT_FOUND');
    }

    const note = notes.items[noteIndex]!;
    const timestamp = now();

    // Create new fact
    const fact = await this.addFact(spaceId, {
      category: request.category,
      statement: request.statement,
      confidence: request.confidence ?? 'high',
      tags: request.tags ?? note.tags,
      sourceType: 'observation',
      sourceReference: `Promoted from note: ${noteId}`,
    });

    // Update note with reference to fact
    notes.items[noteIndex] = {
      ...note,
      updatedAt: timestamp,
      promotedToFactId: fact.id,
      factCandidate: false,
    };
    notes.lastUpdated = timestamp;

    await storage.writeNotes(spaceId, notes);
    await this.addTimelineEntry(spaceId, {
      eventType: 'note_promoted',
      title: `Note promoted to fact`,
      description: `Note "${note.content.slice(0, 50)}..." became fact "${fact.statement.slice(0, 50)}..."`,
      relatedEntityId: fact.id,
      relatedEntityType: 'fact',
      tags: fact.tags,
    });

    return fact;
  }

  // ─────────────────────────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────────────────────────

  async addProfileEntry(spaceId: EntityId, request: AddProfileEntryRequest): Promise<ProfileEntry> {
    const profile = await storage.readProfile(spaceId);
    const timestamp = now();

    const entry: ProfileEntry = {
      id: uuidv4(),
      createdAt: timestamp,
      updatedAt: timestamp,
      category: request.category,
      key: request.key,
      value: request.value,
      source: {
        type: request.sourceType ?? 'user_input',
        reference: request.sourceReference,
        timestamp,
      },
      validFrom: request.validFrom,
      validUntil: request.validUntil,
    };

    profile.entries.push(entry);
    profile.lastUpdated = timestamp;

    await storage.writeProfile(spaceId, profile);
    await this.addTimelineEntry(spaceId, {
      eventType: 'profile_updated',
      title: `Profile updated: ${entry.category}.${entry.key}`,
      relatedEntityId: entry.id,
      relatedEntityType: 'profile',
      tags: [],
    });

    return entry;
  }

  async updateProfileEntry(
    spaceId: EntityId,
    entryId: EntityId,
    request: UpdateProfileEntryRequest
  ): Promise<ProfileEntry> {
    const profile = await storage.readProfile(spaceId);
    const index = profile.entries.findIndex(e => e.id === entryId);

    if (index === -1) {
      throw new StorageError(`Profile entry not found: ${entryId}`, 'NOT_FOUND');
    }

    const existing = profile.entries[index]!;
    const timestamp = now();

    const updated: ProfileEntry = {
      ...existing,
      updatedAt: timestamp,
      value: request.value ?? existing.value,
      validFrom: request.validFrom ?? existing.validFrom,
      validUntil: request.validUntil ?? existing.validUntil,
    };

    profile.entries[index] = updated;
    profile.lastUpdated = timestamp;

    await storage.writeProfile(spaceId, profile);
    await this.addTimelineEntry(spaceId, {
      eventType: 'profile_updated',
      title: `Profile updated: ${updated.category}.${updated.key}`,
      relatedEntityId: updated.id,
      relatedEntityType: 'profile',
      tags: [],
    });

    return updated;
  }

  async deleteProfileEntry(spaceId: EntityId, entryId: EntityId): Promise<void> {
    const profile = await storage.readProfile(spaceId);
    const index = profile.entries.findIndex(e => e.id === entryId);

    if (index === -1) {
      throw new StorageError(`Profile entry not found: ${entryId}`, 'NOT_FOUND');
    }

    profile.entries.splice(index, 1);
    profile.lastUpdated = now();

    await storage.writeProfile(spaceId, profile);
  }

  async getProfile(spaceId: EntityId): Promise<ProfileEntry[]> {
    const profile = await storage.readProfile(spaceId);
    return profile.entries;
  }

  // ─────────────────────────────────────────────────────────────────
  // Timeline
  // ─────────────────────────────────────────────────────────────────

  async addTimelineEntry(spaceId: EntityId, request: AddTimelineEntryRequest): Promise<TimelineEntry> {
    const timeline = await storage.readTimeline(spaceId);
    const timestamp = now();

    const entry: TimelineEntry = {
      id: uuidv4(),
      createdAt: timestamp,
      updatedAt: timestamp,
      timestamp: request.timestamp ?? timestamp,
      eventType: request.eventType,
      title: request.title,
      description: request.description,
      relatedEntityId: request.relatedEntityId,
      relatedEntityType: request.relatedEntityType,
      metadata: request.metadata,
      tags: request.tags ?? [],
    };

    timeline.entries.push(entry);
    timeline.lastUpdated = timestamp;

    await storage.writeTimeline(spaceId, timeline);
    return entry;
  }

  async getTimeline(spaceId: EntityId, limit = 50): Promise<TimelineEntry[]> {
    const timeline = await storage.readTimeline(spaceId);
    return timeline.entries
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  // ─────────────────────────────────────────────────────────────────
  // Context Query
  // ─────────────────────────────────────────────────────────────────

  async queryContext(request: QueryContextRequest): Promise<CompactContext> {
    const [metadata, profile, facts, notes, timeline] = await Promise.all([
      storage.readMetadata(request.spaceId),
      storage.readProfile(request.spaceId),
      storage.readFacts(request.spaceId),
      storage.readNotes(request.spaceId),
      storage.readTimeline(request.spaceId),
    ]);

    // Filter by categories if provided
    const categoryFilter = (item: { category?: string }) =>
      !request.categories?.length || request.categories.includes(item.category ?? '');

    // Filter by tags if provided
    const tagFilter = (item: { tags: string[] }) =>
      !request.tags?.length || item.tags.some(t => request.tags!.includes(t));

    // Filter and limit facts
    const relevantFacts = facts.items
      .filter(categoryFilter)
      .filter(tagFilter)
      .slice(0, request.maxFacts ?? 20)
      .map(f => ({
        category: f.category,
        statement: f.statement,
        confidence: f.confidence,
      }));

    // Filter and limit notes (only if requested)
    const relevantNotes = request.includeNotes
      ? notes.items
        .filter(categoryFilter)
        .filter(tagFilter)
        .filter(n => !n.promotedToFactId) // Exclude promoted notes
        .sort((a, b) => {
          // Sort by importance, then by date
          const importanceOrder = { high: 0, medium: 1, low: 2 };
          const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
          return impDiff !== 0 ? impDiff : b.createdAt.localeCompare(a.createdAt);
        })
        .slice(0, request.maxNotes ?? 10)
        .map(n => ({
          content: n.content,
          importance: n.importance,
        }))
      : [];

    // Get recent timeline entries
    const recentTimeline = timeline.entries
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, request.maxTimelineEntries ?? 10)
      .map(t => ({
        timestamp: t.timestamp,
        title: t.title,
        eventType: t.eventType,
      }));

    // Get profile summary (current valid entries only)
    const currentTime = now();
    const profileSummary = profile.entries
      .filter(e => {
        if (e.validFrom && e.validFrom > currentTime) return false;
        if (e.validUntil && e.validUntil < currentTime) return false;
        return true;
      })
      .map(e => ({
        category: e.category,
        key: e.key,
        value: e.value,
      }));

    return {
      spaceId: metadata.id,
      spaceName: metadata.name,
      profileSummary,
      relevantFacts,
      relevantNotes,
      recentTimeline,
    };
  }

  /** Estimate token count for a context (rough approximation) */
  estimateTokens(context: CompactContext): number {
    const json = JSON.stringify(context);
    // Rough estimation: ~4 chars per token
    return Math.ceil(json.length / 4);
  }
}

export const spaceService = new SpaceService();
