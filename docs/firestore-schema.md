# Firestore Schema

The database uses a **Root Collection -> Document -> Subcollection** pattern to organize data. Each "Space" is an isolated container of memory.

## Collections

### `spaces` (Root Collection)
Stores the metadata for each Context Space.

-   **Document ID**: `UUID` (Space ID)
-   **Fields**:
    -   `id` (string): UUID.
    -   `name` (string): Display name.
    -   `description` (string): Purpose of the space.
    -   `rules` (map): configuration (e.g., `allowHealthData`, `noteRetentionDays`).
    -   `createdAt` (ISO String).
    -   `updatedAt` (ISO String).
    -   `isActive` (boolean).
    -   `tags` (array of strings).

---

### `spaces/{spaceId}/data` (Subcollection)
Contains the actual memory data chunks. To keep documents within size limits and organize logically, data is split into specific documents within this subcollection.

#### 1. Document: `profile`
Stores structured user information.
-   **Path**: `spaces/{spaceId}/data/profile`
-   **Fields**:
    -   `entries` (Array): List of profile objects.
        -   `key`, `value`, `category`, `source`.
    -   `lastUpdated` (ISO String).

#### 2. Document: `facts`
Stores verified truths.
-   **Path**: `spaces/{spaceId}/data/facts`
-   **Fields**:
    -   `items` (Array): List of Fact objects.
        -   `id`, `statement`, `category`, `confidence`, `source`.
    -   `lastUpdated` (ISO String).

#### 3. Document: `notes`
Stores ephemeral or unverified observations.
-   **Path**: `spaces/{spaceId}/data/notes`
-   **Fields**:
    -   `items` (Array): List of Note objects.
        -   `id`, `content`, `importance`, `factCandidate` (boolean).
    -   `lastUpdated` (ISO String).

#### 4. Document: `timeline`
Stores history of events (What happened when).
-   **Path**: `spaces/{spaceId}/data/timeline`
-   **Fields**:
    -   `entries` (Array): List of TimelineEntry objects.
        -   `id`, `timestamp`, `eventType` (e.g., `fact_added`, `note_promoted`), `title`.
    -   `lastUpdated` (ISO String).

---

*Note: Chat Sessions are managed separately (schema details for sessions defined in `src/types/chat.ts` but currently implemented in memory or separate `sessions` collection depending on strict implementation - codebase suggests `ChatSession` type exists but `SpaceService` focuses on memory. If sessions are persisted, they typically follow a `sessions` root collection).*
