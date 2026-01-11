"use strict";
/**
 * File-based storage service for context spaces.
 * Designed for single-node deployment with future migration path to distributed storage.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.StorageError = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const DATA_DIR = process.env['DATA_DIR'] ?? './data/spaces';
const FILE_NAMES = {
    space: 'space.json',
    profile: 'profile.json',
    facts: 'facts.json',
    notes: 'notes.json',
    timeline: 'timeline.json',
};
class StorageError extends Error {
    code;
    cause;
    constructor(message, code, cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = 'StorageError';
    }
}
exports.StorageError = StorageError;
function getSpacePath(spaceId) {
    return node_path_1.default.join(DATA_DIR, spaceId);
}
function getFilePath(spaceId, fileType) {
    return node_path_1.default.join(getSpacePath(spaceId), FILE_NAMES[fileType]);
}
async function ensureDir(dirPath) {
    await node_fs_1.promises.mkdir(dirPath, { recursive: true });
}
async function fileExists(filePath) {
    try {
        await node_fs_1.promises.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function readJsonFile(filePath) {
    try {
        const content = await node_fs_1.promises.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new StorageError(`File not found: ${filePath}`, 'NOT_FOUND', error);
        }
        throw new StorageError(`Failed to read file: ${filePath}`, 'IO_ERROR', error);
    }
}
async function writeJsonFile(filePath, data) {
    try {
        await ensureDir(node_path_1.default.dirname(filePath));
        await node_fs_1.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    catch (error) {
        throw new StorageError(`Failed to write file: ${filePath}`, 'IO_ERROR', error);
    }
}
exports.storage = {
    /** Initialize storage directory */
    async init() {
        await ensureDir(DATA_DIR);
    },
    /** Check if a space exists */
    async spaceExists(spaceId) {
        return fileExists(getFilePath(spaceId, 'space'));
    },
    /** List all space IDs */
    async listSpaceIds() {
        try {
            const entries = await node_fs_1.promises.readdir(DATA_DIR, { withFileTypes: true });
            const spaceIds = [];
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const spaceFilePath = node_path_1.default.join(DATA_DIR, entry.name, FILE_NAMES.space);
                    if (await fileExists(spaceFilePath)) {
                        spaceIds.push(entry.name);
                    }
                }
            }
            return spaceIds;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw new StorageError('Failed to list spaces', 'IO_ERROR', error);
        }
    },
    /** Create a new space directory with initial files */
    async createSpace(spaceId, metadata, profile, facts, notes, timeline) {
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
    async deleteSpace(spaceId) {
        const spacePath = getSpacePath(spaceId);
        if (!await fileExists(spacePath)) {
            throw new StorageError(`Space not found: ${spaceId}`, 'NOT_FOUND');
        }
        await node_fs_1.promises.rm(spacePath, { recursive: true });
    },
    // Metadata
    async readMetadata(spaceId) {
        return readJsonFile(getFilePath(spaceId, 'space'));
    },
    async writeMetadata(spaceId, metadata) {
        await writeJsonFile(getFilePath(spaceId, 'space'), metadata);
    },
    // Profile
    async readProfile(spaceId) {
        return readJsonFile(getFilePath(spaceId, 'profile'));
    },
    async writeProfile(spaceId, profile) {
        await writeJsonFile(getFilePath(spaceId, 'profile'), profile);
    },
    // Facts
    async readFacts(spaceId) {
        return readJsonFile(getFilePath(spaceId, 'facts'));
    },
    async writeFacts(spaceId, facts) {
        await writeJsonFile(getFilePath(spaceId, 'facts'), facts);
    },
    // Notes
    async readNotes(spaceId) {
        return readJsonFile(getFilePath(spaceId, 'notes'));
    },
    async writeNotes(spaceId, notes) {
        await writeJsonFile(getFilePath(spaceId, 'notes'), notes);
    },
    // Timeline
    async readTimeline(spaceId) {
        return readJsonFile(getFilePath(spaceId, 'timeline'));
    },
    async writeTimeline(spaceId, timeline) {
        await writeJsonFile(getFilePath(spaceId, 'timeline'), timeline);
    },
};
//# sourceMappingURL=storage.js.map