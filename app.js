(function () {
  const NAME = "Narelle";

  function timeGreeting(d) {
    const h = d.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function setGreeting() {
    const el = document.getElementById("greeting");
    if (!el) return;
    el.textContent = timeGreeting(new Date()) + ", " + NAME;
  }

  function showPanel(id) {
    document.querySelectorAll(".panel").forEach(function (p) {
      const on = p.id === "panel-" + id;
      p.classList.toggle("is-active", on);
      if (on) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
    document.querySelectorAll(".dock-btn").forEach(function (btn) {
      const on = btn.getAttribute("data-panel") === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  document.querySelectorAll(".dock-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showPanel(btn.getAttribute("data-panel"));
    });
  });

  setGreeting();
  setInterval(setGreeting, 60 * 1000);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
