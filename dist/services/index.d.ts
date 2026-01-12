/**
 * Services barrel export.
 * Re-exports from domain/ and ai/ for backwards compatibility.
 */
export { storage, StorageError, spaceService, SpaceService } from '../domain/index.js';
export { initializeAI, isAIConfigured, getAIConfig, chatCompletion, chatCompletionStream, buildContextParts, buildSystemPrompt, estimateContextTokens, parseMemoryExtract, saveExtractedMemory, requiresConfirmation, chat, createSession, getSession, getOrCreateSession, listSessions, deleteSession, clearSpaceSessions, getChatHistory, exportSession, } from '../ai/index.js';
//# sourceMappingURL=index.d.ts.map