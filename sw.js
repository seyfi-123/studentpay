// StudentPay Service Worker v3
// Қоида: SW ҳеҷ гоҳ ба дархостҳои API даст намезанад (POST/PUT/DELETE, GET-и API,
// ва ҳар чизе ки аз домени дигар меояд). Танҳо файлҳои худи барнома кэш мешаванд.
const CACHE = 'studentpay-v3';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // Ҳар файл ҷудо: агар яке (масалан icon) набошад, насб вайрон намешавад
      Promise.all(FILES.map(f => c.add(f).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // 1) Ҳар чизе ғайр аз GET — бемонеа ба шабака мегузарад (POST /apply, /verify ...)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 2) Домени дигар (сервери API/Railway/Mock) — SW дахолат намекунад
  if (url.origin !== self.location.origin) return;

  // 3) Ҳар роҳи /api/ дар домени худӣ — бе кэш
  if (url.pathname.includes('/api/')) return;

  // 4) Range-дархостҳо (медиа) — бе кэш
  if (req.headers.has('range')) return;

  // Файлҳои барнома: Network First (навсозии худкор), офлайн — аз кэш
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});
