/* ==========================================================================
   RC8 - Service Worker
   Habilita o modo offline: caches os MP3s baixados e o shell do app.
   Estratégia: cache-first para assets e MP3 (uma vez baixado, toca offline);
   network-first para o manifest e dados dinâmicos.
   ========================================================================== */

const CACHE_NAME = 'rc8-cache-v1';
const SHELL_CACHE = 'rc8-shell-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/player.js',
  './js/sheets.js',
  './js/visualizer.js',
  './js/wod-timer.js',
  './assets/icon.svg'
];

// Instala o service worker e cacheia o "shell" do app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Intercepta as requisições
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Requisições não-GET não são cacheadas
  if (event.request.method !== 'GET') return;

  // MP3 (áudio local) e covers: cache-first — se baixado, toca offline
  if (url.includes('.mp3') || url.includes('audio/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        // Se não está no cache, busca na rede E salva no cache
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Imagens externas (covers do YouTube/Unsplash): tentar cache, senão rede
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Shell/assets locais: cache-first
  if (url.startsWith(self.location.origin) && !url.includes('gviz') && !url.includes('playlist.json')) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
      )
    );
    return;
  }
});
