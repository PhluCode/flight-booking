/* =========================================================
   flights.js — dynamic catalog, filtering, debounced search,
   sorting. Demonstrates event delegation + debouncing.
   Supports one-way (single list) and round-trip (outbound +
   return lists with a selection bar).
   ========================================================= */
(async function () {
  mountShell("flights");

  const qp = new URLSearchParams(location.search);

  // This page only shows flights AFTER an origin/destination is chosen.
  // If no route was selected yet, bounce back to the home booking widget
  // so the user can pick airports there (replace → no empty entry in history).
  const hasSearch = !!(qp.get("from") || qp.get("to"));
  if (!hasSearch) { location.replace("index.html#book"); return; }

  document.getElementById("searchIcon").innerHTML = ICONS.search;
  // if a destination is given without an origin (e.g. clicking a
  // popular-destination card), default the origin to BKK so results show.
  const searchFrom = qp.get("from") || (qp.get("to") ? "BKK" : "");
  const searchTo   = qp.get("to")   || "";
  const searchDate = qp.get("date") || "2026-06-01";
  const searchRet  = qp.get("ret")  || "";
  const roundtrip  = !!searchRet;
  const searchPax  = Math.max(1, parseInt(qp.get("pax"), 10) || 1);
  const searchCls  = qp.get("cls") || "Economy";

  const PRICE_MAX = 50000;
  const BIZ_PREMIUM = 1000;   // Business ≈ base + premium (mirrors checkout seat fee)
  const priceOf = (f) => f.price + (state.cls === "Business" ? BIZ_PREMIUM : 0);

  function normCls(raw) {
    if (!raw) return "";
    const s = String(raw).toLowerCase();
    if (s.includes("biz") || s.includes("business")) return "Business";
    if (s.includes("prem") || s.includes("premium")) return "Premium";
    // coach / coaching / coach -> Economy
    if (s.includes("coach") || s.includes("eco") || s.includes("econom")) return "Economy";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  // filter state (single source of truth)
  const state = {
    keyword: "",
    stops: new Set(),
    airlines: new Set(),
    maxPrice: PRICE_MAX,
    times: new Set(),
    sort: "cheapest",
    cls: normCls(searchCls),
  };

  // round-trip selection (db ids) + which leg is being viewed
  let selOut = null, selRet = null;
  let activeLeg = "out";   // "out" | "ret"

  const timeStr = (iso) => (iso || "").slice(11, 16);

  function mapFlight(f) {
    return {
      id: f.flight_number, _dbId: f.id, airline: f.airline_code,
      from: f.origin_code, to: f.destination_code,
      dep: timeStr(f.departure_time), arr: timeStr(f.arrival_time),
      duration: f.duration, stops: f.stops, seatsLeft: f.seats_available,
      price: f.price,
      cls: normCls(f.cls || f.class || f.cabin_class || searchCls),
    };
  }

  async function fetchLeg(origin, destination, date) {
    if (!origin || !destination) return [];
    try {
      const res = await apiFetch(`/api/flights?origin=${origin}&destination=${destination}&date=${date}`);
      const data = await res.json();
      return data.map(mapFlight);
    } catch (e) { console.error("Failed to fetch flights:", e); return []; }
  }

  /* ---- fetch outbound (+ return) ---- */
  const FLIGHTS_OUT = await fetchLeg(searchFrom, searchTo, searchDate);
  const FLIGHTS_RET = roundtrip ? await fetchLeg(searchTo, searchFrom, searchRet) : [];

  function updateAirlineFilters() {
    const src = roundtrip && activeLeg === "ret" ? FLIGHTS_RET : FLIGHTS_OUT;
    const filtered = src.filter(f => {
      if (state.stops.size && !state.stops.has(String(f.stops))) return false;
      if (f.price > state.maxPrice) return false;
      if (state.times.size && !state.times.has(timeBucket(f.dep))) return false;
      return true;
    });
    const availableAirlines = new Set(filtered.map(f => f.airline));
    document.getElementById("airlineFilters").innerHTML = Object.values(AIRLINES).map(a => {
      const isAvailable = availableAirlines.has(a.code);
      const isChecked = state.airlines.has(a.code) && isAvailable;
      if (!isAvailable && state.airlines.has(a.code)) {
        state.airlines.delete(a.code);
      }
      return `
      <label class="check ${isAvailable ? (isChecked ? 'checked' : '') : 'disabled'}">
        <input type="checkbox" class="f-airline" value="${a.code}" ${isAvailable ? '' : 'disabled'} ${isChecked ? 'checked' : ''} />
        <span>${a.name}</span>
      </label>`;
    }).join("");
  }

  /* ---- build airline filter checkboxes from data ---- */
  updateAirlineFilters();

  function localizeSort() {
    document.querySelectorAll("#sortBy option[data-i18n-opt]").forEach(o => {
      o.textContent = t(o.getAttribute("data-i18n-opt"));
    });
  }

  function timeBucket(dep) {
    const h = parseInt(dep.slice(0, 2), 10);
    if (h < 12) return "morning";
    if (h < 18) return "afternoon";
    return "evening";
  }

  /* ---- filter + sort a given list ---- */
  function getResults(source) {
    let list = source.filter(f => {
      if (state.stops.size && !state.stops.has(String(f.stops))) return false;
      if (state.airlines.size && !state.airlines.has(f.airline)) return false;
      if (f.price > state.maxPrice) return false;
      if (state.times.size && !state.times.has(timeBucket(f.dep))) return false;
      if (state.keyword) {
        const hay = [
          f.id, (AIRLINES[f.airline]?.name || f.airline),
          cityName(f.from, "en"), cityName(f.to, "en"),
          cityName(f.from, "th"), cityName(f.to, "th"),
          f.from, f.to,
        ].join(" ").toLowerCase();
        if (!hay.includes(state.keyword.toLowerCase())) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      if (state.sort === "cheapest") return a.price - b.price;
      if (state.sort === "fastest") return a.duration - b.duration;
      if (state.sort === "earliest") return a.dep.localeCompare(b.dep);
      return 0;
    });
    return list;
  }

  /* ---- a single flight card ---- */
  function flightCard(f, leg, minPrice) {
    const lang = I18nStore.get();
    const al = AIRLINES[f.airline] || { name: f.airline, code: f.airline };
    const stopsTxt = f.stops === 0 ? t("flight.nonstop") : t("flight.stop");
    const cheapest = f.price === minPrice;
    const selected = leg === "out" ? selOut === f._dbId : leg === "ret" ? selRet === f._dbId : false;
    const action = leg
      ? `<button class="btn ${selected ? "btn-dark" : "btn-light"} select-btn" data-leg="${leg}" data-id="${f._dbId}">
           ${selected ? t("rt.selected") : t("rt.select")}</button>`
      : `<button class="btn btn-dark book-btn" data-id="${f._dbId}" data-i18n="flight.book"></button>`;
    return `
      <article class="flight-card ${selected ? "selected" : ""}" data-id="${f.id}">
        <div class="airline">
          <div class="airline-logo">${ICONS.plane}</div>
          <div><div class="name">${al.name}</div><div class="code">${f.id}</div></div>
        </div>
        <div class="route">
          <div>
            <div class="time">${f.dep}</div>
            <div class="ap">${f.from} · ${cityName(f.from, lang)}</div>
          </div>
          <div class="mid">
            <div class="dur">${fmtDuration(f.duration, lang)}</div>
            <div class="line"></div>
            <div class="stops">${stopsTxt}</div>
          </div>
          <div class="col-r">
            <div class="time">${f.arr}</div>
            <div class="ap">${f.to} · ${cityName(f.to, lang)}</div>
          </div>
        </div>
        <div class="flight-buy">
          ${cheapest
            ? '<span class="badge badge-dark" data-i18n="sort.cheapest"></span>'
            : `<span class="badge">${t(state.cls === "Business" ? "class.business" : "class.economy")}</span>`}
          <div class="price">${fmtBaht(priceOf(f))}</div>
          <div class="per" data-i18n="flight.perpax"></div>
          ${action}
        </div>
      </article>`;
  }

  function emptyBlock() {
    return `<div class="empty-state">${ICONS.plane}
      <h3 data-i18n="empty.title"></h3><p data-i18n="empty.sub"></p></div>`;
  }

  function listHtml(source, leg) {
    const list = getResults(source);
    if (!list.length) return emptyBlock();
    const minPrice = Math.min(...list.map(x => x.price));
    return list.map(f => flightCard(f, leg, minPrice)).join("");
  }

  /* ---- round-trip leg switcher (one list at a time) ---- */
  function legTab(leg, key, from, to, date, selFlight) {
    const lang = I18nStore.get();
    return `
      <button class="leg-tab ${activeLeg === leg ? "active" : ""}" data-leg-tab="${leg}">
        <span class="leg-tab-top"><span class="leg-tab-k" data-i18n="${key}"></span>
          <span class="leg-tab-route">${from} → ${to}</span></span>
        <span class="leg-tab-sel">${selFlight
          ? `✓ ${selFlight.id} · ${selFlight.dep}`
          : `<span class="muted">${fmtDate(date, lang)} · </span><span data-i18n="rt.choose"></span>`}</span>
      </button>`;
  }
  function legSwitch() {
    const o = selOut ? flightById(selOut) : null;
    const r = selRet ? flightById(selRet) : null;
    return `<div class="leg-switch">
      ${legTab("out", "rt.outbound", searchFrom, searchTo, searchDate, o)}
      ${legTab("ret", "rt.return", searchTo, searchFrom, searchRet, r)}
    </div>`;
  }

  /* ---- render ---- */
  function render() {
    updateAirlineFilters();
    const wrap = document.getElementById("flightList");
    if (roundtrip) {
      const src = activeLeg === "out" ? FLIGHTS_OUT : FLIGHTS_RET;
      const list = getResults(src);
      document.getElementById("resultCount").textContent = list.length;
      wrap.innerHTML = legSwitch() + (list.length ? listHtml(src, activeLeg) : emptyBlock());
      updateRtBar();
    } else {
      const list = getResults(FLIGHTS_OUT);
      document.getElementById("resultCount").textContent = list.length;
      wrap.innerHTML = list.length ? listHtml(FLIGHTS_OUT, null) : emptyBlock();
    }
    applyI18n();
  }

  /* ---- round-trip selection bar ---- */
  function ensureRtBar() {
    let bar = document.getElementById("rtBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "rtBar"; bar.className = "rt-bar"; bar.hidden = true;
      document.body.appendChild(bar);
    }
    return bar;
  }
  function flightById(id) { return [...FLIGHTS_OUT, ...FLIGHTS_RET].find(f => f._dbId === id); }
  function updateRtBar() {
    if (!roundtrip) return;
    const bar = ensureRtBar();
    bar.hidden = false;
    const o = selOut ? flightById(selOut) : null;
    const r = selRet ? flightById(selRet) : null;
    const total = (o ? priceOf(o) : 0) + (r ? priceOf(r) : 0);
    const ready = o && r;
    bar.innerHTML = `
      <div class="container rt-bar-inner">
        <div class="rt-legs">
          <span><b data-i18n="rt.outbound"></b>: ${o ? `${o.id} · ${o.dep}` : t("rt.choose")}</span>
          <span><b data-i18n="rt.return"></b>: ${r ? `${r.id} · ${r.dep}` : t("rt.choose")}</span>
          <span class="rt-total">${ready ? fmtBaht(total * searchPax) : ""}</span>
        </div>
        <button class="btn btn-dark" id="rtContinue" ${ready ? "" : "disabled"} data-i18n="rt.continue"></button>
      </div>`;
    applyI18n();
  }

  /* ---- debounce ---- */
  function debounce(fn, wait) {
    let timer;
    return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), wait); };
  }
  const debouncedRender = debounce(render, 280);

  /* ---- filters via event delegation ---- */
  const layout = document.querySelector(".results-layout");
  layout.addEventListener("change", (e) => {
    const el = e.target;
    if (el.classList.contains("f-stops")) toggleSet(state.stops, el.value, el.checked);
    else if (el.classList.contains("f-airline")) toggleSet(state.airlines, el.value, el.checked);
    else if (el.classList.contains("f-time")) toggleSet(state.times, el.value, el.checked);
    else if (el.id === "sortBy") state.sort = el.value;
    else return;
    render();
  });

  layout.addEventListener("input", (e) => {
    if (e.target.id === "priceRange") {
      state.maxPrice = +e.target.value;
      document.getElementById("priceMax").textContent = fmtBaht(state.maxPrice);
      debouncedRender();
    }
    if (e.target.id === "keyword") {
      state.keyword = e.target.value.trim();
      debouncedRender();
    }
  });

  /* ---- card actions (book / select) ---- */
  document.getElementById("flightList").addEventListener("click", (e) => {
    // switch outbound/return leg
    const legBtn = e.target.closest("[data-leg-tab]");
    if (legBtn) { activeLeg = legBtn.dataset.legTab; render(); return; }

    if (!Auth.isLoggedIn()) {
      if (e.target.closest(".book-btn") || e.target.closest(".select-btn")) { location.href = "login.html"; return; }
    }
    const book = e.target.closest(".book-btn");
    if (book) {
      const params = new URLSearchParams({ flight: book.dataset.id, pax: String(searchPax), cls: state.cls });
      location.href = "checkout.html?" + params.toString();
      return;
    }
    const select = e.target.closest(".select-btn");
    if (select) {
      const id = Number(select.dataset.id);
      if (select.dataset.leg === "out") {
        selOut = selOut === id ? null : id;
        if (selOut && !selRet) activeLeg = "ret";   // warp to the return leg after choosing outbound
      } else {
        selRet = selRet === id ? null : id;
      }
      render();
      return;
    }
  });

  // continue (round trip) — bar lives on body
  document.body.addEventListener("click", (e) => {
    if (!e.target.closest("#rtContinue")) return;
    if (!Auth.isLoggedIn()) { location.href = "login.html"; return; }
    if (!selOut || !selRet) return;
    const params = new URLSearchParams({
      flight: String(selOut), flight2: String(selRet), pax: String(searchPax), cls: state.cls,
    });
    location.href = "checkout.html?" + params.toString();
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    state.stops.clear(); state.airlines.clear(); state.times.clear();
    state.keyword = ""; state.maxPrice = PRICE_MAX;
    document.querySelectorAll(".results-layout input[type=checkbox]").forEach(c => c.checked = false);
    document.getElementById("priceRange").value = PRICE_MAX;
    document.getElementById("priceMax").textContent = fmtBaht(PRICE_MAX);
    document.getElementById("keyword").value = "";
    render();
  });

  function toggleSet(set, val, on) { on ? set.add(val) : set.delete(val); }

  /* ---- cabin class toggle (Economy ⇄ Business) ---- */
  function syncClsToggle() {
    document.querySelectorAll("#clsToggle button").forEach(b =>
      b.classList.toggle("active", b.dataset.cls === state.cls));
  }
  document.getElementById("clsToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cls]");
    if (!btn || btn.dataset.cls === state.cls) return;
    state.cls = btn.dataset.cls;
    syncClsToggle();
    render();
  });

  const SORT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h6"/></svg>';

  localizeSort();
  syncClsToggle();
  render();
  enhanceSelect(document.getElementById("sortBy"), { icon: SORT_ICON, align: "right" });
  document.addEventListener("languagechange", () => {
    localizeSort(); render();
    document.getElementById("sortBy")?._refreshCsel?.();
  });
})();
