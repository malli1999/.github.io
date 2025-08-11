// Year in footer
document.getElementById('y').textContent = new Date().getFullYear();

// Accordion for Experience
document.querySelectorAll('.exp-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const panel = btn.nextElementSibling;
    panel.hidden = expanded;
  });
});

// Animated moving-lines background (lightweight canvas)
(() => {
  const c = document.getElementById('bg-canvas');
  const ctx = c.getContext('2d', { alpha: true });

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W=0, H=0, lines=[];

  function resize(){
    W = Math.round(innerWidth * dpr);
    H = Math.round(innerHeight * dpr);
    c.width = W; c.height = H;
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
    initLines();
  }

  function initLines(){
    const n = Math.max(8, Math.min(22, Math.floor(innerWidth / 140)));
    lines = Array.from({length:n}, () => ({
      x: Math.random()*W,
      y: Math.random()*H,
      len: (Math.random()*0.25 + 0.35) * Math.hypot(W,H) * 0.12,
      ang: (-20 + (Math.random()*8 - 4)) * Math.PI/180,
      speed: (Math.random()*0.5 + 0.15) * dpr,
      w: (Math.random()*1.4 + 0.8) * dpr,
      alpha: 0.08 + Math.random()*0.08,
      hue: 225 + Math.random()*18
    }));
  }

  function drawBackground(){
    const g = ctx.createRadialGradient(W*0.2, H*0.1, 0, W*0.2, H*0.1, Math.max(W,H));
    g.addColorStop(0, '#1b2553');
    g.addColorStop(0.4, '#0e122a');
    g.addColorStop(1, '#070a18');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
  }

  function tick(){
    drawBackground();
    lines.forEach(L => {
      const dx = Math.cos(L.ang), dy = Math.sin(L.ang);
      const x2 = L.x + dx * L.len, y2 = L.y + dy * L.len;

      ctx.lineWidth = L.w;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `hsla(${L.hue},80%,72%,${L.alpha})`;
      ctx.shadowColor = `hsla(${L.hue},90%,70%,${L.alpha*0.9})`;
      ctx.shadowBlur = 8 * dpr;

      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // move perpendicular for a 'striped slide' effect
      L.x += -dy * L.speed;
      L.y +=  dx * L.speed;

      // wrap around edges
      if (L.x < -L.len) L.x = W + L.len;
      if (L.x > W + L.len) L.x = -L.len;
      if (L.y < -L.len) L.y = H + L.len;
      if (L.y > H + L.len) L.y = -L.len;
    });

    if (!prefersReducedMotion) requestAnimationFrame(tick);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resize(); tick();
  window.addEventListener('resize', resize, {passive:true});
})();
