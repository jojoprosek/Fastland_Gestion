/* Fastlane Gestion — cache shell + état, file d’attente gérée par pwa.js */
const VER = "fl6";
const SHELL = "fl-shell-" + VER;
const DATA = "fl-data-" + VER;
const CORE = [
  "/",
  "/static/css/app.css?v=" + VER,
  "/static/js/app.js?v=" + VER,
  "/static/js/pwa.js?v=" + VER,
  "/static/js/erp.js?v=" + VER,
  "/static/img/logo.jpg",
  "/static/img/icon-192.png",
  "/static/manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.pathname.startsWith("/api/auth")) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req, DATA));
    return;
  }
  event.respondWith(cacheFirst(req, SHELL));
});

async function cacheFirst(req, bucket) {
  const cached = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(bucket);
    if (fresh.ok && req.method === "GET") cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    if (req.mode === "navigate") {
      const home = await caches.match("/");
      if (home) return home;
    }
    throw e;
  }
}

async function networkFirst(req, bucket) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(bucket);
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener("message", event => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
