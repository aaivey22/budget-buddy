const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/index.js",
  "/style.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];


const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
// activate
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetched data is stored in cache
self.addEventListener("fetch", (e) => {
  if (e.req.url.includes("/api/")) {
    e.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(e.req)
          .then(res => {
            // If the response was good, clone it and store it in the cache.
            if (res.status === 200) {
              cache.put(e.req.url, res.clone());
            }

            return res;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(e.req);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  e.respondWith(
    caches.match(e.req).then(function (res) {
      return res || fetch(e.req);
    })
  );

});