/* =========================================================
   app.js — shared shell: navbar, footer, language switch,
   auth state (localStorage), toasts, scroll reveal.
   Included on every page.
   ========================================================= */

const Auth = {
  TOKEN_KEY: "aeris_token",
  get() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { this.clear(); return null; }
      return { name: payload.full_name, email: payload.email, tier: "Gold" };
    } catch { return null; }
  },
  set(token) { localStorage.setItem(this.TOKEN_KEY, token); },
  clear() { localStorage.removeItem(this.TOKEN_KEY); },
  isLoggedIn() { return !!this.get(); },
  getToken() { return localStorage.getItem(this.TOKEN_KEY); },
  initials(user) {
    const u = user || this.get();
    if (!u || !u.name) return "U";
    return u.name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
  },
};

function apiFetch(url, options = {}) {
  const token = Auth.getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

/* ---------- Toast ---------- */
function toast(messageKey, opts = {}) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  const el = document.createElement("div");
  el.className = "toast";
  const msg = opts.raw ? messageKey : t(messageKey);
  el.innerHTML = `<span class="ic">${ICONS.check}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

/* ---------- Custom <select> → airport-style popover dropdown ----------
   Keeps the underlying <select> (value + change events still work) but
   renders a pill trigger + rounded option list like the airport picker. */
function ensureCselGlobalClose() {
  if (window.__cselGlobalClose) return;
  window.__cselGlobalClose = true;
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".csel.open").forEach(w => {
      if (w.contains(e.target)) return;
      w.classList.remove("open");
      const p = w.querySelector(".csel-pop"); if (p) p.hidden = true;
      w.querySelector(".csel-trigger")?.setAttribute("aria-expanded", "false");
    });
  });
}
function enhanceSelect(sel, opts = {}) {
  if (!sel || sel.dataset.csel) return;
  sel.dataset.csel = "1";
  const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  const wrap = document.createElement("div");
  wrap.className = "csel" + (opts.align === "right" ? " csel-right" : "");
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "csel-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  const pop = document.createElement("div");
  pop.className = "csel-pop";
  pop.hidden = true;

  const renderTrigger = () => {
    const cur = sel.options[sel.selectedIndex];
    trigger.innerHTML =
      (opts.icon ? `<span class="csel-ico">${opts.icon}</span>` : "") +
      `<span class="csel-val">${cur ? cur.textContent : ""}</span>` +
      `<span class="csel-chev">${CHEV}</span>`;
  };
  const renderList = () => {
    pop.innerHTML = [...sel.options].map(o =>
      `<button type="button" class="csel-item ${o.value === sel.value ? "selected" : ""}" data-val="${o.value}">
         <span>${o.textContent}</span>${o.value === sel.value ? ICONS.check : ""}
       </button>`).join("");
  };
  const open = () => { renderList(); pop.hidden = false; wrap.classList.add("open"); trigger.setAttribute("aria-expanded", "true"); };
  const close = () => { pop.hidden = true; wrap.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); };

  trigger.addEventListener("click", () => { pop.hidden ? open() : close(); });
  pop.addEventListener("click", (e) => {
    const it = e.target.closest("[data-val]");
    if (!it) return;
    if (sel.value !== it.dataset.val) {
      sel.value = it.dataset.val;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    renderTrigger();
    close();
  });
  ensureCselGlobalClose();   // one shared outside-click handler for all dropdowns

  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(trigger);
  wrap.appendChild(pop);
  wrap.appendChild(sel);
  sel.style.display = "none";
  sel.addEventListener("change", renderTrigger);
  sel._refreshCsel = renderTrigger;    // call after re-localizing the options
  renderTrigger();
}

/* ---------- Navbar + footer injection ---------- */
function brandMark(extraClass = "") {
  return `<a href="index.html" class="brand ${extraClass}">
      <span class="brand-mark">${ICONS.planeUp}</span>
      <span>AERIS</span>
    </a>`;
}

function buildNav(active) {
  const user = Auth.get();
  const links = [
    { key: "nav.home",     href: "index.html",    id: "home" },
    { key: "nav.flights",  href: "index.html#book", id: "flights" },
    { key: "nav.bookings", href: "bookings.html", id: "bookings" },
  ];
  const navLinks = links.map(l =>
    `<a class="nav-link ${active === l.id ? "active" : ""}" href="${l.href}" data-i18n="${l.key}"></a>`
  ).join("");

  const right = user
    ? `<a href="profile.html" class="avatar-chip">
         <span class="avatar">${Auth.initials(user)}</span>
         <span class="btn-text-hide">${user.name.split(" ")[0]}</span>
       </a>
       <button class="btn btn-light" id="logoutBtn" data-i18n="nav.logout"></button>`
    : `<a href="login.html" class="btn btn-dark" data-i18n="nav.login"></a>`;

  const langSwitch = `
    <div class="lang-switch" role="group" aria-label="Language">
      <button data-lang="en">EN</button>
      <button data-lang="th">TH</button>
    </div>`;

  const mobileLinks = links.map(l =>
    `<a class="${active === l.id ? "active" : ""}" href="${l.href}" data-i18n="${l.key}"></a>`
  ).join("") + (user
    ? `<a href="profile.html" data-i18n="nav.profile"></a>`
    : `<a href="login.html" data-i18n="nav.login"></a>`);

  return `
  <header class="nav" id="siteNav">
    <div class="container nav-inner">
      ${brandMark()}
      <nav class="nav-pill">${navLinks}</nav>
      <div class="nav-right">
        ${langSwitch}
        ${right}
        <button class="nav-toggle" id="navToggle" data-i18n-aria="nav.menu">${ICONS.menu}</button>
      </div>
    </div>
    <div class="mobile-drawer" id="mobileDrawer">${mobileLinks}
      ${langSwitch}
    </div>
  </header>`;
}

function buildFooter() {
  return `
  <footer class="footer">
    <div class="container footer-top">
      <div>
        ${brandMark()}
        <p style="margin-top:14px" data-i18n="foot.tagline"></p>
        <div class="socials" style="margin-top:18px">
          <a href="#" aria-label="Twitter">${ICONS.twitter}</a>
          <a href="#" aria-label="Instagram">${ICONS.instagram}</a>
          <a href="#" aria-label="Facebook">${ICONS.facebook}</a>
        </div>
      </div>
      <div>
        <h4 data-i18n="foot.company"></h4>
        <ul>
          <li><a href="#" data-i18n="foot.about"></a></li>
          <li><a href="#" data-i18n="foot.careers"></a></li>
          <li><a href="#" data-i18n="foot.press"></a></li>
        </ul>
      </div>
      <div>
        <h4 data-i18n="foot.support"></h4>
        <ul>
          <li><a href="#" data-i18n="foot.help"></a></li>
          <li><a href="#" data-i18n="foot.contact"></a></li>
          <li><a href="#" data-i18n="foot.faq"></a></li>
        </ul>
      </div>
      <div>
        <h4 data-i18n="foot.legal"></h4>
        <ul>
          <li><a href="#" data-i18n="foot.terms"></a></li>
          <li><a href="#" data-i18n="foot.privacy"></a></li>
          <li><a href="#" data-i18n="foot.cookies"></a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© ${new Date().getFullYear()} AERIS. <span data-i18n="foot.rights"></span></span>
      <span>Bangkok · Tokyo · London · Singapore</span>
    </div>
  </footer>`;
}

/* ---------- Wire up shared behaviour ---------- */
function mountShell(activePage) {
  const navSlot = document.getElementById("nav-slot");
  const footSlot = document.getElementById("footer-slot");
  if (navSlot) navSlot.innerHTML = buildNav(activePage);
  if (footSlot) footSlot.innerHTML = buildFooter();

  // Language switch (event delegation on document — one listener)
  document.addEventListener("click", (e) => {
    const langBtn = e.target.closest(".lang-switch button");
    if (langBtn) {
      const lang = langBtn.dataset.lang;
      if (lang !== I18nStore.get()) {
        setLanguage(lang);
        toast("toast.lang");
      }
      return;
    }
    if (e.target.closest("#logoutBtn")) {
      Auth.clear();
      applyI18n();                 // refresh any user-dependent labels
      toast("toast.logout");
      setTimeout(() => location.href = "index.html", 700);
      return;
    }
    if (e.target.closest("#navToggle")) {
      document.getElementById("mobileDrawer")?.classList.toggle("open");
      return;
    }
  });

  // Nav shadow on scroll
  const nav = document.getElementById("siteNav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // Back button at the breadcrumb level (every page that has a page-head)
  const head = document.querySelector(".page-head");
  if (head && !head.querySelector(".back-btn")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-btn";
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg><span data-i18n="nav.back"></span>`;
    btn.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.href = "index.html";
    });
    head.prepend(btn);
  }

  applyI18n();
}

/* expose for inline page scripts */
window.AERIS = { Auth, toast, mountShell, applyI18n, I18nStore, t };
