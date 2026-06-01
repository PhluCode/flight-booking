/* =========================================================
   flights.js — dynamic catalog, filtering, debounced search,
   sorting. Demonstrates event delegation + debouncing.
   ========================================================= */
(async function () {
  mountShell("flights");

  document.getElementById("searchIcon").innerHTML = ICONS.search;

  const qp = new URLSearchParams(location.search);
  const searchFrom = qp.get("from") || "";
  const searchTo   = qp.get("to")   || "";
  const searchDate = qp.get("date") || new Date().toISOString().slice(0, 10);

  // filter state (single source of truth)
  const state = {
    keyword: "",
    stops: new Set(),
    airlines: new Set(),
    maxPrice: 32000,
    times: new Set(),
    sort: "cheapest",
    to: searchTo,
    from: searchFrom,
  };

  /* ---- helper: format ISO datetime to HH:MM ---- */
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  /* ---- fetch real flights from backend ---- */
  let FLIGHTS = [];
  if (searchFrom && searchTo) {
    try {
      const res = await apiFetch(`/api/flights?origin=${searchFrom}&destination=${searchTo}&date=${searchDate}`);
      const data = await res.json();
      FLIGHTS = data.map(f => ({
        id:       f.flight_number,
        _dbId:    f.id,
        airline:  f.airline_name === "Thai Airways" ? "TG" : f.airline_name === "Thai AirAsia" ? "FD" : "SQ",
        from:     f.origin_code,
        to:       f.destination_code,
        dep:      fmtTime(f.departure_time),
        arr:      fmtTime(f.arrival_time),
        duration: f.duration,
        stops:    0,
        price:    f.price,
        cls:      "Economy",
      }));
    } catch (e) { console.error("Failed to fetch flights:", e); }
  }

  /* ---- build airline filter checkboxes from data ---- */
  document.getElementById("airlineFilters").innerHTML = Object.values(AIRLINES).map(a =>
    `<label class="check"><input type="checkbox" class="f-airline" value="${a.code}" /> ${a.name}</label>`
  ).join("");

  /* ---- localize sort options ---- */
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

  /* ---- core: filter + sort the data ---- */
  function getResults() {
    const lang = I18nStore.get();
    let list = FLIGHTS.filter(f => {
      // query param prefilter
      if (state.to && f.to !== state.to) return false;
      if (state.from && f.from !== state.from) return false;

      if (state.stops.size && !state.stops.has(String(f.stops))) return false;
      if (state.airlines.size && !state.airlines.has(f.airline)) return false;
      if (f.price > state.maxPrice) return false;
      if (state.times.size && !state.times.has(timeBucket(f.dep))) return false;

      if (state.keyword) {
        const hay = [
          f.id, AIRLINES[f.airline].name,
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

  /* ---- render ---- */
  function render() {
    const lang = I18nStore.get();
    const list = getResults();
    document.getElementById("resultCount").textContent = list.length;
    const wrap = document.getElementById("flightList");

    if (!list.length) {
      wrap.innerHTML = `<div class="empty-state">
        ${ICONS.plane}
        <h3 data-i18n="empty.title"></h3>
        <p data-i18n="empty.sub"></p>
      </div>`;
      applyI18n();
      return;
    }

    wrap.innerHTML = list.map(f => {
      const al = AIRLINES[f.airline];
      const stopsTxt = f.stops === 0 ? t("flight.nonstop") : t("flight.stop");
      const cheapest = f.price === Math.min(...list.map(x => x.price));
      return `
      <article class="flight-card" data-id="${f.id}">
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
          ${cheapest ? '<span class="badge badge-dark" data-i18n="sort.cheapest"></span>' : `<span class="badge">${f.cls}</span>`}
          <div class="price">${fmtBaht(f.price)}</div>
          <div class="per" data-i18n="flight.perpax"></div>
          <button class="btn btn-dark book-btn" data-id="${f.id}" data-i18n="flight.book"></button>
        </div>
      </article>`;
    }).join("");
    applyI18n();
  }

  /* ---- debounce helper (prevents excessive re-render on typing) ---- */
  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  const debouncedRender = debounce(render, 280);

  /* ---- event delegation: one listener handles all filter controls ---- */
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

  // delegated booking buttons
  document.getElementById("flightList").addEventListener("click", async (e) => {
    const btn = e.target.closest(".book-btn");
    if (!btn) return;
    if (!Auth.isLoggedIn()) { location.href = "login.html"; return; }
    const f = FLIGHTS.find(x => x.id === btn.dataset.id);
    if (!f) return;
    try {
      const res = await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          flight_id:      f._dbId,
          passengers:     [{ first_name: Auth.get().name.split(" ")[0], last_name: Auth.get().name.split(" ").slice(1).join(" ") || "—", seat_number: "1A" }],
          payment_method: "credit_card",
          total_price:    f.price,
        }),
      });
      if (res.ok) { toast("toast.booked"); }
      else { const d = await res.json(); toast({ raw: true }, d.message || "Booking failed"); }
    } catch { toast("toast.booked"); }
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    state.stops.clear(); state.airlines.clear(); state.times.clear();
    state.keyword = ""; state.maxPrice = 32000; state.to = ""; state.from = "";
    document.querySelectorAll(".results-layout input[type=checkbox]").forEach(c => c.checked = false);
    document.getElementById("priceRange").value = 32000;
    document.getElementById("priceMax").textContent = fmtBaht(32000);
    document.getElementById("keyword").value = "";
    render();
  });

  function toggleSet(set, val, on) { on ? set.add(val) : set.delete(val); }

  /* ---- persist a booking into localStorage (continuity) ---- */
  function addBooking(f) {
    const KEY = "aeris_bookings";
    let bookings = [];
    try { bookings = JSON.parse(localStorage.getItem(KEY)) || []; } catch {}
    const ref = "AERIS-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    bookings.unshift({
      ref, type: "flight", status: "confirmed",
      airline: f.airline, flightNo: f.id, from: f.from, to: f.to,
      date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
      dep: f.dep, arr: f.arr, duration: f.duration,
      passengers: 1, cls: f.cls, seat: "—", gate: "—", total: f.price,
    });
    localStorage.setItem(KEY, JSON.stringify(bookings));
  }

  localizeSort();
  render();
  document.addEventListener("languagechange", () => { localizeSort(); render(); });
})();
