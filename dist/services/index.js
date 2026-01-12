"use strict";
/**
 * Services barrel export.
 * Re-exports from domain/ and ai/ for backwards compatibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSession = exports.getChatHistory = exports.clearSpaceSessions = exports.deleteSession = exports.listSessions = exports.getOrCreateSession = exports.getSession = exports.createSession = exports.chat = exports.requiresConfirmation = exports.saveExtractedMemory = exports.parseMemoryExtract = exports.estimateContextTokens = exports.buildSystemPrompt = exports.buildContextParts = exports.chatCompletionStream = exports.chatCompletion = exports.getAIConfig = exports.isAIConfigured = exports.initializeAI = exports.SpaceService = exports.spaceService = exports.StorageError = exports.storage = void 0;
// Domain services
var index_js_1 = require("../domain/index.js");
Object.defineProperty(exports, "storage", { enumerable: true, get: function () { return index_js_1.storage; } });
Object.defineProperty(exports, "StorageError", { enumerable: true, get: function () { return index_js_1.StorageError; } });
Object.defineProperty(exports, "spaceService", { enumerable: true, get: function () { return index_js_1.spaceService; } });
Object.defineProperty(exports, "SpaceService", { enumerable: true, get: function () { return index_js_1.SpaceService; } });
// AI services
var index_js_2 = require("../ai/index.js");
Object.defineProperty(exports, "initializeAI", { enumerable: true, get: function () { return index_js_2.initializeAI; } });
Object.defineProperty(exports, "isAIConfigured", { enumerable: true, get: function () { return index_js_2.isAIConfigured; } });
Object.defineProperty(exports, "getAIConfig", { enumerable: true, get: function () { return index_js_2.getAIConfig; } });
Object.defineProperty(exports, "chatCompletion", { enumerable: true, get: function () { return index_js_2.chatCompletion; } });
Object.defineProperty(exports, "chatCompletionStream", { enumerable: true, get: function () { return index_js_2.chatCompletionStream; } });
Object.defineProperty(exports, "buildContextParts", { enumerable: true, get: function () { return index_js_2.buildContextParts; } });
Object.defineProperty(exports, "buildSystemPrompt", { enumerable: true, get: function () { return index_js_2.buildSystemPrompt; } });
Object.defineProperty(exports, "estimateContextTokens", { enumerable: true, get: function () { return index_js_2.estimateContextTokens; } });
Object.defineProperty(exports, "parseMemoryExtract", { enumerable: true, get: function () { return index_js_2.parseMemoryExtract; } });
Object.defineProperty(exports, "saveExtractedMemory", { enumerable: true, get: function () { return index_js_2.saveExtractedMemory; } });
Object.defineProperty(exports, "requiresConfirmation", { enumerable: true, get: function () { return index_js_2.requiresConfirmation; } });
Object.defineProperty(exports, "chat", { enumerable: true, get: function () { return index_js_2.chat; } });
Object.defineProperty(exports, "createSession", { enumerable: true, get: function () { return index_js_2.createSession; } });
Object.defineProperty(exports, "getSession", { enumerable: true, get: function () { return index_js_2.getSession; } });
Object.defineProperty(exports, "getOrCreateSession", { enumerable: true, get: function () { return index_js_2.getOrCreateSession; } });
Object.defineProperty(exports, "listSessions", { enumerable: true, get: function () { return index_js_2.listSessions; } });
Object.defineProperty(exports, "deleteSession", { enumerable: true, get: function () { return index_js_2.deleteSession; } });
Object.defineProperty(exports, "clearSpaceSessions", { enumerable: true, get: function () { return index_js_2.clearSpaceSessions; } });
Object.defineProperty(exports, "getChatHistory", { enumerable: true, get: function () { return index_js_2.getChatHistory; } });
Object.defineProperty(exports, "exportSession", { enumerable: true, get: function () { return index_js_2.exportSession; } });
//# sourceMappingURL=index.js.map