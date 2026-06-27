const CACHE = 'btalk-v3';
const STATIC = ['/B-Talk/icon.svg', '/B-Talk/manifest.json', '/B-Talk/logo-transparent.png', '/B-Talk/icon-192.png', '/B-Talk/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 외부 도메인, Firebase, admin 페이지는 항상 네트워크에서
  if (
    url.origin !== self.location.origin ||
    url.pathname === '/B-Talk/' ||
    url.pathname === '/B-Talk/index.html' ||
    url.pathname === '/B-Talk/admin.html' ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('netlify')
  ) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  // 정적 자산은 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
