/* =========================================================
   profile.js — profile page; requires a logged-in session.
   ========================================================= */
(function () {
  mountShell("profile");

  // gatekeeper: must be logged in
  const user = Auth.get();
  if (!user) { location.href = "login.html"; return; }

  // saved profile details (persisted across sessions, used to auto-fill checkout)
  const PROFILE_KEY = "aeris_profile";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch {}

  // fill identity
  document.getElementById("pAvatar").textContent = Auth.initials(user);
  document.getElementById("pName").textContent = user.name;
  document.getElementById("pEmail").textContent = user.email;
  document.getElementById("pfEmail").value = user.email;
  const parts = user.name.split(/\s+/);
  document.getElementById("firstName").value = saved.firstName || parts[0] || "";
  document.getElementById("lastName").value  = saved.lastName  || parts.slice(1).join(" ") || "";
  document.getElementById("phone").value = saved.phone || user.phone || "";
  ["nationality", "passport", "dob", "address"].forEach(id => {
    if (saved[id]) document.getElementById(id).value = saved[id];
  });

  // icons
  document.getElementById("ic1").innerHTML = ICONS.ticket;
  document.getElementById("ic2").innerHTML = ICONS.plane;

  // side nav — sections (no href) switch in-page; links navigate away
  const sideItems = [
    { key: "side.overview", ic: ICONS.grid,   section: "secOverview", active: true },
    { key: "information",   ic: ICONS.user,   section: "secPersonal" },
    { key: "side.bookings", ic: ICONS.ticket, href: "bookings.html" },
    { key: "side.payment",  ic: ICONS.card,   section: "secPayment" },
  ];

  document.getElementById("sideNav").innerHTML = sideItems.map(i =>
    `<li><a ${i.href ? `href="${i.href}"` : `href="#" data-section="${i.section}"`}
        class="${i.active ? "active" : ""}">${i.ic}<span data-i18n="${i.key}"></span></a></li>`
  ).join("");

  // section switching
  const allSections = ["secOverview", "secPersonal", "secPayment"];
  document.getElementById("sideNav").addEventListener("click", (e) => {
    const link = e.target.closest("a[data-section]");
    if (!link) return;
    e.preventDefault();
    const target = link.dataset.section;
    allSections.forEach(id => {
      document.getElementById(id).hidden = (id !== target);
    });
    document.querySelectorAll("#sideNav a").forEach(a =>
      a.classList.toggle("active", a.dataset.section === target)
    );
  });

  function localizeSelects() {
    document.querySelectorAll("select option[data-i18n-opt]").forEach(o =>
      o.textContent = t(o.getAttribute("data-i18n-opt")));
  }

  // edit toggle
  let editing = false;
  const inputs = ["firstName", "lastName", "phone", "nationality", "passport", "dob", "address"];
  const editBtn = document.getElementById("editBtn");

  function setEditing(on) {
    editing = on;
    inputs.forEach(id => document.getElementById(id).disabled = !on);
    document.getElementById("saveBtn").style.display = on ? "" : "none";
    // when editing, show a close glyph; otherwise the translated "Edit" label
    editBtn.setAttribute("data-i18n", on ? "" : "panel.edit");
    editBtn.textContent = on ? "✕" : t("panel.edit");
  }

  editBtn.addEventListener("click", () => setEditing(!editing));

  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    // persist all detail fields so checkout can auto-fill them later
    const profile = {};
    ["firstName", "lastName", "phone", "nationality", "passport", "dob", "address"].forEach(id => {
      profile[id] = document.getElementById(id).value.trim();
    });
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    // update the displayed name (do NOT touch the JWT token in Auth)
    const name = `${profile.firstName} ${profile.lastName}`.trim() || user.name;
    setEditing(false);
    document.getElementById("pName").textContent = name;
    document.getElementById("pAvatar").textContent = Auth.initials({ name });
    toast("toast.saved");
  });

  // fetch real booking stats from backend
  apiFetch('/api/bookings')
    .then(res => res.json())
    .then(bookings => {
      const now = new Date()
      const totalTrips = bookings.length
      const upcoming   = bookings.filter(b =>
        b.status !== 'cancelled' && new Date(b.departure_time) > now
      ).length

      document.getElementById('tileTrips').textContent    = totalTrips
      document.getElementById('tileUpcoming').textContent = upcoming
    })
    .catch(() => {
      document.getElementById('tileTrips').textContent    = '—'
      document.getElementById('tileUpcoming').textContent = '—'
    })

  // fetch personalized recommendations
  apiFetch('/api/bookings/recommendations')
    .then(res => res.json())
    .then(recs => {
      const wrap = document.getElementById('recList')
      if (!recs.length) {
        wrap.innerHTML = '<span class="muted">Book a flight to get personalised recommendations.</span>'
        return
      }
      wrap.innerHTML = recs.map(r => `
        <a href="flights.html?to=${r.destination_code}" style="
          display:flex;flex-direction:column;gap:4px;padding:14px 18px;
          background:var(--bg-soft,#f5f5f5);border-radius:12px;
          text-decoration:none;color:inherit;min-width:130px;flex:1 1 130px">
          <span style="font-size:1.3rem;font-weight:700">${r.destination_code}</span>
          <span style="font-size:.85rem;font-weight:500">${r.destination_city}</span>
          <span style="font-size:.75rem;color:#888">${r.destination_country}</span>
          <span style="font-size:.75rem;color:#888;margin-top:2px">
            &#9992; ${r.popularity} traveller${r.popularity > 1 ? 's' : ''}
          </span>
        </a>`).join('')
    })
    .catch(() => {
      const wrap = document.getElementById('recList')
      if (wrap) wrap.innerHTML = '<span class="muted">Could not load recommendations.</span>'
    })

  // ── Payment section ──
  // Uses the same key + field names as checkout.js so saved card auto-fills at checkout
  const CARD_KEY = 'aeris_payment';

  // load saved card on page open
  const savedCard = (() => { try { return JSON.parse(localStorage.getItem(CARD_KEY)) || {} } catch { return {} } })();
  if (savedCard.cardNumber) document.getElementById('cardNumber').value = savedCard.cardNumber;
  if (savedCard.cardName)   document.getElementById('cardHolder').value = savedCard.cardName;
  if (savedCard.exp)        document.getElementById('cardExp').value    = savedCard.exp;

  // input formatting
  const secPayment = document.getElementById('secPayment');
  secPayment.addEventListener('input', (e) => {
    if (e.target.id === 'cardNumber') {
      const v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    }
    if (e.target.id === 'cardExp') {
      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
      e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
      const month = parseInt(v.slice(0, 2), 10);
      const err = document.getElementById('cardExpErr');
      const invalid = v.length >= 2 && (month < 1 || month > 12);
      err.style.display = invalid ? '' : 'none';
      e.target.style.borderColor = invalid ? '#e53e3e' : '';
    }

  });

  // save card — stored with checkout.js field names so checkout auto-fills
  document.getElementById('saveCardBtn').addEventListener('click', () => {
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardName   = document.getElementById('cardHolder').value.trim();
    const exp        = document.getElementById('cardExp').value.trim();
    const month      = parseInt(exp.replace(/\D/g, '').slice(0, 2), 10);
    if (!cardNumber || !cardName || !exp) return;
    if (!month || month < 1 || month > 12) {
      document.getElementById('cardExpErr').style.display = '';
      document.getElementById('cardExp').style.borderColor = '#e53e3e';
      return;
    }
    localStorage.setItem(CARD_KEY, JSON.stringify({ method: 'card', cardNumber, cardName, exp }));
    toast('toast.saved');
  });

  localizeSelects();
  applyI18n();
  document.addEventListener("languagechange", localizeSelects);
})();
