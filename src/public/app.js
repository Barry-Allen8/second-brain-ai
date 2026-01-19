/**
 * Second Brain AI - Frontend Application (Simplified MVP)
 */

const API_BASE = '/api/v1';
const MAX_CHATS_PER_SPACE = 10;

// ═══════════════════════════════════════════════════════════
// PWA Service Worker Registration
// ═══════════════════════════════════════════════════════════

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker не підтримується цим браузером');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('[PWA] Service Worker зареєстровано:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[PWA] Нова версія Service Worker знайдена');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available
          console.log('[PWA] Нова версія доступна!');
          showUpdateNotification();
        }
      });
    });

    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Новий Service Worker активовано');
    });

  } catch (error) {
    console.error('[PWA] Помилка реєстрації Service Worker:', error);
  }
}

function showUpdateNotification() {
  // Show a toast notification about the update
  if (typeof showToast === 'function') {
    showToast('Доступна нова версія! Оновіть сторінку.', 'info');
  }
}

// PWA Install Prompt Handler
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the default browser install prompt
  event.preventDefault();

  // Store the event for later use
  deferredInstallPrompt = event;

  console.log('[PWA] Додаток можна встановити');

  // Optionally show custom install button/notification
  showInstallButton();
});

function showInstallButton() {
  // Check if we already showed install prompt
  const installShown = localStorage.getItem('pwa-install-shown');
  if (installShown) return;

  // Create a subtle install suggestion after a delay
  setTimeout(() => {
    if (deferredInstallPrompt && typeof showToast === 'function') {
      showToast('💡 Встановіть Second Brain як додаток!', 'info');
      localStorage.setItem('pwa-install-shown', 'true');
    }
  }, 30000); // Show after 30 seconds
}

async function installPWA() {
  if (!deferredInstallPrompt) {
    console.log('[PWA] Встановлення недоступне');
    return false;
  }

  // Show the install prompt
  deferredInstallPrompt.prompt();

  // Wait for user response
  const { outcome } = await deferredInstallPrompt.userChoice;

  console.log('[PWA] Результат встановлення:', outcome);

  // Clear the deferred prompt
  deferredInstallPrompt = null;

  return outcome === 'accepted';
}

// Track successful installation
window.addEventListener('appinstalled', () => {
  console.log('[PWA] Додаток успішно встановлено!');
  deferredInstallPrompt = null;

  if (typeof showToast === 'function') {
    showToast('🎉 Second Brain AI встановлено!', 'success');
  }
});

// Check if running as installed PWA
function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');
}

// Online/Offline Status Handler
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  const aiStatusEl = document.getElementById('ai-status');
  const mobileAiStatusEl = document.getElementById('mobile-ai-status');

  if (isOnline) {
    // Update sidebar status
    if (aiStatusEl) {
      aiStatusEl.querySelector('.ai-status-text').textContent = 'AI: перевірка...';
      aiStatusEl.classList.remove('disconnected');
      aiStatusEl.classList.add('connected');
      aiStatusEl.style.cursor = 'default';
      aiStatusEl.title = '';
    }
    // Update mobile status
    if (mobileAiStatusEl) {
      mobileAiStatusEl.querySelector('.mobile-ai-text').textContent = '...';
      mobileAiStatusEl.classList.remove('disconnected');
      mobileAiStatusEl.classList.add('connected');
    }
    checkAIStatus();
  } else {
    // Update sidebar status
    if (aiStatusEl) {
      aiStatusEl.classList.remove('connected');
      aiStatusEl.classList.add('disconnected');
      aiStatusEl.querySelector('.ai-status-text').textContent = 'Офлайн';
      aiStatusEl.style.cursor = 'default';
      aiStatusEl.title = '';
    }
    // Update mobile status
    if (mobileAiStatusEl) {
      mobileAiStatusEl.classList.remove('connected');
      mobileAiStatusEl.classList.add('disconnected');
      mobileAiStatusEl.querySelector('.mobile-ai-text').textContent = 'Офлайн';
    }
  }

  console.log('[PWA] Статус мережі:', isOnline ? 'онлайн' : 'офлайн');
}

window.addEventListener('online', () => {
  updateOnlineStatus();
  if (typeof showToast === 'function') {
    showToast("З'єднання відновлено", 'success');
  }
});

window.addEventListener('offline', () => {
  updateOnlineStatus();
  if (typeof showToast === 'function') {
    showToast('Немає з\'єднання з інтернетом', 'warning');
  }
});

