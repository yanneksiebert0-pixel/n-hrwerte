/* Nährwert – Service Worker. Macht die App offline nutzbar. */
var CACHE = "naehrwert-v3";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./cardinal.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./favicon-32.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  // eigene Adresse, aber außerhalb der App (z. B. /api/ der Zentrale): nicht zwischenspeichern
  if (new URL(req.url).origin === location.origin && req.url.indexOf(self.registration.scope) !== 0) return;

  // App-Dateien + Google Fonts: aus dem Cache antworten, im Hintergrund erneuern.
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // offline und nicht im Cache: bei Seitenaufrufen die App-Shell liefern
        if (req.mode === "navigate") return caches.match("./index.html");
        return cached;
      });
      return cached || network;
    })
  );
});
