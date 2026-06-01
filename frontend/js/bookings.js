/* =========================================================
   bookings.js — booking history from real backend API.
   ========================================================= */
(function () {
  mountShell("bookings");

  if (!Auth.isLoggedIn()) { location.href = "login.html"; return; }

  let activeFilter = "all";
  let allBookings  = [];

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  async function loadBookings() {
    try {
      const res  = await apiFetch("/api/bookings");
      const data = await res.json();
      allBookings = data.map(b => ({
        ref:      b.booking_reference,
        type:     "flight",
        status:   b.status,
        airline:  b.flight_number ? b.flight_number.slice(0, 2) : "TG",
        flightNo: b.flight_number,
        from:     b.origin_code,
        to:       b.destination_code,
        date:     b.departure_time ? b.departure_time.slice(0, 10) : "",
        dep:      b.departure_time ? fmtTime(b.departure_time) : "—",
        arr:      "—",
        duration: 0,
        passengers: 1,
        cls:      "Economy",
        seat:     "—",
        gate:     "—",
        total:    b.total_price,
        _id:      b.id,
      }));
    } catch (e) { console.error("Failed to load bookings:", e); }
    render();
  }

  const statusMap = {
    confirmed: { cls: "status-confirmed", key: "st.confirmed", group: "upcoming" },
    pending:   { cls: "status-pending",   key: "st.pending",   group: "upcoming" },
    completed: { cls: "status-completed", key: "st.completed", group: "completed" },
    cancelled: { cls: "status-cancelled", key: "st.cancelled", group: "cancelled" },
  };

  function render() {
    const lang = I18nStore.get();
    const list = allBookings.filter(b => {
      if (activeFilter === "all") return true;
      return statusMap[b.status]?.group === activeFilter;
    });

    const wrap = document.getElementById("bookingList");
    if (!list.length) {
      wrap.innerHTML = `<div class="empty-state">${ICONS.ticket}<h3 data-i18n="bk.empty"></h3></div>`;
      applyI18n();
      return;
    }

    wrap.innerHTML = list.map(b => {
      const st = statusMap[b.status] || statusMap.completed;
      const isCar = b.type === "car";
      const title = isCar ? (b.brand || "Car rental") : (AIRLINES[b.airline]?.name || b.airline);
      const typeIc = isCar ? ICONS.car : ICONS.plane;
      const fromCity = cityName(b.from, lang);
      const toCity = isCar ? fromCity : cityName(b.to, lang);
      return `
      <article class="booking-item">
        <div class="bi-head">
          <div class="bi-ref">
            <span class="type-ic">${typeIc}</span>
            <div>
              <div class="code">${title} · ${b.flightNo || b.carType || ""}</div>
              <div class="date">${t("bk.ref")}: ${b.ref} · ${fmtDate(b.date, lang)}</div>
            </div>
          </div>
          <span class="status ${st.cls}">${t(st.key)}</span>
        </div>

        <div class="bi-body">
          <div class="bi-route">
            <div class="bi-point">
              <div class="city">${b.from}</div>
              <div class="ap">${fromCity}</div>
              <div class="t">${b.dep}</div>
            </div>
            ${isCar ? "" : `
            <div class="bi-path">
              <div class="dur">${fmtDuration(b.duration, lang)}</div>
              <div class="track"></div>
              <div class="dur">${b.from} – ${b.to}</div>
            </div>
            <div class="bi-point" style="text-align:right">
              <div class="city">${b.to}</div>
              <div class="ap">${toCity}</div>
              <div class="t">${b.arr}</div>
            </div>`}
          </div>
          <div class="bi-meta">
            <div><div class="k">${t("bk.passengers")}</div><div class="v">${b.passengers}</div></div>
            <div><div class="k">${t("bk.class")}</div><div class="v">${b.cls}</div></div>
            ${isCar ? "" : `<div><div class="k">${t("bk.seat")}</div><div class="v">${b.seat}</div></div>`}
            <div><div class="k">${t("bk.total")}</div><div class="v">${fmtBaht(b.total)}</div></div>
          </div>
        </div>

        <div class="bi-actions">
          ${b.status === "cancelled"
            ? `<button class="btn btn-dark" data-i18n="bk.rebook"></button>`
            : `<button class="btn btn-dark" data-i18n="bk.viewticket"></button>
               <button class="btn btn-light" data-i18n="bk.manage"></button>`}
        </div>
      </article>`;
    }).join("");
    applyI18n();
  }

  // filter tabs via event delegation
  document.getElementById("bookFilters").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    document.querySelectorAll("#bookFilters button").forEach(b => b.classList.toggle("active", b === btn));
    render();
  });

  // cancel button handler
  document.getElementById("bookingList").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-cancel]");
    if (!btn) return;
    if (!confirm("Cancel this booking?")) return;
    const id = btn.dataset.cancel;
    await apiFetch(`/api/bookings/${id}`, { method: "DELETE" });
    await loadBookings();
  });

  loadBookings();
  document.addEventListener("languagechange", render);
})();
