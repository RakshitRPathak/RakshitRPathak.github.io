// Shared behaviour for every page: theme toggle, phone menu, header edge, project filter, copy email.
(() => {
  const root = document.documentElement;
  const store = {
    get() { try { return localStorage.getItem("theme"); } catch (_) { return null; } },
    set(v) { try { localStorage.setItem("theme", v); } catch (_) {} }
  };
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = document.querySelector(".theme");
  const label = () => theme && theme.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
  if (theme) {
    label();
    theme.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.dataset.theme = next; store.set(next); label();
    });
  }

  const menu = document.querySelector(".menu"), mnav = document.getElementById("mnav");
  if (menu && mnav) {
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") === "true";
      menu.setAttribute("aria-expanded", String(!open));
      menu.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mnav.hidden = open;
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !mnav.hidden) { mnav.hidden = true; menu.setAttribute("aria-expanded", "false"); menu.setAttribute("aria-label", "Open menu"); menu.focus(); }
    });
  }

  const top = document.querySelector(".top");
  const edge = () => top && top.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", edge, { passive: true }); edge();

  // Projects page: filter by area. Without JavaScript every project shows.
  const tabs = document.querySelector("[data-tabs]");
  if (tabs) {
    const cards = [...document.querySelectorAll("[data-track]")];
    const count = document.querySelector("[data-count]");
    const apply = k => {
      let n = 0;
      cards.forEach(c => { const show = k === "all" || c.dataset.track === k; c.hidden = !show; if (show) n++; });
      tabs.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.filter === k)));
      if (count) count.textContent = n === 1 ? "1 project" : `${n} projects`;
    };
    tabs.hidden = false;
    tabs.addEventListener("click", e => { const b = e.target.closest("button[data-filter]"); if (b) { apply(b.dataset.filter); history.replaceState(null, "", b.dataset.filter === "all" ? location.pathname : "#" + b.dataset.filter); } });
    const start = location.hash.slice(1);
    apply(tabs.querySelector(`[data-filter="${start}"]`) ? start : "all");
  }

  const copy = document.getElementById("copy");
  if (copy) {
    copy.hidden = false;
    copy.addEventListener("click", () => {
      const t = document.getElementById("toast"), addr = document.getElementById("addr");
      const done = () => { t.textContent = "Address copied."; };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(addr); const s = getSelection(); s.removeAllRanges(); s.addRange(r); t.textContent = "Address selected. Press Ctrl+C or ⌘C to copy it."; };
      try { navigator.clipboard.writeText(addr.textContent.trim()).then(done, fallback); } catch (_) { fallback(); }
    });
  }
})();
