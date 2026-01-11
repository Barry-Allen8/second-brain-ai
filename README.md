# Second Brain AI

Persistent memory system for AI assistants with isolated context spaces.

## Quick Start

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`.

## Architecture

### Context Spaces
Each space is an isolated memory container with:
- `space.json` - Metadata and rules
- `profile.json` - Stable characteristics
- `facts.json` - Verified statements
- `notes.json` - Unverified observations
- `timeline.json` - Change history

### Memory Types

| Type | Purpose | Trust Level |
|------|---------|-------------|
| Profile | Stable attributes | High |
| Facts | Verified statements | High |
| Notes | Observations | Low |
| Timeline | Change tracking | N/A |

## API Endpoints

### Spaces
- `GET /api/v1/spaces` - List spaces
- `POST /api/v1/spaces` - Create space
- `GET /api/v1/spaces/:id` - Get space
- `PATCH /api/v1/spaces/:id` - Update space
- `DELETE /api/v1/spaces/:id` - Delete space
- `POST /api/v1/spaces/:id/context` - Query context for AI

### Facts
- `GET /api/v1/spaces/:id/facts` - List facts
- `POST /api/v1/spaces/:id/facts` - Add fact
- `PATCH /api/v1/spaces/:id/facts/:factId` - Update fact
- `DELETE /api/v1/spaces/:id/facts/:factId` - Delete fact

### Notes
- `GET /api/v1/spaces/:id/notes` - List notes
- `POST /api/v1/spaces/:id/notes` - Add note
- `PATCH /api/v1/spaces/:id/notes/:noteId` - Update note
- `DELETE /api/v1/spaces/:id/notes/:noteId` - Delete note
- `POST /api/v1/spaces/:id/notes/:noteId/promote` - Promote to fact

### Profile
- `GET /api/v1/spaces/:id/profile` - Get profile entries
- `POST /api/v1/spaces/:id/profile` - Add entry
- `PATCH /api/v1/spaces/:id/profile/:entryId` - Update entry
- `DELETE /api/v1/spaces/:id/profile/:entryId` - Delete entry

### Timeline
- `GET /api/v1/spaces/:id/timeline` - Get timeline
- `POST /api/v1/spaces/:id/timeline` - Add event

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `DATA_DIR` | ./data/spaces | Storage directory |

## Design Principles

1. **Isolation** - Spaces never share data
2. **Explicit Memory** - No silent assumptions
3. **Structured Data** - JSON over raw text
4. **Scalability** - Designed for future vector search
5. **Safety** - Health data flagged, advisory language used
