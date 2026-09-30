  /* —— Appointments —— */
  function clearBringRows() {
    const list = document.getElementById("bring-list");
    if (list) list.innerHTML = "";
  }

  function addBringRow(value) {
    const list = document.getElementById("bring-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "bring-edit-row";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 80;
    input.placeholder = "e.g. Medicare card";
    input.value = value || "";
    input.setAttribute("aria-label", "What to bring");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-ghost btn-sm";
    remove.textContent = "Remove";
    remove.addEventListener("click", function () { row.remove(); });
    row.appendChild(input);
    row.appendChild(remove);
    list.appendChild(row);
  }

  function collectBringItems() {
    const inputs = document.querySelectorAll("#bring-list input[type=text]");
    const items = [];
    inputs.forEach(function (inp) {
      const v = inp.value.trim();
      if (v) items.push(v);
    });
    return items;
  }

  function openApptForm(appt) {
    const formCard = document.getElementById("appt-form");
    const title = document.getElementById("appt-form-title");
    editingApptId = appt ? appt.id : null;
    document.getElementById("appt-id").value = editingApptId || "";
    document.getElementById("appt-date").value = appt ? appt.date : "";
    document.getElementById("appt-time").value = appt ? appt.time : "";
    document.getElementById("appt-doctor").value = appt ? (appt.doctor || "") : "";
    document.getElementById("appt-place").value = appt ? (appt.place || "") : "";
    document.getElementById("appt-notes").value = appt ? (appt.notes || "") : "";
    title.textContent = appt ? "Edit appointment" : "Add appointment";
    clearBringRows();
    const items = appt && appt.bring && appt.bring.length ? appt.bring : [];
    if (items.length) items.forEach(addBringRow);
    else addBringRow("");
    formCard.hidden = false;
    document.getElementById("appt-date").focus();
  }

  function closeApptForm() {
    document.getElementById("appt-form").hidden = true;
    editingApptId = null;
    document.getElementById("form-appt").reset();
    clearBringRows();
  }

  function renderAppts() {
    const list = document.getElementById("appt-list");
    if (!list) return;
    list.innerHTML = "";

    if (!appts.length) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "No appointments yet. Tap Add appointment when you're ready.";
      list.appendChild(empty);
      return;
    }

    const sorted = upcomingAppts();
    sorted.forEach(function (entry) {
      const appt = entry.appt;
      const li = document.createElement("li");
      li.className = "appt-card";

      const head = document.createElement("div");
      head.className = "appt-card-head";

      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "appt-title";
      title.textContent = appt.doctor || "Appointment";
      info.appendChild(title);
      const when = document.createElement("p");
      when.className = "appt-when";
      when.textContent = formatDateLabel(appt.date) + " · " + formatTimeLabel(appt.time) +
        (entry.past ? " · past" : "");
      info.appendChild(when);
      if (appt.place) {
        const place = document.createElement("p");
        place.className = "appt-meta";
        place.textContent = appt.place;
        info.appendChild(place);
      }
      if (appt.notes) {
        const notes = document.createElement("p");
        notes.className = "appt-meta";
        notes.textContent = appt.notes;
        info.appendChild(notes);
      }
      head.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "appt-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-ghost btn-sm";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () { openApptForm(appt); });
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.textContent = "Remove";
      delBtn.addEventListener("click", function () {
        if (!confirm("Remove appointment with " + (appt.doctor || "this provider") + "?")) return;
        appts = appts.filter(function (a) { return a.id !== appt.id; });
        delete bringDone[appt.id];
        saveAppts();
        saveBringDone();
        refreshAll();
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      head.appendChild(actions);
      li.appendChild(head);

      const bring = appt.bring || [];
      if (bring.length) {
        const label = document.createElement("p");
        label.className = "bring-list-label";
        label.textContent = "What to bring";
        li.appendChild(label);
        bring.forEach(function (item) {
          const row = document.createElement("div");
          row.className = "bring-row";
          const lab = document.createElement("label");
          lab.className = "bring-check" + (isBringDone(appt.id, item) ? " is-done" : "");
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = isBringDone(appt.id, item);
          cb.setAttribute("aria-label", "Packed " + item);
          cb.addEventListener("change", function () {
            setBringDone(appt.id, item, cb.checked);
            lab.classList.toggle("is-done", cb.checked);
          });
          const span = document.createElement("span");
          span.textContent = item;
          lab.appendChild(cb);
          lab.appendChild(span);
          row.appendChild(lab);
          li.appendChild(row);
        });
      }

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
      el.textContent = "Reminders are on while Keeper is open. Ara will whisper for doses and appointments.";
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
    const nowMs = now.getTime();

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

    appts.forEach(function (appt) {
      const dt = apptDateTime(appt);
      const atMs = dt.getTime();
      const offsets = [
        { label: "1 hour", ms: 60 * 60 * 1000 },
        { label: "now", ms: 0 }
      ];
      offsets.forEach(function (off) {
        const fireAt = atMs - off.ms;
        let delayMs = fireAt - nowMs;
        if (delayMs < 0) return;
        if (delayMs > 6 * 60 * 60 * 1000) return;
        if (delayMs < 500) delayMs = 500;
        const id = setTimeout(function () {
          const when = formatDateLabel(appt.date) + " · " + formatTimeLabel(appt.time);
          const place = appt.place ? " · " + appt.place : "";
          const title = off.ms === 0
            ? (appt.doctor || "Appointment")
            : "Soon · " + (appt.doctor || "Appointment");
          const body = off.ms === 0
            ? when + place + " — Ara is with you."
            : "In about an hour: " + when + place;
          fireNotification(title, body, "nk-appt-" + appt.id + "-" + off.ms);
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
    renderAppts();
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
      meds.push({ id: uid("m"), name: name, dose: dose, times: times });
    }
    saveMeds();
    closeForm();
    refreshAll();
  });

  document.getElementById("btn-add-appt").addEventListener("click", function () {
    openApptForm(null);
  });
  document.getElementById("btn-cancel-appt").addEventListener("click", closeApptForm);
  document.getElementById("btn-add-bring").addEventListener("click", function () {
    addBringRow("");
  });

  document.getElementById("form-appt").addEventListener("submit", function (e) {
    e.preventDefault();
    const date = document.getElementById("appt-date").value;
    const time = document.getElementById("appt-time").value;
    const doctor = document.getElementById("appt-doctor").value.trim();
    const place = document.getElementById("appt-place").value.trim();
    const notes = document.getElementById("appt-notes").value.trim();
    const bring = collectBringItems();
    if (!date || !time || !doctor) return;
    const record = {
      id: editingApptId || uid("a"),
      date: date,
      time: time,
      doctor: doctor,
      place: place,
      notes: notes,
      bring: bring
    };
    if (editingApptId) {
      appts = appts.map(function (a) {
        return a.id === editingApptId ? record : a;
      });
    } else {
      appts.push(record);
    }
    saveAppts();
    closeApptForm();
    refreshAll();
  });

  loadMeds();
  loadTaken();
  loadAppts();
  loadBringDone();
  setGreeting();
  initWelcome();
  wirePhotoSlots();
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
