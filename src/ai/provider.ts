/**
 * AI Provider Service
 * Handles communication with OpenAI API.
 */

import OpenAI from 'openai';
import type { ChatMessage, AIProviderConfig } from '../types/index.js';

/** Supported OpenAI models */
export const SUPPORTED_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
] as const;

export type SupportedModel = typeof SUPPORTED_MODELS[number];

// CHANGE: Added model validation helper
/** Validate if model is supported */
export function isSupportedModel(model: string): model is SupportedModel {
  return SUPPORTED_MODELS.includes(model as SupportedModel);
}

// Default configuration
// CHANGE: Model now defaults to gpt-4o-mini (backward compatible)
const DEFAULT_CONFIG: AIProviderConfig = {
  provider: 'openai',
  model: process.env['OPENAI_MODEL'] || 'gpt-4o-mini',
  maxTokens: 2000,
  temperature: 0.7,
};

let openaiClient: OpenAI | null = null;
let currentConfig: AIProviderConfig = DEFAULT_CONFIG;

/** Initialize OpenAI client */
export function initializeAI(config?: Partial<AIProviderConfig>): void {
  currentConfig = { ...DEFAULT_CONFIG, ...config };
  
  // CHANGE: Validate model on initialization
  if (!isSupportedModel(currentConfig.model)) {
    console.warn(`⚠️ Unsupported model "${currentConfig.model}". Falling back to gpt-4o-mini.`);
    console.warn(`   Supported models: ${SUPPORTED_MODELS.join(', ')}`);
    currentConfig.model = 'gpt-4o-mini';
  }
  
  const apiKey = config?.apiKey || process.env['OPENAI_API_KEY'];
  
  if (!apiKey) {
    console.warn('⚠️ OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    return;
  }

  openaiClient = new OpenAI({
    apiKey,
    baseURL: currentConfig.baseUrl,
  });

  console.log(`🤖 AI Provider initialized: ${currentConfig.provider} (${currentConfig.model})`);
}

/** Check if AI is configured */
export function isAIConfigured(): boolean {
  return openaiClient !== null;
}

/** Get current AI configuration */
export function getAIConfig(): AIProviderConfig {
  return { ...currentConfig };
}

// CHANGE: Added function to dynamically change model
/** 
 * Set OpenAI model
 * @throws Error if model is not supported
 */
export function setModel(model: string): void {
  if (!isSupportedModel(model)) {
    throw new Error(
      `Unsupported model "${model}". Supported models: ${SUPPORTED_MODELS.join(', ')}`
    );
  }
  
  currentConfig.model = model;
  console.log(`🔄 AI model changed to: ${model}`);
}

/** Send chat completion request */
export async function chatCompletion(
  systemPrompt: string,
  messages: ChatMessage[],
  options?: Partial<AIProviderConfig>
): Promise<string> {
  if (!openaiClient) {
    throw new Error('AI provider not initialized. Set OPENAI_API_KEY environment variable.');
  }

  const config = { ...currentConfig, ...options };

  // Convert to OpenAI message format
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  try {
    const response = await openaiClient.chat.completions.create({
      model: config.model,
      messages: openaiMessages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from AI');
    }

    return content;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.message);
      throw new Error(`AI Error: ${error.message}`);
    }
    throw error;
  }
}

/** Stream chat completion (for future use) */
export async function* chatCompletionStream(
  systemPrompt: string,
  messages: ChatMessage[],
  options?: Partial<AIProviderConfig>
): AsyncGenerator<string, void, unknown> {
  if (!openaiClient) {
    throw new Error('AI provider not initialized');
  }

  const config = { ...currentConfig, ...options };

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const stream = await openaiClient.chat.completions.create({
    model: config.model,
    messages: openaiMessages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
