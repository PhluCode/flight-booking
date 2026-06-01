/* =========================================================
   auth.js — login / register with client-side validation.
   (UI only — no real backend yet. Stores a mock session.)
   ========================================================= */
(function () {
  mountShell(null);

  // decorative icons
  document.getElementById("asideMark").innerHTML = ICONS.planeUp;
  document.getElementById("asidePlane").innerHTML = ART.jetSide;
  ["t1", "t2", "t3"].forEach(id => document.getElementById(id).innerHTML = ICONS.check);
  document.getElementById("googleBtn").innerHTML = ICONS.google + " Google";
  document.getElementById("fbBtn").innerHTML = ICONS.facebook + " Facebook";
  document.querySelectorAll(".toggle-pass").forEach(b => b.innerHTML = ICONS.eye);

  let mode = "login"; // login | register

  function setMode(next) {
    mode = next;
    document.querySelectorAll(".auth-switch button").forEach(b =>
      b.classList.toggle("active", b.dataset.mode === mode));
    const reg = mode === "register";
    document.getElementById("nameField").style.display = reg ? "" : "none";
    document.getElementById("confirmField").style.display = reg ? "" : "none";
    document.getElementById("agreeRow").style.display = reg ? "" : "none";
    document.getElementById("loginRow").style.display = reg ? "none" : "";
    document.getElementById("authTitle").setAttribute("data-i18n", reg ? "auth.register.title" : "auth.login.title");
    document.getElementById("authLede").setAttribute("data-i18n", reg ? "auth.register.lede" : "auth.login.lede");
    document.getElementById("submitBtn").setAttribute("data-i18n", reg ? "auth.register.btn" : "auth.login.btn");
    clearErrors();
    applyI18n();
  }

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach(e => e.textContent = "");
    document.querySelectorAll(".input").forEach(i => i.classList.remove("invalid"));
  }
  function showError(field, key) {
    const box = document.querySelector(`[data-err="${field}"]`);
    if (box) box.textContent = t(key);
    document.getElementById(field)?.classList.add("invalid");
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    clearErrors();
    let ok = true;
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value;

    if (mode === "register") {
      const name = document.getElementById("name").value.trim();
      if (!name) { showError("name", "err.required"); ok = false; }
    }
    if (!email) { showError("email", "err.required"); ok = false; }
    else if (!emailRe.test(email)) { showError("email", "err.email"); ok = false; }

    if (!pass) { showError("password", "err.required"); ok = false; }
    else if (pass.length < 6) { showError("password", "err.password"); ok = false; }

    if (mode === "register") {
      const confirm = document.getElementById("confirm").value;
      if (confirm !== pass) { showError("confirm", "err.match"); ok = false; }
      if (!document.getElementById("agree").checked) { showError("agree", "err.agree"); ok = false; }
    }
    return ok;
  }

  // tab switch
  document.querySelector(".auth-switch").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (b) setMode(b.dataset.mode);
  });

  // show/hide password (delegated)
  document.getElementById("authForm").addEventListener("click", (e) => {
    const tog = e.target.closest(".toggle-pass");
    if (!tog) return;
    const input = document.getElementById(tog.dataset.target);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    tog.innerHTML = show ? ICONS.eyeOff : ICONS.eye;
  });

  // submit — calls real backend API
  document.getElementById("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      let res, data;
      if (mode === "login") {
        res  = await apiFetch("/api/auth/login",    { method: "POST", body: JSON.stringify({ email, password }) });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
      } else {
        const full_name = document.getElementById("name").value.trim();
        res  = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ full_name, email, password }) });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");
      }
      Auth.set(data.token);
      toast(mode === "register" ? "toast.register" : "toast.login");
      setTimeout(() => location.href = "index.html", 800);
    } catch (err) {
      showError("email", err.message);
    }
  });

  // social mock (kept for UI, still mock)
  document.getElementById("googleBtn").addEventListener("click", () => toast("toast.login"));
  document.getElementById("fbBtn").addEventListener("click",     () => toast("toast.login"));

  setMode("login");
})();
