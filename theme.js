(function () {
  "use strict";

  var KEY = "cc-theme";
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var params = new URLSearchParams(location.search);
  var param = params.get("theme");
  var mode = param && ["light", "dark", "system"].indexOf(param) !== -1 ? param : null;

  if (!mode) {
    try {
      mode = localStorage.getItem(KEY) || "system";
    } catch (e) {
      mode = "system";
    }
  }
  if (["light", "dark", "system"].indexOf(mode) === -1) mode = "system";

  function resolved(m) {
    if (m === "system") return media && media.matches ? "dark" : "light";
    return m;
  }

  function apply(m) {
    root.setAttribute("data-theme", resolved(m));
    root.setAttribute("data-theme-mode", m);
    document.querySelectorAll("[data-theme-choice]").forEach(function (btn) {
      var on = btn.getAttribute("data-theme-choice") === m;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function set(m) {
    if (["light", "dark", "system"].indexOf(m) === -1) return;
    mode = m;
    try {
      localStorage.setItem(KEY, m);
    } catch (e) { /* storage non disponibile */ }
    apply(m);
  }

  apply(mode);
  if (param) {
    try {
      localStorage.setItem(KEY, mode);
    } catch (e) { /* storage non disponibile */ }
  }

  if (media && media.addEventListener) {
    media.addEventListener("change", function () {
      if (mode === "system") apply("system");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(mode);
    document.querySelectorAll("[data-theme-choice]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        set(btn.getAttribute("data-theme-choice"));
      });
    });
  });

  window.CCTheme = { set: set, apply: apply, mode: function () { return mode; } };
})();
