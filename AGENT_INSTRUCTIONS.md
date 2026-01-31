# Agent Instructions

You must operate using the following skills:

- ui-ux-pro-max
- vercel-react-best-practices

These skills are located in:
.claude/skills/

Rules:
- These skills are authoritative.
- If there is a conflict between general knowledge and a skill, follow the skill.
- Apply them by default to all design, UI, React, Next.js, and architecture decisions.

Before making any decision or generating code,
you must first load and follow the corresponding SKILL.md files
from .claude/skills/.

---

## Technical Requirements (January 2026)

### Runtime & Package Manager
| Technology | Required Version | Notes |
|------------|------------------|-------|
| **Node.js** | 24.x LTS | Active LTS "Krypton", supported until April 2028 |
| **pnpm** | 10.x | Latest: 10.28.0. Fast package manager with global store |

### Core Dependencies
| Package | Required Version | Notes |
|---------|------------------|-------|
| **TypeScript** | 5.9.x | Latest stable: 5.9.3. TypeScript 7 (native Go port) coming Q1 2026 |
| **Express** | 5.x | Latest: 5.2.1. Now default on npm, requires Node 18+ |
| **Zod** | 4.x | Latest: 4.3.5. Major rewrite with better performance |

### Firebase
| Package | Required Version | Notes |
|---------|------------------|-------|
| **firebase-admin** | 13.x | Latest: 13.6.0. Requires Node 18+ |
| **firebase-functions** | 7.x | Latest stable |
| **firebase** (client) | 12.x | Latest: 12.8.0 |

### AI Integration
| Package | Required Version | Notes |
|---------|------------------|-------|
| **openai** | 6.x | Latest: 6.16.0. Major update from 4.x |

### Dev Dependencies
| Package | Required Version | Notes |
|---------|------------------|-------|
| **vitest** | 4.x | Latest: 4.0.17. Browser Mode now stable |
| **tsx** | 4.x | TypeScript execution for development |

### Migration Notes

When upgrading from current versions:

1. **Node.js 20 → 24**: Check for deprecated APIs, update CI/CD pipelines
2. **Express 4 → 5**: Use official codemod (`npx @expressjs/codemod`), update path patterns
3. **OpenAI 4 → 6**: Breaking API changes, review migration guide
4. **Zod 3 → 4**: New API methods, better TypeScript inference
5. **Vitest 1 → 4**: Browser Mode API changes, update test configs

### engines (package.json)
```json
{
  "engines": {
    "node": ">=24"
  },
  "packageManager": "pnpm@10.28.0"
}
```
