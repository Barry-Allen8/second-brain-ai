/**
 * Express application setup.
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { spacesRouter, chatRouter } from './routes/index.js';
import { errorHandler, createSuccessResponse } from './middleware.js';
import { isAIConfigured, getAIConfig } from '../ai/index.js';
export function createApp() {
    const app = express();
    // Middleware
    const jsonParser = express.json();
    app.use((req, res, next) => {
        const hasBody = req.body !== undefined &&
            (Buffer.isBuffer(req.body) ||
                typeof req.body === 'string' ||
                (typeof req.body === 'object' && Object.keys(req.body).length > 0));
        if (hasBody) {
            return next();
        }
        if (req.headers['content-type']?.includes('multipart/form-data')) {
            return next();
        }
        return jsonParser(req, res, next);
    });
    // Serve static files from public directory
    // In production, public folder is copied to dist/public
    const distPublicPath = path.join(process.cwd(), 'dist', 'public');
    const srcPublicPath = path.join(process.cwd(), 'src', 'public');
    const publicPath = fs.existsSync(distPublicPath) ? distPublicPath : srcPublicPath;
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