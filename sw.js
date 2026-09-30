const CACHE = "narelles-keeper-v13";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./nk/b0.js",
  "./nk/b1.js",
  "./nk/b2.js",
  "./nk/b3.js",
  "./nk/b4.js",
  "./nk/b5.js",
  "./nk/b6.js",
  "./nk/b7.js",
  "./nk/b8.js",
  "./nk/b9.js",
  "./nk/b10.js",
  "./nk/b11.js",
  "./nk/b12.js",
  "./nk/b13.js",
  "./manifest.json",
  "./assets/icon.svg",
  "./assets/placements.css"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
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
        return caches.match(e.request).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }
  var url = e.request.url || "";
  if (url.indexOf("styles.css") !== -1 || url.indexOf("placements.css") !== -1 || url.indexOf("nk-app") !== -1 || url.indexOf("app.js") !== -1 || url.indexOf("/nk/") !== -1 || url.indexOf("nk/b") !== -1 || url.indexOf("sw.js") !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request);
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        return res;
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].url && "focus" in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});
