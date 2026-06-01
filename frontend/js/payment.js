/* =========================================================
   payment.js — manage a saved payment method.
   Saves to localStorage "aeris_payment" so checkout can
   auto-fill it. For safety we NEVER store the CVV — the user
   re-enters it at checkout (same as real booking sites).
   ========================================================= */
(function () {
  mountShell("profile");

  if (!Auth.isLoggedIn()) { location.href = "login.html"; return; }

  const KEY = "aeris_payment";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}

  let method = saved.method || "card";

  const $ = (id) => document.getElementById(id);

  function maskCard(num) {
    const d = (num || "").replace(/\s/g, "");
    return d ? "•••• •••• •••• " + d.slice(-4) : "";
  }

  function renderSaved() {
    const box = $("savedCard");
    if (saved.method === "card" && saved.cardNumber) {
      box.innerHTML = `
        <div class="pm-saved">
          <div class="pm-card-visual">
            <div class="pm-card-brand">${ICONS.card} AERIS</div>
            <div class="pm-card-num">${maskCard(saved.cardNumber)}</div>
            <div class="pm-card-row"><span>${saved.cardName || ""}</span><span>${saved.exp || ""}</span></div>
          </div>
          <p class="muted" data-i18n="pm.savedcard"></p>
        </div>`;
    } else if (saved.method === "promptpay") {
      box.innerHTML = `<div class="pm-saved"><p class="muted" data-i18n="pm.savedpp"></p></div>`;
    } else {
      box.innerHTML = `<p class="muted" data-i18n="pm.none"></p>`;
    }
    applyI18n();
  }

  function syncMethod() {
    document.querySelectorAll("#pmMethods .pay-opt").forEach(o =>
      o.classList.toggle("checked", o.dataset.method === method));
    $("pmCardFields").style.display = method === "card" ? "" : "none";
  }

  // prefill form from saved
  if (saved.cardName) $("cardName").value = saved.cardName;
  if (saved.cardNumber) $("cardNumber").value = saved.cardNumber;
  if (saved.exp) $("cardExp").value = saved.exp;

  renderSaved();
  syncMethod();

  // method toggle
  $("pmMethods").addEventListener("click", (e) => {
    const opt = e.target.closest(".pay-opt[data-method]");
    if (!opt) return;
    method = opt.dataset.method;
    syncMethod();
  });

  // card formatting
  document.addEventListener("input", (e) => {
    if (e.target.id === "cardNumber") {
      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
      e.target.value = v.replace(/(.{4})/g, "$1 ").trim();
    }
    if (e.target.id === "cardExp") {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
    }
  });

  // save
  $("pmSave").addEventListener("click", () => {
    const err = $("pmErr");
    err.textContent = "";
    if (method === "card") {
      const name = $("cardName").value.trim();
      const num = $("cardNumber").value.replace(/\s/g, "");
      const exp = $("cardExp").value.trim();
      if (!name) { err.textContent = t("co.err.cardname"); return; }
      if (!/^\d{13,16}$/.test(num)) { err.textContent = t("co.err.cardnum"); return; }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) { err.textContent = t("co.err.exp"); return; }
      saved = { method, cardName: name, cardNumber: $("cardNumber").value.trim(), exp };
    } else {
      saved = { method: "promptpay" };
    }
    localStorage.setItem(KEY, JSON.stringify(saved));
    renderSaved();
    toast("pm.saved");
  });

  document.addEventListener("languagechange", renderSaved);
})();
