/**
 * Second Brain AI - Frontend Application
 */

const API_BASE = '/api/v1';

// ═══════════════════════════════════════════════════════════
// State Management
// ═══════════════════════════════════════════════════════════

const state = {
  spaces: [],
  currentSpaceId: null,
  currentSpace: null,
  facts: [],
  notes: [],
  profile: [],
  timeline: [],
  chatSessionId: null,
  chatMessages: [],
  aiConfigured: false,
};

// ═══════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }
    
    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Spaces API
const spacesApi = {
  list: () => api('/spaces'),
  get: (id) => api(`/spaces/${id}`),
  create: (data) => api('/spaces', { method: 'POST', body: data }),
  update: (id, data) => api(`/spaces/${id}`, { method: 'PATCH', body: data }),
  delete: (id) => api(`/spaces/${id}`, { method: 'DELETE' }),
};

// Facts API
const factsApi = {
  list: (spaceId) => api(`/spaces/${spaceId}/facts`),
  create: (spaceId, data) => api(`/spaces/${spaceId}/facts`, { method: 'POST', body: data }),
  update: (spaceId, factId, data) => api(`/spaces/${spaceId}/facts/${factId}`, { method: 'PATCH', body: data }),
  delete: (spaceId, factId) => api(`/spaces/${spaceId}/facts/${factId}`, { method: 'DELETE' }),
};

// Notes API
const notesApi = {
  list: (spaceId) => api(`/spaces/${spaceId}/notes`),
  create: (spaceId, data) => api(`/spaces/${spaceId}/notes`, { method: 'POST', body: data }),
  update: (spaceId, noteId, data) => api(`/spaces/${spaceId}/notes/${noteId}`, { method: 'PATCH', body: data }),
  delete: (spaceId, noteId) => api(`/spaces/${spaceId}/notes/${noteId}`, { method: 'DELETE' }),
  promote: (spaceId, noteId, data) => api(`/spaces/${spaceId}/notes/${noteId}/promote`, { method: 'POST', body: data }),
};

// Profile API
const profileApi = {
  list: (spaceId) => api(`/spaces/${spaceId}/profile`),
  create: (spaceId, data) => api(`/spaces/${spaceId}/profile`, { method: 'POST', body: data }),
  update: (spaceId, entryId, data) => api(`/spaces/${spaceId}/profile/${entryId}`, { method: 'PATCH', body: data }),
  delete: (spaceId, entryId) => api(`/spaces/${spaceId}/profile/${entryId}`, { method: 'DELETE' }),
};

// Timeline API
const timelineApi = {
  list: (spaceId) => api(`/spaces/${spaceId}/timeline`),
};

// Chat API
const chatApi = {
  status: () => api('/chat/status'),
  send: (data) => api('/chat', { method: 'POST', body: data }),
  getSession: (sessionId) => api(`/chat/sessions/${sessionId}`),
};

// ═══════════════════════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════════════════════

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  spacesList: $('#spaces-list'),
  emptyState: $('#empty-state'),
  spaceContent: $('#space-content'),
  spaceName: $('#space-name'),
  spaceDescription: $('#space-description'),
  factsList: $('#facts-list'),
  notesList: $('#notes-list'),
  profileList: $('#profile-list'),
  timelineList: $('#timeline-list'),
  factsCount: $('#facts-count'),
  notesCount: $('#notes-count'),
  modalOverlay: $('#modal-overlay'),
  modal: $('#modal'),
  modalTitle: $('#modal-title'),
  modalBody: $('#modal-body'),
  modalSubmit: $('#modal-submit'),
  toastContainer: $('#toast-container'),
  // Chat elements
  chatMessages: $('#chat-messages'),
  chatForm: $('#chat-form'),
  chatInput: $('#chat-input'),
  chatSend: $('#chat-send'),
  chatContextInfo: $('#chat-context-info'),
  aiStatus: $('#ai-status'),
};

// ═══════════════════════════════════════════════════════════
// Toast Notifications
// ═══════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.2s ease reverse';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ═══════════════════════════════════════════════════════════
// Modal Functions
// ═══════════════════════════════════════════════════════════

let currentModalCallback = null;

