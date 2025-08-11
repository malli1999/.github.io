// ===== Year in footer
const yEl = document.getElementById('y');
if (yEl) yEl.textContent = new Date().getFullYear();

// ===== Accordion for Experience
document.querySelectorAll('.exp-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const panel = btn.nextElementSibling;
    panel.hidden = expanded;
  });
});

// ===== Curvy ribbons background (all lines same speed)
(() => {
  const c = document.getElementById('bg-canvas');
  if (!c) return;
  const ctx = c.getContext('2d', { alpha: true });

  // ---- Tunables: push these if you want even more curve
  const ANGLE_DEG = -20;                 // tilt
  const COUNT_MIN = 10, COUNT_MAX = 20;  // how many ribbons
  const AMP1 = [48, 120];                // main wave amplitude (px)
  const LAM1 = [80, 180];                // main wavelength (px)
  const AMP2_RATIO = 0.5;                // secondary wave is 50% of AMP1
  const LAM2_RATIO = 0.55;               // secondary wave wavelength
  const WAVE_CYCLES_PER_SEC = 0.45;      // “wiggle” speed (same for all)
  const SLIDE_PX_PER_SEC = 80;           // slide speed across screen (same for all)
  const STEP_PX = 10;                    // segment step (smaller = smoother, heavier)

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W=0, H=0, diag=0, B={x:0,y:0}, N={x:0,y:0}, lines=[];
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    W = Math.round(innerWidth * dpr);
    H = Math.round(innerHeight * dpr);
    c.width = W; c.height = H;
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';

    const a = ANGLE_DEG * Math.PI/180;
    B = { x: Math.cos(a), y: Math.sin(a) };        // direction along the ribbon
    N = { x:-Math.sin(a), y: Math.cos(a) };        // perpendicular to ribbon
    diag = Math.hypot(W, H);
    initLines();
  }

  function rr(a,b){ return a + Math.random()*(b-a); }

  function initLines(){
    const count = Math.max(COUNT_MIN, Math.min(COUNT_MAX, Math.round(innerWidth/140)));
    lines = Array.from({length:count}, () => {
      const amp1 = rr(AMP1[0], AMP1[1]) * dpr;
      const lam1 = rr(LAM1[0], LAM1[1]) * dpr;
      return {
        amp1,
        lam1,
        amp2: amp1 * AMP2_RATIO,
        lam2: lam1 * LAM2_RATIO,
        w:   rr(1.6, 2.8) * dpr,
        hue: 220 + Math.random()*30,
        alpha: 0.10 + Math.random()*0.08,
        offset: rr(-diag, diag),         // position along the perpendicular
        ph0: Math.random()*Math.PI*2,    // phase for wave1
        ph1: Math.random()*Math.PI*2     // phase for wave2
      };
    });
  }

  function background(){
    const g = ctx.createRadialGradient(W*0.2, H*0.1, 0, W*0.2, H*0.1, Math.max(W,H));
    g.addColorStop(0, '#1b2553'); g.addColorStop(0.4, '#0e122a'); g.addColorStop(1, '#070a18');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  }

  function drawLine(L, phase){
    ctx.save();
    ctx.strokeStyle = `hsla(${L.hue},80%,72%,${L.alpha})`;
    ctx.lineWidth = L.w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = `hsla(${L.hue},90%,70%,${L.alpha*0.9})`;
    ctx.shadowBlur = 8 * dpr;

    const T = diag * 0.9;                 // half-length
    const STEP = STEP_PX * dpr;
    const cx = W/2, cy = H/2;

    ctx.beginPath();
    for (let t=-T; t<=T; t+=STEP){
      // Two sine waves combined -> clearly curvy
      const wave =
        L.amp1 * Math.sin((t/L.lam1)*Math.PI*2 + phase + L.ph0) +
        L.amp2 * Math.sin((t/L.lam2)*Math.PI*2 - phase*0.6 + L.ph1);

      const x = cx + B.x*t + N.x*(L.offset + wave);
      const y = cy + B.y*t + N.y*(L.offset + wave);
      (t===-T) ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.restore();
  }

  let last = performance.now(), phase = 0;
  function tick(now){
    const dt = Math.min(0.05, (now - last)/1000); last = now;
    phase += WAVE_CYCLES_PER_SEC * dt * Math.PI*2;            // same undulation
    const slide = SLIDE_PX_PER_SEC * dpr * dt;                 // same speed for all

    background();

    for (const L of lines){
      L.offset += slide;
      const wrap = diag * 2.6;
      if (L.offset > wrap/2) L.offset -= wrap;                // wrap around
      drawLine(L, phase);
    }

    if (!prefersReduced) requestAnimationFrame(tick);
  }

  // Debug flag so you can verify the new script is loaded
  window.__curvyBgLoaded = true;

  resize(); background(); if (!prefersReduced) requestAnimationFrame(tick);
  addEventListener('resize', resize, {passive:true});
})();