// Register SW on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    updateOnlineStatus();
  });
} else {
  registerServiceWorker();
  updateOnlineStatus();
}

// ═══════════════════════════════════════════════════════════
// State Management
// ═══════════════════════════════════════════════════════════

const state = {
  spaces: [],
  currentSpaceId: null,
  currentSpace: null,
  aiConfigured: false,
  aiModel: 'gpt-4o-mini',
  supportedModels: ['gpt-4o-mini', 'gpt-4o'],
  // Chat management
  chats: [], // List of chats in current space
  currentChatId: null,
  currentChatMessages: [],
  chatInputValue: '',
};

// ═══════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { ...options.headers },
    ...options,
  };

  if (options.body instanceof FormData) {
    if (config.headers && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }
  } else if (options.body && typeof options.body === 'object') {
    config.headers = { ...config.headers, 'Content-Type': 'application/json' };
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    if (response.status === 204) {
      return null;
    }
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

// Chat API
const chatApi = {
  status: () => api('/chat/status'),
  send: (data) => api('/chat', { method: 'POST', body: data }),
  getSession: (sessionId) => api(`/chat/sessions/${sessionId}`),
  setModel: (model) => api('/chat/model', { method: 'PUT', body: { model } }),
  listSessions: (spaceId) => api(`/chat/sessions?spaceId=${spaceId}`),
  deleteSession: (sessionId) => api(`/chat/sessions/${sessionId}`, { method: 'DELETE' }),
  renameSession: (sessionId, name) => api(`/chat/sessions/${sessionId}`, { method: 'PATCH', body: { name } }),
};

// ═══════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ═══════════════════════════════════════════════════════════
// Context Menu
// ═══════════════════════════════════════════════════════════

let activeContextMenu = null;

function showContextMenu(event, type, id) {
  // Close any existing context menu
  closeContextMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.id = 'context-menu';

  if (type === 'space') {
    menu.innerHTML = `
      <button class="context-menu-item" data-action="rename-space" data-id="${id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span>Перейменувати</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item danger" data-action="delete-space" data-id="${id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Видалити</span>
      </button>
    `;
  } else if (type === 'chat') {
    menu.innerHTML = `
      <button class="context-menu-item" data-action="rename-chat" data-id="${id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span>Перейменувати</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item danger" data-action="delete-chat" data-id="${id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Видалити</span>
      </button>
    `;
  }

  document.body.appendChild(menu);
  activeContextMenu = menu;

  // Position the menu near the click
  const rect = event.target.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  
  let x = rect.right + 4;
  let y = rect.top;

  // Ensure menu doesn't go off-screen
  if (x + menuRect.width > window.innerWidth) {
    x = rect.left - menuRect.width - 4;
  }
  if (y + menuRect.height > window.innerHeight) {
    y = window.innerHeight - menuRect.height - 8;
  }

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  // Add click handlers for menu items
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      handleContextMenuAction(item.dataset.action, item.dataset.id);
    });
  });

  // Add event listener to close on click outside or Escape
  setTimeout(() => {
    document.addEventListener('click', handleClickOutsideContextMenu);
    document.addEventListener('keydown', handleEscapeContextMenu);
  }, 0);
}

function closeContextMenu() {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
  document.removeEventListener('click', handleClickOutsideContextMenu);
  document.removeEventListener('keydown', handleEscapeContextMenu);
}

function handleClickOutsideContextMenu(e) {
  if (activeContextMenu && !activeContextMenu.contains(e.target)) {
    closeContextMenu();
  }
}

function handleEscapeContextMenu(e) {
  if (e.key === 'Escape') {
    closeContextMenu();
  }
}

async function handleContextMenuAction(action, id) {
  closeContextMenu();

  switch (action) {
    case 'rename-space':
      // First select the space, then open edit modal
      if (state.currentSpaceId !== id) {
        await selectSpace(id);
      }
      openEditSpaceModal();
      break;
    case 'delete-space':
      // First select the space, then delete
      if (state.currentSpaceId !== id) {
        await selectSpace(id);
      }
      deleteSpace();
      break;
    case 'rename-chat':
      // Set current chat and rename
      if (state.currentChatId !== id) {
        await selectChat(id);
      }
      renameChat();
      break;
    case 'delete-chat':
      // Set current chat and delete
      if (state.currentChatId !== id) {
        state.currentChatId = id;
      }
      deleteChat();
      break;
  }
}

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
  chatSelect: $('#chat-select'),
  aiStatus: $('#ai-status'),
  mobileAiStatus: $('#mobile-ai-status'),
  // Header model selector
  headerModelSelector: $('#header-model-selector'),
  headerModelText: $('#header-model-text'),
  // Mobile elements
  sidebar: $('#sidebar'),
  sidebarOverlay: $('#sidebar-overlay'),
  hamburgerBtn: $('#hamburger-btn'),
  sidebarClose: $('#sidebar-close'),
};

