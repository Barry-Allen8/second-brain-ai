# Architecture Overview

The project follows a pragmatic monolithic layered architecture, designed for dual deployment (Serverless or Long-running Node process).

## Directory Structure

```
src/
├── api/            # Interface Layer (Express Router, Controllers)
│   ├── routes/     # API Route definitions
│   └── app.ts      # Express App configuration
├── domain/         # Business Logic Layer (Core)
│   ├── space.service.ts   # Space management logic
│   └── storage.service.ts # Data Access abstraction (Firestore)
├── ai/             # AI Integration Layer
│   ├── openai/     # OpenAI specific implementation
│   └── prompts/    # System prompts & extraction logic
├── types/          # Shared TypeScript definitions
├── public/         # Frontend Client (HTML/JS/CSS)
└── index.ts        # Entry point (bootstraps server)
```

## Layers

### 1. Interface Layer (`src/api`)
-   **Role**: Handles HTTP requests, validation (Zod), and response formatting.
-   **Tech**: Express.js.
-   **Key Components**:
    -   `routes/spaces.ts`: Endpoints for managing spaces.
    -   `routes/chat.ts`: Endpoints for chat interactions.
    -   `middleware.ts`: Error handling and logging.

### 2. Domain Layer (`src/domain`)
-   **Role**: Implements business rules and use cases. It is agnostic of the HTTP layer.
-   **Key Components**:
    -   `SpaceService`: Manages the lifecycle of Spaces, Facts, Notes, and Profiles.
    -   `StorageService`: Abstract data access. Currently implements Firestore interactions. It handles the mapping between TypeScript objects and Firestore documents.

### 3. AI Layer (`src/ai`)
-   **Role**: Manages interactions with LLMs (OpenAI).
-   **Key Components**:
    -   **Context Builder**: Assembles relevant Facts/Notes into a prompt.
    -   **Extraction**: Parses LLM responses to find memory updates (new facts, updated profile).

### 4. Data Layer (Firestore)
-   **Role**: Persistence.
-   **Access**: Through `firebase-admin` via `StorageService`.

### 5. Frontend (`src/public`)
-   **Role**: User Interface.
-   **Tech**: Vanilla JavaScript (ES Modules), CSS, HTML.
-   **Communication**: Fetches data from `/api/v1/*`.

## Design Decisions

-   **Types-First**: All data structures are defined in `src/types` first, ensuring consistency between Frontend, Backend, and DB.
-   **Storage Abstraction**: `StorageService` isolates DB logic, allowing potential future swaps (e.g., to Vector DB or SQL) without changing business logic.
-   **Firebase Deployment**: The app exports both an Express `app` (for local development) and a Firebase `onRequest` handler (for Cloud Functions). Static assets are served via Firebase Hosting.
