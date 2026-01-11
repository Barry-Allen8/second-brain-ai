/**
 * Chat Service
 * Orchestrates AI conversations with context injection.
 */
import type { EntityId, ChatMessage, ChatSession, ChatRequest, ChatResponse } from '../types/index.js';
/** Create a new chat session */
export declare function createSession(spaceId: EntityId): ChatSession;
/** Get existing session or create new one */
export declare function getOrCreateSession(spaceId: EntityId, sessionId?: EntityId): ChatSession;
/** Get session by ID */
export declare function getSession(sessionId: EntityId): ChatSession | undefined;
/** List sessions for a space */
export declare function listSessions(spaceId: EntityId): ChatSession[];
/** Delete a session */
export declare function deleteSession(sessionId: EntityId): boolean;
/** Clear all sessions for a space */
export declare function clearSpaceSessions(spaceId: EntityId): number;
/** Process a chat message */
export declare function chat(request: ChatRequest): Promise<ChatResponse>;
/** Get chat history for a session */
export declare function getChatHistory(sessionId: EntityId): ChatMessage[];
/** Export session for analysis */
export declare function exportSession(sessionId: EntityId): ChatSession | null;
//# sourceMappingURL=chat.d.ts.map