/**
 * Express application setup.
 */
import express from 'express';
import path from 'node:path';
import { spacesRouter, chatRouter } from './routes/index.js';
import { errorHandler, createSuccessResponse } from './middleware.js';
import { isAIConfigured, getAIConfig } from '../ai/index.js';
export function createApp() {
    const app = express();
    // Middleware
    app.use(express.json());
    // Serve static files from public directory
    // In production, public folder is copied to dist/public
    const publicPath = path.join(process.cwd(), 'dist', 'public');
    app.use(express.static(publicPath));
    // Health check with AI readiness
    app.get('/health', (_req, res) => {
        const aiConfigured = isAIConfigured();
        const aiConfig = getAIConfig();
        res.json(createSuccessResponse({
            status: 'ok',
            version: '1.0.0',
            services: {
                ai: {
                    ready: aiConfigured,
                    provider: aiConfigured ? aiConfig.provider : null,
                    model: aiConfigured ? aiConfig.model : null,
                    message: aiConfigured
                        ? 'AI service is ready'
                        : 'AI service unavailable - OPENAI_API_KEY not configured',
                },
            },
        }));
    });
    // API info endpoint
    app.get('/api', (_req, res) => {
        res.json(createSuccessResponse({
            name: 'Second Brain AI',
            version: '1.0.0',
            description: 'Persistent memory system for AI assistants',
            endpoints: {
                health: '/health',
                spaces: '/api/v1/spaces',
                chat: '/api/v1/chat',
                docs: 'See README.md for full API documentation'
            }
        }));
    });
    // API routes
    app.use('/api/v1/spaces', spacesRouter);
    app.use('/api/v1/chat', chatRouter);
    // Error handling
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map