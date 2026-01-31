# Mobile App "Second Brain AI" - IDE Prompt

Use the following description as a prompt for an AI IDE (like Cursor, Windsurf) or a developer to create a native mobile version of this application.

---

## Project Goal
Create a native mobile application (iOS & Android) for "Second Brain AI" that replicates the functionality of the existing web application.
The app should allow users to chat with their AI "Second Brain", manage persistent memory spaces, and view their profile/facts/notes.

## Preferred Tech Stack
-   **Framework**: React Native (with Expo)
-   **Language**: TypeScript
-   **Backend**: Reuse existing Node.js/Express API (e.g., connected via localhost or deployed URL)
-   **Styling**: NativeWind (Tailwind CSS for React Native) or standard StyleSheet
-   **Navigation**: Expo Router (file-based routing similar to Next.js)

## Architecture & Communication
The mobile app will act as a client for the existing backend.
-   **API Base URL**: Configurable via `.env` (e.g., `http://localhost:3000/api/v1` for dev).
-   **Authentication**:
    -   *MVP*: Reuse existing "open" access or implement simple local storage for "User ID" if needed by backend.
    -   *Future*: Firebase Auth integration (since backend uses Firebase Admin).

## Core Features (Screens)

### 1. Home (Spaces List)
-   Fetch list of spaces from `GET /api/v1/spaces`.
-   Display spaces as cards (Name, Icon, Description).
-   "Create Space" FAB (Floating Action Button).
    -   Opens modal to input Name, Description, and Icon.
    -   `POST /api/v1/spaces`.

### 2. Space Detail (Main View)
-   **Tab Navigation**: "Chat" | "Memory" | "Settings"

#### A. Chat Tab
-   **Interface**: Standard chat UI (Bubble view).
-   **Functionality**:
    -   Display message history.
    -   Input area with "Send" button.
    -   `POST /api/v1/chat` to send messages.
    -   Support "Streaming" text if the backend supports it, otherwise loading states.
    -   Display "Extracted Memories" (Facts/Notes) in a collapsible section under the AI response.

#### B. Memory Tab ("The Brain")
-   **Sections**:
    -   **Profile**: List Key/Value pairs from `data/profile`.
    -   **Facts**: List verified facts from `data/facts`.
    -   **Notes**: List notes from `data/notes`.
-   **Actions**:
    -   Pull-to-refresh to reload from `GET /api/v1/spaces/{id}/context`.

#### C. Settings Tab
-   Edit Space details (Name, Color).
-   Delete Space (`DELETE /api/v1/spaces/{id}`).

## Data Types (Reference)

Use these existing TypeScript definitions for the API responses:

```typescript
// Shared Types

export interface SpaceMetadata {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Fact {
  id: string;
  statement: string;
  category: string;
  confidence: 'low' | 'medium' | 'high' | 'verified';
}

export interface Note {
  id: string;
  content: string;
  importance: 'low' | 'medium' | 'high';
}
```

## Design Guidelines
-   **Mental Model**: "Clean, futuristic, personal database".
-   **Colors**: Dark mode by default (like the web app).
-   **Icons**: Lucide React Native or Ionicons.
-   **UX**: Fast transitions, optimistic UI updates where possible.

## Implementation Steps for AI Assistant
1.  Initialize a new Expo project with TypeScript.
2.  Set up `axios` or `fetch` client to talk to the backend.
3.  Create the `SpaceMetadata` and `Chat` type definitions.
4.  Implement the **Home Screen** (Spaces List).
5.  Implement the **Space Detail Screen** with Tab Navigation.
6.  Implement the **Chat Interface** (integrating with API).
7.  Implement the **Memory View** (Profile/Facts Lists).

---
