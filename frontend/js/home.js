/* =========================================================
   home.js — home page: booking widget, destinations, why-us
   ========================================================= */
(function () {
  mountShell("home");

  // hero art
  document.getElementById("heroPlane").innerHTML = ART.jetSide;
  document.getElementById("promoImg").innerHTML = ART.jetFront;
  document.getElementById("promoArt").innerHTML = ICONS.arrowUpRight;

  /* ---------- widget state ---------- */
  let activeTab = "flights";   // flights | cars
  let activeTrip = "oneway";   // oneway | round | multi

  const MIN_DATE = "2026-06-01";
  const MAX_DATE = "2026-06-14";
  const clamp = (iso) => iso < MIN_DATE ? MIN_DATE : iso > MAX_DATE ? MAX_DATE : iso;
  const todayISO = new Date().toISOString().slice(0, 10);

  // selected airports (codes) — single source of truth
  const sel = { from: "", to: "" };
  const ap = { open: false, target: "from", query: "" };

  // date-picker state
  const dp = {
    depart: clamp(todayISO),
    return: null,
    open: false,
    target: "depart",
    view: new Date(MIN_DATE + "T00:00:00"),
  };

  const MONTHS = {
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    th: ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"],
  };
  const WEEKDAYS = { en: ["Mo","Tu","We","Th","Fr","Sa","Su"], th: ["จ.","อ.","พ.","พฤ.","ศ.","ส.","อา."] };

  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  function prettyDate(iso) {
    if (!iso) return "";
    const lang = I18nStore.get();
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-GB",
      { weekday: "short", day: "numeric", month: "short" });
  }

  /* ---------- field builders ---------- */
  function fieldFlights() {
    const showReturn = activeTrip === "round";
    return `
      <div class="field ap-field" data-ap="from">
        <label>${ICONS.mapPin}<span data-i18n="field.from"></span></label>
        <div class="ap-display" id="apFromText"></div>
      </div>
      <div class="field-swap">
        <button class="swap-btn" id="swapBtn" type="button" aria-label="swap">${ICONS.swap}</button>
      </div>
      <div class="field ap-field" data-ap="to">
        <label>${ICONS.mapPin}<span data-i18n="field.to"></span></label>
        <div class="ap-display" id="apToText"></div>
      </div>
      <div class="field dp-field" data-dp="depart">
        <label>${ICONS.calendar}<span data-i18n="field.depart"></span></label>
        <div class="dp-display" id="dpDepartText"></div>
      </div>
      ${showReturn ? `
      <div class="field dp-field" data-dp="return" id="returnField">
        <label>${ICONS.calendar}<span data-i18n="field.return"></span></label>
        <div class="dp-display" id="dpReturnText"></div>
      </div>` : ""}
      <div class="field">
        <label>${ICONS.user}<span data-i18n="field.traveler"></span></label>
        <input type="number" id="fPax" min="1" max="6" value="1" />
      </div>
      <div class="field field-search">
        <button class="search-btn" id="searchBtn" type="button" aria-label="search">${ICONS.search}</button>
      </div>`;
  }

  function fieldCars() {
    return `
      <div class="field">
        <label>${ICONS.mapPin}<span data-i18n="field.pickup"></span></label>
        <input id="cPickup" list="airportList" data-i18n-ph="field.pickup.ph" onfocus="this.select()" autocomplete="off" />
      </div>
      <div class="field-swap"><button class="swap-btn" type="button" disabled style="opacity:.4">${ICONS.swap}</button></div>
      <div class="field">
        <label>${ICONS.calendar}<span data-i18n="field.depart"></span></label>
        <input type="date" id="cFrom" min="${MIN_DATE}" max="${MAX_DATE}" />
      </div>
      <div class="field">
        <label>${ICONS.calendar}<span data-i18n="field.return"></span></label>
        <input type="date" id="cTo" min="${MIN_DATE}" max="${MAX_DATE}" />
      </div>
      <div class="field">
        <label>${ICONS.car}<span data-i18n="field.cartype"></span></label>
        <select id="cType">
          ${CARS.map(c => `<option value="${c.id}">${c.brand}</option>`).join("")}
        </select>
      </div>
      <div class="field field-search">
        <button class="search-btn" id="searchBtn" type="button" aria-label="search">${ICONS.search}</button>
      </div>`;
  }

  function segs() {
    const items = [
      { id: "oneway", key: "trip.oneway" },
      { id: "round",  key: "trip.round" },
    ];
    return items.map(s => `
      <label class="seg ${activeTrip === s.id ? "checked" : ""}" data-trip="${s.id}">
        <span class="dot"></span><span data-i18n="${s.key}"></span>
      </label>`).join("");
  }

  function renderBooking() {
    const fieldsHtml = activeTab === "flights" ? fieldFlights() : fieldCars();
    const fieldsCls = activeTab === "cars" ? 'data-layout="cars"'
      : (activeTrip === "round" ? "" : 'data-layout="ow"');
    document.getElementById("booking-slot").innerHTML = `
      <div class="booking">

        <div class="seg-row">
          ${segs()}
        </div>

        <div class="fields-wrap">
          <div class="fields" ${fieldsCls}>${fieldsHtml}</div>
          <div class="ap-pop" id="apPop" hidden></div>
          <div class="dp-pop" id="dpPop" hidden></div>
        </div>

        <div class="booking-bottom">
          <div class="booking-links">
            <a href="bookings.html" class="underline">${ICONS.ticket}<span data-i18n="link.mybooking"></span></a>
            <a href="#">${ICONS.status}<span data-i18n="link.status"></span></a>
          </div>
        </div>
      </div>
      <datalist id="airportList">
        ${Object.keys(AIRPORTS).map(c => `<option value="${c} — ${cityName(c, I18nStore.get())}"></option>`).join("")}
      </datalist>`;

    document.querySelectorAll("#fClass option[data-i18n-opt]").forEach(o => {
      o.textContent = t(o.getAttribute("data-i18n-opt"));
    });
    applyI18n();
    syncAirportDisplays();
    syncDateDisplays();
    renderAirportPop();
    renderCalendar();
  }

  /* ---------- custom airport dropdown ---------- */
  function syncAirportDisplays() {
    const lang = I18nStore.get();
    const f = document.getElementById("apFromText");
    if (f) f.textContent = sel.from ? `${sel.from} · ${cityName(sel.from, lang)}` : t("ap.pick");
    const tt = document.getElementById("apToText");
    if (tt) tt.textContent = sel.to ? `${sel.to} · ${cityName(sel.to, lang)}` : t("ap.pick");
    document.querySelectorAll(".ap-field").forEach(el =>
      el.classList.toggle("active", ap.open && el.dataset.ap === ap.target));
  }

  function buildApList() {
    const lang = I18nStore.get();
    const q = ap.query.trim().toLowerCase();
    const other = ap.target === "from" ? sel.to : sel.from;  // exclude the opposite pick
    const items = Object.keys(AIRPORTS).filter(code => {
      if (code === other) return false;
      if (!q) return true;
      const a = AIRPORTS[code];
      return `${code} ${a.city_en} ${a.city_th} ${a.country}`.toLowerCase().includes(q);
    });
    if (!items.length) return `<div class="ap-empty">${t("ap.none")}</div>`;
    return items.map(code => {
      const a = AIRPORTS[code];
      const isSel = sel[ap.target] === code ? "selected" : "";
      return `<button type="button" class="ap-item ${isSel}" data-ap-pick="${code}">
        <span class="ap-code">${code}</span>
        <span class="ap-name">${cityName(code, lang)} <span class="muted">· ${a.country}</span></span>
      </button>`;
    }).join("");
  }

  function renderAirportPop() {
    const pop = document.getElementById("apPop");
    if (!pop) return;
    pop.hidden = !ap.open;
    if (!ap.open) return;
    pop.innerHTML = `
      <div class="ap-search">${ICONS.search}
        <input id="apSearch" type="search" autocomplete="off" placeholder="${t("ap.search")}" value="${ap.query}" />
      </div>
      <div class="ap-list" id="apList">${buildApList()}</div>`;
    const inp = document.getElementById("apSearch");
    if (inp) inp.focus();
  }

  /* ---------- custom date picker ---------- */
  function syncDateDisplays() {
    const d = document.getElementById("dpDepartText");
    if (d) d.textContent = dp.depart ? prettyDate(dp.depart) : t("dp.pick");
    const r = document.getElementById("dpReturnText");
    if (r) r.textContent = dp.return ? prettyDate(dp.return) : t("dp.pick");
    document.querySelectorAll(".dp-field").forEach(f =>
      f.classList.toggle("active", dp.open && f.dataset.dp === dp.target));
  }

  function monthGrid(base) {
    const lang = I18nStore.get();
    const y = base.getFullYear(), m = base.getMonth();
    const first = new Date(y, m, 1);
    const startCol = (first.getDay() + 6) % 7;
    const daysIn = new Date(y, m + 1, 0).getDate();
    let cells = "";
    for (let i = 0; i < startCol; i++) cells += `<span class="dp-cell dp-empty"></span>`;
    for (let day = 1; day <= daysIn; day++) {
      const iso = isoOf(new Date(y, m, day));
      const disabled = iso < MIN_DATE || iso > MAX_DATE;
      const isDep = iso === dp.depart, isRet = iso === dp.return;
      const inRange = dp.depart && dp.return && iso > dp.depart && iso < dp.return;
      const cls = [isDep ? "dp-start" : "", isRet ? "dp-end" : "", inRange ? "dp-inrange" : ""].join(" ").trim();
      cells += disabled
        ? `<span class="dp-cell dp-off">${day}</span>`
        : `<button type="button" class="dp-cell ${cls}" data-day="${iso}">${day}</button>`;
    }
    return `
      <div class="dp-month">
        <div class="dp-mhead">${MONTHS[lang][m]} ${y}</div>
        <div class="dp-weekdays">${WEEKDAYS[lang].map(w => `<span>${w}</span>`).join("")}</div>
        <div class="dp-days">${cells}</div>
      </div>`;
  }

  function renderCalendar() {
    const pop = document.getElementById("dpPop");
    if (!pop) return;
    pop.hidden = !dp.open;
    if (!dp.open) return;
    const m1 = new Date(dp.view.getFullYear(), dp.view.getMonth(), 1);
    const m2 = new Date(dp.view.getFullYear(), dp.view.getMonth() + 1, 1);
    const minMonth = new Date(MIN_DATE + "T00:00:00");
    const maxMonth = new Date(MAX_DATE + "T00:00:00");
    const canPrev = m1 > new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);
    const canNext = m2 < new Date(maxMonth.getFullYear(), maxMonth.getMonth(), 1);
    pop.innerHTML = `
      <div class="dp-top">
        <button type="button" class="dp-nav" data-nav="-1" ${canPrev ? "" : "disabled"}>‹</button>
        <button type="button" class="dp-nav" data-nav="1" ${canNext ? "" : "disabled"}>›</button>
      </div>
      <div class="dp-grid">${monthGrid(m1)}${monthGrid(m2)}</div>
      <div class="dp-foot"><span class="muted">${t("dp.window")}</span>
        <button type="button" class="btn btn-dark dp-done" data-dp-done>${t("dp.done")}</button>
      </div>`;
  }

  function pickDay(iso) {
    if (activeTrip === "round") {
      if (dp.target === "depart") {
        dp.depart = iso;
        if (dp.return && dp.return <= iso) dp.return = null;
        dp.target = "return";
      } else {
        if (iso < dp.depart) { dp.depart = iso; dp.return = null; }
        else { dp.return = iso; dp.open = false; }
      }
    } else {
      dp.depart = iso;
      dp.open = false;
    }
    syncDateDisplays();
    renderCalendar();
  }

  /* ---------- Destination cards ---------- */
  function renderDestinations() {
    const lang = I18nStore.get();
    document.getElementById("destGrid").innerHTML = DESTINATIONS.map(d => {
      const apt = AIRPORTS[d.code];
      return `
      <a href="flights.html?from=BKK&to=${d.code}&date=${clamp(todayISO)}" class="dest-card reveal">
        <div class="dest-media">${ART.city}</div>
        <div class="dest-body">
          <div>
            <h3>${cityName(d.code, lang)}</h3>
            <div class="sub">${apt.country} · ${d.code}</div>
          </div>
          <div class="dest-price">
            <div class="from" data-i18n="dest.from"></div>
            <div class="amt">${fmtBaht(d.price)}</div>
          </div>
        </div>
      </a>`;
    }).join("");
    applyI18n();
    document.querySelectorAll(".dest-card.reveal").forEach(el => el.classList.add("in"));
  }

  /* ---------- Why-us tiles ---------- */
  function renderWhy() {
    const items = [
      { ic: ICONS.shield,  t: "why.1.t", d: "why.1.d" },
      { ic: ICONS.headset, t: "why.2.t", d: "why.2.d" },
      { ic: ICONS.bolt,    t: "why.3.t", d: "why.3.d" },
      { ic: ICONS.refresh, t: "why.4.t", d: "why.4.d" },
    ];
    document.getElementById("whyGrid").innerHTML = items.map(i => `
      <div class="info-tile reveal in">
        <div class="ic">${i.ic}</div>
        <h3 style="margin:.2rem 0" data-i18n="${i.t}"></h3>
        <p class="muted" style="margin:0;font-size:.92rem" data-i18n="${i.d}"></p>
      </div>`).join("");
    applyI18n();
  }

  /* ---------- Event delegation: clicks ---------- */
  document.getElementById("booking-slot").addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".tab");
    if (tabBtn) { activeTab = tabBtn.dataset.tab; dp.open = false; ap.open = false; renderBooking(); return; }

    const seg = e.target.closest("[data-trip]");
    if (seg) {
      activeTrip = seg.dataset.trip;
      if (activeTrip !== "round") dp.return = null;
      dp.open = false; ap.open = false;
      renderBooking();
      return;
    }

    const fare = e.target.closest("[data-fare]");
    if (fare) {
      document.querySelectorAll("[data-fare]").forEach(s => s.classList.toggle("checked", s === fare));
      return;
    }

    // airport dropdown
    const apField = e.target.closest(".ap-field");
    if (apField) {
      ap.target = apField.dataset.ap; ap.query = ""; ap.open = true;
      dp.open = false; renderCalendar();
      syncAirportDisplays(); renderAirportPop();
      return;
    }
    const apPick = e.target.closest("[data-ap-pick]");
    if (apPick) {
      sel[ap.target] = apPick.dataset.apPick;   // data-ap-pick → dataset.apPick
      ap.open = false;
      syncAirportDisplays(); renderAirportPop();
      return;
    }

    // date picker
    const dpField = e.target.closest(".dp-field");
    if (dpField) {
      dp.target = dpField.dataset.dp; dp.open = true;
      ap.open = false; renderAirportPop();
      const anchor = dp[dp.target] || dp.depart || MIN_DATE;
      dp.view = new Date(anchor + "T00:00:00"); dp.view.setDate(1);
      const maxView = new Date(MAX_DATE + "T00:00:00"); maxView.setDate(1); maxView.setMonth(maxView.getMonth() - 1);
      const minView = new Date(MIN_DATE + "T00:00:00"); minView.setDate(1);
      if (dp.view > maxView) dp.view = maxView;
      if (dp.view < minView) dp.view = minView;
      syncDateDisplays(); renderCalendar();
      return;
    }
    const nav = e.target.closest(".dp-nav");
    if (nav) { dp.view.setMonth(dp.view.getMonth() + Number(nav.dataset.nav)); renderCalendar(); return; }
    const day = e.target.closest(".dp-cell[data-day]");
    if (day) { pickDay(day.dataset.day); return; }
    if (e.target.closest("[data-dp-done]")) { dp.open = false; syncDateDisplays(); renderCalendar(); return; }

    if (e.target.closest("#swapBtn")) {
      [sel.from, sel.to] = [sel.to, sel.from];
      syncAirportDisplays();
      return;
    }

    if (e.target.closest("#searchBtn")) {
      const params = new URLSearchParams();
      if (activeTab === "flights") {
        if (!sel.from || !sel.to) { toast("dp.err.airport"); return; }
        if (sel.from === sel.to) { toast("dp.err.same"); return; }
        params.set("from", sel.from);
        params.set("to", sel.to);
        params.set("date", dp.depart || clamp(todayISO));
        if (dp.return) params.set("ret", dp.return);
        const cls = document.getElementById("fClass")?.value;
        if (cls) params.set("cls", cls);
        const pax = document.getElementById("fPax")?.value;
        if (pax) params.set("pax", pax);
      }
      location.href = "flights.html" + (params.toString() ? "?" + params.toString() : "");
    }
  });

  /* ---------- airport search box typing ---------- */
  document.getElementById("booking-slot").addEventListener("input", (e) => {
    if (e.target.id === "apSearch") {
      ap.query = e.target.value;
      const list = document.getElementById("apList");
      if (list) list.innerHTML = buildApList();
    }
  });

  // close popovers when clicking outside the widget
  document.addEventListener("click", (e) => {
    if (dp.open && !e.target.closest(".dp-pop") && !e.target.closest(".dp-field")) {
      dp.open = false; syncDateDisplays(); renderCalendar();
    }
    if (ap.open && !e.target.closest(".ap-pop") && !e.target.closest(".ap-field")) {
      ap.open = false; syncAirportDisplays(); renderAirportPop();
    }
  });

  // initial render + re-render on language change
  renderBooking();
  renderDestinations();
  renderWhy();
  document.addEventListener("languagechange", () => { renderBooking(); renderDestinations(); });
})();
