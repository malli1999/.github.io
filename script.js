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

// ===== Constellation / low-poly background (sparser)
(() => {
  const c = document.getElementById("bg-canvas");
  if (!c) return;
  const ctx = c.getContext("2d", { alpha: true });

  // ---------- Tunables (edit these to taste) ----------
  const NODE_DENSITY = 0.040;     // ↓ fewer nodes (was 0.08)
  const SPEED_PX_SEC = 28;        // same speed for all nodes
  const CONNECT_DIST = 120;       // ↓ shorter link distance (was 160)
  const TRI_ALPHA  = 0.030;       // triangle fill opacity
  const TRIANGLE_FACTOR = 0.65;   // fill triangles only if BOTH neighbors are < 65% of CONNECT_DIST
  const DOT_RADIUS = 2;
  const LINE_ALPHA = 0.25;
  const HUE = 225;
  // ----------------------------------------------------

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, nodes = [], linkMax2 = 0, triMax2 = 0;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    W = Math.round(innerWidth * dpr);
    H = Math.round(innerHeight * dpr);
    c.width = W; c.height = H;
    c.style.width = innerWidth + "px";
    c.style.height = innerHeight + "px";

    const n = Math.max(30, Math.min(110, Math.round(innerWidth * NODE_DENSITY)));
    const v = SPEED_PX_SEC * dpr;

    nodes = Array.from({ length: n }, () => {
      const ang = rand(0, Math.PI * 2);
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
      };
    });

    linkMax2 = Math.pow(CONNECT_DIST * dpr, 2);
    triMax2  = Math.pow(CONNECT_DIST * TRIANGLE_FACTOR * dpr, 2);
  }

  function bg() {
    const g = ctx.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.2, H * 0.1, Math.max(W, H));
    g.addColorStop(0, "#1b2553");
    g.addColorStop(0.4, "#0e122a");
    g.addColorStop(1, "#070a18");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    // lines & nearest-neighbor tracking
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = `hsla(${HUE}, 70%, 78%, ${LINE_ALPHA})`;

    const nearest = new Array(nodes.length); // {a, b, d1, d2}

    for (let i = 0; i < nodes.length; i++) {
      let a = -1, b = -1, d1 = Infinity, d2 = Infinity;

      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d2ij = dx * dx + dy * dy;

        if (d2ij <= linkMax2) {
          // draw line i—j
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();

          // track two closest within link range
          if (d2ij < d1) { d2 = d1; b = a; d1 = d2ij; a = j; }
          else if (d2ij < d2) { d2 = d2ij; b = j; }
        }
      }
      nearest[i] = (a >= 0 && b >= 0) ? { a, b, d1, d2 } : null;
    }

    // subtle triangle fill (only when both neighbors are close)
    if (TRI_ALPHA > 0) {
      ctx.fillStyle = `hsla(${HUE}, 70%, 70%, ${TRI_ALPHA})`;
      nearest.forEach((nfo, i) => {
        if (!nfo || nfo.d1 > triMax2 || nfo.d2 > triMax2) return;
        const { a, b } = nfo;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.closePath();
        ctx.fill();
      });
    }

    // dots
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

    for (const p of nodes) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > W) p.vx *= -1, p.x = Math.max(0, Math.min(W, p.x));
      if (p.y < 0 || p.y > H) p.vy *= -1, p.y = Math.max(0, Math.min(H, p.y));
    }

    bg();
    draw();

    if (!reduceMotion) requestAnimationFrame(tick);
  }

  resize(); bg(); if (!reduceMotion) requestAnimationFrame(tick);
  addEventListener("resize", resize, { passive: true });
})();
