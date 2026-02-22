// NEO PWA Service Worker - Network First with Pre-caching
const CACHE_NAME = 'neo-pwa-v3';

// Recursos essenciais para pré-cachear (app funciona offline após primeiro carregamento)
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    // CSS
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/sidebar.css',
    './css/modals.css',
    './css/messages.css',
    './css/settings.css',
    './css/animations.css',
    './css/notes.css',
    './css/code-studio.css',
    './css/media-loader.css',
    './css/attach-sidebar.css',
    // JS essencial
    './js/web-compat.js',
    './js/ia-config.js',
    './js/config.js',
    './js/utils.js',
    './js/elements.js',
    './js/storage.js',
    './js/ui.js',
    './js/main.js',
    './js/chat.js',
    './js/api.js',
    './js/neo-api.js',
    './js/features.js',
    './js/suggestions.js',
    './js/terms.js',
    './js/model-selector.js',
    './js/personas.js',
    './js/notes.js',
    './js/image-handler.js',
    './js/image-storage.js',
    './js/pdf-handler.js',
    './js/voice-call.js',
    './js/mic-voice.js',
    './js/particle-sphere.js',
    './js/vibration.js',
    './js/debug-log.js',
    './js/web-search.js',
    './js/serp-search.js',
    './js/topic-images.js',
    './js/charts.js',
    './js/mindmap.js',
    './js/diff-engine.js',
    './js/document-generator.js',
    './js/code-studio.js',
    './js/health-form.js',
    // Ícones
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/icon-96x96.png'
];

// Install event - pré-cacheia recursos essenciais
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando e pré-cacheando recursos...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => {
                console.log('[SW] Pré-cache concluído');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.warn('[SW] Erro no pré-cache (continuando):', err);
                return self.skipWaiting();
            })
    );
});

// Activate event - limpa caches antigos e assume clientes
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker ativado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Network First com fallback para cache
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Só intercepta requests GET (não intercepta POST para APIs externas)
    if (request.method !== 'GET') return;

    // Não intercepta requests para APIs externas
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Se sucesso na rede, atualiza o cache e retorna
                if (networkResponse && networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Rede falhou - tenta servir do cache
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Se é navegação e não tem cache, mostra página offline
                    if (request.mode === 'navigate') {
                        return caches.match('./index.html').then((indexResponse) => {
                            return indexResponse || new Response(
                                '<!DOCTYPE html><html><body style="background:#050014;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0"><div style="text-align:center"><h2>NEO</h2><p>Sem conexão. Verifique sua internet e tente novamente.</p><button onclick="location.reload()" style="margin-top:20px;padding:10px 30px;background:#6c3ce0;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer">Tentar Novamente</button></div></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                    }
                    return new Response('', { status: 408, statusText: 'Offline' });
                });
            })
    );
});
