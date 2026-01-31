# Second Brain AI

A persistent memory system for AI assistants with isolated context spaces. This application allows users to create "spaces" where an AI can store and recall facts, notes, and profiles, creating a long-term memory for intelligent interactions.

## Problem It Solves
Standard AI interactions are stateless; the AI forgets everything after the session ends. Second Brain AI provides a structured, persistent memory layer (Facts, Notes, User Profile, Timeline) stored in Firestore, enabling the AI to "remember" context across different conversations and sessions.

## Tech Stack

- **Frontend**: Vanilla JavaScript (HTML/CSS/JS)
  - Located in `src/public`
  - Served statically by the backend
- **Backend**: Node.js + Express
  - Located in `src/api`
  - Handles API requests and serves the frontend
- **Database**: Google Cloud Firestore
  - Accessed via `firebase-admin` SDK
  - Data abstractions in `src/domain`
- **AI**: OpenAI API
  - Integration in `src/ai`
- **Hosting**:
  - Supports **Vercel** (Serverless) via `api/serverless.js`
  - Supports **Firebase Functions** via `onRequest` in `index.ts`
  - Runnable as a standard Node.js server locally

## How to Run Locally

1.  **Prerequisites**:
    -   Node.js (v20+)
    -   pnpm (v9+)
    -   A Firebase project with Firestore enabled
    -   OpenAI API Key

2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

3.  **Environment Setup**:
    -   Create a `.env` file in the root directory (see `env.example` or documentation below).
    -   You need a Firebase Service Account JSON file for admin access.
    
    Refer to `docs/env.md` for detailed variable setup.

4.  **Start Development Server**:
    ```bash
    pnpm run dev
    ```
    -   Server runs at `http://localhost:3000` (default)
    -   Web UI: `http://localhost:3000`
    -   API: `http://localhost:3000/api/v1`
    -   Health Check: `http://localhost:3000/health`

## High-Level App Flow

1.  **User** interacts with the **Web UI** (creates a space, sends a message).
2.  **Web UI** sends an HTTP request to the **Express Backend**.
3.  **Backend** delegates logic to **Domain Services** (`SpaceService`, `ChatService`).
4.  **Domain Services** read/write state to **Firestore** (Database).
5.  If Chatting:
    -   **AI Service** retrieves context (Facts/Notes) from Firestore.
    -   Sends prompt + context to **OpenAI**.
    -   Parses response and updates Memory (extracts new facts) in **Firestore**.
6.  **Backend** returns JSON response to **Web UI**.

## Documentation

See `/docs` folder for details:
- [Architecture](./docs/architecture.md)
- [Firestore Schema](./docs/firestore-schema.md)
- [User Flows](./docs/flows.md)
- [Environment Variables](./docs/env.md)
