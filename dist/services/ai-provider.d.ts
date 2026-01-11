/**
 * AI Provider Service
 * Handles communication with OpenAI API.
 */
import type { ChatMessage, AIProviderConfig } from '../types/index.js';
/** Initialize OpenAI client */
export declare function initializeAI(config?: Partial<AIProviderConfig>): void;
/** Check if AI is configured */
export declare function isAIConfigured(): boolean;
/** Get current AI configuration */
export declare function getAIConfig(): AIProviderConfig;
/** Send chat completion request */
export declare function chatCompletion(systemPrompt: string, messages: ChatMessage[], options?: Partial<AIProviderConfig>): Promise<string>;
/** Stream chat completion (for future use) */
export declare function chatCompletionStream(systemPrompt: string, messages: ChatMessage[], options?: Partial<AIProviderConfig>): AsyncGenerator<string, void, unknown>;
//# sourceMappingURL=ai-provider.d.ts.map