// Home-page hero: a tiled matrix multiply C = A x B drawn as its 3D iteration space.
// Every point inside the cube is one multiply-add (i, j, k). A sits on the left face (i, k), B on the top face (k, j)
// and C on the front face (i, j). One thread block's T x T tile of C is computed at a time: at each step it reads a
// K-chunk of A and B (teal, data movement) and the multiply-adds it has finished build up in amber (compute).
// Raw WebGL 1, no libraries. Falls back to nothing (the caption still explains) when WebGL is missing, and draws one
// still frame when the visitor prefers reduced motion.
(() => {
  const canvas = document.getElementById("gemm");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: true, alpha: true });
  if (!gl) { canvas.closest("figure").classList.add("no-gl"); return; }

  const N = 16, T = 4, KC = 4;                       // 16^3 iteration space, 4x4 tiles, K read in chunks of 4
  const TILES = (N / T) * (N / T), STEPS = N / KC;
  const STEP_S = 0.55, TILE_S = STEP_S * STEPS, CYCLE_S = TILE_S * TILES + 2.5;

  // ---- geometry: one vertex per point, kind 0 = multiply-add, 1 = A, 2 = B, 3 = C
  const pts = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) pts.push(i, j, k, 0);
  // the cube's 12 edges, as line segments (kind 4), drawn faintly so the volume reads as a volume
  const E = [];
  const c0 = -0.5, c1 = N - 0.5;
  const corners = []; for (const i of [c0, c1]) for (const j of [c0, c1]) for (const k of [c0, c1]) corners.push([i, j, k]);
  corners.forEach((a, x) => corners.forEach((b, y) => { if (y > x && [0, 1, 2].filter(d => a[d] !== b[d]).length === 1) E.push(...a, 4, ...b, 4); }));
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) pts.push(i, -1, k, 1);
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) pts.push(-1, j, k, 2);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) pts.push(i, j, -1, 3);
  const COUNT = pts.length / 4;
  const EDGE_START = COUNT, EDGE_COUNT = E.length / 4;
  pts.push(...E);

  const vs = `
    attribute vec4 a;
    uniform mat4 u_m; uniform vec2 u_tile; uniform float u_k, u_done, u_dpr, u_size;
    uniform vec3 u_compute, u_memory, u_dim;
    varying vec4 v_c;
    const float N = ${N}.0, T = ${T}.0, KC = ${KC}.0, GAP = 2.2;
    void main() {
      float i = a.x, j = a.y, k = a.z, kind = a.w;
      // position: j -> x, i -> -y, k -> z (toward the viewer is k = 0); the three matrices float GAP cells off the cube
      vec3 p = vec3(j, -i, -k);
      if (kind == 1.0) p.x = -GAP;
      if (kind == 2.0) p.y = GAP;
      if (kind == 3.0) p.z = GAP;
      p = (p - vec3((N - 1.0) * 0.5, -(N - 1.0) * 0.5, -(N - 1.0) * 0.5)) / N * 2.0;

      vec2 t = floor(vec2(i, j) / T);                 // which tile this point belongs to
      float tileIdx = t.x * (N / T) + t.y;
      float cur = u_tile.x * (N / T) + u_tile.y;
      bool rowsHit = floor(i / T) == u_tile.x, colsHit = floor(j / T) == u_tile.y;
      float kLo = floor(u_k / KC) * KC;
      bool kHit = k >= kLo && k < kLo + KC;

      vec3 c = u_dim; float alpha = 0.22, size = 0.75;
      if (kind == 0.0) {
        if (tileIdx == cur && k < u_k) { c = u_compute; alpha = 0.85; size = 1.0; }
        else if (mod(i, 3.0) == 0.0 && mod(j, 3.0) == 0.0 && mod(k, 3.0) == 0.0) { alpha = 0.3; size = 0.6; }
        else { alpha = 0.0; size = 0.0; }
      } else if (kind == 1.0) {                       // A[i, k]: read by the block when its rows and the K-chunk match
        if (rowsHit && kHit) { c = u_memory; alpha = 1.0; size = 1.25; } else alpha = 0.32;
      } else if (kind == 2.0) {                       // B[k, j]
        if (colsHit && kHit) { c = u_memory; alpha = 1.0; size = 1.25; } else alpha = 0.32;
      } else if (kind == 4.0) {                       // cube edge
        c = u_dim; alpha = 0.35;
      } else {                                        // C[i, j]: finished tiles stay amber, the current one fills in
        if (tileIdx < u_done) { c = u_compute; alpha = 0.7; size = 1.05; }
        else if (tileIdx == cur) { c = u_compute; alpha = 0.25 + 0.75 * (u_k / N); size = 1.15; }
        else alpha = 0.32;
      }
      vec4 clip = u_m * vec4(p, 1.0);
      gl_Position = clip;
      gl_PointSize = u_size * size * u_dpr * (5.2 / clip.w);
      v_c = vec4(c * alpha, alpha);                   // premultiplied
    }`;
  const fs = `
    precision mediump float;
    varying vec4 v_c;
    uniform float u_lines;
    void main() {
      if (u_lines > 0.5) { gl_FragColor = v_c; return; }
      vec2 q = abs(gl_PointCoord - 0.5);
      if (max(q.x, q.y) > 0.42) discard;              // small square cells, like a die shot
      gl_FragColor = v_c;
    }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.closest("figure").classList.add("no-gl"); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { m: U("u_m"), tile: U("u_tile"), k: U("u_k"), done: U("u_done"), dpr: U("u_dpr"), size: U("u_size"), compute: U("u_compute"), memory: U("u_memory"), dim: U("u_dim"), lines: U("u_lines") };
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);

  // ---- colours come from the page's CSS, so the scene follows the theme
  const hex = v => { v = v.trim().replace("#", ""); if (v.length === 3) v = [...v].map(x => x + x).join(""); const n = parseInt(v, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const colours = () => { const s = getComputedStyle(document.documentElement); gl.uniform3fv(u.compute, hex(s.getPropertyValue("--compute"))); gl.uniform3fv(u.memory, hex(s.getPropertyValue("--memory"))); gl.uniform3fv(u.dim, hex(s.getPropertyValue("--lattice"))); };
  colours();
  new MutationObserver(() => { colours(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { colours(); draw(); });

  // ---- camera: a three-quarter view that sways a little and leans toward the pointer
  const mul = (a, b) => { const o = new Array(16); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { let s = 0; for (let x = 0; x < 4; x++) s += a[x * 4 + r] * b[c * 4 + x]; o[c * 4 + r] = s; } return o; };
  const persp = (f, asp, n, fa) => { const t = 1 / Math.tan(f / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]; };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; };
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };
  const move = z => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1];

  const YAW = parseFloat(new URLSearchParams(location.search).get("yaw") || "0.62");
  let px = 0, py = 0, tx = 0, ty = 0;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  window.addEventListener("pointermove", e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };
  new ResizeObserver(() => { resize(); draw(); }).observe(canvas);

  let t0 = performance.now(), paused = 0, last = 0;
  function draw(now) {
    if (now === undefined) now = last || performance.now();
    last = now;
    const t = still.matches ? TILE_S * 5 + STEP_S * 2.6 : ((now - t0) / 1000) % CYCLE_S;
    const tileN = Math.min(Math.floor(t / TILE_S), TILES);
    const kNow = tileN >= TILES ? 0 : ((t - tileN * TILE_S) / TILE_S) * N;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    const sway = still.matches ? 0 : Math.sin(now / 9000) * 0.18;
    const yaw = YAW + sway + px * 0.35, pitch = 0.42 + py * 0.2;
    const w = canvas.width || 1, h = canvas.height || 1;
    const m = mul(persp(0.62, w / h, 0.1, 50), mul(move(-5.6), mul(rotX(pitch), rotY(yaw))));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(u.m, false, m);
    gl.uniform2f(u.tile, Math.floor(Math.min(tileN, TILES - 1) / (N / T)), Math.min(tileN, TILES - 1) % (N / T));
    gl.uniform1f(u.k, tileN >= TILES ? N : kNow);
    gl.uniform1f(u.done, tileN);
    gl.uniform1f(u.dpr, dpr);
    gl.uniform1f(u.size, Math.max(3.2, Math.min(canvas.clientWidth / 110, 5.5)));
    gl.uniform1f(u.lines, 0); gl.drawArrays(gl.POINTS, 0, COUNT);
    gl.uniform1f(u.lines, 1); gl.drawArrays(gl.LINES, EDGE_START, EDGE_COUNT);
    place(m);
  }

  // labels for the three matrices, positioned by projecting a point beside each face
  const fig = canvas.closest("figure");
  const labels = [["A", [N + 1.6, -2.2, N / 2]], ["B", [-2.2 - 1.8, N / 2, N / 2]], ["C", [N + 1.6, N / 2, -2.2]]].map(([t, at]) => {
    const s = document.createElement("span"); s.className = "mlabel"; s.textContent = t; s.setAttribute("aria-hidden", "true"); fig.appendChild(s); return [s, at];
  });
  function place(m) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const [s, [i, j, k]] of labels) {
      const p = [(j - (N - 1) / 2) / N * 2, (-i + (N - 1) / 2) / N * 2, (-k + (N - 1) / 2) / N * 2, 1];
      const c = [0, 1, 2, 3].map(r => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] * p[3]);
      s.style.transform = `translate(${canvas.offsetLeft + (c[0] / c[3] * 0.5 + 0.5) * w}px, ${canvas.offsetTop + (0.5 - c[1] / c[3] * 0.5) * h}px) translate(-50%, -50%)`;
    }
  }

  // run only while it can be seen
  let visible = true, raf = 0;
  const loop = now => { draw(now); raf = visible && !document.hidden && !still.matches ? requestAnimationFrame(loop) : 0; };
  const kick = () => { if (!raf && visible && !document.hidden && !still.matches) { t0 += performance.now() - (paused || performance.now()); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible) paused = performance.now(); kick(); }).observe(canvas);
  document.addEventListener("visibilitychange", () => { if (document.hidden) paused = performance.now(); else kick(); });
  still.addEventListener("change", () => { draw(); kick(); });
  resize(); draw(); kick();
})();
