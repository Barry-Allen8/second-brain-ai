/**
 * Chat Service
 * Orchestrates AI conversations with context injection.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  EntityId,
  ChatMessage,
  ChatSession,
  ChatRequest,
  ChatResponse,
  ExtractedMemory,
} from '../types/index.js';
import { buildSystemPrompt, estimateContextTokens } from './context-builder.js';
import { chatCompletion, isAIConfigured } from './ai-provider.js';
import { parseMemoryExtract, saveExtractedMemory } from './memory-extractor.js';
import { storage } from './storage.js';

// In-memory session storage (for MVP - could be persisted later)
const sessions = new Map<EntityId, ChatSession>();

function now(): string {
  return new Date().toISOString();
}

/** Create a new chat session */
export function createSession(spaceId: EntityId): ChatSession {
  const session: ChatSession = {
    id: uuidv4(),
    spaceId,
    messages: [],
    createdAt: now(),
    updatedAt: now(),
  };
  
  sessions.set(session.id, session);
  return session;
}

/** Get existing session or create new one */
export function getOrCreateSession(spaceId: EntityId, sessionId?: EntityId): ChatSession {
  if (sessionId) {
    const existing = sessions.get(sessionId);
    if (existing && existing.spaceId === spaceId) {
      return existing;
    }
  }
  return createSession(spaceId);
}

/** Get session by ID */
export function getSession(sessionId: EntityId): ChatSession | undefined {
  return sessions.get(sessionId);
}

/** List sessions for a space */
export function listSessions(spaceId: EntityId): ChatSession[] {
  return Array.from(sessions.values())
    .filter(s => s.spaceId === spaceId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Delete a session */
export function deleteSession(sessionId: EntityId): boolean {
  return sessions.delete(sessionId);
}

/** Clear all sessions for a space */
export function clearSpaceSessions(spaceId: EntityId): number {
  let count = 0;
  for (const [id, session] of sessions) {
    if (session.spaceId === spaceId) {
      sessions.delete(id);
      count++;
    }
  }
  return count;
}

/** Process a chat message */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  // Validate space exists
  const spaceExists = await storage.spaceExists(request.spaceId);
  if (!spaceExists) {
    throw new Error(`Space not found: ${request.spaceId}`);
  }

  // Check AI configuration
  if (!isAIConfigured()) {
    throw new Error('AI not configured. Please set OPENAI_API_KEY environment variable.');
  }

  // Get or create session
  const session = getOrCreateSession(request.spaceId, request.sessionId);

  // Create user message
  const userMessage: ChatMessage = {
    id: uuidv4(),
    role: 'user',
    content: request.message,
    timestamp: now(),
  };
  session.messages.push(userMessage);

  // Build context-aware system prompt
  const systemPrompt = await buildSystemPrompt(request.spaceId);
  const contextTokens = estimateContextTokens(systemPrompt);

  // Get AI response
  const rawResponse = await chatCompletion(systemPrompt, session.messages);

  // Parse response for memory extraction
  const { cleanResponse, extractedMemory } = parseMemoryExtract(rawResponse);

  // Create assistant message
  const assistantMessage: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: cleanResponse,
    timestamp: now(),
    extractedData: extractedMemory || undefined,
  };
  session.messages.push(assistantMessage);
  session.updatedAt = now();

  // Auto-save extracted memory (can be disabled via settings)
  if (extractedMemory) {
    await saveExtractedMemory(request.spaceId, extractedMemory);
  }

  return {
    sessionId: session.id,
    message: assistantMessage,
    extractedMemory: extractedMemory || undefined,
    context: {
      factsUsed: countSection(systemPrompt, 'ФАКТИ'),
      notesUsed: countSection(systemPrompt, 'НОТАТКИ'),
      tokensEstimate: contextTokens,
    },
  };
}

/** Count items in a section (rough estimate) */
function countSection(prompt: string, sectionName: string): number {
  const sectionMatch = prompt.match(new RegExp(`=== ${sectionName}.*?===([\\s\\S]*?)(?====|$)`));
  if (!sectionMatch || !sectionMatch[1]) return 0;
  
  const lines = sectionMatch[1].split('\n').filter((l: string) => 
    l.trim().startsWith('•') || l.trim().startsWith('✓') || l.trim().startsWith('◉') || l.trim().startsWith('○') || l.trim().startsWith('⚡')
  );
  return lines.length;
}

/** Get chat history for a session */
export function getChatHistory(sessionId: EntityId): ChatMessage[] {
  const session = sessions.get(sessionId);
  return session?.messages || [];
}

/** Export session for analysis */
export function exportSession(sessionId: EntityId): ChatSession | null {
  return sessions.get(sessionId) || null;
}
