/**
 * Second Brain AI - Persistent Memory System
 * Main entry point.
 */

import 'dotenv/config';
import { createApp } from './api/index.js';
import { spaceService, initializeAI } from './services/index.js';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

async function main() {
  // Initialize services
  await spaceService.init();
  
  // Initialize AI provider
  initializeAI();
  
  // Create and start server
  const app = createApp();
  
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
