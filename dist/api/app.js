"use strict";
/**
 * Express application setup.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const index_js_1 = require("./routes/index.js");
const middleware_js_1 = require("./middleware.js");
function createApp() {
    const app = (0, express_1.default)();
    // Middleware
    app.use(express_1.default.json());
    // Serve static files from public directory
    // In production, public folder is copied to dist/public
    const publicPath = node_path_1.default.join(process.cwd(), 'dist', 'public');
    app.use(express_1.default.static(publicPath));
    // Health check
    app.get('/health', (_req, res) => {
        res.json((0, middleware_js_1.createSuccessResponse)({ status: 'ok', version: '1.0.0' }));
    });
    // API info endpoint
    app.get('/api', (_req, res) => {
        res.json((0, middleware_js_1.createSuccessResponse)({
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
    app.use('/api/v1/spaces', index_js_1.spacesRouter);
    app.use('/api/v1/spaces/:spaceId/facts', index_js_1.factsRouter);
    app.use('/api/v1/spaces/:spaceId/notes', index_js_1.notesRouter);
    app.use('/api/v1/spaces/:spaceId/profile', index_js_1.profileRouter);
    app.use('/api/v1/spaces/:spaceId/timeline', index_js_1.timelineRouter);
    app.use('/api/v1/chat', index_js_1.chatRouter);
    // Error handling
    app.use(middleware_js_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map