function openModal(title, formHtml, onSubmit) {
  elements.modalTitle.textContent = title;
  elements.modalBody.innerHTML = formHtml;
  elements.modalOverlay.classList.remove('hidden');
  currentModalCallback = onSubmit;
  
  const firstInput = elements.modalBody.querySelector('input, textarea, select');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function closeModal() {
  elements.modalOverlay.classList.add('hidden');
  currentModalCallback = null;
}

function getFormData() {
  const form = elements.modalBody;
  const data = {};
  
  form.querySelectorAll('[name]').forEach(field => {
    if (field.type === 'checkbox') {
      data[field.name] = field.checked;
    } else if (field.value.trim()) {
      if (field.name === 'tags') {
        data[field.name] = field.value.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        data[field.name] = field.value.trim();
      }
    }
  });
  
  return data;
}

$('#modal-close').addEventListener('click', closeModal);
$('#modal-cancel').addEventListener('click', closeModal);
elements.modalOverlay.addEventListener('click', (e) => {
  if (e.target === elements.modalOverlay) closeModal();
});

elements.modalSubmit.addEventListener('click', async () => {
  if (currentModalCallback) {
    const data = getFormData();
    elements.modalSubmit.disabled = true;
    try {
      await currentModalCallback(data);
      closeModal();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      elements.modalSubmit.disabled = false;
    }
  }
});

// ═══════════════════════════════════════════════════════════
// AI Status
// ═══════════════════════════════════════════════════════════

async function checkAIStatus() {
  try {
    const status = await chatApi.status();
    state.aiConfigured = status.configured;
    
    if (status.configured) {
      elements.aiStatus.classList.add('connected');
      elements.aiStatus.classList.remove('disconnected');
      elements.aiStatus.querySelector('.ai-status-text').textContent = `AI: ${status.model}`;
    } else {
      elements.aiStatus.classList.add('disconnected');
      elements.aiStatus.classList.remove('connected');
      elements.aiStatus.querySelector('.ai-status-text').textContent = 'AI: не налаштовано';
    }
  } catch (error) {
    elements.aiStatus.classList.add('disconnected');
    elements.aiStatus.querySelector('.ai-status-text').textContent = 'AI: помилка';
  }
}

// ═══════════════════════════════════════════════════════════
// Spaces Management
// ═══════════════════════════════════════════════════════════

async function loadSpaces() {
  try {
    state.spaces = await spacesApi.list();
    renderSpacesList();
    
    if (state.spaces.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.spaceContent.classList.add('hidden');
    } else if (!state.currentSpaceId) {
      selectSpace(state.spaces[0].id);
    }
  } catch (error) {
    showToast('Не вдалося завантажити простори', 'error');
  }
}

function renderSpacesList() {
  elements.spacesList.innerHTML = state.spaces.map(space => `
    <li class="space-item ${space.id === state.currentSpaceId ? 'active' : ''}" 
        data-id="${space.id}">
      <span class="space-item-icon">${space.icon || '📁'}</span>
      <span class="space-item-name">${space.name}</span>
      <span class="space-item-count">${space.factCount}</span>
    </li>
  `).join('');

  elements.spacesList.querySelectorAll('.space-item').forEach(item => {
    item.addEventListener('click', () => selectSpace(item.dataset.id));
  });
}

async function selectSpace(spaceId) {
  state.currentSpaceId = spaceId;
  state.chatSessionId = null;
  state.chatMessages = [];
  
  try {
    const space = await spacesApi.get(spaceId);
    state.currentSpace = space.metadata;
    state.facts = space.facts.items;
    state.notes = space.notes.items;
    state.profile = space.profile.entries;
    state.timeline = space.timeline.entries;
    
    renderSpacesList();
    renderSpaceContent();
    renderChatWelcome();
    updateChatContextInfo();
    
    elements.emptyState.classList.add('hidden');
    elements.spaceContent.classList.remove('hidden');
  } catch (error) {
    showToast('Не вдалося завантажити простір', 'error');
  }
}

function renderSpaceContent() {
  elements.spaceName.textContent = state.currentSpace.name;
  elements.spaceDescription.textContent = state.currentSpace.description;
  elements.factsCount.textContent = state.facts.length;
  elements.notesCount.textContent = state.notes.length;
  
  renderFacts();
  renderNotes();
  renderProfile();
  renderTimeline();
}

function openCreateSpaceModal() {
  openModal('Створити простір', `
    <div class="form-group">
      <label class="form-label">Назва *</label>
      <input type="text" name="name" class="form-input" placeholder="Наприклад: Робота, Здоров'я, Навчання">
    </div>
    <div class="form-group">
      <label class="form-label">Опис</label>
      <textarea name="description" class="form-textarea" placeholder="Короткий опис контексту"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Іконка</label>
      <input type="text" name="icon" class="form-input" placeholder="📁" maxlength="2">
      <p class="form-hint">Emoji або символ</p>
    </div>
  `, async (data) => {
    if (!data.name) throw new Error("Назва обов'язкова");
    await spacesApi.create(data);
    showToast('Простір створено', 'success');
    await loadSpaces();
  });
}

function openEditSpaceModal() {
  const space = state.currentSpace;
  openModal('Редагувати простір', `
    <div class="form-group">
      <label class="form-label">Назва *</label>
      <input type="text" name="name" class="form-input" value="${space.name}">
    </div>
    <div class="form-group">
      <label class="form-label">Опис</label>
      <textarea name="description" class="form-textarea">${space.description}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Іконка</label>
      <input type="text" name="icon" class="form-input" value="${space.icon || ''}" maxlength="2">
    </div>
  `, async (data) => {
    if (!data.name) throw new Error("Назва обов'язкова");
    await spacesApi.update(state.currentSpaceId, data);
    showToast('Простір оновлено', 'success');
    await selectSpace(state.currentSpaceId);
    await loadSpaces();
  });
}

async function deleteSpace() {
  if (!confirm(`Видалити простір "${state.currentSpace.name}"? Це незворотня дія!`)) return;
  
  try {
    await spacesApi.delete(state.currentSpaceId);
    showToast('Простір видалено', 'success');
    state.currentSpaceId = null;
    await loadSpaces();
  } catch (error) {
    showToast('Не вдалося видалити простір', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// Chat Functions
// ═══════════════════════════════════════════════════════════

function renderChatWelcome() {
  elements.chatMessages.innerHTML = `
    <div class="chat-welcome">
      <div class="chat-welcome-icon">💬</div>
      <h3>Розпочніть розмову</h3>
      <p>AI вже знає контекст "${state.currentSpace?.name}" — запитуйте про що завгодно!</p>
    </div>
  `;
}

function updateChatContextInfo() {
  if (state.currentSpace) {
    elements.chatContextInfo.innerHTML = `
      <span>📊 ${state.facts.length} фактів</span>
      <span>📝 ${state.notes.length} нотаток</span>
      <span>👤 ${state.profile.length} записів профілю</span>
    `;
  }
}

function addChatMessage(role, content, extractedMemory) {
  const message = { role, content, extractedMemory };
  state.chatMessages.push(message);
  
  // Remove welcome message if present
  const welcome = elements.chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${role}`;
  
  const avatar = role === 'user' ? '👤' : '🧠';
  const formattedContent = formatChatContent(content);
  
  let extractedHtml = '';
  if (extractedMemory) {
    const total = (extractedMemory.facts?.length || 0) + 
                  (extractedMemory.notes?.length || 0) + 
                  (extractedMemory.profileUpdates?.length || 0);
    if (total > 0) {
      extractedHtml = `
        <div class="chat-extracted">
          <span>✨</span>
          <span>Збережено: ${total} нових записів у пам'ять</span>
        </div>
      `;
    }
  }
  
  messageEl.innerHTML = `
    <div class="chat-avatar">${avatar}</div>
    <div class="chat-bubble">
      ${formattedContent}
      ${extractedHtml}
    </div>
  `;
  
  elements.chatMessages.appendChild(messageEl);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function formatChatContent(content) {
  // Basic markdown-like formatting
  return content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^(.*)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

function showTypingIndicator() {
  const typing = document.createElement('div');
  typing.className = 'chat-message assistant';
  typing.id = 'typing-indicator';
  typing.innerHTML = `
    <div class="chat-avatar">🧠</div>
    <div class="chat-typing">
      <div class="chat-typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      AI думає...
    </div>
  `;
  elements.chatMessages.appendChild(typing);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

async function sendChatMessage(message) {
  if (!message.trim()) return;
  if (!state.aiConfigured) {
    showToast('AI не налаштовано. Встановіть OPENAI_API_KEY.', 'error');
    return;
  }
  
  addChatMessage('user', message);
  elements.chatInput.value = '';
  elements.chatInput.style.height = 'auto';
  elements.chatSend.disabled = true;
  
  showTypingIndicator();
  
  try {
    // Build payload without null values (only include defined values)
    const payload = { message };
    if (state.currentSpaceId) {
      payload.spaceId = state.currentSpaceId;
    }
    if (state.chatSessionId) {
      payload.sessionId = state.chatSessionId;
    }
    
    const response = await chatApi.send(payload);
    
    state.chatSessionId = response.sessionId;
    hideTypingIndicator();
    addChatMessage('assistant', response.message.content, response.extractedMemory);
    
    // Refresh data if memory was extracted
    if (response.extractedMemory) {
      await selectSpace(state.currentSpaceId);
      updateChatContextInfo();
    }
  } catch (error) {
    hideTypingIndicator();
    showToast(error.message || 'Помилка відправки повідомлення', 'error');
  } finally {
    elements.chatSend.disabled = false;
  }
}

// Chat form handler
elements.chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendChatMessage(elements.chatInput.value);
});

// Auto-resize chat input
elements.chatInput.addEventListener('input', () => {
  elements.chatInput.style.height = 'auto';
  elements.chatInput.style.height = Math.min(elements.chatInput.scrollHeight, 200) + 'px';
});

// Enter to send (Shift+Enter for new line)
elements.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage(elements.chatInput.value);
  }
});

// ═══════════════════════════════════════════════════════════
// Facts Management
// ═══════════════════════════════════════════════════════════

function renderFacts() {
  if (state.facts.length === 0) {
    elements.factsList.innerHTML = `
      <div class="empty-list">
        <div class="empty-list-icon">📋</div>
        <p class="empty-list-text">Ще немає фактів. Додайте перший!</p>
      </div>
    `;
    return;
  }

  elements.factsList.innerHTML = state.facts.map(fact => `
    <div class="card" data-id="${fact.id}">
      <div class="card-header">
        <span class="card-category">${fact.category}</span>
        <div class="card-actions">
          <button class="btn-icon edit-fact" title="Редагувати">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon danger delete-fact" title="Видалити">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-content">${fact.statement}</div>
      <div class="card-footer">
        <div class="card-meta">
          <span class="confidence ${fact.confidence}">${getConfidenceLabel(fact.confidence)}</span>
        </div>
        <div class="card-tags">
          ${fact.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  elements.factsList.querySelectorAll('.edit-fact').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.card').dataset.id;
      openEditFactModal(id);
    });
  });

  elements.factsList.querySelectorAll('.delete-fact').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.card').dataset.id;
      deleteFact(id);
    });
  });
}

