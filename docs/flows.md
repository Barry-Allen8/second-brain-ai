# User Flows

Description of the primary interaction paths within the application.

## 1. Creating a Space
1.  **UI**: User clicks "New Space", fills form (Name, Description).
2.  **API**: `POST /api/v1/spaces`
3.  **Service**: `spaceService.createSpace(data)`
4.  **DB**:
    -   Generates new UUID.
    -   Creates `spaces/{id}` document.
    -   Creates empty sub-documents: `data/profile`, `data/facts`, `data/notes`, `data/timeline`.
5.  **Return**: Returns Space Metadata to UI.

## 2. Chatting with Memory
1.  **UI**: User sends a message in a Space.
2.  **API**: `POST /api/v1/chat`
3.  **Service**:
    -   **Context Retrieval**: Fetches Profile, relevant Facts, and Notes from Firestore (`spaceService.queryContext()`).
    -   **Prompt Engineering**: specific System Prompt constructed with retrieved context + User Message.
    -   **Inference**: Calls OpenAI API.
4.  **Memory Extraction** (Post-Processing):
    -   AI response is parsed for JSON blocks indicating new memories.
    -   **New Fact**: If AI identifies a fact -> `spaceService.addFact()`.
    -   **New Note**: If AI identifies a note -> `spaceService.addNote()`.
5.  **DB Update**: Firestore documents (`facts`, `notes`, `timeline`) are updated.
6.  **Return**: Chat response + list of any extracted memories.

## 3. Reading/Updating Memory
1.  **UI**: User navigates to Space Details ("Brain" tab).
2.  **API**: `GET /api/v1/spaces/{id}/context` (or specific sub-resources).
3.  **Service**: Fetches `facts`, `notes`, `profile` docs.
4.  **UI**: Renders lists of items.
5.  **Action**: User can manually edit/delete items or "Promote Note to Fact".
    -   **Promote**: Calls `POST .../promote`. Service moves item from `notes` array to `facts` array and updates timeline.
