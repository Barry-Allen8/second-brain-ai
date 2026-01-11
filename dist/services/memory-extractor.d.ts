/**
 * Memory Extractor Service
 * Parses AI responses for new facts, notes, and profile updates.
 */
import type { EntityId, ExtractedMemory } from '../types/index.js';
/** Parse AI response and extract memory data */
export declare function parseMemoryExtract(response: string): {
    cleanResponse: string;
    extractedMemory: ExtractedMemory | null;
};
/** Save extracted memory to storage */
export declare function saveExtractedMemory(spaceId: EntityId, memory: ExtractedMemory): Promise<{
    savedFacts: number;
    savedNotes: number;
    savedProfileUpdates: number;
}>;
/** Check if extracted data is pending user confirmation */
export declare function requiresConfirmation(memory: ExtractedMemory): boolean;
//# sourceMappingURL=memory-extractor.d.ts.map