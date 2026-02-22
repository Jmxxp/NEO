// NEO PWA Service Worker - Online Only (no caching strategy for offline)
const CACHE_NAME = 'neo-pwa-v1';

// Install event - minimal setup
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker installed');
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, no offline fallback needed
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
