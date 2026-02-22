// NEO PWA Service Worker - Online Only (no caching strategy for offline)
const CACHE_NAME = 'neo-pwa-v2';

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

// Fetch event - network first with error handling
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // If navigation request fails (offline), redirect to start page
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html') || new Response(
                    '<html><body style="background:#050014;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h2>Sem conexão. Verifique sua internet.</h2></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                );
            }
            return new Response('', { status: 408 });
        })
    );
});
