"use strict";
/**
 * Second Brain AI - Persistent Memory System
 * Main entry point.
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const index_js_1 = require("./api/index.js");
const index_js_2 = require("./services/index.js");
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
async function main() {
    // Initialize services
    await index_js_2.spaceService.init();
    // Initialize AI provider
    (0, index_js_2.initializeAI)();
    // Create and start server
    const app = (0, index_js_1.createApp)();
    app.listen(PORT, () => {
        console.log(`🧠 Second Brain AI server running on port ${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/health`);
        console.log(`   API base: http://localhost:${PORT}/api/v1`);
        console.log(`   Web UI: http://localhost:${PORT}`);
    });
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map