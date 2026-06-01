/* =========================================================
   checkout.js — Agoda-style checkout (one-way or round-trip).
   Flight summary → passenger details → seat selection (per leg)
   → (simulated) payment → POST /api/bookings → e-ticket.
   "Bypass the payment process": the card form is validated
   client-side but no real charge happens. The server
   (Gatekeeper) re-computes price + re-checks seats.
   Round-trip = two bookings (outbound + return).
   ========================================================= */
(async function () {
  mountShell("flights");
  const root = document.getElementById("checkoutRoot");
  if (!Auth.isLoggedIn()) { location.href = "login.html"; return; }

  const qp = new URLSearchParams(location.search);
  const outId = qp.get("flight");
  const retId = qp.get("flight2");        // null for one-way
  const roundtrip = !!retId;
  const pax = Math.max(1, Math.min(6, parseInt(qp.get("pax"), 10) || 1));
  const cls = qp.get("cls") || "Economy";

  // saved payment method (from payment.html)
  let savedPay = {};
  try { savedPay = JSON.parse(localStorage.getItem("aeris_payment")) || {}; } catch {}

  const SEAT_PREMIUM = 1000;
  // side-profile seat icon for premium (purple) seats
  const SEAT_CHAIR = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 6a3 3 0 0 1 3 3v6h8a3 3 0 0 1 3 3v8h-4v-6a1 1 0 0 0-1-1h-9a3 3 0 0 1-3-3V6z"/></svg>`;

  const state = { paymentMethod: savedPay.method || "card" };
  // one leg per flight; each tracks its own seats + selection
  const legs = [{ key: "out", id: outId, labelKey: roundtrip ? "co.outbound" : "co.flight", flight: null, seats: [], selected: [] }];
  if (roundtrip) legs.push({ key: "ret", id: retId, labelKey: "co.return", flight: null, seats: [], selected: [] });

  const timeOf = (dt) => (dt || "").slice(11, 16);
  const dateOf = (dt) => (dt || "").slice(0, 10);

  function errorState(key) {
    root.innerHTML = `<div class="empty-state">${ICONS.plane}
      <h3 data-i18n="${key}"></h3>
      <p><a class="btn btn-dark" href="flights.html" data-i18n="co.backsearch"></a></p>
    </div>`;
    applyI18n();
  }

  /* ---- load every leg's flight + seats ---- */
  try {
    for (const leg of legs) {
      const [fRes, sRes] = await Promise.all([
        apiFetch(`/api/flights/${leg.id}`),
        apiFetch(`/api/flights/${leg.id}/seats`),
      ]);
      if (!fRes.ok) return errorState("co.notfound");
      leg.flight = await fRes.json();
      leg.seats  = sRes.ok ? await sRes.json() : [];
    }
  } catch { return errorState("co.notfound"); }

  /* ---------- renders ---------- */
  function flightSummary(leg) {
    const f = leg.flight, lang = I18nStore.get();
    const al = AIRLINES[f.airline_code] || { name: f.airline_name || f.airline_code };
    const stopsTxt = f.stops === 0 ? t("flight.nonstop") : t("flight.stop");
    return `
    <div class="co-flight">
      ${roundtrip ? `<span class="co-leg-tag" data-i18n="${leg.labelKey}"></span>` : ""}
      <div class="airline">
        <div class="airline-logo">${ICONS.plane}</div>
        <div><div class="name">${al.name}</div><div class="code">${f.flight_number} · ${cls}</div></div>
      </div>
      <div class="route">
        <div><div class="time">${timeOf(f.departure_time)}</div>
          <div class="ap">${f.origin_code} · ${cityName(f.origin_code, lang)}</div></div>
        <div class="mid"><div class="dur">${fmtDuration(f.duration, lang)}</div>
          <div class="line"></div><div class="stops">${stopsTxt}</div></div>
        <div class="col-r"><div class="time">${timeOf(f.arrival_time)}</div>
          <div class="ap">${f.destination_code} · ${cityName(f.destination_code, lang)}</div></div>
      </div>
      <div class="co-flight-meta">
        <span>${fmtDate(dateOf(f.departure_time), lang)}</span>
        <span><span data-i18n="bk.gate"></span>: ${f.gate || "—"}</span>
        <span><span data-i18n="bk.seat"></span>: ${leg.selected.join(", ") || "—"}</span>
      </div>
    </div>`;
  }

  function flightsCard() {
    return `
    <section class="co-card">
      <div class="co-step"><span class="co-num">1</span><h3 data-i18n="co.flight"></h3></div>
      ${legs.map(flightSummary).join('<div class="co-sep"></div>')}
    </section>`;
  }

  function passengerForms() {
    const me = Auth.get();
    let prof = {};
    try { prof = JSON.parse(localStorage.getItem("aeris_profile")) || {}; } catch {}
    const first = prof.firstName || (me?.name || "").split(" ")[0] || "";
    const last  = prof.lastName  || (me?.name || "").split(" ").slice(1).join(" ") || "";
    const passport = prof.passport || "";

    let rows = "";
    for (let i = 0; i < pax; i++) {
      const note = i === 0 && (prof.firstName || me?.name)
        ? `<span class="pax-auto" data-i18n="co.autofill"></span>` : "";
      rows += `
      <div class="pax-row" data-pax="${i}">
        <div class="pax-head"><span data-i18n="co.passenger"></span> ${i + 1} ${note}</div>
        <div class="pax-fields">
          <label class="fld"><span data-i18n="f.firstname"></span>
            <input class="p-first" value="${i === 0 ? first : ""}" autocomplete="off" /></label>
          <label class="fld"><span data-i18n="f.lastname"></span>
            <input class="p-last" value="${i === 0 ? last : ""}" autocomplete="off" /></label>
          <label class="fld"><span data-i18n="co.passport"></span>
            <input class="p-passport" value="${i === 0 ? passport : ""}" data-i18n-ph="co.passport.ph" autocomplete="off" /></label>
        </div>
        <div class="fld-err" data-err="${i}"></div>
      </div>`;
    }
    return `
    <section class="co-card">
      <div class="co-step"><span class="co-num">2</span><h3 data-i18n="co.passengers"></h3>
        <a class="co-editprofile no-print" href="profile.html" data-i18n="co.editprofile"></a></div>
      ${rows}
    </section>`;
  }

  function seatMapFor(leg) {
    if (!leg.seats.length) return `<div class="seat-leg"><p class="muted" data-i18n="co.noseats"></p></div>`;
    const byNo = {};
    leg.seats.forEach(s => { byNo[s.seat_number] = s; });
    const nums = [...new Set(leg.seats.map(s => parseInt(s.seat_number, 10)))].sort((a, b) => a - b);
    const top = ["K", "J", "H"], bottom = ["C", "B", "A"];   // airline-style lettering

    const cell = (n, letter) => {
      const s = byNo[`${n}${letter}`];
      if (!s) return `<span class="seat2 seat2-empty"></span>`;
      const premium = s.class === "business";
      const taken = s.status === "occupied";
      const seld = leg.selected.includes(s.seat_number);
      const cls = ["seat2", premium ? "seat2-prem" : "seat2-free",
        taken ? "seat2-taken" : "", seld ? "seat2-sel" : ""].join(" ").replace(/\s+/g, " ").trim();
      const title = s.seat_number + (premium ? " · +" + fmtBaht(SEAT_PREMIUM) : "");
      return `<button type="button" class="${cls}" ${taken ? "disabled" : ""}
        data-leg="${leg.key}" data-seat="${s.seat_number}" title="${title}">${premium ? SEAT_CHAIR : ""}</button>`;
    };
    const letterRow = (letter) =>
      `<div class="sm-row"><span class="sm-lbl">${letter}</span>${nums.map(n => cell(n, letter)).join("")}</div>`;

    return `
      <div class="seat-leg">
        ${roundtrip ? `<h4 class="seat-leg-title"><span data-i18n="${leg.labelKey}"></span>
          <span class="muted">${leg.flight.origin_code} → ${leg.flight.destination_code}</span></h4>` : ""}
        <div class="cabin">
          <div class="cabin-frame">
            <div class="exit-row exit-top"><span class="exit" data-i18n="co.exit"></span><span class="exit" data-i18n="co.exit"></span></div>
            <div class="seatmap">
              <div class="sm-row sm-numrow"><span class="sm-lbl"></span>${nums.map(n => `<span class="sm-num">${n}</span>`).join("")}</div>
              ${top.map(letterRow).join("")}
              <div class="sm-aisle"></div>
              ${bottom.map(letterRow).join("")}
            </div>
            <div class="exit-row exit-bot"><span class="exit" data-i18n="co.exit"></span><span class="exit" data-i18n="co.exit"></span></div>
          </div>
        </div>
      </div>`;
  }

  function seatsCard() {
    return `
    <section class="co-card">
      <div class="co-step"><span class="co-num">3</span><h3 data-i18n="co.seats"></h3></div>
      <p class="muted co-seat-hint"><span data-i18n="co.seathint"></span> <strong>${pax}</strong>${roundtrip ? ` <span data-i18n="co.seatperleg"></span>` : ""}</p>
      <div class="seat-legend">
        <span><i class="lg lg-free"></i><span data-i18n="co.seat.free"></span></span>
        <span><i class="lg lg-biz"></i><span data-i18n="co.seat.biz"></span></span>
        <span><i class="lg lg-sel"></i><span data-i18n="co.seat.sel"></span></span>
        <span><i class="lg lg-taken"></i><span data-i18n="co.seat.taken"></span></span>
      </div>
      ${legs.map(seatMapFor).join("")}
    </section>`;
  }

  function paymentForm() {
    const m = state.paymentMethod;
    const hasSaved = savedPay.method === "card" && savedPay.cardNumber;
    return `
    <section class="co-card">
      <div class="co-step"><span class="co-num">4</span><h3 data-i18n="co.payment"></h3>
        <a class="co-editprofile no-print" href="payment.html" data-i18n="co.managepay"></a></div>
      <p class="muted co-sim"><span data-i18n="co.simnote"></span></p>
      ${hasSaved ? `<p class="pax-auto" data-i18n="co.usesaved"></p>` : ""}
      <div class="pay-methods">
        <label class="pay-opt ${m === "card" ? "checked" : ""}" data-method="card">
          <span class="dot"></span><span data-i18n="co.pay.card"></span></label>
        <label class="pay-opt ${m === "promptpay" ? "checked" : ""}" data-method="promptpay">
          <span class="dot"></span><span data-i18n="co.pay.promptpay"></span></label>
      </div>
      <div id="cardFields" style="${m === "card" ? "" : "display:none"}">
        <label class="fld"><span data-i18n="co.card.name"></span>
          <input id="cardName" value="${savedPay.cardName || ""}" autocomplete="off" /></label>
        <label class="fld"><span data-i18n="co.card.number"></span>
          <input id="cardNumber" value="${savedPay.cardNumber || ""}" inputmode="numeric" maxlength="19" placeholder="4242 4242 4242 4242" autocomplete="off" /></label>
        <div class="pax-fields">
          <label class="fld"><span data-i18n="co.card.exp"></span>
            <input id="cardExp" value="${savedPay.exp || ""}" inputmode="numeric" maxlength="5" placeholder="MM/YY" autocomplete="off" /></label>
          <label class="fld"><span data-i18n="co.card.cvv"></span>
            <input id="cardCvv" inputmode="numeric" maxlength="4" placeholder="123" autocomplete="off" /></label>
        </div>
      </div>
      <div id="ppFields" style="${m === "promptpay" ? "" : "display:none"}">
        <div class="promptpay-box"><div class="pp-qr">${ICONS.status || ICONS.ticket}</div>
          <p class="muted" data-i18n="co.pp.note"></p></div>
      </div>
      <div class="fld-err" id="payErr"></div>
    </section>`;
  }

  function premiumCount(leg) {
    const cls = {};
    leg.seats.forEach(s => { cls[s.seat_number] = s.class; });
    return leg.selected.filter(sn => cls[sn] === "business").length;
  }

  function summary() {
    let fareSub = 0, seatFees = 0;
    const lines = legs.map(l => {
      const fare = l.flight.price * pax; fareSub += fare;
      return `<div class="sum-line"><span>${roundtrip ? t(l.labelKey) + " · " : ""}${l.flight.flight_number} × ${pax}</span>
        <span>${fmtBaht(fare)}</span></div>`;
    }).join("");
    legs.forEach(l => { seatFees += premiumCount(l) * SEAT_PREMIUM; });
    const total = fareSub + seatFees;
    return `
    <aside class="co-summary">
      <h3 data-i18n="co.summary"></h3>
      ${lines}
      ${seatFees > 0 ? `<div class="sum-line"><span data-i18n="co.seatfee"></span><span>+${fmtBaht(seatFees)}</span></div>` : ""}
      <div class="sum-line muted"><span data-i18n="co.taxes"></span><span data-i18n="co.included"></span></div>
      <div class="sum-total"><span data-i18n="bk.total"></span><span>${fmtBaht(total)}</span></div>
      <button class="btn btn-dark co-pay" id="payBtn" data-i18n="co.confirmpay"></button>
      <p class="muted co-secure">${ICONS.shield || ""}<span data-i18n="co.secure"></span></p>
    </aside>`;
  }

  function render() {
    root.innerHTML = `
      <div class="checkout-grid">
        <div class="checkout-main">
          ${flightsCard()}
          ${passengerForms()}
          ${seatsCard()}
          ${paymentForm()}
        </div>
        ${summary()}
      </div>`;
    applyI18n();
  }

  /* ---------- interactions ---------- */
  root.addEventListener("click", (e) => {
    const seatBtn = e.target.closest("button[data-seat]");
    if (seatBtn) {
      const leg = legs.find(l => l.key === seatBtn.dataset.leg);
      const n = seatBtn.dataset.seat;
      const idx = leg.selected.indexOf(n);
      if (idx >= 0) leg.selected.splice(idx, 1);
      else { if (leg.selected.length >= pax) leg.selected.shift(); leg.selected.push(n); }
      render();
      return;
    }
    const payOpt = e.target.closest(".pay-opt[data-method]");
    if (payOpt) { state.paymentMethod = payOpt.dataset.method; render(); return; }
  });

  root.addEventListener("input", (e) => {
    if (e.target.id === "cardNumber") {
      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
      e.target.value = v.replace(/(.{4})/g, "$1 ").trim();
    }
    if (e.target.id === "cardExp") {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
    }
    if (e.target.id === "cardCvv") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });

  /* ---------- validation + submit ---------- */
  function collectPassengers() {
    const rows = [...root.querySelectorAll(".pax-row")];
    let ok = true;
    const names = rows.map((r, i) => {
      const first = r.querySelector(".p-first").value.trim();
      const last  = r.querySelector(".p-last").value.trim();
      const passport = r.querySelector(".p-passport").value.trim();
      const errEl = r.querySelector(`[data-err="${i}"]`);
      if (!first || !last) { errEl.textContent = t("co.err.name"); ok = false; }
      else errEl.textContent = "";
      return { first, last, passport };
    });
    return { ok, names };
  }

  function validatePayment() {
    const errEl = document.getElementById("payErr");
    errEl.textContent = "";
    if (state.paymentMethod === "promptpay") return true;
    const num = (document.getElementById("cardNumber").value || "").replace(/\s/g, "");
    const name = (document.getElementById("cardName").value || "").trim();
    const exp = (document.getElementById("cardExp").value || "").trim();
    const cvv = (document.getElementById("cardCvv").value || "").trim();
    if (!name) { errEl.textContent = t("co.err.cardname"); return false; }
    if (!/^\d{13,16}$/.test(num)) { errEl.textContent = t("co.err.cardnum"); return false; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) { errEl.textContent = t("co.err.exp"); return false; }
    if (!/^\d{3,4}$/.test(cvv)) { errEl.textContent = t("co.err.cvv"); return false; }
    return true;
  }

  async function refreshSeats(leg) {
    const sRes = await apiFetch(`/api/flights/${leg.id}/seats`);
    leg.seats = sRes.ok ? await sRes.json() : leg.seats;
    leg.selected = [];
  }

  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("#payBtn");
    if (!btn) return;

    for (const leg of legs) {
      if (leg.selected.length !== pax) { toast("co.err.seats"); return; }
    }
    const { ok, names } = collectPassengers();
    if (!ok) { toast("co.err.name"); return; }
    if (!validatePayment()) return;

    btn.disabled = true; btn.textContent = t("co.processing");
    const created = [];
    for (const leg of legs) {
      const passengers = names.map((n, i) => ({
        first_name: n.first, last_name: n.last,
        passport_number: n.passport || null, seat_number: leg.selected[i],
      }));
      let res, data;
      try {
        res = await apiFetch("/api/bookings", {
          method: "POST",
          body: JSON.stringify({
            flight_id: leg.flight.id, passengers,
            payment_method: state.paymentMethod, cabin_class: cls,
          }),
        });
        data = await res.json();
      } catch {
        toast("Network error", { raw: true });
        btn.disabled = false; btn.textContent = t("co.confirmpay");
        return;
      }
      if (res.ok) { created.push(data); continue; }

      // session/token no longer valid → clear it and send to login
      if (res.status === 401) {
        toast(data.message || "Please log in again", { raw: true });
        Auth.clear();
        setTimeout(() => location.href = "login.html", 1300);
        return;
      }

      // a leg failed
      if (res.status === 409) { await refreshSeats(leg); render(); }
      if (created.length) {
        // round-trip: one leg already booked → send them to bookings to review
        toast(data.message || t("co.err.seattaken"), { raw: true });
        setTimeout(() => location.href = "bookings.html", 1300);
      } else {
        toast(data.message || t("co.err.seattaken"), { raw: true });
        btn.disabled = false; btn.textContent = t("co.confirmpay");
      }
      return;
    }

    // all legs booked
    toast("co.success");
    setTimeout(() => location.href = roundtrip ? "bookings.html" : ("eticket.html?id=" + created[0].id), 800);
  });

  render();
  document.addEventListener("languagechange", render);
})();
