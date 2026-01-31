/**
 * Second Brain AI - Persistent Memory System
 * Main entry point.
 */
import 'dotenv/config';
import { createApp } from './api/index.js';
import { spaceService } from './domain/index.js';
import { initializeAI, isAIConfigured } from './ai/index.js';
import { onRequest } from 'firebase-functions/v2/https';
import { fileURLToPath } from 'url';
const PORT = parseInt(process.env['LOCAL_PORT'] ?? '3000', 10);
// Initialize application
async function bootstrap() {
    // Initialize services
    await spaceService.init();
    // Initialize AI provider
    initializeAI();
    return createApp();
}
// Create app instance (top-level await supported in Node 18+ ESM)
const app = await bootstrap();
// Export for Firebase Cloud Functions
export const api = onRequest({ region: 'us-central1' }, app);
// Start server LOCALLY if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(PORT, () => {
        console.log(`🧠 Second Brain AI server running on port ${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/health`);
        console.log(`   API base: http://localhost:${PORT}/api/v1`);
        console.log(`   Web UI: http://localhost:${PORT}`);
        // Warn if AI is not configured
        if (!isAIConfigured()) {
            console.log('');
            console.log('⚠️  WARNING: AI service is NOT configured!');
            console.log('   Set OPENAI_API_KEY environment variable to enable AI features.');
            console.log('   AI endpoints will return HTTP 503 until configured.');
            console.log('   Non-AI endpoints (spaces, sessions) will work normally.');
        }
    });
}
//# sourceMappingURL=index.js.map