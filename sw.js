// Offline support: the page is fetched network-first (so updates show up right away)
// and falls back to the cached copy when the gym has no signal. Icons and fonts are cache-first.
const CACHE = "ppl-v1";
const CORE = ["./", "./index.html", "./manifest.json", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./", copy)); return res; })
        .catch(() => caches.match("./").then(r => r || caches.match("./index.html")))
    );
    return;
  }
  const cacheable = url.origin === location.origin || url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  if (!cacheable) return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
