const CACHE = 'studentpay-v2';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Стратегияи "Network First" барои авто-навсозӣ (автоматическое обновление)
self.addEventListener('fetch', e => {
  // Агар дархости API бошад, онро кэш намекунад
  if (e.request.url.includes('/api/') || e.request.url.includes('railway')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Агар интернет бошад, версияи нави кодро аз GitHub мегирад ва дар кэш нав мекунад
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Агар интернет набошад (офлайн), версияи сабтшударо аз кэш нишон медиҳад
        return caches.match(e.request);
      })
  );
});

