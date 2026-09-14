/* Service worker: the page and its icons are cached on install; the page is
   served from cache and refreshed in the background (stale-while-revalidate),
   so it opens instantly, works offline, and picks up a new version the next
   time it is opened with a connection. Progress never passes through here —
   it lives in localStorage. Bump CACHE with each release to drop old caches, and the
   ?v= on index.html's og:image and README's <img> so chat apps and GitHub's
   image cache fetch the new preview; add the line to CHANGELOG.md. */
const CACHE = 'mission-tree-v1.0';
const SHELL = ['./', './index.html', './favicon.svg', './favicon-32.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const cached = await c.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
      return cached || (await fresh) || Response.error();
    })
  );
});