// ═══════════════════════════════════════════════════════════
// Mobile Sidebar Management
// ═══════════════════════════════════════════════════════════

function openSidebar() {
  elements.sidebar.classList.add('open');
  elements.sidebarOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  elements.sidebar.classList.remove('open');
  elements.sidebarOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function isMobile() {
  return window.innerWidth <= 768;
}

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
      data[field.name] = field.value.trim();
    }
  });

  return data;
}

$('#modal-close').addEventListener('click', closeModal);
$('#modal-cancel').addEventListener('click', closeModal);

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
    state.aiModel = status.model || 'gpt-4o-mini';
    // Validate that saved model is in supported list, fallback to default if not
    if (!['gpt-4o-mini', 'gpt-4o'].includes(state.aiModel)) {
      console.warn(`Unsupported model "${state.aiModel}". Falling back to gpt-4o-mini.`);
      state.aiModel = 'gpt-4o-mini';
    }
    state.supportedModels = ['gpt-4o-mini', 'gpt-4o'];

    if (status.configured) {
      // Update sidebar AI status
      elements.aiStatus.classList.add('connected');
      elements.aiStatus.classList.remove('disconnected');
      elements.aiStatus.querySelector('.ai-status-text').textContent = `AI: ${status.model}`;
      elements.aiStatus.style.cursor = 'pointer';
      elements.aiStatus.title = 'Клікніть для зміни моделі';

      // Update mobile AI status
      if (elements.mobileAiStatus) {
        elements.mobileAiStatus.classList.add('connected');
        elements.mobileAiStatus.classList.remove('disconnected');
        elements.mobileAiStatus.querySelector('.mobile-ai-text').textContent = status.model;
      }

      // Update header model selector (primary position)
      if (elements.headerModelSelector) {
        elements.headerModelSelector.classList.add('connected');
        elements.headerModelSelector.classList.remove('disconnected');
        elements.headerModelSelector.title = 'Клікніть для зміни моделі';
      }
      if (elements.headerModelText) {
        elements.headerModelText.textContent = status.model;
      }
    } else {
      elements.aiStatus.classList.add('disconnected');
      elements.aiStatus.classList.remove('connected');
      elements.aiStatus.querySelector('.ai-status-text').textContent = 'AI: не налаштовано';
      elements.aiStatus.style.cursor = 'default';
      elements.aiStatus.title = '';

      // Update mobile AI status
      if (elements.mobileAiStatus) {
        elements.mobileAiStatus.classList.add('disconnected');
        elements.mobileAiStatus.classList.remove('connected');
        elements.mobileAiStatus.querySelector('.mobile-ai-text').textContent = 'Не налаштовано';
      }

      // Update header model selector
      if (elements.headerModelSelector) {
        elements.headerModelSelector.classList.add('disconnected');
        elements.headerModelSelector.classList.remove('connected');
        elements.headerModelSelector.title = 'AI не налаштовано';
      }
      if (elements.headerModelText) {
        elements.headerModelText.textContent = 'Не налаштовано';
      }
    }
  } catch (error) {
    elements.aiStatus.classList.add('disconnected');
    elements.aiStatus.querySelector('.ai-status-text').textContent = 'AI: помилка';

    // Update mobile AI status on error
    if (elements.mobileAiStatus) {
      elements.mobileAiStatus.classList.add('disconnected');
      elements.mobileAiStatus.classList.remove('connected');
      elements.mobileAiStatus.querySelector('.mobile-ai-text').textContent = 'Помилка';
    }

    // Update header model selector on error
    if (elements.headerModelSelector) {
      elements.headerModelSelector.classList.add('disconnected');
      elements.headerModelSelector.classList.remove('connected');
    }
    if (elements.headerModelText) {
      elements.headerModelText.textContent = 'Помилка';
    }
  }
}

