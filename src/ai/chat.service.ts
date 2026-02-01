/**
 * Chat Service
 * Orchestrates AI conversations with context injection.
 * Persists sessions to Firestore.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  EntityId,
  ChatMessage,
  ChatSession,
  ChatRequest,
  ChatResponse,
  ChatContentPart,
} from '../types/index.js';
import { buildSystemPrompt, estimateContextTokens } from './context-builder.js';
import { chatCompletion, isAIConfigured } from './provider.js';
import { parseMemoryExtract, saveExtractedMemory } from './memory-extractor.js';
import { spaceService } from '../domain/index.js';
import { now } from '../utils/index.js';
import { db } from '../lib/firebase.js';

const SESSIONS_COLLECTION = 'sessions';
const IMAGE_PLACEHOLDER = '[Image attachment omitted from history]';

/** Create a new chat session */
export async function createSession(spaceId: EntityId, userId: EntityId): Promise<ChatSession> {
  const session: ChatSession = {
    id: uuidv4(),
    spaceId,
    userId,
    messages: [],
    createdAt: now(),
    updatedAt: now(),
  };

  await db.collection(SESSIONS_COLLECTION).doc(session.id).set(session);
  console.log(`[Session] Created session ${session.id} for space ${spaceId}`);
  return session;
}

/** Get existing session or create new one */
export async function getOrCreateSession(
  spaceId: EntityId,
  userId: EntityId,
  sessionId?: EntityId
): Promise<ChatSession> {
  if (sessionId) {
    const existing = await getSession(sessionId, userId);
    if (existing && existing.spaceId === spaceId && existing.userId === userId) {
      return existing;
    }
  }
  return createSession(spaceId, userId);
}

/** Get session by ID */
export async function getSession(sessionId: EntityId, userId?: EntityId): Promise<ChatSession | undefined> {
  const doc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();
  if (!doc.exists) return undefined;
  const session = doc.data() as ChatSession;
  if (userId && session.userId !== userId) return undefined;
  return session;
}

/** List sessions for a space */
export async function listSessions(spaceId: EntityId, userId: EntityId): Promise<ChatSession[]> {
  console.log(`[Session] Listing sessions for space ${spaceId} (user ${userId})`);
  const snapshot = await db.collection(SESSIONS_COLLECTION)
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .get(); // We'll sort in memory as Firestore requires composite index for filtering + sorting different fields

  console.log(`[Session] Found ${snapshot.size} sessions for space ${spaceId}`);
  const sessions = snapshot.docs.map((doc: any) => doc.data() as ChatSession);
  return sessions.sort((a: ChatSession, b: ChatSession) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Update session metadata */
export async function updateSession(
  sessionId: EntityId,
  updates: Partial<Pick<ChatSession, 'name'>>,
  userId: EntityId
): Promise<ChatSession | null> {
  const ref = db.collection(SESSIONS_COLLECTION).doc(sessionId);
  const doc = await ref.get();

  if (!doc.exists) return null;

  const session = doc.data() as ChatSession;
  if (session.userId !== userId) return null;
  const updateData: Partial<ChatSession> = { updatedAt: now() };

  if (updates.name !== undefined) {
    updateData.name = updates.name;
    session.name = updates.name; // Update local object for return
  }

  session.updatedAt = updateData.updatedAt!; // Update local object for return

  await ref.update(updateData);
  return session;
}

/** Delete a session */
export async function deleteSession(sessionId: EntityId, userId: EntityId): Promise<boolean> {
  try {
    const ref = db.collection(SESSIONS_COLLECTION).doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists) return false;
    const session = doc.data() as ChatSession;
    if (session.userId !== userId) return false;
    await ref.delete();
    return true;
  } catch (e) {
    console.error('Failed to delete session', e);
    return false;
  }
}

/** Clear all sessions for a space */
export async function clearSpaceSessions(spaceId: EntityId, userId: EntityId): Promise<number> {
  const snapshot = await db.collection(SESSIONS_COLLECTION)
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

/** Process a chat message */
export async function chat(request: ChatRequest, userId: EntityId): Promise<ChatResponse> {
  // Validate space exists + ownership
  await spaceService.getSpace(request.spaceId, userId);

  // Check AI configuration
  if (!isAIConfigured()) {
    throw new Error('AI not configured. Please set OPENAI_API_KEY environment variable.');
  }

  // Get or create session
  const session = await getOrCreateSession(request.spaceId, userId, request.sessionId);

  // Create user message
  let content: string | ChatContentPart[] = request.message;

  // Check for image attachments and convert to multimodal message if needed
  if (request.attachments && request.attachments.some(a => a.type === 'image')) {
    const parts: ChatContentPart[] = [];

    // Add text part
    if (request.message) {
      parts.push({ type: 'text', text: request.message });
    }

    // Add image parts
    request.attachments.forEach(att => {
      if (att.type === 'image') {
        parts.push({
          type: 'image_url',
          image_url: { url: att.url }
        });
      }
    });

    content = parts;
  }

  const userMessage: ChatMessage = {
    id: uuidv4(),
    role: 'user',
    content: content,
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
    extractedData: extractedMemory || null,
  };
  session.messages.push(assistantMessage);
  session.updatedAt = now();

  // Save session to Firestore
  const sessionToPersist = {
    ...session,
    messages: sanitizeMessagesForStorage(session.messages),
  };
  await db.collection(SESSIONS_COLLECTION).doc(session.id).set(sessionToPersist);

  // Auto-save extracted memory (can be disabled via settings)
  if (extractedMemory) {
    await saveExtractedMemory(request.spaceId, userId, extractedMemory);
  }

  return {
    sessionId: session.id,
    message: assistantMessage,
    extractedMemory: extractedMemory || null,
    context: {
      factsUsed: countSection(systemPrompt, 'ФАКТИ'),
      notesUsed: countSection(systemPrompt, 'НОТАТКИ'),
      tokensEstimate: contextTokens,
    },
  };
}

function sanitizeMessagesForStorage(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    if (!Array.isArray(message.content)) {
      return message;
    }

    const textParts = message.content
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text.trim())
      .filter((part) => part.length > 0);
    const combinedText = textParts.join('\n\n').trim();
    const hasImages = message.content.some((part) => part.type === 'image_url');

    return {
      ...message,
      content: combinedText || (hasImages ? IMAGE_PLACEHOLDER : ''),
    };
  });
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
export async function getChatHistory(sessionId: EntityId, userId: EntityId): Promise<ChatMessage[]> {
  const session = await getSession(sessionId, userId);
  return session?.messages || [];
}

/** Export session for analysis */
export async function exportSession(sessionId: EntityId, userId: EntityId): Promise<ChatSession | null> {
  const session = await getSession(sessionId, userId);
  return session || null;
}
