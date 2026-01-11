"use strict";
/**
 * Context Builder Service
 * Constructs optimized prompts from memory context for AI consumption.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContextParts = buildContextParts;
exports.buildSystemPrompt = buildSystemPrompt;
exports.estimateContextTokens = estimateContextTokens;
const storage_js_1 = require("./storage.js");
const MAX_FACTS = 30;
const MAX_NOTES = 15;
const MAX_TIMELINE = 10;
/** Build system prompt parts from a space */
async function buildContextParts(spaceId) {
    const [metadata, profile, facts, notes, timeline] = await Promise.all([
        storage_js_1.storage.readMetadata(spaceId),
        storage_js_1.storage.readProfile(spaceId),
        storage_js_1.storage.readFacts(spaceId),
        storage_js_1.storage.readNotes(spaceId),
        storage_js_1.storage.readTimeline(spaceId),
    ]);
    return {
        baseInstructions: buildBaseInstructions(metadata),
        spaceContext: buildSpaceContext(metadata),
        profileSection: buildProfileSection(profile),
        factsSection: buildFactsSection(facts),
        notesSection: buildNotesSection(notes),
        timelineSection: buildTimelineSection(timeline),
        extractionInstructions: buildExtractionInstructions(),
    };
}
/** Build complete system prompt */
async function buildSystemPrompt(spaceId) {
    const parts = await buildContextParts(spaceId);
    return `${parts.baseInstructions}

${parts.spaceContext}

${parts.profileSection}

${parts.factsSection}

${parts.notesSection}

${parts.timelineSection}

${parts.extractionInstructions}`;
}
function buildBaseInstructions(metadata) {
    const healthWarning = metadata.rules.allowHealthData
        ? `
ВАЖЛИВО: Цей простір містить медичні дані. 
- Ніколи не ставте діагнози
- Використовуйте advisory language ("рекомендую проконсультуватись з лікарем")
- Чітко вказуйте на невизначеність`
        : '';
    return `Ти — AI-асистент з персистентною пам'яттю. 
Ти маєш доступ до структурованої інформації про користувача.
Використовуй цю інформацію для персоналізованих відповідей.

ПРАВИЛА:
1. Не питай про інформацію, яка вже є в контексті
2. Посилайся на відомі факти природно ("як ви згадували раніше...")
3. Якщо інформації немає — чесно скажи
4. Розрізняй ФАКТИ (верифіковані) та НОТАТКИ (спостереження)
5. При виявленні нової важливої інформації — зазначай це
${healthWarning}

${metadata.rules.customInstructions || ''}`;
}
function buildSpaceContext(metadata) {
    return `=== КОНТЕКСТ: ${metadata.name} ===
Опис: ${metadata.description}
Теги: ${metadata.tags.join(', ') || 'немає'}`;
}
function buildProfileSection(profile) {
    if (profile.entries.length === 0) {
        return '=== ПРОФІЛЬ ===\nПрофіль порожній.';
    }
    const now = new Date().toISOString();
    const validEntries = profile.entries.filter(e => {
        if (e.validFrom && e.validFrom > now)
            return false;
        if (e.validUntil && e.validUntil < now)
            return false;
        return true;
    });
    // Group by category
    const grouped = validEntries.reduce((acc, entry) => {
        if (!acc[entry.category])
            acc[entry.category] = [];
        acc[entry.category].push(entry);
        return acc;
    }, {});
    let section = '=== ПРОФІЛЬ ===\n';
    for (const [category, entries] of Object.entries(grouped)) {
        section += `\n[${category.toUpperCase()}]\n`;
        for (const entry of entries) {
            const value = Array.isArray(entry.value) ? entry.value.join(', ') : entry.value;
            section += `• ${entry.key}: ${value}\n`;
        }
    }
    return section;
}
function buildFactsSection(facts) {
    if (facts.items.length === 0) {
        return '=== ФАКТИ ===\nФактів немає.';
    }
    // Sort by confidence (verified first) then by date
    const sorted = [...facts.items]
        .sort((a, b) => {
        const confOrder = { verified: 0, high: 1, medium: 2, low: 3 };
        const confDiff = confOrder[a.confidence] - confOrder[b.confidence];
        return confDiff !== 0 ? confDiff : b.createdAt.localeCompare(a.createdAt);
    })
        .slice(0, MAX_FACTS);
    // Group by category
    const grouped = sorted.reduce((acc, fact) => {
        if (!acc[fact.category])
            acc[fact.category] = [];
        acc[fact.category].push(fact);
        return acc;
    }, {});
    let section = '=== ФАКТИ (верифіковані) ===\n';
    for (const [category, categoryFacts] of Object.entries(grouped)) {
        section += `\n[${category.toUpperCase()}]\n`;
        for (const fact of categoryFacts) {
            const conf = getConfidenceEmoji(fact.confidence);
            const tags = fact.tags.length > 0 ? ` [${fact.tags.join(', ')}]` : '';
            section += `${conf} ${fact.statement}${tags}\n`;
        }
    }
    return section;
}
function getConfidenceEmoji(confidence) {
    switch (confidence) {
        case 'verified': return '✓';
        case 'high': return '◉';
        case 'medium': return '○';
        case 'low': return '◌';
        default: return '•';
    }
}
function buildNotesSection(notes) {
    // Filter out promoted notes and sort by importance/date
    const activeNotes = notes.items
        .filter(n => !n.promotedToFactId)
        .sort((a, b) => {
        const impOrder = { high: 0, medium: 1, low: 2 };
        const impDiff = impOrder[a.importance] - impOrder[b.importance];
        return impDiff !== 0 ? impDiff : b.createdAt.localeCompare(a.createdAt);
    })
        .slice(0, MAX_NOTES);
    if (activeNotes.length === 0) {
        return '=== НОТАТКИ ===\nНотаток немає.';
    }
    let section = '=== НОТАТКИ (спостереження, неверифіковані) ===\n';
    for (const note of activeNotes) {
        const imp = note.importance === 'high' ? '⚡' : note.importance === 'medium' ? '•' : '○';
        const cat = note.category ? `[${note.category}] ` : '';
        section += `${imp} ${cat}${note.content}\n`;
    }
    return section;
}
function buildTimelineSection(timeline) {
    const recent = [...timeline.entries]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, MAX_TIMELINE);
    if (recent.length === 0) {
        return '=== ОСТАННІ ЗМІНИ ===\nІсторія порожня.';
    }
    let section = '=== ОСТАННІ ЗМІНИ ===\n';
    for (const entry of recent) {
        const date = new Date(entry.timestamp).toLocaleDateString('uk-UA');
        section += `• ${date}: ${entry.title}\n`;
    }
    return section;
}
function buildExtractionInstructions() {
    return `
=== ІНСТРУКЦІЇ ВИТЯГУВАННЯ ІНФОРМАЦІЇ ===
Якщо в розмові з'являється НОВА важлива інформація, яку варто запам'ятати,
в кінці відповіді додай JSON-блок у форматі:

\`\`\`memory_extract
{
  "facts": [
    {
      "category": "категорія",
      "statement": "факт для запам'ятовування",
      "confidence": "high|medium|low",
      "reason": "чому це важливо"
    }
  ],
  "notes": [
    {
      "content": "спостереження",
      "category": "категорія",
      "importance": "high|medium|low",
      "reason": "чому варто записати"
    }
  ],
  "profileUpdates": [
    {
      "category": "категорія",
      "key": "ключ",
      "value": "значення",
      "reason": "чому оновлюємо профіль"
    }
  ]
}
\`\`\`

Додавай цей блок ТІЛЬКИ якщо є нова інформація для збереження.
Не дублюй те, що вже є в контексті.`;
}
/** Estimate token count for the built context */
function estimateContextTokens(prompt) {
    // Rough estimation: ~4 chars per token for English, ~2-3 for Ukrainian
    return Math.ceil(prompt.length / 3);
}
//# sourceMappingURL=context-builder.js.map