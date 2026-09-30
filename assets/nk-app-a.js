(function () {
  const NAME = "Narelle";
  const STORAGE_MEDS = "nk.medicines.v1";
  const STORAGE_TAKEN = "nk.taken.v1";
  const STORAGE_APPTS = "nk.appointments.v1";
  const STORAGE_BRING = "nk.apptBring.v1";
  const STORAGE_WELCOME = "nk.welcomeSeen.v1";
  let meds = [];
  let taken = {};
  let appts = [];
  let bringDone = {};
  let alarmTimers = [];
  let editingId = null;
  let editingApptId = null;

  function uid(prefix) {
    return (prefix || "m") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

  function loadAppts() {
    try {
      const raw = localStorage.getItem(STORAGE_APPTS);
      appts = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(appts)) appts = [];
    } catch (e) {
      appts = [];
    }
  }

  function saveAppts() {
    localStorage.setItem(STORAGE_APPTS, JSON.stringify(appts));
  }

  function loadBringDone() {
    try {
      const raw = localStorage.getItem(STORAGE_BRING);
      bringDone = raw ? JSON.parse(raw) : {};
      if (!bringDone || typeof bringDone !== "object") bringDone = {};
    } catch (e) {
      bringDone = {};
    }
  }

  function saveBringDone() {
    localStorage.setItem(STORAGE_BRING, JSON.stringify(bringDone));
  }

  function isBringDone(apptId, item) {
    const bag = bringDone[apptId] || {};
    return !!bag[item];
  }

  function setBringDone(apptId, item, value) {
    if (!bringDone[apptId]) bringDone[apptId] = {};
    if (value) bringDone[apptId][item] = true;
    else delete bringDone[apptId][item];
    saveBringDone();
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
    if (!hhmm) return "";
    const parts = hhmm.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    return h + ":" + m + " " + ampm;
  }

  function formatDateLabel(ymd) {
    if (!ymd) return "";
    const parts = ymd.split("-");
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = todayKey();
    const tomorrow = todayKey(new Date(Date.now() + 86400000));
    if (ymd === today) return "Today";
    if (ymd === tomorrow) return "Tomorrow";
    try {
      return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    } catch (e) {
      return ymd;
    }
  }

  function minutesNow(d) {
    d = d || new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function timeToMinutes(hhmm) {
    const parts = hhmm.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function apptDateTime(appt) {
    const parts = (appt.date || "").split("-");
    const t = (appt.time || "00:00").split(":");
    return new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10),
      parseInt(t[0], 10),
      parseInt(t[1], 10),
      0,
      0
    );
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

  function upcomingAppts() {
    const now = Date.now();
    const list = appts.slice().map(function (a) {
      const dt = apptDateTime(a);
      const ms = dt.getTime();
      return { appt: a, dt: dt, ms: ms, past: ms < now, delta: ms - now };
    });
    list.sort(function (a, b) {
      if (a.past !== b.past) return a.past ? 1 : -1;
      return a.ms - b.ms;
    });
    return list;
  }

  function nextFutureAppt() {
    const list = upcomingAppts().filter(function (x) { return !x.past; });
    return list.length ? list[0] : null;
  }

  function wirePhotoSlots() {
    document.querySelectorAll(".photo-slot img").forEach(function (img) {
      function mark() {
        const slot = img.closest(".photo-slot");
        if (!slot) return;
        if (img.complete && img.naturalWidth > 0 && !img.hidden) {
          slot.classList.add("has-image");
        }
      }
      img.addEventListener("load", mark);
      mark();
    });
  }

  function initWelcome() {
    const splash = document.getElementById("welcome-splash");
    if (!splash) return;
    let seen = false;
    try { seen = sessionStorage.getItem(STORAGE_WELCOME) === "1"; } catch (e) {}
    if (seen) {
      splash.hidden = true;
      return;
    }
    splash.hidden = false;
    const btn = document.getElementById("btn-enter-today");
    if (btn) {
      btn.addEventListener("click", function () {
        splash.hidden = true;
        try { sessionStorage.setItem(STORAGE_WELCOME, "1"); } catch (e) {}
        showPanel("today");
      });
    }
  }

  function renderToday() {
    const nextEl = document.getElementById("next-due");
    const detailEl = document.getElementById("next-due-detail");
    const apptEl = document.getElementById("next-appt");
    const apptDetail = document.getElementById("next-appt-detail");
    const chips = document.getElementById("today-chips");
    if (!nextEl || !detailEl || !chips) return;
    const upcoming = upcomingDoses();
    chips.innerHTML = "";
    if (!meds.length) {
      nextEl.textContent = "No medicines yet";
      nextEl.className = "next-due is-quiet";
      detailEl.textContent = "Add one in Medicines when you're ready — Ara will keep watch.";
    } else if (!upcoming.length) {
      nextEl.textContent = "All done for today";
      nextEl.className = "next-due is-quiet";
      detailEl.textContent = "That's lovely. Rest easy — Ara's still here.";
    } else {
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
    if (!meds.length || !upcoming.length) {
      const chip = document.createElement("span");
      chip.className = "chip chip-quiet";
      chip.textContent = "Meds quiet";
      chips.appendChild(chip);
    }
    if (apptEl && apptDetail) {
      const nextA = nextFutureAppt();
      if (!appts.length) {
        apptEl.textContent = "Nothing booked yet";
        apptEl.className = "next-due is-quiet";
        apptDetail.textContent = "Add one in Appointments when you like.";
      } else if (!nextA) {
        apptEl.textContent = "No upcoming appointments";
        apptEl.className = "next-due is-quiet";
        apptDetail.textContent = "Past ones stay in the Appointments room.";
      } else {
        const a = nextA.appt;
        apptEl.textContent = formatDateLabel(a.date) + " · " + formatTimeLabel(a.time);
        apptEl.className = "next-due";
        const bits = [];
        if (a.doctor) bits.push(a.doctor);
        if (a.place) bits.push(a.place);
        apptDetail.textContent = bits.join(" · ") || "Ara will remind you while Keeper is open.";
        const chip = document.createElement("span");
        chip.className = "chip chip-appt";
        chip.textContent = formatDateLabel(a.date);
        chips.appendChild(chip);
      }
    }
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

