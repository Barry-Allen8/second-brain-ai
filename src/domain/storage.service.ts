/**
 * File-based storage service for context spaces.
 * Designed for single-node deployment with future migration path to distributed storage.
 * 
 * TODO: Migrate to database storage (PostgreSQL/SQLite) for production use.
 * Current file-based implementation is suitable for development and single-node deployment.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { EntityId, SpaceMetadata, Profile, Facts, Notes, Timeline } from '../types/index.js';

const DATA_DIR = process.env['DATA_DIR'] ?? './data/spaces';

type MemoryFileType = 'space' | 'profile' | 'facts' | 'notes' | 'timeline';

const FILE_NAMES: Record<MemoryFileType, string> = {
  space: 'space.json',
  profile: 'profile.json',
  facts: 'facts.json',
  notes: 'notes.json',
  timeline: 'timeline.json',
};

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

function getSpacePath(spaceId: EntityId): string {
  return path.join(DATA_DIR, spaceId);
}

function getFilePath(spaceId: EntityId, fileType: MemoryFileType): string {
  return path.join(getSpacePath(spaceId), FILE_NAMES[fileType]);
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new StorageError(`File not found: ${filePath}`, 'NOT_FOUND', error);
    }
    throw new StorageError(`Failed to read file: ${filePath}`, 'IO_ERROR', error);
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw new StorageError(`Failed to write file: ${filePath}`, 'IO_ERROR', error);
  }
}

export const storage = {
  /** Initialize storage directory */
  async init(): Promise<void> {
    await ensureDir(DATA_DIR);
  },

  /** Check if a space exists */
  async spaceExists(spaceId: EntityId): Promise<boolean> {
    return fileExists(getFilePath(spaceId, 'space'));
  },

  /** List all space IDs */
  async listSpaceIds(): Promise<EntityId[]> {
    try {
      const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
      const spaceIds: EntityId[] = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const spaceFilePath = path.join(DATA_DIR, entry.name, FILE_NAMES.space);
          if (await fileExists(spaceFilePath)) {
            spaceIds.push(entry.name);
          }
        }
      }
      
      return spaceIds;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new StorageError('Failed to list spaces', 'IO_ERROR', error);
    }
  },

  /** Create a new space directory with initial files */
  async createSpace(
    spaceId: EntityId,
    metadata: SpaceMetadata,
    profile: Profile,
    facts: Facts,
    notes: Notes,
    timeline: Timeline
  ): Promise<void> {
    const spacePath = getSpacePath(spaceId);
    
    if (await fileExists(spacePath)) {
      throw new StorageError(`Space already exists: ${spaceId}`, 'ALREADY_EXISTS');
    }

    await ensureDir(spacePath);
    
    await Promise.all([
      writeJsonFile(getFilePath(spaceId, 'space'), metadata),
      writeJsonFile(getFilePath(spaceId, 'profile'), profile),
      writeJsonFile(getFilePath(spaceId, 'facts'), facts),
      writeJsonFile(getFilePath(spaceId, 'notes'), notes),
      writeJsonFile(getFilePath(spaceId, 'timeline'), timeline),
    ]);
  },

  /** Delete a space and all its files */
  async deleteSpace(spaceId: EntityId): Promise<void> {
    const spacePath = getSpacePath(spaceId);
    
    if (!await fileExists(spacePath)) {
      throw new StorageError(`Space not found: ${spaceId}`, 'NOT_FOUND');
    }

    await fs.rm(spacePath, { recursive: true });
  },

  // Metadata
  async readMetadata(spaceId: EntityId): Promise<SpaceMetadata> {
    return readJsonFile<SpaceMetadata>(getFilePath(spaceId, 'space'));
  },

  async writeMetadata(spaceId: EntityId, metadata: SpaceMetadata): Promise<void> {
    await writeJsonFile(getFilePath(spaceId, 'space'), metadata);
  },

  // Profile
  async readProfile(spaceId: EntityId): Promise<Profile> {
    return readJsonFile<Profile>(getFilePath(spaceId, 'profile'));
  },

  async writeProfile(spaceId: EntityId, profile: Profile): Promise<void> {
    await writeJsonFile(getFilePath(spaceId, 'profile'), profile);
  },

  // Facts
  async readFacts(spaceId: EntityId): Promise<Facts> {
    return readJsonFile<Facts>(getFilePath(spaceId, 'facts'));
  },

  async writeFacts(spaceId: EntityId, facts: Facts): Promise<void> {
    await writeJsonFile(getFilePath(spaceId, 'facts'), facts);
  },

  // Notes
  async readNotes(spaceId: EntityId): Promise<Notes> {
    return readJsonFile<Notes>(getFilePath(spaceId, 'notes'));
  },

  async writeNotes(spaceId: EntityId, notes: Notes): Promise<void> {
    await writeJsonFile(getFilePath(spaceId, 'notes'), notes);
  },

  // Timeline
  async readTimeline(spaceId: EntityId): Promise<Timeline> {
    return readJsonFile<Timeline>(getFilePath(spaceId, 'timeline'));
  },

  async writeTimeline(spaceId: EntityId, timeline: Timeline): Promise<void> {
    await writeJsonFile(getFilePath(spaceId, 'timeline'), timeline);
  },
};
