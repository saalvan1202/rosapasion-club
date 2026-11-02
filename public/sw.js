// Rosa Pasión Club - Service Worker PWA Robusto y Seguro
const CACHE_NAME = "rosapasion-pwa-v2";

const PRECACHE_ASSETS = [
  "/",
  "/favicon.ico",
  "/logo-horizontal.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.log("PWA Precache opcional omitido:", err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1. Omitir peticiones que no sean GET o que pertenezcan a APIs o Server Actions
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 2. Omitir llamadas a Next.js Server Actions y APIs para garantizar datos siempre frescos
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/admin")
  ) {
    return;
  }

  // 3. Estrategia Network First con fallback a Cache para assets e imágenes
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guardar copia en cache solo de respuestas válidas de assets
        if (
          response.status === 200 &&
          (url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".webp") ||
            url.pathname.endsWith(".svg") ||
            url.pathname === "/")
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback a página de inicio si falla la red al navegar
        if (request.mode === "navigate") {
          return caches.match("/");
        }
      })
  );
});
