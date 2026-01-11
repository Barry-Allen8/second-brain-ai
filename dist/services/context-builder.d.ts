/**
 * Context Builder Service
 * Constructs optimized prompts from memory context for AI consumption.
 */
import type { EntityId, SystemPromptParts } from '../types/index.js';
/** Build system prompt parts from a space */
export declare function buildContextParts(spaceId: EntityId): Promise<SystemPromptParts>;
/** Build complete system prompt */
export declare function buildSystemPrompt(spaceId: EntityId): Promise<string>;
/** Estimate token count for the built context */
export declare function estimateContextTokens(prompt: string): number;
//# sourceMappingURL=context-builder.d.ts.map