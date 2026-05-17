// Invite Studio — minimal service worker. Its presence (alongside the web
// manifest) is what makes the browser show the "Install App" prompt.
const CACHE = "invite-studio-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network-first for navigations; pass-through for everything else.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((r) => r || new Response("Offline", { status: 503 })),
      ),
    );
  }
});
