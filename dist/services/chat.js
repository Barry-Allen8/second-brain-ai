"use strict";
/**
 * Chat Service
 * Orchestrates AI conversations with context injection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getOrCreateSession = getOrCreateSession;
exports.getSession = getSession;
exports.listSessions = listSessions;
exports.deleteSession = deleteSession;
exports.clearSpaceSessions = clearSpaceSessions;
exports.chat = chat;
exports.getChatHistory = getChatHistory;
exports.exportSession = exportSession;
const uuid_1 = require("uuid");
const context_builder_js_1 = require("./context-builder.js");
const ai_provider_js_1 = require("./ai-provider.js");
const memory_extractor_js_1 = require("./memory-extractor.js");
const storage_js_1 = require("./storage.js");
// In-memory session storage (for MVP - could be persisted later)
const sessions = new Map();
function now() {
    return new Date().toISOString();
}
/** Create a new chat session */
function createSession(spaceId) {
    const session = {
        id: (0, uuid_1.v4)(),
        spaceId,
        messages: [],
        createdAt: now(),
        updatedAt: now(),
    };
    sessions.set(session.id, session);
    return session;
}
/** Get existing session or create new one */
function getOrCreateSession(spaceId, sessionId) {
    if (sessionId) {
        const existing = sessions.get(sessionId);
        if (existing && existing.spaceId === spaceId) {
            return existing;
        }
    }
    return createSession(spaceId);
}
/** Get session by ID */
function getSession(sessionId) {
    return sessions.get(sessionId);
}
/** List sessions for a space */
function listSessions(spaceId) {
    return Array.from(sessions.values())
        .filter(s => s.spaceId === spaceId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
/** Delete a session */
function deleteSession(sessionId) {
    return sessions.delete(sessionId);
}
/** Clear all sessions for a space */
function clearSpaceSessions(spaceId) {
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
async function chat(request) {
    // Validate space exists
    const spaceExists = await storage_js_1.storage.spaceExists(request.spaceId);
    if (!spaceExists) {
        throw new Error(`Space not found: ${request.spaceId}`);
    }
    // Check AI configuration
    if (!(0, ai_provider_js_1.isAIConfigured)()) {
        throw new Error('AI not configured. Please set OPENAI_API_KEY environment variable.');
    }
    // Get or create session
    const session = getOrCreateSession(request.spaceId, request.sessionId);
    // Create user message
    const userMessage = {
        id: (0, uuid_1.v4)(),
        role: 'user',
        content: request.message,
        timestamp: now(),
    };
    session.messages.push(userMessage);
    // Build context-aware system prompt
    const systemPrompt = await (0, context_builder_js_1.buildSystemPrompt)(request.spaceId);
    const contextTokens = (0, context_builder_js_1.estimateContextTokens)(systemPrompt);
    // Get AI response
    const rawResponse = await (0, ai_provider_js_1.chatCompletion)(systemPrompt, session.messages);
    // Parse response for memory extraction
    const { cleanResponse, extractedMemory } = (0, memory_extractor_js_1.parseMemoryExtract)(rawResponse);
    // Create assistant message
    const assistantMessage = {
        id: (0, uuid_1.v4)(),
        role: 'assistant',
        content: cleanResponse,
        timestamp: now(),
        extractedData: extractedMemory || undefined,
    };
    session.messages.push(assistantMessage);
    session.updatedAt = now();
    // Auto-save extracted memory (can be disabled via settings)
    if (extractedMemory) {
        await (0, memory_extractor_js_1.saveExtractedMemory)(request.spaceId, extractedMemory);
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
function countSection(prompt, sectionName) {
    const sectionMatch = prompt.match(new RegExp(`=== ${sectionName}.*?===([\\s\\S]*?)(?====|$)`));
    if (!sectionMatch || !sectionMatch[1])
        return 0;
    const lines = sectionMatch[1].split('\n').filter((l) => l.trim().startsWith('•') || l.trim().startsWith('✓') || l.trim().startsWith('◉') || l.trim().startsWith('○') || l.trim().startsWith('⚡'));
    return lines.length;
}
/** Get chat history for a session */
function getChatHistory(sessionId) {
    const session = sessions.get(sessionId);
    return session?.messages || [];
}
/** Export session for analysis */
function exportSession(sessionId) {
    return sessions.get(sessionId) || null;
}
//# sourceMappingURL=chat.js.map