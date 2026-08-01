/* Super Friends — Service Worker
   Caches the app shell so the app opens instantly and works offline.
   Live data itself (matches/scores) lives in localStorage today, or
   in Firebase Realtime Database once you switch USE_FIREBASE on in
   js/db.js — Firebase's own SDK handles its offline queue separately. */

const CACHE_NAME = "superfriends-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/db.js",
  "./js/app.js",
  "./js/scoring.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* Push notifications: this fires when a push message arrives from
   your server (e.g. Firebase Cloud Messaging). Requires your own
   FCM server key + VAPID keys wired up server-side — the client
   hook is ready here. */
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Super Friends", body: "New match update" };
  event.waitUntil(
    self.registration.showNotification(data.title || "Super Friends", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
    })
  );
});
