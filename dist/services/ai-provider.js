"use strict";
/**
 * AI Provider Service
 * Handles communication with OpenAI API.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAI = initializeAI;
exports.isAIConfigured = isAIConfigured;
exports.getAIConfig = getAIConfig;
exports.chatCompletion = chatCompletion;
exports.chatCompletionStream = chatCompletionStream;
const openai_1 = __importDefault(require("openai"));
// Default configuration
const DEFAULT_CONFIG = {
    provider: 'openai',
    model: process.env['OPENAI_MODEL'] || 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
};
let openaiClient = null;
let currentConfig = DEFAULT_CONFIG;
/** Initialize OpenAI client */
function initializeAI(config) {
    currentConfig = { ...DEFAULT_CONFIG, ...config };
    const apiKey = config?.apiKey || process.env['OPENAI_API_KEY'];
    if (!apiKey) {
        console.warn('⚠️ OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
        return;
    }
    openaiClient = new openai_1.default({
        apiKey,
        baseURL: currentConfig.baseUrl,
    });
    console.log(`🤖 AI Provider initialized: ${currentConfig.provider} (${currentConfig.model})`);
}
/** Check if AI is configured */
function isAIConfigured() {
    return openaiClient !== null;
}
/** Get current AI configuration */
function getAIConfig() {
    return { ...currentConfig };
}
/** Send chat completion request */
async function chatCompletion(systemPrompt, messages, options) {
    if (!openaiClient) {
        throw new Error('AI provider not initialized. Set OPENAI_API_KEY environment variable.');
    }
    const config = { ...currentConfig, ...options };
    // Convert to OpenAI message format
    const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role,
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
    }
    catch (error) {
        if (error instanceof openai_1.default.APIError) {
            console.error('OpenAI API Error:', error.message);
            throw new Error(`AI Error: ${error.message}`);
        }
        throw error;
    }
}
/** Stream chat completion (for future use) */
async function* chatCompletionStream(systemPrompt, messages, options) {
    if (!openaiClient) {
        throw new Error('AI provider not initialized');
    }
    const config = { ...currentConfig, ...options };
    const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role,
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
//# sourceMappingURL=ai-provider.js.map