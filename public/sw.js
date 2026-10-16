/**
 * Student Life & Campus Hub - Service Worker (Phase 6 PWA)
 * Oxford Navy (#0B1D33) + Academic Gold (#C59B27) Light Theme
 *
 * Strategies:
 * 1. App Shell & Static Assets: Offline-First (Cache-First with network fallback & background refresh)
 * 2. Data / API / Supabase Calls: Network-First / Network-Only.
 *    CRITICAL PRIVACY RULE: Never cache authenticated API responses where one user's data could leak to another.
 * 3. Page Navigations: Network-First with fallback to /offline.html
 */

const CACHE_VERSION = "campus-hub-v1";
const STATIC_CACHE = `campus-hub-static-${CACHE_VERSION}`;
const PAGES_CACHE = `campus-hub-pages-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/offline.html",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.png",
  "/icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon-180x180.png",
  "/apple-touch-icon.png",
];

// URLs/patterns that must NEVER be stored in shared service worker caches
function isPrivateOrAuthenticatedRequest(request, url) {
  // Non-GET requests (mutations, server actions POST, uploads)
  if (request.method !== "GET") {
    return true;
  }

  // API endpoints, auth routes, Supabase endpoints
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/auth/") ||
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/rest/v1")
  ) {
    return true;
  }

  // Headers carrying sensitive authentication or cookie credentials
  if (
    request.headers.get("authorization") ||
    request.headers.get("x-supabase-auth")
  ) {
    return true;
  }

  return false;
}

// Check if request is for static asset (JS, CSS, images, fonts)
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/offline.html"
  );
}

// Install Event: Pre-cache app shell & offline fallback
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("PWA: Precaching failed for some assets:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up legacy caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== PAGES_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http(s) requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // 1. PRIVACY BOUNDARY: Never cache authenticated API or mutation requests
  if (isPrivateOrAuthenticatedRequest(request, url)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: "You are currently offline. Live data synchronization is paused until connection is restored.",
          }),
          {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // 2. Navigation requests (HTML pages): Network-First with fallback to /offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, cache the public page shell if safe
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(PAGES_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed: try cached page first
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          // If no cached page, serve offline fallback
          const offlineFallback = await caches.match("/offline.html");
          if (offlineFallback) {
            return offlineFallback;
          }
          const offlinePage = await caches.match("/offline");
          if (offlinePage) {
            return offlinePage;
          }
          return new Response("You are currently offline.", {
            headers: { "Content-Type": "text/html" },
          });
        })
    );
    return;
  }

  // 3. Static Assets: Offline-First (Cache-First, fallback to network)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in background to keep cache fresh
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Cache miss: fetch from network and store in static cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Default: Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
