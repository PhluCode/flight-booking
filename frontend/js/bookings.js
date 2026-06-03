/* =========================================================
   bookings.js — booking history from real backend API.
   ========================================================= */
(function () {
  mountShell("bookings");

  if (!Auth.isLoggedIn()) { location.href = "login.html"; return; }

  let activeFilter = "upcoming";
  let allBookings  = [];

  async function loadBookings() {
    try {
      const res  = await apiFetch("/api/bookings");
      const data = await res.json();
      allBookings = data.map(b => ({
        ref:      b.booking_reference,
        type:     "flight",
        status:   b.status,
        airline:  b.airline_code || (b.flight_number ? b.flight_number.slice(0, 2) : "TG"),
        flightNo: b.flight_number,
        from:     b.origin_code,
        to:       b.destination_code,
        date:     b.departure_time ? b.departure_time.slice(0, 10) : "",
        dep:      b.departure_time ? b.departure_time.slice(11, 16) : "—",
        arr:      b.arrival_time ? b.arrival_time.slice(11, 16) : "—",
        duration: b.duration || 0,
        passengers: b.passenger_count || 1,
        cls:      b.cabin_class || "Economy",
        seat:     b.seat || "—",
        gate:     b.gate || "—",
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
    let list = allBookings.filter(b => statusMap[b.status]?.group === activeFilter);

    // sort upcoming by nearest departure date first
    if (activeFilter === "upcoming") {
      list = list.slice().sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );
    }

    const wrap = document.getElementById("bookingList");
    if (!list.length) {
      wrap.innerHTML = `<div class="empty-state">${ICONS.ticket}<h3 data-i18n="bk.empty"></h3></div>`;
      applyI18n();
      return;
    }

    // each booking → a route-titled group with one card (Agoda-style)
    wrap.innerHTML = list.map(b => {
      const st = statusMap[b.status] || statusMap.completed;
      const airline = AIRLINES[b.airline]?.name || b.airline;
      const fromCity = cityName(b.from, lang);
      const toCity = cityName(b.to, lang);
      return `
      <section class="bk-group">
        <div class="bk-group-head">
          <h3>${fromCity} - ${toCity}</h3>
          <div class="date">${fmtDate(b.date, lang)}</div>
        </div>
        <article class="bk-card">
          <div class="bk-card-top">
            <span class="bk-id">${t("bk.ref")}: ${b.ref}</span>
            <span class="status ${st.cls}">${t(st.key)}</span>
          </div>
          <div class="bk-card-body">
            <div class="airline-logo">${ICONS.plane}</div>
            <div class="bk-route">
              <div class="bk-end">
                <div class="city">${fromCity} <span class="muted">(${b.from})</span></div>
                <div class="t">${b.dep}</div>
              </div>
              <div class="bk-arrow">
                <div class="dur">${fmtDuration(b.duration, lang)}</div>
                <div class="line"></div>
                <div class="muted">${airline} · ${b.flightNo || ""}</div>
              </div>
              <div class="bk-end bk-end-r">
                <div class="city">${toCity} <span class="muted">(${b.to})</span></div>
                <div class="t">${b.arr}</div>
              </div>
            </div>
            <div class="bk-meta">
              <div><div class="k">${t("bk.class")}</div><div class="v">${b.cls}</div></div>
              <div><div class="k">${t("bk.seat")}</div><div class="v">${b.seat}</div></div>
              <div><div class="k">${t("bk.passengers")}</div><div class="v">${b.passengers}</div></div>
              <div><div class="k">${t("bk.total")}</div><div class="v">${fmtBaht(b.total)}</div></div>
            </div>
          </div>
          <div class="bk-card-actions">
            ${b.status === "cancelled"
              ? `<a class="btn btn-dark" href="flights.html" data-i18n="bk.rebook"></a>`
              : `<button class="btn btn-dark" data-ticket="${b._id}" data-i18n="bk.viewticket"></button>
                 <button class="btn btn-light" data-cancel="${b._id}" data-i18n="bk.manage"></button>`}
          </div>
        </article>
      </section>`;
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

  // view e-ticket + cancel handlers (event delegation)
  document.getElementById("bookingList").addEventListener("click", async (e) => {
    const ticketBtn = e.target.closest("[data-ticket]");
    if (ticketBtn) { location.href = "eticket.html?id=" + ticketBtn.dataset.ticket; return; }

    const btn = e.target.closest("[data-cancel]");
    if (!btn) return;
    if (!confirm(t("bk.confirmcancel"))) return;
    const id = btn.dataset.cancel;
    await apiFetch(`/api/bookings/${id}`, { method: "DELETE" });
    await loadBookings();
  });

  loadBookings();
  document.addEventListener("languagechange", render);
})();