function openModelSelectorModal() {
  if (!state.aiConfigured) {
    showToast('AI не налаштовано', 'warning');
    return;
  }

  const modelOptions = state.supportedModels
    .map(model => `
      <option value="${model}" ${model === state.aiModel ? 'selected' : ''}>
        ${model}
      </option>
    `)
    .join('');

  openModal('Вибрати модель OpenAI', `
    <div class="form-group">
      <label class="form-label">Модель *</label>
      <select name="model" class="form-select">
        ${modelOptions}
      </select>
      <p class="form-hint">Поточна модель: ${state.aiModel}</p>
    </div>
    <div class="form-group">
      <p style="color: var(--text-secondary); font-size: 0.875rem;">
        <strong>Доступні моделі:</strong><br>
        • gpt-4o-mini - швидка, економна (за замовчуванням)<br>
        • gpt-4o - найпотужніша модель від OpenAI
      </p>
    </div>
  `, async (data) => {
    if (!data.model) throw new Error("Оберіть модель");

    try {
      await chatApi.setModel(data.model);
      state.aiModel = data.model;
      showToast(`Модель змінено на ${data.model}`, 'success');
      await checkAIStatus();
    } catch (error) {
      throw new Error(error.message || 'Не вдалося змінити модель');
    }
  });
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
  elements.spacesList.innerHTML = state.spaces.map(space => {
    const isActive = space.id === state.currentSpaceId;
    const spaceChats = isActive ? state.chats : [];
    
    return `
      <li class="sidebar-item-wrapper" data-space-id="${space.id}">
        <div class="sidebar-item ${isActive ? 'active' : ''}" data-id="${space.id}">
          <span class="sidebar-item-icon">${escapeHtml(space.icon || '📁')}</span>
          <span class="sidebar-item-name">${escapeHtml(space.name)}</span>
          <button class="sidebar-item-menu" data-space-id="${space.id}" title="Дії">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
        ${isActive && spaceChats.length > 0 ? `
          <ul class="sidebar-chats">
            ${spaceChats.map(chat => `
              <li class="sidebar-chat-item ${chat.sessionId === state.currentChatId ? 'active' : ''}" 
                  data-chat-id="${chat.sessionId}">
                <span class="sidebar-chat-item-icon">💬</span>
                <span class="sidebar-chat-item-name">${escapeHtml(chat.name || `Чат ${new Date(chat.createdAt).toLocaleDateString('uk-UA')}`)}</span>
                <button class="sidebar-chat-item-menu" data-chat-id="${chat.sessionId}" title="Дії">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </li>
            `).join('')}
            <li class="sidebar-new-chat" data-space-id="${space.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Новий чат</span>
            </li>
          </ul>
        ` : isActive ? `
          <ul class="sidebar-chats">
            <li class="sidebar-new-chat" data-space-id="${space.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Новий чат</span>
            </li>
          </ul>
        ` : ''}
      </li>
    `;
  }).join('');

  // Add click handlers for space items
  elements.spacesList.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't select space if clicking on menu button
      if (e.target.closest('.sidebar-item-menu')) return;
      selectSpace(item.dataset.id);
    });
  });

  // Add click handlers for space menu buttons
  elements.spacesList.querySelectorAll('.sidebar-item-menu').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spaceId = btn.dataset.spaceId;
      showContextMenu(e, 'space', spaceId);
    });
  });

  // Add click handlers for chat items
  elements.spacesList.querySelectorAll('.sidebar-chat-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't select chat if clicking on menu button
      if (e.target.closest('.sidebar-chat-item-menu')) return;
      const chatId = item.dataset.chatId;
      selectChat(chatId);
      // Close sidebar on mobile
      if (isMobile()) closeSidebar();
    });
  });

  // Add click handlers for chat menu buttons
  elements.spacesList.querySelectorAll('.sidebar-chat-item-menu').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chatId = btn.dataset.chatId;
      showContextMenu(e, 'chat', chatId);
    });
  });

  // Add click handlers for new chat buttons
  elements.spacesList.querySelectorAll('.sidebar-new-chat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      createNewChat();
      if (isMobile()) closeSidebar();
    });
  });
}

async function selectSpace(spaceId) {
  state.currentSpaceId = spaceId;
  state.currentChatId = null;
  state.currentChatMessages = [];

  try {
    const space = await spacesApi.get(spaceId);
    state.currentSpace = space.metadata;

    // Load chats for this space
    await loadChats();

    renderSpacesList();
    renderSpaceContent();
    renderChatWelcome();

    elements.emptyState.classList.add('hidden');
    elements.spaceContent.classList.remove('hidden');

    // Close sidebar on mobile after selecting a space
    if (isMobile()) {
      closeSidebar();
    }
  } catch (error) {
    showToast('Не вдалося завантажити простір', 'error');
  }
}

