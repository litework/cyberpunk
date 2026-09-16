/* Service worker: the page and its icons are cached on install; the page is
   served from cache and refreshed in the background (stale-while-revalidate),
   so it opens instantly, works offline, and picks up a new version the next
   time it is opened with a connection. Progress never passes through here —
   it lives in localStorage. Bump CACHE with each release to drop old caches, and the
   ?v= on index.html's og:image and README's <img> so chat apps and GitHub's
   image cache fetch the new preview; add the line to CHANGELOG.md. */
const CACHE = 'mission-tree-v1.0.5';
const SHELL = ['./', './index.html', './favicon.svg', './favicon-32.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  /* fetch the shell past the browser's HTTP cache: GitHub Pages serves index.html
     with a 10-minute max-age, and a fresh worker filled from that cache would
     carry the OLD page — the reload the update bar offers would change nothing */
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
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
      const fresh = fetch(new Request(e.request, { cache: 'no-cache' })).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
      return cached || (await fresh) || Response.error();
    })
  );
});
