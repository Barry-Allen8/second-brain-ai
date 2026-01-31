/**
 * Firestore-based storage service for context spaces.
 * Replaces the file-based implementation for cloud persistence.
 */

import { db } from '../lib/firebase.js';
import type { EntityId, SpaceMetadata, Profile, Facts, Notes, Timeline } from '../types/index.js';

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'IO_ERROR' | 'PARSE_ERROR',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// Collection references
const SPACES_COLLECTION = 'spaces';

async function getDocData<T>(docPath: string): Promise<T> {
  try {
    const doc = await db.doc(docPath).get();
    if (!doc.exists) {
      throw new StorageError(`Document not found: ${docPath}`, 'NOT_FOUND');
    }
    return doc.data() as T;
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(`Failed to read document: ${docPath}`, 'IO_ERROR', error);
  }
}

async function setDocData<T extends object>(docPath: string, data: T): Promise<void> {
  try {
    await db.doc(docPath).set(data);
  } catch (error) {
    throw new StorageError(`Failed to write document: ${docPath}`, 'IO_ERROR', error);
  }
}

export const storage = {
  /** Initialize storage (no-op for Firestore) */
  async init(): Promise<void> {
    // Firestore is initialized in lib/firebase.ts
    console.log('📦 Storage service initialized (Firestore)');
  },

  /** Check if a space exists */
  async spaceExists(spaceId: EntityId): Promise<boolean> {
    const doc = await db.collection(SPACES_COLLECTION).doc(spaceId).get();
    return doc.exists;
  },

  /** List all space IDs */
  async listSpaceIds(): Promise<EntityId[]> {
    try {
      const snapshot = await db.collection(SPACES_COLLECTION).get();
      return snapshot.docs.map((doc: any) => doc.id);
    } catch (error) {
      throw new StorageError('Failed to list spaces', 'IO_ERROR', error);
    }
  },

  /** Create a new space with initial data structure */
  async createSpace(
    spaceId: EntityId,
    metadata: SpaceMetadata,
    profile: Profile,
    facts: Facts,
    notes: Notes,
    timeline: Timeline
  ): Promise<void> {
    const spaceRef = db.collection(SPACES_COLLECTION).doc(spaceId);
    const doc = await spaceRef.get();

    if (doc.exists) {
      throw new StorageError(`Space already exists: ${spaceId}`, 'ALREADY_EXISTS');
    }

    try {
      const batch = db.batch();

      // Set metadata in the main document
      batch.set(spaceRef, metadata);

      // Set data in subcollection 'data'
      batch.set(spaceRef.collection('data').doc('profile'), profile);
      batch.set(spaceRef.collection('data').doc('facts'), facts);
      batch.set(spaceRef.collection('data').doc('notes'), notes);
      batch.set(spaceRef.collection('data').doc('timeline'), timeline);

      await batch.commit();
    } catch (error) {
      throw new StorageError(`Failed to create space: ${spaceId}`, 'IO_ERROR', error);
    }
  },

  /** Delete a space and all its subcollections */
  async deleteSpace(spaceId: EntityId): Promise<void> {
    const spaceRef = db.collection(SPACES_COLLECTION).doc(spaceId);
    const doc = await spaceRef.get();

    if (!doc.exists) {
      throw new StorageError(`Space not found: ${spaceId}`, 'NOT_FOUND');
    }

    try {
      // Delete subcollection documents first
      // Note: Firestore doesn't automatically delete subcollections when parent is deleted
      const dataCollection = spaceRef.collection('data');
      const subDocs = await dataCollection.get();

      const batch = db.batch();
      subDocs.docs.forEach((doc: any) => batch.delete(doc.ref));
      batch.delete(spaceRef);

      await batch.commit();
    } catch (error) {
      throw new StorageError(`Failed to delete space: ${spaceId}`, 'IO_ERROR', error);
    }
  },

  // Metadata (stored in the space document root)
  async readMetadata(spaceId: EntityId): Promise<SpaceMetadata> {
    return getDocData<SpaceMetadata>(`${SPACES_COLLECTION}/${spaceId}`);
  },

  async writeMetadata(spaceId: EntityId, metadata: SpaceMetadata): Promise<void> {
    // We use set with merge: true to avoid overwriting other fields if we ever add them,
    // but here we want to replace the metadata fully as per previous logic?
    // The previous logic was file overwrite. Metadata object contains all fields.
    // However, if we put subcollections, they are separate.
    // The main doc strictly holds SpaceMetadata fields.
    await setDocData(`${SPACES_COLLECTION}/${spaceId}`, metadata);
  },

  // Profile
  async readProfile(spaceId: EntityId): Promise<Profile> {
    return getDocData<Profile>(`${SPACES_COLLECTION}/${spaceId}/data/profile`);
  },

  async writeProfile(spaceId: EntityId, profile: Profile): Promise<void> {
    await setDocData(`${SPACES_COLLECTION}/${spaceId}/data/profile`, profile);
  },

  // Facts
  async readFacts(spaceId: EntityId): Promise<Facts> {
    return getDocData<Facts>(`${SPACES_COLLECTION}/${spaceId}/data/facts`);
  },

  async writeFacts(spaceId: EntityId, facts: Facts): Promise<void> {
    await setDocData(`${SPACES_COLLECTION}/${spaceId}/data/facts`, facts);
  },

  // Notes
  async readNotes(spaceId: EntityId): Promise<Notes> {
    return getDocData<Notes>(`${SPACES_COLLECTION}/${spaceId}/data/notes`);
  },

  async writeNotes(spaceId: EntityId, notes: Notes): Promise<void> {
    await setDocData(`${SPACES_COLLECTION}/${spaceId}/data/notes`, notes);
  },

  // Timeline
  async readTimeline(spaceId: EntityId): Promise<Timeline> {
    return getDocData<Timeline>(`${SPACES_COLLECTION}/${spaceId}/data/timeline`);
  },

  async writeTimeline(spaceId: EntityId, timeline: Timeline): Promise<void> {
    await setDocData(`${SPACES_COLLECTION}/${spaceId}/data/timeline`, timeline);
  },
};
