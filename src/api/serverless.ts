/**
 * Vercel Serverless Entry Point
 * 
 * This file exports the Express app as a serverless function handler.
 * Used by Vercel for serverless deployment.
 * 
 * For local development, use `npm run dev` which runs src/index.ts
 * with app.listen() for a traditional server.
 */

import 'dotenv/config';
import type { Request, Response } from 'express';
import { createApp } from './app.js';
import { spaceService } from '../domain/index.js';
import { initializeAI } from '../ai/index.js';

// Lazy initialization flag (persists across warm starts)
let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  
  await spaceService.init();
  initializeAI();
  initialized = true;
}

// Create Express app instance (reused across warm starts)
const app = createApp();

/**
 * Vercel serverless handler
 * Initializes services on first request (cold start),
 * then delegates to Express app.
 */
export default async function handler(
  req: Request,
  res: Response
): Promise<void> {
  await ensureInitialized();
  
  // Express app handles the request
  return new Promise((resolve) => {
    app(req, res, () => {
      resolve();
    });
  });
}
