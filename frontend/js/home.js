/* =========================================================
   home.js — home page: booking widget, destinations, why-us
   ========================================================= */
(function () {
  mountShell("home");

  // hero art
  document.getElementById("heroPlane").innerHTML = ART.jetSide;
  document.getElementById("promoImg").innerHTML = ART.jetFront;
  document.getElementById("promoArt").innerHTML = ICONS.arrowUpRight;

  /* ---------- Booking widget (built dynamically so it re-renders on lang change) ---------- */
  let activeTab = "flights";   // flights | cars
  let activeTrip = "oneway";   // oneway | round | multi

  function fieldFlights() {
    return `
      <div class="field">
        <label>${ICONS.mapPin}<span data-i18n="field.from"></span></label>
        <input id="fFrom" list="airportList" data-i18n-ph="field.from.ph" />
      </div>
      <div class="field-swap">
        <button class="swap-btn" id="swapBtn" type="button" aria-label="swap">${ICONS.swap}</button>
      </div>
      <div class="field">
        <label>${ICONS.mapPin}<span data-i18n="field.to"></span></label>
        <input id="fTo" list="airportList" data-i18n-ph="field.to.ph" />
      </div>
      <div class="field">
        <label>${ICONS.calendar}<span data-i18n="field.depart"></span></label>
        <input type="date" id="fDepart" />
      </div>
      <div class="field" id="returnField">
        <label>${ICONS.calendar}<span data-i18n="field.return"></span></label>
        <input type="date" id="fReturn" ${activeTrip === "oneway" ? "disabled" : ""} />
      </div>
      <div class="field">
        <label>${ICONS.user}<span data-i18n="field.traveler"></span></label>
        <input type="number" id="fPax" min="1" max="9" value="1" />
      </div>
      <div class="field field-search">
        <button class="search-btn" id="searchBtn" type="button" aria-label="search">${ICONS.search}</button>
      </div>`;
  }

  function fieldCars() {
    return `
      <div class="field">
        <label>${ICONS.mapPin}<span data-i18n="field.pickup"></span></label>
        <input id="cPickup" list="airportList" data-i18n-ph="field.pickup.ph" />
      </div>
      <div class="field-swap"><button class="swap-btn" type="button" disabled style="opacity:.4">${ICONS.swap}</button></div>
      <div class="field">
        <label>${ICONS.calendar}<span data-i18n="field.depart"></span></label>
        <input type="date" id="cFrom" />
      </div>
      <div class="field">
        <label>${ICONS.calendar}<span data-i18n="field.return"></span></label>
        <input type="date" id="cTo" />
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
      { id: "multi",  key: "trip.multi" },
    ];
    return items.map(s => `
      <label class="seg ${activeTrip === s.id ? "checked" : ""}" data-trip="${s.id}">
        <span class="dot"></span><span data-i18n="${s.key}"></span>
      </label>`).join("");
  }

  function renderBooking() {
    const fieldsHtml = activeTab === "flights" ? fieldFlights() : fieldCars();
    const fieldsCls = activeTab === "cars" ? 'data-layout="cars"' : "";
    document.getElementById("booking-slot").innerHTML = `
      <div class="booking">
        <div class="booking-top">
          <div class="tabs">
            <button class="tab ${activeTab === "flights" ? "active" : ""}" data-tab="flights">
              ${ICONS.plane}<span data-i18n="tab.flights"></span>
            </button>
            <button class="tab ${activeTab === "cars" ? "active" : ""}" data-tab="cars">
              ${ICONS.car}<span data-i18n="tab.cars"></span>
            </button>
          </div>
          <a href="#" class="support-link">${ICONS.headset}<span data-i18n="nav.support"></span></a>
        </div>

        <div class="seg-row" ${activeTab === "cars" ? 'style="display:none"' : ""}>
          ${segs()}
          <div class="class-select">
            <select id="fClass">
              <option value="Coach" data-i18n-opt="class.coach"></option>
              <option value="Premium" data-i18n-opt="class.premium"></option>
              <option value="Business" data-i18n-opt="class.business"></option>
              <option value="First" data-i18n-opt="class.first"></option>
            </select>
          </div>
        </div>

        <div class="fields" ${fieldsCls}>${fieldsHtml}</div>

        <div class="booking-bottom">
          <div class="fare-options">
            <label class="seg checked" data-fare="regular"><span class="dot"></span><span data-i18n="fare.regular"></span></label>
            <label class="seg" data-fare="student"><span class="dot"></span><span data-i18n="fare.student"></span></label>
          </div>
          <div class="booking-links">
            <a href="bookings.html" class="underline">${ICONS.ticket}<span data-i18n="link.mybooking"></span></a>
            <a href="#">${ICONS.status}<span data-i18n="link.status"></span></a>
          </div>
        </div>
      </div>
      <datalist id="airportList">
        ${Object.keys(AIRPORTS).map(c => `<option value="${c} — ${cityName(c, I18nStore.get())}"></option>`).join("")}
      </datalist>`;

    // localize the class <option> labels (data-i18n doesn't touch option text by default)
    document.querySelectorAll("#fClass option[data-i18n-opt]").forEach(o => {
      o.textContent = t(o.getAttribute("data-i18n-opt"));
    });
    applyI18n();
  }

  /* ---------- Destination cards ---------- */
  function renderDestinations() {
    const lang = I18nStore.get();
    document.getElementById("destGrid").innerHTML = DESTINATIONS.map(d => {
      const ap = AIRPORTS[d.code];
      return `
      <a href="flights.html?to=${d.code}" class="dest-card reveal">
        <div class="dest-media">${ART.city}</div>
        <div class="dest-body">
          <div>
            <h3>${cityName(d.code, lang)}</h3>
            <div class="sub">${ap.country} · ${d.code}</div>
          </div>
          <div class="dest-price">
            <div class="from" data-i18n="dest.from"></div>
            <div class="amt">${fmtBaht(d.price)}</div>
          </div>
        </div>
      </a>`;
    }).join("");
    applyI18n();
    // re-observe newly added reveal cards
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

  /* ---------- Event delegation for the booking widget ---------- */
  document.getElementById("booking-slot").addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".tab");
    if (tabBtn) { activeTab = tabBtn.dataset.tab; renderBooking(); return; }

    const seg = e.target.closest("[data-trip]");
    if (seg) {
      activeTrip = seg.dataset.trip;
      document.querySelectorAll("[data-trip]").forEach(s => s.classList.toggle("checked", s === seg));
      const ret = document.getElementById("fReturn");
      if (ret) ret.disabled = (activeTrip === "oneway");
      return;
    }

    const fare = e.target.closest("[data-fare]");
    if (fare) {
      document.querySelectorAll("[data-fare]").forEach(s => s.classList.toggle("checked", s === fare));
      return;
    }

    if (e.target.closest("#swapBtn")) {
      const a = document.getElementById("fFrom"), b = document.getElementById("fTo");
      if (a && b) { const tmp = a.value; a.value = b.value; b.value = tmp; }
      return;
    }

    if (e.target.closest("#searchBtn")) {
      const params = new URLSearchParams();
      if (activeTab === "flights") {
        const from = document.getElementById("fFrom")?.value.trim().slice(0, 3).toUpperCase();
        const to   = document.getElementById("fTo")?.value.trim().slice(0, 3).toUpperCase();
        const date = document.getElementById("fDepart")?.value;
        if (from) params.set("from", from);
        if (to)   params.set("to", to);
        if (date) params.set("date", date);
        const cls = document.getElementById("fClass")?.value;
        if (cls) params.set("cls", cls);
      }
      location.href = "flights.html" + (params.toString() ? "?" + params.toString() : "");
    }
  });

  // initial render + re-render on language change
  renderBooking();
  renderDestinations();
  renderWhy();
  document.addEventListener("languagechange", () => { renderBooking(); renderDestinations(); });
})();
