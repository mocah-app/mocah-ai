/// <reference lib="webworker" />

const CACHE_NAME = "mocah-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/mocah-icon-dark.svg",
  "/mocah-icon-light.svg",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests, auth routes, and Next.js internal files
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/trpc/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.includes("/_next/") ||
    url.pathname.includes("/turbopack") ||
    url.pathname.includes("__turbopack") ||
    url.pathname.includes("%5Bturbopack%5D") ||
    url.pathname.includes("hmr-client") ||
    url.pathname.includes("webpack") ||
    url.pathname.includes(".hot-update.") ||
    url.pathname.endsWith(".map")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response for caching
        const responseClone = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }

          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || "/",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

