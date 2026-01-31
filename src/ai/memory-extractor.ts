/**
 * Memory Extractor Service
 * Parses AI responses for new facts, notes, and profile updates.
 */

import type {
  EntityId,
  ExtractedMemory,
  ExtractedFact,
  ExtractedNote,
  ExtractedProfileUpdate,
} from '../types/index.js';
import { spaceService } from '../domain/index.js';

const MEMORY_EXTRACT_REGEX = /```memory_extract\s*([\s\S]*?)```/;

/** Parse AI response and extract memory data */
export function parseMemoryExtract(response: string): {
  cleanResponse: string;
  extractedMemory: ExtractedMemory | null;
} {
  const match = response.match(MEMORY_EXTRACT_REGEX);
  
  if (!match) {
    return {
      cleanResponse: response.trim(),
      extractedMemory: null,
    };
  }

  const jsonStr = match[1]?.trim();
  const cleanResponse = response.replace(MEMORY_EXTRACT_REGEX, '').trim();

  if (!jsonStr) {
    return { cleanResponse, extractedMemory: null };
  }

  try {
    const parsed = JSON.parse(jsonStr) as Partial<ExtractedMemory>;
    
    const extractedMemory: ExtractedMemory = {
      facts: validateFacts(parsed.facts),
      notes: validateNotes(parsed.notes),
      profileUpdates: validateProfileUpdates(parsed.profileUpdates),
    };

    // Check if anything was actually extracted
    const hasContent = 
      extractedMemory.facts.length > 0 ||
      extractedMemory.notes.length > 0 ||
      extractedMemory.profileUpdates.length > 0;

    return {
      cleanResponse,
      extractedMemory: hasContent ? extractedMemory : null,
    };
  } catch (error) {
    console.warn('Failed to parse memory extract:', error);
    return { cleanResponse, extractedMemory: null };
  }
}

function validateFacts(facts: unknown): ExtractedFact[] {
  if (!Array.isArray(facts)) return [];
  
  return facts.filter((f): f is ExtractedFact => {
    return (
      typeof f === 'object' &&
      f !== null &&
      typeof f.category === 'string' &&
      typeof f.statement === 'string' &&
      ['low', 'medium', 'high', 'verified'].includes(f.confidence)
    );
  });
}

function validateNotes(notes: unknown): ExtractedNote[] {
  if (!Array.isArray(notes)) return [];
  
  return notes.filter((n): n is ExtractedNote => {
    return (
      typeof n === 'object' &&
      n !== null &&
      typeof n.content === 'string' &&
      ['low', 'medium', 'high'].includes(n.importance)
    );
  });
}

function validateProfileUpdates(updates: unknown): ExtractedProfileUpdate[] {
  if (!Array.isArray(updates)) return [];
  
  return updates.filter((u): u is ExtractedProfileUpdate => {
    return (
      typeof u === 'object' &&
      u !== null &&
      typeof u.category === 'string' &&
      typeof u.key === 'string' &&
      u.value !== undefined
    );
  });
}

/** Save extracted memory to storage */
export async function saveExtractedMemory(
  spaceId: EntityId,
  ownerId: EntityId,
  memory: ExtractedMemory
): Promise<{
  savedFacts: number;
  savedNotes: number;
  savedProfileUpdates: number;
}> {
  let savedFacts = 0;
  let savedNotes = 0;
  let savedProfileUpdates = 0;

  // Save facts
  for (const fact of memory.facts) {
    try {
      await spaceService.addFact(spaceId, {
        category: fact.category,
        statement: fact.statement,
        confidence: fact.confidence,
        sourceType: 'inference',
        sourceReference: `Автоматично витягнуто: ${fact.reason}`,
      }, ownerId);
      savedFacts++;
    } catch (error) {
      console.warn('Failed to save extracted fact:', error);
    }
  }

  // Save notes
  for (const note of memory.notes) {
    try {
      await spaceService.addNote(spaceId, {
        content: note.content,
        category: note.category,
        importance: note.importance,
        factCandidate: note.importance === 'high',
        sourceType: 'inference',
        sourceReference: `Автоматично витягнуто: ${note.reason}`,
      }, ownerId);
      savedNotes++;
    } catch (error) {
      console.warn('Failed to save extracted note:', error);
    }
  }

  // Save profile updates
  for (const update of memory.profileUpdates) {
    try {
      await spaceService.addProfileEntry(spaceId, {
        category: update.category,
        key: update.key,
        value: update.value,
        sourceType: 'inference',
        sourceReference: `Автоматично витягнуто: ${update.reason}`,
      }, ownerId);
      savedProfileUpdates++;
    } catch (error) {
      console.warn('Failed to save profile update:', error);
    }
  }

  return { savedFacts, savedNotes, savedProfileUpdates };
}

/** Check if extracted data is pending user confirmation */
export function requiresConfirmation(memory: ExtractedMemory): boolean {
  // Facts always require confirmation if space rules say so
  // High-importance items require confirmation
  return memory.facts.length > 0 || 
         memory.notes.some((n: ExtractedNote) => n.importance === 'high') ||
         memory.profileUpdates.length > 0;
}
