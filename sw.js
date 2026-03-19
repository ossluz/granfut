/* GranFut Service Worker - Saieso Seraos */
const CACHE_NAME = 'granfut-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/engine.js',
  './js/finance.js',
  './js/missions.js',
  './js/app.js'
];

// Instalação: cacheia os arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache-First para assets, Network-First para APIs externas
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // APIs externas de notícias: tenta rede, falha graciosamente
  if (url.hostname.includes('rss2json') || url.hostname.includes('newsapi')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(JSON.stringify({ offline: true, items: [] }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Assets locais: Cache-First
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// Mensagens do app principal
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
