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

// ===== Curved ribbons background (same speed for all)
(() => {
  const c = document.getElementById('bg-canvas');
  if (!c) return;
  const ctx = c.getContext('2d', { alpha: true });

  // ---- Tunables (match the sample video by adjusting these)
  const ANGLE_DEG = -20;              // base tilt of ribbons
  const COUNT_MIN = 8, COUNT_MAX = 18;// number of ribbons
  const AMPLITUDE_PX = [12, 36];      // wave height range
  const WAVELENGTH_PX = [120, 280];   // curve length range
  const WAVE_CYCLES_PER_SEC = 0.25;   // wiggle speed (same for all)
  const SLIDE_PX_PER_SEC = 60;        // slide speed across screen (same for all)

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W=0, H=0, diag=0, B={x:0,y:0}, N={x:0,y:0}, lines=[];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    W = Math.round(innerWidth * dpr);
    H = Math.round(innerHeight * dpr);
    c.width = W; c.height = H;
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';

    const a = ANGLE_DEG * Math.PI/180;
    B = { x: Math.cos(a), y: Math.sin(a) };        // baseline direction
    N = { x:-Math.sin(a), y: Math.cos(a) };        // perpendicular
    diag = Math.hypot(W, H);

    initLines();
  }

  function rr(a,b){ return a + Math.random()*(b-a); }

  function initLines(){
    const count = Math.max(COUNT_MIN, Math.min(COUNT_MAX, Math.round(innerWidth/150)));
    lines = Array.from({length:count}, () => ({
      amp: rr(AMPLITUDE_PX[0], AMPLITUDE_PX[1]) * dpr,
      lam: rr(WAVELENGTH_PX[0], WAVELENGTH_PX[1]) * dpr,
      w:   rr(1.2, 2.4) * dpr,
      hue: 220 + Math.random()*30,
      alpha: 0.08 + Math.random()*0.08,
      offset: rr(-diag, diag),             // position along perpendicular
      phase0: Math.random()*Math.PI*2      // unique curve phase
    }));
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

    const T = diag * 0.9;           // half-length along the ribbon
    const STEP = 14 * dpr;          // segment step
    const cx = W/2, cy = H/2;       // center anchor

    ctx.beginPath();
    for (let t=-T; t<=T; t+=STEP){
      const wave = L.amp * Math.sin((t/L.lam)*Math.PI*2 + phase + L.phase0);
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
    phase += WAVE_CYCLES_PER_SEC * dt * Math.PI*2;            // uniform undulation
    const slide = SLIDE_PX_PER_SEC * dpr * dt;                 // uniform slide

    background();

    for (const L of lines){
      L.offset += slide;                                      // same speed for all
      const wrap = diag * 2.4;
      if (L.offset > wrap/2) L.offset -= wrap;                // wrap around
      drawLine(L, phase);
    }

    if (!prefersReduced) requestAnimationFrame(tick);
  }

  resize(); background(); if (!prefersReduced) requestAnimationFrame(tick);
  addEventListener('resize', resize, {passive:true});
})();
