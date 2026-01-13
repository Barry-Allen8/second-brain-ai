/**
 * Chat and AI integration types
 */
import type { EntityId } from './memory.js';
/** Chat message role */
export type MessageRole = 'system' | 'user' | 'assistant';
/** Chat message */
export interface ChatMessage {
    id: EntityId;
    role: MessageRole;
    content: string;
    timestamp: string;
    /** Extracted facts/notes from this message */
    extractedData?: ExtractedMemory;
}
/** Chat session */
export interface ChatSession {
    id: EntityId;
    spaceId: EntityId;
    name?: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}
/** Extracted memory from AI response */
export interface ExtractedMemory {
    facts: ExtractedFact[];
    notes: ExtractedNote[];
    profileUpdates: ExtractedProfileUpdate[];
}
/** Fact extracted from conversation */
export interface ExtractedFact {
    category: string;
    statement: string;
    confidence: 'low' | 'medium' | 'high' | 'verified';
    reason: string;
}
/** Note extracted from conversation */
export interface ExtractedNote {
    content: string;
    category?: string;
    importance: 'low' | 'medium' | 'high';
    reason: string;
}
/** Profile update extracted from conversation */
export interface ExtractedProfileUpdate {
    category: string;
    key: string;
    value: string | number | boolean | string[];
    reason: string;
}
/** AI provider configuration */
export interface AIProviderConfig {
    provider: 'openai' | 'anthropic' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    maxTokens: number;
    temperature: number;
}
/** Chat request */
export interface ChatRequest {
    spaceId: EntityId;
    message: string;
    sessionId?: EntityId;
}
/** Chat response */
export interface ChatResponse {
    sessionId: EntityId;
    message: ChatMessage;
    extractedMemory?: ExtractedMemory;
    context: {
        factsUsed: number;
        notesUsed: number;
        tokensEstimate: number;
    };
}
/** System prompt parts */
export interface SystemPromptParts {
    baseInstructions: string;
    spaceContext: string;
    profileSection: string;
    factsSection: string;
    notesSection: string;
    timelineSection: string;
    extractionInstructions: string;
}
//# sourceMappingURL=chat.d.ts.map