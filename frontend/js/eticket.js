/* =========================================================
   eticket.js — boarding-pass style e-ticket.
   Reads ?id= and fetches the full booking detail from
   GET /api/bookings/:id (owner-only, enforced server-side).
   ========================================================= */
(async function () {
  mountShell("bookings");

  const root = document.getElementById("ticketRoot");
  if (!Auth.isLoggedIn()) { location.href = "login.html"; return; }

  const id = new URLSearchParams(location.search).get("id");

  const timeOf = (dt) => (dt || "").slice(11, 16);
  const dateOf = (dt) => (dt || "").slice(0, 10);

  function errorState() {
    root.innerHTML = `<div class="empty-state">${ICONS.ticket}
      <h3 data-i18n="et.notfound"></h3>
      <p><a class="btn btn-dark" href="bookings.html" data-i18n="et.back"></a></p>
    </div>`;
    applyI18n();
  }

  let b;
  try {
    const res = await apiFetch(`/api/bookings/${id}`);
    if (!res.ok) return errorState();
    b = await res.json();
  } catch { return errorState(); }

  const statusKey = {
    confirmed: "st.confirmed", pending: "st.pending",
    completed: "st.completed", cancelled: "st.cancelled",
  }[b.status] || "st.confirmed";

  function render() {
    const lang = I18nStore.get();
    const al = AIRLINES[b.airline_code] || { name: b.airline_name || b.airline_code };
    const paxNames = b.passengers.map(p => `${p.first_name} ${p.last_name}`).join(", ");
    const seats = b.passengers.map(p => p.seat_number).filter(Boolean).join(", ") || "—";

    root.innerHTML = `
    <div class="ticket-actions no-print">
      <button class="btn btn-dark" id="printBtn">${ICONS.ticket}<span data-i18n="et.print"></span></button>
      <a class="btn btn-light" href="bookings.html" data-i18n="et.back"></a>
    </div>

    <div class="boarding-pass">
      <div class="bp-main">
        <div class="bp-top">
          <div class="bp-brand">${ICONS.planeUp}<span>AERIS</span></div>
          <span class="status ${"status-" + b.status}">${t(statusKey)}</span>
        </div>

        <div class="bp-route">
          <div class="bp-end">
            <div class="bp-code">${b.origin_code}</div>
            <div class="bp-city">${cityName(b.origin_code, lang)}</div>
            <div class="bp-time">${timeOf(b.departure_time)}</div>
          </div>
          <div class="bp-mid">
            <div class="bp-plane">${ICONS.plane}</div>
            <div class="bp-dur">${fmtDuration(b.duration, lang)}</div>
          </div>
          <div class="bp-end bp-end-r">
            <div class="bp-code">${b.destination_code}</div>
            <div class="bp-city">${cityName(b.destination_code, lang)}</div>
            <div class="bp-time">${timeOf(b.arrival_time)}</div>
          </div>
        </div>

        <div class="bp-grid">
          <div><div class="k" data-i18n="et.passenger"></div><div class="v">${paxNames || "—"}</div></div>
          <div><div class="k" data-i18n="et.flight"></div><div class="v">${al.name} · ${b.flight_number}</div></div>
          <div><div class="k" data-i18n="et.date"></div><div class="v">${fmtDate(dateOf(b.departure_time), lang)}</div></div>
          <div><div class="k" data-i18n="bk.class"></div><div class="v">${b.cabin_class}</div></div>
          <div><div class="k" data-i18n="bk.seat"></div><div class="v">${seats}</div></div>
          <div><div class="k" data-i18n="bk.gate"></div><div class="v">${b.gate || "—"}</div></div>
        </div>
      </div>

      <div class="bp-stub">
        <div class="bp-stub-row"><span class="k" data-i18n="bk.ref"></span><span class="v">${b.booking_reference}</span></div>
        <div class="bp-stub-row"><span class="k" data-i18n="et.from"></span><span class="v">${b.origin_code} → ${b.destination_code}</span></div>
        <div class="bp-stub-row"><span class="k" data-i18n="bk.seat"></span><span class="v">${seats}</span></div>
        <div class="bp-stub-row"><span class="k" data-i18n="bk.gate"></span><span class="v">${b.gate || "—"}</span></div>
        <div class="bp-stub-row"><span class="k" data-i18n="bk.total"></span><span class="v">${fmtBaht(b.total_price)}</span></div>
        <div class="bp-barcode" aria-hidden="true"></div>
        <div class="bp-ref">${b.booking_reference}</div>
      </div>
    </div>`;
    applyI18n();
  }

  root.addEventListener("click", (e) => {
    if (e.target.closest("#printBtn")) window.print();
  });

  render();
  document.addEventListener("languagechange", render);
})();