function getConfidenceLabel(confidence) {
  const labels = {
    verified: '✓ Верифіковано',
    high: 'Висока',
    medium: 'Середня',
    low: 'Низька',
  };
  return labels[confidence] || confidence;
}

function openAddFactModal() {
  openModal('Додати факт', `
    <div class="form-group">
      <label class="form-label">Категорія *</label>
      <input type="text" name="category" class="form-input" placeholder="personal, health, work...">
    </div>
    <div class="form-group">
      <label class="form-label">Твердження *</label>
      <textarea name="statement" class="form-textarea" placeholder="Опишіть факт..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Рівень довіри</label>
      <select name="confidence" class="form-select">
        <option value="verified">Верифіковано</option>
        <option value="high">Висока</option>
        <option value="medium" selected>Середня</option>
        <option value="low">Низька</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Теги</label>
      <input type="text" name="tags" class="form-input" placeholder="tag1, tag2, tag3">
      <p class="form-hint">Розділіть комою</p>
    </div>
  `, async (data) => {
    if (!data.category || !data.statement) throw new Error("Категорія і твердження обов'язкові");
    await factsApi.create(state.currentSpaceId, data);
    showToast('Факт додано', 'success');
    await selectSpace(state.currentSpaceId);
    await loadSpaces();
  });
}