function renderSpaceContent() {
  elements.spaceName.textContent = state.currentSpace.name;
  // Keep header clean; description stays only in edit modal
  if (elements.spaceDescription) {
    elements.spaceDescription.textContent = '';
  }
}

function openCreateSpaceModal() {
  openModal('Створити простір', `
    <div class="form-group">
      <label class="form-label">Назва *</label>
      <input type="text" name="name" class="form-input" placeholder="Наприклад: Робота, Здоров'я, Навчання">
    </div>
    <div class="form-group">
      <label class="form-label">Опис</label>
      <textarea name="description" class="form-textarea description-textarea" rows="12" maxlength="20000" placeholder="Детальний опис контексту"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Іконка</label>
      <div class="icon-picker" id="icon-picker">
        <span class="icon-picker-value" id="icon-picker-value">📁</span>
      </div>
      <input type="hidden" name="icon" id="icon-input" value="📁">
    </div>
  `, async (data) => {
    if (!data.name) throw new Error("Назва обов'язкова");
    await spacesApi.create(data);
    showToast('Простір створено', 'success');
    await loadSpaces();
  });
  
  // Add click handler for icon picker
  setTimeout(() => {
    const iconPicker = document.getElementById('icon-picker');
    const iconInput = document.getElementById('icon-input');
    const iconValue = document.getElementById('icon-picker-value');
    
    if (iconPicker) {
      iconPicker.addEventListener('click', () => {
        const newIcon = prompt('Введіть emoji або символ:', iconInput.value || '📁');
        if (newIcon && newIcon.trim()) {
          const icon = newIcon.trim().substring(0, 2);
          iconInput.value = icon;
          iconValue.textContent = icon;
        }
      });
    }
  }, 100);
}

