// CHANGE: Added setModel and SUPPORTED_MODELS exports
export { initializeAI, isAIConfigured, getAIConfig, setModel, chatCompletion, chatCompletionStream, SUPPORTED_MODELS } from './provider.js';
export { buildContextParts, buildSystemPrompt, estimateContextTokens } from './context-builder.js';
export { parseMemoryExtract, saveExtractedMemory, requiresConfirmation } from './memory-extractor.js';
export {
  chat,
  createSession,
  getSession,
  getOrCreateSession,
  listSessions,
  updateSession,
  deleteSession,
  clearSpaceSessions,
  getChatHistory,
  exportSession,
} from './chat.service.js';