function openEditFactModal(factId) {
  const fact = state.facts.find(f => f.id === factId);
  openModal('Редагувати факт', `
    <div class="form-group">
      <label class="form-label">Категорія *</label>
      <input type="text" name="category" class="form-input" value="${fact.category}">
    </div>
    <div class="form-group">
      <label class="form-label">Твердження *</label>
      <textarea name="statement" class="form-textarea">${fact.statement}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Рівень довіри</label>
      <select name="confidence" class="form-select">
        <option value="verified" ${fact.confidence === 'verified' ? 'selected' : ''}>Верифіковано</option>
        <option value="high" ${fact.confidence === 'high' ? 'selected' : ''}>Висока</option>
        <option value="medium" ${fact.confidence === 'medium' ? 'selected' : ''}>Середня</option>
        <option value="low" ${fact.confidence === 'low' ? 'selected' : ''}>Низька</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Теги</label>
      <input type="text" name="tags" class="form-input" value="${fact.tags.join(', ')}">
    </div>
  `, async (data) => {
    await factsApi.update(state.currentSpaceId, factId, data);
    showToast('Факт оновлено', 'success');
    await selectSpace(state.currentSpaceId);
  });
}

async function deleteFact(factId) {
  if (!confirm('Видалити цей факт?')) return;
  try {
    await factsApi.delete(state.currentSpaceId, factId);
    showToast('Факт видалено', 'success');
    await selectSpace(state.currentSpaceId);
    await loadSpaces();
  } catch (error) {
    showToast('Помилка видалення', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// Notes Management
// ═══════════════════════════════════════════════════════════

function renderNotes() {
  if (state.notes.length === 0) {
    elements.notesList.innerHTML = `
      <div class="empty-list">
        <div class="empty-list-icon">📝</div>
        <p class="empty-list-text">Ще немає нотаток. Додайте першу!</p>
      </div>
    `;
    return;
  }

  elements.notesList.innerHTML = state.notes.map(note => `
    <div class="card" data-id="${note.id}">
      ${note.factCandidate ? '<span class="fact-candidate">⭐ Кандидат у факти</span>' : ''}
      <div class="card-header">
        ${note.category ? `<span class="card-category">${note.category}</span>` : '<span></span>'}
        <div class="card-actions">
          ${!note.promotedToFactId ? `
            <button class="btn btn-promote promote-note" title="Перетворити на факт">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </button>
          ` : ''}
          <button class="btn-icon edit-note" title="Редагувати">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon danger delete-note" title="Видалити">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-content">${note.content}</div>
      <div class="card-footer">
        <span class="importance ${note.importance}">${getImportanceLabel(note.importance)}</span>
        <div class="card-tags">
          ${note.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  elements.notesList.querySelectorAll('.edit-note').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.card').dataset.id;
      openEditNoteModal(id);
    });
  });

  elements.notesList.querySelectorAll('.delete-note').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.card').dataset.id;
      deleteNote(id);
    });
  });

  elements.notesList.querySelectorAll('.promote-note').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.card').dataset.id;
      openPromoteNoteModal(id);
    });
  });
}

function getImportanceLabel(importance) {
  const labels = { high: '⚡ Важливо', medium: 'Середня', low: 'Низька' };
  return labels[importance] || importance;
}

function openAddNoteModal() {
  openModal('Додати нотатку', `
    <div class="form-group">
      <label class="form-label">Текст нотатки *</label>
      <textarea name="content" class="form-textarea" placeholder="Ваше спостереження..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Категорія</label>
      <input type="text" name="category" class="form-input" placeholder="Опціонально">
    </div>
    <div class="form-group">
      <label class="form-label">Важливість</label>
      <select name="importance" class="form-select">
        <option value="high">Висока</option>
        <option value="medium" selected>Середня</option>
        <option value="low">Низька</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Теги</label>
      <input type="text" name="tags" class="form-input" placeholder="tag1, tag2">
    </div>
    <div class="form-group">
      <label class="form-checkbox-group">
        <input type="checkbox" name="factCandidate" class="form-checkbox">
        <span>Кандидат у факти</span>
      </label>
      <p class="form-hint">Позначте, якщо це може стати підтвердженим фактом</p>
    </div>
  `, async (data) => {
    if (!data.content) throw new Error("Текст нотатки обов'язковий");
    await notesApi.create(state.currentSpaceId, data);
    showToast('Нотатку додано', 'success');
    await selectSpace(state.currentSpaceId);
    await loadSpaces();
  });
}

function openEditNoteModal(noteId) {
  const note = state.notes.find(n => n.id === noteId);
  openModal('Редагувати нотатку', `
    <div class="form-group">
      <label class="form-label">Текст нотатки *</label>
      <textarea name="content" class="form-textarea">${note.content}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Категорія</label>
      <input type="text" name="category" class="form-input" value="${note.category || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Важливість</label>
      <select name="importance" class="form-select">
        <option value="high" ${note.importance === 'high' ? 'selected' : ''}>Висока</option>
        <option value="medium" ${note.importance === 'medium' ? 'selected' : ''}>Середня</option>
        <option value="low" ${note.importance === 'low' ? 'selected' : ''}>Низька</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Теги</label>
      <input type="text" name="tags" class="form-input" value="${note.tags.join(', ')}">
    </div>
    <div class="form-group">
      <label class="form-checkbox-group">
        <input type="checkbox" name="factCandidate" class="form-checkbox" ${note.factCandidate ? 'checked' : ''}>
        <span>Кандидат у факти</span>
      </label>
    </div>
  `, async (data) => {
    await notesApi.update(state.currentSpaceId, noteId, data);
    showToast('Нотатку оновлено', 'success');
    await selectSpace(state.currentSpaceId);
  });
}

function openPromoteNoteModal(noteId) {
  const note = state.notes.find(n => n.id === noteId);
  openModal('Перетворити на факт', `
    <p style="color: var(--text-secondary); margin-bottom: var(--space-md);">
      Нотатка буде збережена, а на її основі буде створено новий факт.
    </p>
    <div class="form-group">
      <label class="form-label">Категорія *</label>
      <input type="text" name="category" class="form-input" value="${note.category || ''}" placeholder="personal, health, work...">
    </div>
    <div class="form-group">
      <label class="form-label">Твердження *</label>
      <textarea name="statement" class="form-textarea">${note.content}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Рівень довіри</label>
      <select name="confidence" class="form-select">
        <option value="verified">Верифіковано</option>
        <option value="high" selected>Висока</option>
        <option value="medium">Середня</option>
        <option value="low">Низька</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Теги</label>
      <input type="text" name="tags" class="form-input" value="${note.tags.join(', ')}">
    </div>
  `, async (data) => {
    if (!data.category || !data.statement) throw new Error("Категорія і твердження обов'язкові");
    await notesApi.promote(state.currentSpaceId, noteId, data);
    showToast('Нотатку перетворено на факт', 'success');
    await selectSpace(state.currentSpaceId);
    await loadSpaces();
  });
}

async function deleteNote(noteId) {
  if (!confirm('Видалити цю нотатку?')) return;
  try {
    await notesApi.delete(state.currentSpaceId, noteId);
    showToast('Нотатку видалено', 'success');
    await selectSpace(state.currentSpaceId);
    await loadSpaces();
  } catch (error) {
    showToast('Помилка видалення', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// Profile Management
// ═══════════════════════════════════════════════════════════

function renderProfile() {
  if (state.profile.length === 0) {
    elements.profileList.innerHTML = `
      <div class="empty-list">
        <div class="empty-list-icon">👤</div>
        <p class="empty-list-text">Профіль порожній. Додайте характеристики!</p>
      </div>
    `;
    return;
  }

  const grouped = state.profile.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {});

  elements.profileList.innerHTML = Object.entries(grouped).map(([category, entries]) => `
    <div class="profile-category-group">
      ${entries.map(entry => `
        <div class="profile-card" data-id="${entry.id}">
          <div class="profile-category">${category}</div>
          <div class="profile-key">${entry.key}</div>
          <div class="profile-value ${Array.isArray(entry.value) ? 'array' : ''}">
            ${Array.isArray(entry.value) 
              ? entry.value.map(v => `<span>${v}</span>`).join('') 
              : entry.value}
          </div>
          <div class="card-actions" style="opacity: 1; margin-top: var(--space-md);">
            <button class="btn-icon edit-profile" title="Редагувати">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon danger delete-profile" title="Видалити">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  elements.profileList.querySelectorAll('.edit-profile').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.profile-card').dataset.id;
      openEditProfileModal(id);
    });
  });

  elements.profileList.querySelectorAll('.delete-profile').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.profile-card').dataset.id;
      deleteProfileEntry(id);
    });
  });
}

function openAddProfileModal() {
  openModal('Додати запис профілю', `
    <div class="form-group">
      <label class="form-label">Категорія *</label>
      <input type="text" name="category" class="form-input" placeholder="personal, preferences, contacts...">
    </div>
    <div class="form-group">
      <label class="form-label">Ключ *</label>
      <input type="text" name="key" class="form-input" placeholder="name, birthday, email...">
    </div>
    <div class="form-group">
      <label class="form-label">Значення *</label>
      <input type="text" name="value" class="form-input" placeholder="Значення">
      <p class="form-hint">Для списку розділіть комами: item1, item2, item3</p>
    </div>
  `, async (data) => {
    if (!data.category || !data.key || !data.value) throw new Error("Усі поля обов'язкові");
    if (data.value.includes(',')) {
      data.value = data.value.split(',').map(v => v.trim());
    }
    await profileApi.create(state.currentSpaceId, data);
    showToast('Запис додано', 'success');
    await selectSpace(state.currentSpaceId);
  });
}

function openEditProfileModal(entryId) {
  const entry = state.profile.find(e => e.id === entryId);
  const valueStr = Array.isArray(entry.value) ? entry.value.join(', ') : entry.value;
  
  openModal('Редагувати запис', `
    <div class="form-group">
      <label class="form-label">Категорія</label>
      <input type="text" class="form-input" value="${entry.category}" disabled>
    </div>
    <div class="form-group">
      <label class="form-label">Ключ</label>
      <input type="text" class="form-input" value="${entry.key}" disabled>
    </div>
    <div class="form-group">
      <label class="form-label">Значення *</label>
      <input type="text" name="value" class="form-input" value="${valueStr}">
    </div>
  `, async (data) => {
    if (!data.value) throw new Error("Значення обов'язкове");
    if (data.value.includes(',')) {
      data.value = data.value.split(',').map(v => v.trim());
    }
    await profileApi.update(state.currentSpaceId, entryId, data);
    showToast('Запис оновлено', 'success');
    await selectSpace(state.currentSpaceId);
  });
}

async function deleteProfileEntry(entryId) {
  if (!confirm('Видалити цей запис профілю?')) return;
  try {
    await profileApi.delete(state.currentSpaceId, entryId);
    showToast('Запис видалено', 'success');
    await selectSpace(state.currentSpaceId);
  } catch (error) {
    showToast('Помилка видалення', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// Timeline
// ═══════════════════════════════════════════════════════════

function renderTimeline() {
  if (state.timeline.length === 0) {
    elements.timelineList.innerHTML = `
      <div class="empty-list">
        <div class="empty-list-icon">📅</div>
        <p class="empty-list-text">Історія змін порожня</p>
      </div>
    `;
    return;
  }

  const sorted = [...state.timeline].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  elements.timelineList.innerHTML = sorted.map(entry => `
    <div class="timeline-item">
      <div class="timeline-time">${formatDate(entry.timestamp)}</div>
      <div class="timeline-title">${entry.title}</div>
      <span class="timeline-type ${entry.eventType}">${getEventTypeLabel(entry.eventType)}</span>
    </div>
  `).join('');
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEventTypeLabel(eventType) {
  const labels = {
    fact_added: 'Факт додано',
    fact_updated: 'Факт оновлено',
    fact_removed: 'Факт видалено',
    note_added: 'Нотатку додано',
    note_promoted: 'Нотатку → Факт',
    profile_updated: 'Профіль оновлено',
    milestone: 'Подія',
    observation: 'Спостереження',
    custom: 'Інше',
  };
  return labels[eventType] || eventType;
}

// ═══════════════════════════════════════════════════════════
// Tabs Navigation
// ═══════════════════════════════════════════════════════════

$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const tabName = tab.dataset.tab;
    $$('.tab-pane').forEach(pane => pane.classList.remove('active'));
    $(`#${tabName}-tab`).classList.add('active');
  });
});

// ═══════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════

$('#add-space-btn').addEventListener('click', openCreateSpaceModal);
$('#create-first-space').addEventListener('click', openCreateSpaceModal);
$('#edit-space-btn').addEventListener('click', openEditSpaceModal);
$('#delete-space-btn').addEventListener('click', deleteSpace);
$('#add-fact-btn').addEventListener('click', openAddFactModal);
$('#add-note-btn').addEventListener('click', openAddNoteModal);
$('#add-profile-btn').addEventListener('click', openAddProfileModal);

// ═══════════════════════════════════════════════════════════
// Initialize
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  checkAIStatus();
  loadSpaces();
});
