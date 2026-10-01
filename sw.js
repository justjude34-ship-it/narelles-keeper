const CACHE = "narelles-keeper-v28";
const ASSETS = [
  "./assets/hero-lotus-cool.jpg",
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./assets/nk-p0.js",
  "./assets/nk-p1.js",
  "./assets/nk-p2.js",
  "./assets/nk-p3.js",
  "./assets/nk-ara-text.js",
  "./assets/nk-hero.js",
  "./manifest.json",
  "./assets/icon.svg",
  "./assets/placements.css",
  "./assets/hero-jpg/p00.bin",
  "./assets/hero-jpg/p01.bin",
  "./assets/hero-jpg/p02.bin",
  "./assets/hero-jpg/p03.bin",
  "./assets/hero-jpg/p04.bin",
  "./assets/hero-jpg/p05.bin",
  "./assets/hero-jpg/p06.bin",
  "./assets/hero-jpg/p07.bin",
  "./assets/hero-jpg/p08.bin",
  "./assets/hero-jpg/p09.bin",
  "./assets/hero-jpg/p10.bin",
  "./assets/hero-jpg/p11.bin",
  "./assets/hero-jpg/p12.bin",
  "./assets/hero-jpg/p13.bin",
  "./assets/hero-jpg/p14.bin",
  "./assets/hero-jpg/p15.bin",
  "./assets/hero-jpg/p16.bin",
  "./assets/hero-jpg/p17.bin"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var accept = e.request.headers.get("accept") || "";
  var isNav = e.request.mode === "navigate" || accept.indexOf("text/html") !== -1;
  if (isNav) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || caches.match("./index.html"); });
      })
    );
    return;
  }
  var url = e.request.url || "";
  if (url.indexOf("styles.css") !== -1 || url.indexOf("placements.css") !== -1 || url.indexOf("app.js") !== -1 || url.indexOf("nk-p") !== -1 || url.indexOf("nk-ara") !== -1 || url.indexOf("nk-hero") !== -1 || url.indexOf("hero-jpg") !== -1 || url.indexOf("sw.js") !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return hit; });
    })
  );
});
