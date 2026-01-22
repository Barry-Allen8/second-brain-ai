/**
 * Second Brain AI - Service Worker
 * Provides offline functionality and caching strategies
 */

const CACHE_VERSION = 'v4';
const CACHE_NAME = `second-brain-ai-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `second-brain-ai-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `second-brain-ai-dynamic-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Google Fonts to cache
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap',
];

// ═══════════════════════════════════════════════════════════
// Installation - Cache static assets
// ═══════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Static assets cached');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache static assets:', error);
      })
  );
});

// ═══════════════════════════════════════════════════════════
// Activation - Clean up old caches
// ═══════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versioned caches
              return cacheName.startsWith('second-brain-ai-') && 
                     cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// ═══════════════════════════════════════════════════════════
// Fetch - Handle requests with appropriate caching strategies
// ═══════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // API requests - Network first, no cache fallback for API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Google Fonts - Cache first with long TTL
  if (url.hostname.includes('fonts.googleapis.com') || 
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE_NAME));
    return;
  }
  
  // Static assets - Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }
  
  // Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
  
  // Default - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ═══════════════════════════════════════════════════════════
// Caching Strategies
// ═══════════════════════════════════════════════════════════

/**
 * Cache First - Return from cache, fall back to network
 */
async function cacheFirst(request, cacheName = STATIC_CACHE_NAME) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error);
    return new Response('Офлайн режим недоступний', { status: 503 });
  }
}

/**
 * Network First - Try network, fall back to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return error response for API calls
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { 
          code: 'OFFLINE', 
          message: 'Немає з\'єднання з інтернетом' 
        } 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Network First with Offline Fallback - For navigation
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try to return cached page
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return cached index.html for offline navigation
    const indexCached = await caches.match('/index.html');
    if (indexCached) {
      return indexCached;
    }
    
    // Last resort - return offline message
    return new Response(
      generateOfflineHTML(),
      { 
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

/**
 * Stale While Revalidate - Return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || networkPromise;
}

// ═══════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.html', '.css', '.js', '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Generate offline HTML page
 */
function generateOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Second Brain AI - Офлайн</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0a0e14 0%, #1a1f2e 100%);
      color: #e1e5eb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .offline-container {
      text-align: center;
      max-width: 400px;
    }
    .offline-icon {
      font-size: 80px;
      margin-bottom: 24px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    h1 {
      color: #00d9ff;
      margin-bottom: 16px;
      font-size: 24px;
    }
    p {
      color: #8b92a0;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .retry-btn {
      background: linear-gradient(135deg, #00d9ff 0%, #00b8d9 100%);
      color: #0a0e14;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 217, 255, 0.3);
    }
    .retry-btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="offline-icon">📡</div>
    <h1>Ви офлайн</h1>
    <p>
      Немає з'єднання з інтернетом. Перевірте підключення та спробуйте ще раз.
    </p>
    <button class="retry-btn" onclick="location.reload()">
      Спробувати знову
    </button>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// Background Sync (optional, for future use)
// ═══════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    // Could be used to sync pending messages when back online
    event.waitUntil(syncPendingMessages());
  }
});

async function syncPendingMessages() {
  // Placeholder for future background sync functionality
  console.log('[Service Worker] Syncing pending messages...');
}

// ═══════════════════════════════════════════════════════════
// Push Notifications (optional, for future use)
// ═══════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event.data?.text());
  
  const options = {
    body: event.data?.text() || 'Нове повідомлення від Second Brain AI',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Відкрити' },
      { action: 'close', title: 'Закрити' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('Second Brain AI', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[Service Worker] Script loaded');
