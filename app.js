(function () {
  const NAME = "Narelle";
  const STORAGE_MEDS = "nk.medicines.v1";
  const STORAGE_TAKEN = "nk.taken.v1";
  // TODO (future): iOS reliable background alerts need Web Push + a small backend
  // (or a native wrapper). This release only schedules Notification API while the
  // tab/app is open, with best-effort Service Worker showNotification.

  let meds = [];
  let taken = {};
  let alarmTimers = [];
  let editingId = null;

  function uid() {
    return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayKey(d) {
    d = d || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function loadMeds() {
    try {
      const raw = localStorage.getItem(STORAGE_MEDS);
      meds = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(meds)) meds = [];
    } catch (e) {
      meds = [];
    }
  }

  function saveMeds() {
    localStorage.setItem(STORAGE_MEDS, JSON.stringify(meds));
  }

  function loadTaken() {
    try {
      const raw = localStorage.getItem(STORAGE_TAKEN);
      taken = raw ? JSON.parse(raw) : {};
      if (!taken || typeof taken !== "object") taken = {};
    } catch (e) {
      taken = {};
    }
    const t = todayKey();
    Object.keys(taken).forEach(function (k) {
      if (k !== t) delete taken[k];
    });
    saveTaken();
  }

  function saveTaken() {
    localStorage.setItem(STORAGE_TAKEN, JSON.stringify(taken));
  }

  function takenKey(medId, time) {
    return medId + "|" + time;
  }

  function isTaken(medId, time) {
    const day = taken[todayKey()] || {};
    return !!day[takenKey(medId, time)];
  }

  function setTaken(medId, time, value) {
    const t = todayKey();
    if (!taken[t]) taken[t] = {};
    const k = takenKey(medId, time);
    if (value) taken[t][k] = true;
    else delete taken[t][k];
    saveTaken();
  }

  function timeGreeting(d) {
    const h = d.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function setGreeting() {
    const el = document.getElementById("greeting");
    if (!el) return;
    el.textContent = timeGreeting(new Date()) + ", " + NAME + " — it's Ara";
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

  function parseTimes(times) {
    return (times || [])
      .map(function (t) { return String(t || "").trim(); })
      .filter(function (t) { return /^\d{2}:\d{2}$/.test(t); })
      .sort();
  }

  function formatTimeLabel(hhmm) {
    const parts = hhmm.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    return h + ":" + m + " " + ampm;
  }

  function minutesNow(d) {
    d = d || new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function timeToMinutes(hhmm) {
    const parts = hhmm.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function upcomingDoses() {
    const now = minutesNow();
    const list = [];
    meds.forEach(function (med) {
      parseTimes(med.times).forEach(function (t) {
        if (isTaken(med.id, t)) return;
        const mins = timeToMinutes(t);
        list.push({
          med: med,
          time: t,
          mins: mins,
          past: mins < now,
          delta: mins - now
        });
      });
    });
    list.sort(function (a, b) {
      if (a.past !== b.past) return a.past ? 1 : -1;
      return a.mins - b.mins;
    });
    return list;
  }

  function renderToday() {
    const nextEl = document.getElementById("next-due");
    const detailEl = document.getElementById("next-due-detail");
    const chips = document.getElementById("today-chips");
    if (!nextEl || !detailEl || !chips) return;

    const upcoming = upcomingDoses();
    chips.innerHTML = "";

    if (!meds.length) {
      nextEl.textContent = "No medicines yet";
      nextEl.className = "next-due is-quiet";
      detailEl.textContent = "Add one in Medicines when you're ready — Ara will keep watch.";
      const chip = document.createElement("span");
      chip.className = "chip chip-quiet";
      chip.textContent = "All quiet";
      chips.appendChild(chip);
      return;
    }

    if (!upcoming.length) {
      nextEl.textContent = "All done for today";
      nextEl.className = "next-due is-quiet";
      detailEl.textContent = "That's lovely. Rest easy — Ara's still here.";
      const chip = document.createElement("span");
      chip.className = "chip chip-quiet";
      chip.textContent = "All quiet";
      chips.appendChild(chip);
      return;
    }

    const next = upcoming[0];
    const label = next.med.name + " at " + formatTimeLabel(next.time);
    if (next.past) {
      nextEl.textContent = "Still due · " + label;
      detailEl.textContent = (next.med.dose ? next.med.dose + " · " : "") +
        "Whenever you're ready — no rush from Ara.";
    } else if (next.delta <= 30) {
      nextEl.textContent = "Due soon · " + label;
      detailEl.textContent = (next.med.dose ? next.med.dose + " · " : "") +
        "A gentle nudge when the time comes.";
    } else {
      nextEl.textContent = "Next · " + label;
      detailEl.textContent = (next.med.dose ? next.med.dose + " · " : "") +
        "I'll keep an eye on the clock for you.";
    }
    nextEl.className = "next-due";

    const chip = document.createElement("span");
    chip.className = "chip chip-due";
    chip.textContent = next.past ? "Still due" : (next.delta <= 30 ? "Due soon" : formatTimeLabel(next.time));
    chips.appendChild(chip);
  }

  function clearTimeRows() {
    const list = document.getElementById("times-list");
    if (list) list.innerHTML = "";
  }

  function addTimeRow(value) {
    const list = document.getElementById("times-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "time-row";
    const input = document.createElement("input");
    input.type = "time";
    input.required = true;
    input.value = value || "";
    input.setAttribute("aria-label", "Dose time");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-ghost btn-sm";
    remove.textContent = "Remove";
    remove.addEventListener("click", function () {
      if (list.children.length <= 1) {
        input.value = "";
        return;
      }
      row.remove();
    });
    row.appendChild(input);
    row.appendChild(remove);
    list.appendChild(row);
  }

  function openForm(med) {
    const formCard = document.getElementById("med-form");
    const title = document.getElementById("med-form-title");
    const idEl = document.getElementById("med-id");
    const nameEl = document.getElementById("med-name");
    const doseEl = document.getElementById("med-dose");
    editingId = med ? med.id : null;
    idEl.value = editingId || "";
    nameEl.value = med ? med.name : "";
    doseEl.value = med ? (med.dose || "") : "";
    title.textContent = med ? "Edit medicine" : "Add medicine";
    clearTimeRows();
    const times = med && med.times && med.times.length ? med.times : ["08:00"];
    times.forEach(addTimeRow);
    formCard.hidden = false;
    nameEl.focus();
  }

  function closeForm() {
    document.getElementById("med-form").hidden = true;
    editingId = null;
    document.getElementById("form-med").reset();
    clearTimeRows();
  }

  function collectFormTimes() {
    const inputs = document.querySelectorAll("#times-list input[type=time]");
    const times = [];
    inputs.forEach(function (inp) {
      if (inp.value) times.push(inp.value);
    });
    return parseTimes(times);
  }

  function renderMeds() {
    const list = document.getElementById("med-list");
    if (!list) return;
    list.innerHTML = "";

    if (!meds.length) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "No medicines yet. Tap Add medicine when you're ready — Ara will remember.";
      list.appendChild(empty);
      return;
    }

    meds.forEach(function (med) {
      const li = document.createElement("li");
      li.className = "med-card";

      const head = document.createElement("div");
      head.className = "med-card-head";

      const info = document.createElement("div");
      const name = document.createElement("p");
      name.className = "med-name";
      name.textContent = med.name;
      info.appendChild(name);
      if (med.dose) {
        const dose = document.createElement("p");
        dose.className = "med-dose";
        dose.textContent = med.dose;
        info.appendChild(dose);
      }
      head.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "med-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-ghost btn-sm";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () { openForm(med); });
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.textContent = "Remove";
      delBtn.addEventListener("click", function () {
        if (!confirm("Remove " + med.name + "?")) return;
        meds = meds.filter(function (m) { return m.id !== med.id; });
        saveMeds();
        refreshAll();
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      head.appendChild(actions);
      li.appendChild(head);

      parseTimes(med.times).forEach(function (t) {
        const row = document.createElement("div");
        row.className = "dose-row";
        const timeEl = document.createElement("span");
        timeEl.className = "dose-time";
        timeEl.textContent = formatTimeLabel(t);
        const label = document.createElement("label");
        label.className = "dose-check" + (isTaken(med.id, t) ? " is-done" : "");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = isTaken(med.id, t);
        cb.setAttribute("aria-label", "Taken " + med.name + " at " + formatTimeLabel(t));
        cb.addEventListener("change", function () {
          setTaken(med.id, t, cb.checked);
          label.classList.toggle("is-done", cb.checked);
          renderToday();
          scheduleAlarms();
        });
        const span = document.createElement("span");
        span.textContent = cb.checked ? "Taken" : "Mark taken";
        label.appendChild(cb);
        label.appendChild(span);
        row.appendChild(timeEl);
        row.appendChild(label);
        li.appendChild(row);
      });

      list.appendChild(li);
    });
  }

  function updateAlarmStatus() {
    const el = document.getElementById("alarms-status");
    const btn = document.getElementById("btn-enable-alarms");
    if (!el) return;
    if (!("Notification" in window)) {
      el.textContent = "This browser doesn't support notifications. Ara will still show what's next on Today.";
      el.className = "alarms-status is-denied";
      if (btn) btn.hidden = true;
      return;
    }
    const perm = Notification.permission;
    if (perm === "granted") {
      el.textContent = "Reminders are on while Keeper is open. Ara will whisper when a dose is due.";
      el.className = "alarms-status is-granted";
      if (btn) btn.textContent = "Reminders allowed";
    } else if (perm === "denied") {
      el.textContent = "Notifications are blocked. You can still tick doses here; to allow alerts, check your browser or phone settings for this site.";
      el.className = "alarms-status is-denied";
      if (btn) btn.textContent = "How to allow";
    } else {
      el.textContent = "Reminders are off for now. Tap Allow reminders when you're ready.";
      el.className = "alarms-status";
      if (btn) btn.textContent = "Allow reminders";
    }
  }

  function clearAlarmTimers() {
    alarmTimers.forEach(function (id) { clearTimeout(id); });
    alarmTimers = [];
  }

  function fireNotification(title, body, tag) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    function showViaSW() {
      if (!navigator.serviceWorker || !navigator.serviceWorker.ready) return Promise.reject();
      return navigator.serviceWorker.ready.then(function (reg) {
        if (!reg.showNotification) return Promise.reject();
        return reg.showNotification(title, {
          body: body,
          tag: tag || "nk-med",
          renotify: true,
          icon: "assets/icon.svg",
          badge: "assets/icon.svg"
        });
      });
    }

    showViaSW().catch(function () {
      try {
        new Notification(title, { body: body, tag: tag || "nk-med" });
      } catch (e) { /* ignore */ }
    });
  }

  function scheduleAlarms() {
    clearAlarmTimers();
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const nowMins = minutesNow(now);
    const msPerMin = 60 * 1000;

    meds.forEach(function (med) {
      parseTimes(med.times).forEach(function (t) {
        if (isTaken(med.id, t)) return;
        const mins = timeToMinutes(t);
        let delayMins = mins - nowMins;
        if (delayMins < 0) return;
        let delayMs = delayMins * msPerMin - now.getSeconds() * 1000 - now.getMilliseconds();
        if (delayMs < 500) delayMs = 500;
        if (delayMs > 6 * 60 * 60 * 1000) return;

        const id = setTimeout(function () {
          if (isTaken(med.id, t)) return;
          const body = (med.dose ? med.dose + " · " : "") +
            "It's time, " + NAME + ". When you're ready — Ara.";
          fireNotification(med.name, body, "nk-" + med.id + "-" + t);
          renderToday();
        }, delayMs);
        alarmTimers.push(id);
      });
    });
  }

  function requestAlarms() {
    if (!("Notification" in window)) {
      updateAlarmStatus();
      return;
    }
    if (Notification.permission === "granted") {
      updateAlarmStatus();
      scheduleAlarms();
      return;
    }
    if (Notification.permission === "denied") {
      updateAlarmStatus();
      alert("Notifications are blocked for this site.\n\nOn iPhone Safari: Settings → Safari → … or the site settings AA menu.\nOn Android Chrome: tap the lock/info icon in the address bar → Permissions → Notifications.\n\nAra can still show what's next on Today.");
      return;
    }
    Notification.requestPermission().then(function () {
      updateAlarmStatus();
      scheduleAlarms();
    });
  }

  function refreshAll() {
    renderMeds();
    renderToday();
    scheduleAlarms();
    updateAlarmStatus();
  }

  document.querySelectorAll(".dock-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showPanel(btn.getAttribute("data-panel"));
    });
  });

  document.getElementById("btn-add-med").addEventListener("click", function () {
    openForm(null);
  });
  document.getElementById("btn-cancel-med").addEventListener("click", closeForm);
  document.getElementById("btn-add-time").addEventListener("click", function () {
    addTimeRow("12:00");
  });
  document.getElementById("btn-enable-alarms").addEventListener("click", requestAlarms);

  document.getElementById("form-med").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("med-name").value.trim();
    const dose = document.getElementById("med-dose").value.trim();
    const times = collectFormTimes();
    if (!name) return;
    if (!times.length) {
      alert("Please add at least one time.");
      return;
    }
    if (editingId) {
      meds = meds.map(function (m) {
        if (m.id !== editingId) return m;
        return { id: m.id, name: name, dose: dose, times: times };
      });
    } else {
      meds.push({ id: uid(), name: name, dose: dose, times: times });
    }
    saveMeds();
    closeForm();
    refreshAll();
  });

  loadMeds();
  loadTaken();
  setGreeting();
  refreshAll();
  setInterval(setGreeting, 60 * 1000);
  setInterval(function () {
    renderToday();
    scheduleAlarms();
  }, 60 * 1000);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
