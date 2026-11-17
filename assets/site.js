// Shared behaviour for every page: theme toggle, phone menu, header edge, project filter, copy email, pipeline flows.
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

  // Project pages: draw a wire through the pipeline's stages and run a packet along it. Each stage lights up while the
  // packet is inside it. The stages are ordinary list items, so without JavaScript they still read as numbered steps.
  const NS = "http://www.w3.org/2000/svg";
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-flow]").forEach(box => {
    const svg = box.querySelector(".wire"), nodes = [...box.querySelectorAll("li")];
    if (!svg || nodes.length < 2) return;
    const el = (tag, cls) => { const x = document.createElementNS(NS, tag); x.setAttribute("class", cls); svg.appendChild(x); return x; };
    const trace = el("path", "trace"), lit = el("path", "lit"), pkt = el("circle", "pkt");
    pkt.setAttribute("r", "4.5");
    let len = 0, ranges = [], raf = 0, visible = false, t0 = performance.now();
    const SPEED = 170, REST = 0.9;                      // px per second; seconds of rest between runs

    const rounded = pts => {                             // orthogonal polyline with soft corners
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
        const r = Math.min(12, Math.hypot(bx - ax, by - ay) / 2, Math.hypot(cx - bx, cy - by) / 2);
        const ux = Math.sign(bx - ax), uy = Math.sign(by - ay), vx = Math.sign(cx - bx), vy = Math.sign(cy - by);
        d += ` L${bx - ux * r},${by - uy * r} Q${bx},${by} ${bx + vx * r},${by + vy * r}`;
      }
      const z = pts[pts.length - 1];
      return d + ` L${z[0]},${z[1]}`;
    };

    const layout = () => {
      const b = box.getBoundingClientRect();
      const R = nodes.map(n => { const r = n.getBoundingClientRect(); return { l: r.left - b.left, r: r.right - b.left, t: r.top - b.top, b: r.bottom - b.top, cx: (r.left + r.right) / 2 - b.left, cy: (r.top + r.bottom) / 2 - b.top }; });
      const pts = [[R[0].cx, R[0].cy]];
      for (let i = 1; i < R.length; i++) {
        const a = R[i - 1], n = R[i];
        if (Math.abs(n.cy - a.cy) < 4 || Math.abs(n.cx - a.cx) < 4) { pts.push([n.cx, n.cy]); continue; }
        const xr = a.r + 22, ym = (a.b + n.t) / 2, xl = n.l - 22;   // carriage return through the gutters
        pts.push([xr, a.cy], [xr, ym], [xl, ym], [xl, n.cy], [n.cx, n.cy]);
      }
      const d = rounded(pts);
      trace.setAttribute("d", d); lit.setAttribute("d", d);
      len = trace.getTotalLength();
      ranges = R.map(r => {                              // where along the wire the packet is inside each stage
        let lo = Infinity, hi = -Infinity;
        for (let l = 0; l <= len; l += 3) { const p = trace.getPointAtLength(l); if (p.x >= r.l && p.x <= r.r && p.y >= r.t && p.y <= r.b) { lo = Math.min(lo, l); hi = Math.max(hi, l); } }
        return [lo, hi];
      });
      lit.style.strokeDasharray = `0 ${len + 1}`;
      if (still.matches) { pkt.style.display = "none"; nodes.forEach(n => n.classList.remove("on")); }
      else pkt.style.display = "";
    };

    const frame = now => {
      const total = len / SPEED + REST, t = ((now - t0) / 1000) % total, l = t * SPEED;
      const moving = l <= len;
      const p = trace.getPointAtLength(Math.min(l, len));
      pkt.setAttribute("cx", p.x); pkt.setAttribute("cy", p.y);
      pkt.style.opacity = moving ? 1 : 0;
      lit.style.strokeDasharray = moving ? `${l} ${len + 1}` : `0 ${len + 1}`;
      nodes.forEach((n, i) => n.classList.toggle("on", moving && l >= ranges[i][0] - 2 && l <= ranges[i][1] + 2));
      raf = visible && !document.hidden && !still.matches ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => { if (!raf && visible && !document.hidden && !still.matches && len) raf = requestAnimationFrame(frame); };

    new ResizeObserver(() => { layout(); kick(); }).observe(box);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }, { rootMargin: "60px" }).observe(box);
    document.addEventListener("visibilitychange", kick);
    still.addEventListener("change", () => { layout(); kick(); });
  });
})();
