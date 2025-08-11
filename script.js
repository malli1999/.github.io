// ===== Footer year
const yEl = document.getElementById("y");
if (yEl) yEl.textContent = new Date().getFullYear();

// ===== Experience accordion
document.querySelectorAll(".exp-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    const panel = btn.nextElementSibling;
    panel.hidden = expanded;
  });
});

// ===== Constellation / low-poly background
(() => {
  const c = document.getElementById("bg-canvas");
  if (!c) return;
  const ctx = c.getContext("2d", { alpha: true });

  // ---------- Tunables ----------
  const NODE_DENSITY = 0.08;      // nodes per vw (bigger -> more nodes)
  const SPEED_PX_SEC = 28;        // same speed for every node
  const CONNECT_DIST = 160;       // link threshold (px)
  const DOT_RADIUS = 2;           // node radius (px)
  const LINE_ALPHA = 0.25;        // line opacity
  const TRI_ALPHA  = 0.035;       // triangle fill opacity (very subtle)
  const HUE = 225;                // base hue (blue-ish)
  // ------------------------------

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, nodes = [], max2 = 0;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    W = Math.round(innerWidth * dpr);
    H = Math.round(innerHeight * dpr);
    c.width = W; c.height = H;
    c.style.width = innerWidth + "px";
    c.style.height = innerHeight + "px";

    // number of nodes scales with width; clamp for perf
    const n = Math.max(40, Math.min(140, Math.round(innerWidth * NODE_DENSITY)));
    nodes = Array.from({ length: n }, () => {
      // all nodes share the same speed magnitude; random direction
      const ang = rand(0, Math.PI * 2);
      const v = SPEED_PX_SEC * dpr;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
      };
    });

    max2 = Math.pow(CONNECT_DIST * dpr, 2);
  }

  function bg() {
    const g = ctx.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.2, H * 0.1, Math.max(W, H));
    g.addColorStop(0, "#1b2553");
    g.addColorStop(0.4, "#0e122a");
    g.addColorStop(1, "#070a18");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    // lines & triangles
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = `hsla(${HUE}, 70%, 78%, ${LINE_ALPHA})`;

    // For triangle fill: store 2 nearest neighbors for each node
    const nearest2 = new Array(nodes.length);

    for (let i = 0; i < nodes.length; i++) {
      let n1 = -1, n2 = -1, d1 = Infinity, d2 = Infinity;

      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d2ij = dx * dx + dy * dy;

        if (d2ij <= max2) {
          // line i-j
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();

          // track nearest neighbors
          if (d2ij < d1) { d2 = d1; n2 = n1; d1 = d2ij; n1 = j; }
          else if (d2ij < d2) { d2 = d2ij; n2 = j; }
        }
      }
      nearest2[i] = (n1 >= 0 && n2 >= 0) ? [n1, n2] : null;
    }

    // very subtle low-poly triangle fill
    ctx.fillStyle = `hsla(${HUE}, 70%, 70%, ${TRI_ALPHA})`;
    nearest2.forEach((pair, i) => {
      if (!pair) return;
      const [a, b] = pair;
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.closePath();
      ctx.fill();
    });

    // dots on top
    ctx.fillStyle = `hsla(${HUE}, 80%, 85%, .9)`;
    for (const p of nodes) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, DOT_RADIUS * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;

    // update positions (all same speed magnitude)
    for (const p of nodes) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // bounce on edges
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > W) { p.x = W; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > H) { p.y = H; p.vy *= -1; }
    }

    bg();
    draw();

    if (!reduceMotion) requestAnimationFrame(tick);
  }

  resize(); bg(); if (!reduceMotion) requestAnimationFrame(tick);
  addEventListener("resize", resize, { passive: true });
})();
