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
  ["phone", "nationality", "passport", "dob", "address"].forEach(id => {
    if (saved[id]) document.getElementById(id).value = saved[id];
  });

  // icons
  document.getElementById("tierStar").innerHTML = ICONS.star;
  document.getElementById("ic1").innerHTML = ICONS.ticket;
  document.getElementById("ic2").innerHTML = ICONS.globe;
  document.getElementById("ic3").innerHTML = ICONS.plane;

  // side nav
  const sideItems = [
    { key: "side.overview", ic: ICONS.grid,       href: "profile.html", active: true },
    { key: "side.personal", ic: ICONS.idCard,     href: "#" },
    { key: "side.bookings", ic: ICONS.ticket,     href: "bookings.html" },
    { key: "side.payment",  ic: ICONS.card,       href: "payment.html" },
    { key: "side.settings", ic: ICONS.gear,       href: "#" },
  ];
  document.getElementById("sideNav").innerHTML = sideItems.map(i =>
    `<li><a href="${i.href}" class="${i.active ? "active" : ""}">${i.ic}<span data-i18n="${i.key}"></span></a></li>`
  ).join("");

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

  localizeSelects();
  applyI18n();
  document.addEventListener("languagechange", localizeSelects);
})();
