(function () {
  var map = {
    "nk-img-hero": "images/hero.b64",
    "nk-img-welcome": "images/welcome.b64",
    "nk-img-today-closer": "images/today-closer.b64",
    "nk-img-meds": "images/meds.b64",
    "nk-img-appointments": "images/appointments.b64",
    "nk-img-rosie-butterfly": "images/rosie-butterfly.b64"
  };

  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    fetch(map[id])
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
      .then(function (t) {
        el.src = "data:image/jpeg;base64," + String(t).trim();
        el.hidden = false;
        el.style.display = "block";
      })
      .catch(function () { /* keep hidden if missing */ });
  });

  var splash = document.getElementById("welcome-splash");
  var enter = document.getElementById("btn-enter-keeper");
  if (splash && enter) {
    try {
      if (sessionStorage.getItem("nk.welcome.seen") === "1") {
        splash.style.display = "none";
      }
    } catch (e) {}
    enter.addEventListener("click", function () {
      splash.style.display = "none";
      try { sessionStorage.setItem("nk.welcome.seen", "1"); } catch (e) {}
    });
  }
})();