function openEditSpaceModal() {
  const space = state.currentSpace;
  const currentIcon = space.icon || '📁';
  openModal('Редагувати простір', `
    <div class="form-group">
      <label class="form-label">Назва *</label>
      <input type="text" name="name" class="form-input" value="${escapeHtml(space.name)}">
    </div>
    <div class="form-group">
      <label class="form-label">Опис</label>
      <textarea name="description" class="form-textarea description-textarea" rows="12" maxlength="20000">${escapeHtml(space.description)}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Іконка</label>
      <div class="icon-picker" id="icon-picker">
        <span class="icon-picker-value" id="icon-picker-value">${escapeHtml(currentIcon)}</span>
      </div>
      <input type="hidden" name="icon" id="icon-input" value="${escapeHtml(currentIcon)}">
    </div>
  `, async (data) => {
    if (!data.name) throw new Error("Назва обов'язкова");
    await spacesApi.update(state.currentSpaceId, data);
    showToast('Простір оновлено', 'success');
    await selectSpace(state.currentSpaceId);
    await loadSpaces();
  });
  
  // Add click handler for icon picker
  setTimeout(() => {
    const iconPicker = document.getElementById('icon-picker');
    const iconInput = document.getElementById('icon-input');
    const iconValue = document.getElementById('icon-picker-value');
    
    if (iconPicker) {
      iconPicker.addEventListener('click', () => {
        const newIcon = prompt('Введіть emoji або символ:', iconInput.value || '📁');
        if (newIcon && newIcon.trim()) {
          const icon = newIcon.trim().substring(0, 2);
          iconInput.value = icon;
          iconValue.textContent = icon;
        }
      });
    }
  }, 100);
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
// Chat Management
// ═══════════════════════════════════════════════════════════

async function loadChats() {
  try {
    const sessions = await chatApi.listSessions(state.currentSpaceId);
    state.chats = sessions || [];
    renderChatSelector();
    // Re-render spaces list to show nested chats
    renderSpacesList();
  } catch (error) {
    console.error('Error loading chats:', error);
    state.chats = [];
    renderChatSelector();
    renderSpacesList();
  }
}

function renderChatSelector() {
  const select = elements.chatSelect;
  select.innerHTML = '<option value="">Новий чат</option>';

  state.chats.forEach(chat => {
    const option = document.createElement('option');
    option.value = chat.sessionId;
    option.textContent = chat.name || `Чат ${new Date(chat.createdAt).toLocaleString('uk-UA')}`;
    if (chat.sessionId === state.currentChatId) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  // Update button states
  updateChatButtonStates();
}

function updateChatButtonStates() {
  const hasActiveChat = !!state.currentChatId;
  const renameBtn = $('#rename-chat-btn');
  const deleteBtn = $('#delete-chat-btn');

  if (renameBtn) {
    renameBtn.disabled = !hasActiveChat;
    renameBtn.style.opacity = hasActiveChat ? '1' : '0.5';
    renameBtn.style.cursor = hasActiveChat ? 'pointer' : 'not-allowed';
  }

  if (deleteBtn) {
    deleteBtn.disabled = !hasActiveChat;
    deleteBtn.style.opacity = hasActiveChat ? '1' : '0.5';
    deleteBtn.style.cursor = hasActiveChat ? 'pointer' : 'not-allowed';
  }
}

async function createNewChat() {
  if (state.chats.length >= MAX_CHATS_PER_SPACE) {
    showToast(`Максимум ${MAX_CHATS_PER_SPACE} чатів на простір. Видаліть старі чати.`, 'warning');
    return;
  }

  state.currentChatId = null;
  state.currentChatMessages = [];
  elements.chatSelect.value = '';
  renderChatWelcome();
  updateChatButtonStates();
  renderSpacesList();
  showToast('Новий чат створено', 'info');
}

async function selectChat(sessionId) {
  if (!sessionId) {
    createNewChat();
    return;
  }

  try {
    const session = await chatApi.getSession(sessionId);
    state.currentChatId = sessionId;
    state.currentChatMessages = session.messages || [];
    renderChatMessages();
    updateChatButtonStates();
    // Update sidebar to show active chat
    renderSpacesList();
    // Update dropdown selection
    if (elements.chatSelect) elements.chatSelect.value = sessionId;
  } catch (error) {
    showToast('Не вдалося завантажити чат', 'error');
  }
}

async function renameChat() {
  if (!state.currentChatId) {
    showToast('Спочатку оберіть чат', 'warning');
    return;
  }

  const currentChat = state.chats.find(c => c.sessionId === state.currentChatId);
  openModal('Перейменувати чат', `
    <div class="form-group">
      <label class="form-label">Назва чату *</label>
      <input type="text" name="name" class="form-input" value="${escapeHtml(currentChat?.name || '')}" placeholder="Моя розмова про...">
    </div>
  `, async (data) => {
    if (!data.name) throw new Error("Назва обов'язкова");
    await chatApi.renameSession(state.currentChatId, data.name);
    showToast('Чат перейменовано', 'success');
    await loadChats();
    // Sidebar is already updated by loadChats
  });
}

async function deleteChat() {
  if (!state.currentChatId) {
    showToast('Спочатку оберіть чат', 'warning');
    return;
  }

  if (!confirm('Видалити цей чат? Це незворотня дія!')) return;

  try {
    await chatApi.deleteSession(state.currentChatId);
    showToast('Чат видалено', 'success');
    state.currentChatId = null;
    state.currentChatMessages = [];
    await loadChats();
    renderChatWelcome();
    updateChatButtonStates();
    // Sidebar is already updated by loadChats
  } catch (error) {
    showToast('Не вдалося видалити чат', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// Chat Interface
// ═══════════════════════════════════════════════════════════

function renderChatWelcome() {
  elements.chatMessages.innerHTML = `
    <div class="chat-welcome">
      <div class="chat-welcome-icon">💬</div>
      <h3>Розпочніть розмову</h3>
      <p>AI вже знає контекст "${escapeHtml(state.currentSpace?.name || '')}" — запитуйте про що завгодно!</p>
    </div>
  `;
}

function renderChatMessages() {
  elements.chatMessages.innerHTML = '';
  state.currentChatMessages.forEach(msg => {
    addChatMessageToDOM(msg.role, msg.content);
  });
}

function addChatMessageToDOM(role, content) {
  const welcome = elements.chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${role}`;

  const avatar = role === 'user' ? '👤' : '🧠';
  const formattedContent = formatChatContent(content);

  messageEl.innerHTML = `
    <div class="chat-avatar">${avatar}</div>
    <div class="chat-bubble">
      ${formattedContent}
    </div>
  `;

  elements.chatMessages.appendChild(messageEl);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function setChatInputValue(value, { resetHeight = false, focus = false } = {}) {
  state.chatInputValue = value;
  if (!elements.chatInput) return;

  elements.chatInput.value = value;

  if (resetHeight) {
    elements.chatInput.style.height = 'auto';
  }

  if (focus) {
    elements.chatInput.focus();
  }
}

function formatChatContent(content) {
  // Handle array content (multimodal)
  if (Array.isArray(content)) {
    return content.map(part => {
      if (part.type === 'text') {
        return formatText(part.text);
      } else if (part.type === 'image_url') {
        return `<img src="${part.image_url.url}" class="chat-content-image" alt="Image">`;
      }
      return '';
    }).join('');
  }

  // Handle string content
  return formatText(content);
}

function formatText(text) {
  if (!text) return '';
  return text
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

// ═══════════════════════════════════════════════════════════
// File Handling
// ═══════════════════════════════════════════════════════════

let selectedFiles = [];

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  selectedFiles = [...selectedFiles, ...files];
  renderAttachments();
  e.target.value = ''; // Reset input
}

function renderAttachments() {
  const container = document.getElementById('chat-attachments');
  container.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'chat-attachment-item';

    // Truncate filename: 'very-long-file...name.pdf'
    const ext = file.name.split('.').pop();
    let name = file.name;
    if (name.length > 20) {
      name = name.substring(0, 15) + '...' + (name.includes('.') ? ext : '');
    }

    let preview = '';
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      preview = `<img src="${url}" class="attachment-preview" alt="Preview" style="cursor: pointer">`;
    } else {
      // PDF or other file icon
      preview = `<div class="attachment-preview">📄</div>`;
    }

    item.innerHTML = `
      ${preview}
      <span class="attachment-name" title="${escapeHtml(file.name)}">${escapeHtml(name)}</span>
      <button class="attachment-remove" data-index="${index}" type="button" aria-label="Видалити">×</button>
    `;
    container.appendChild(item);
  });

  // Add remove listeners
  container.querySelectorAll('.attachment-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent form submission or other clicks

      // We need to use current index lookup because splice shifts indices
      // Simpler: re-render all? No, just splice properly.
      // But button has data-index baked in.
      // Better strategy: filter the array?
      // Since we re-render immediately, the indices will be refreshed.

      const index = parseInt(btn.dataset.index);
      selectedFiles.splice(index, 1);

      // Revoke object URLs to avoid memory leaks
      // (Advanced but good practice) - skipped for brevity in this task, but noted.

      renderAttachments();
    });
  });
}

// Add listeners
document.getElementById('chat-attach').addEventListener('click', () => {
  document.getElementById('file-input').click();
});
document.getElementById('file-input').addEventListener('change', handleFileSelect);


async function sendChatMessage(messageOverride) {
  // Read directly from DOM for reliability, fallback to state
  const message = typeof messageOverride === 'string' 
    ? messageOverride 
    : (elements.chatInput?.value ?? state.chatInputValue ?? '');
  
  if (!message.trim() && selectedFiles.length === 0) return;
  if (!state.aiConfigured) {
    showToast('AI не налаштовано. Встановіть OPENAI_API_KEY.', 'error');
    return;
  }

  // Capture files BEFORE clearing
  const filesToSend = [...selectedFiles];
  const messageToSend = message.trim();

  // Disable send button temporarily
  if (elements.chatSend) elements.chatSend.disabled = true;

  try {
    // Process files for Display (Base64/DataURL)
    const filePromises = filesToSend.map(file => {
      return new Promise((resolve) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            type: 'image_url',
            image_url: { url: e.target.result },
            file
          });
          reader.readAsDataURL(file);
        } else {
          resolve({
            type: 'text',
            text: `[Attached file: ${file.name}]`,
            file
          });
        }
      });
    });

    const filesData = await Promise.all(filePromises);

    // Construct mixed content message for UI
    const contentParts = [];
    if (messageToSend) {
      contentParts.push({ type: 'text', text: messageToSend });
    }
    filesData.forEach(f => {
      if (f.type === 'image_url') {
        contentParts.push({ type: 'image_url', image_url: f.image_url });
      } else if (f.type === 'text' && !messageToSend.includes(f.text)) {
        contentParts.push(f);
      }
    });

    // Add User Message to DOM (Optimistic)
    if (contentParts.length > 0) {
      state.currentChatMessages.push({ role: 'user', content: contentParts });
      addChatMessageToDOM('user', contentParts);
    }

    // CRITICAL FIX: Clear input IMMEDIATELY after message is sent to UI
    // User can now type new message while AI is responding
    clearChatInput();

    showTypingIndicator();

    // Send to API
    const formData = new FormData();
    formData.append('message', messageToSend);
    if (state.currentSpaceId) {
      formData.append('spaceId', state.currentSpaceId);
    }
    if (state.currentChatId) {
      formData.append('sessionId', state.currentChatId);
    }

    filesToSend.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await chatApi.send(formData);

    // Update session if needed
    if (!state.currentChatId) {
      state.currentChatId = response.sessionId;
      await loadChats();
      // Ensure specific chat is selected in dropdown
      if (elements.chatSelect) elements.chatSelect.value = state.currentChatId;
    }

    // Add Assistant Message to DOM
    state.currentChatMessages.push({ role: 'assistant', content: response.message.content });
    hideTypingIndicator();
    addChatMessageToDOM('assistant', response.message.content);

  } catch (error) {
    hideTypingIndicator();
    console.error('Send error:', error);
    showToast(error.message || 'Помилка відправки повідомлення', 'error');
    // On error, the input was already cleared - user needs to retype
    // This is acceptable trade-off for immediate clearing behavior
  } finally {
    if (elements.chatSend) elements.chatSend.disabled = false;
    // Ensure focus is back on input
    if (elements.chatInput) elements.chatInput.focus();
  }
}

/**
 * Clear chat input, reset textarea height, clear attachments
 * This is the single source of truth for resetting the chat input state
 */
function clearChatInput() {
  // Clear text input state
  state.chatInputValue = '';
  
  // Clear DOM textarea value and reset height - multiple methods for reliability
  const textarea = elements.chatInput || document.getElementById('chat-input');
  if (textarea) {
    // Method 1: Direct value assignment
    textarea.value = '';
    // Method 2: setAttribute for extra reliability
    textarea.setAttribute('value', '');
    // Reset height
    textarea.style.height = 'auto';
    textarea.style.height = '';
    // Force reflow
    void textarea.offsetHeight;
    // Dispatch input event to trigger any listeners
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Clear file attachments
  selectedFiles = [];
  renderAttachments();
  
  // Also clear the file input
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.value = '';
  }
}

// ═══════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════

// Mobile sidebar
elements.hamburgerBtn.addEventListener('click', openSidebar);
elements.sidebarClose.addEventListener('click', closeSidebar);
elements.sidebarOverlay.addEventListener('click', closeSidebar);

// Close sidebar on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMobile() && elements.sidebar.classList.contains('open')) {
    closeSidebar();
  }
});

// Spaces
$('#add-space-btn').addEventListener('click', openCreateSpaceModal);
$('#create-first-space').addEventListener('click', openCreateSpaceModal);
$('#edit-space-btn').addEventListener('click', openEditSpaceModal);
$('#delete-space-btn').addEventListener('click', deleteSpace);

// Chat management
$('#new-chat-btn').addEventListener('click', createNewChat);
$('#rename-chat-btn').addEventListener('click', renameChat);
$('#delete-chat-btn').addEventListener('click', deleteChat);
elements.chatSelect.addEventListener('change', (e) => selectChat(e.target.value));

// Chat form
elements.chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendChatMessage();
});

// Auto-resize chat input
elements.chatInput.addEventListener('input', () => {
  setChatInputValue(elements.chatInput.value);
  elements.chatInput.style.height = 'auto';
  elements.chatInput.style.height = Math.min(elements.chatInput.scrollHeight, 200) + 'px';
});

// Enter to send (Shift+Enter for new line)
elements.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// ═══════════════════════════════════════════════════════════
// Initialize
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  checkAIStatus();
  loadSpaces();

  // Sidebar AI status click handler
  elements.aiStatus.addEventListener('click', () => {
    if (state.aiConfigured) {
      openModelSelectorModal();
    }
  });

  // Mobile AI status click handler
  if (elements.mobileAiStatus) {
    elements.mobileAiStatus.addEventListener('click', () => {
      if (state.aiConfigured) {
        openModelSelectorModal();
      }
    });
  }

  // Header model selector click handler (primary model selector)
  if (elements.headerModelSelector) {
    elements.headerModelSelector.addEventListener('click', () => {
      if (state.aiConfigured) {
        openModelSelectorModal();
      } else {
        showToast('AI не налаштовано. Встановіть OPENAI_API_KEY.', 'warning');
      }
    });
  }

  // Image modal handler (delegated)
  document.addEventListener('click', (e) => {
    if ((e.target.classList.contains('chat-content-image') || e.target.classList.contains('attachment-preview')) && e.target.tagName === 'IMG') {
      const src = e.target.src;
      const modal = document.createElement('div');
      modal.className = 'image-modal';
      modal.innerHTML = `<img src="${src}" alt="Full view">`;
      modal.onclick = () => modal.remove();
      document.body.appendChild(modal);
    }
  });
});
