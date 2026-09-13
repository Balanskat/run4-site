// The screenshots stay ordinary images; this module only enhances navigation.
const rows = [...document.querySelectorAll('.track-row')];
const descriptions = {
  tape: ['01 / CAPTURE — Record, loop, overdub. Remember the last few seconds.', 'RUN4 Tape: capture and reshape recorded sound.'],
  devices: ['02 / SHAPE — Grain, Tone, Color, Air. A small change becomes another world.', 'RUN4 Devices: granular processing, filters, colour and space.'],
  poly: ['03 / SEQUENCE — Samples, synth voices and steps that leave room for chance.', 'RUN4 Poly: a pattern sequencer with a playable keyboard.'],
  visuals: ['04 / PERFORM — Macros, gestures and a visual world that follows the sound.', 'RUN4 performance visualizer, carrying the four track colours.']
};
for (const row of rows) row.addEventListener('click', () => {
  rows.forEach(item => { item.classList.toggle('active', item === row); item.setAttribute('aria-pressed', String(item === row)); });
  const name = row.dataset.screen;
  document.getElementById('track-phone').srcset = `assets/screens/iphone-${name}.webp`;
  const img = document.getElementById('track-image');
  img.src = `assets/screens/ipad-${name}.webp`;
  img.alt = descriptions[name][1];
  document.getElementById('track-caption').textContent = descriptions[name][0];
});

// Original RUN4 signal intro. Decorative artwork is static CSS.
const hero = document.querySelector('.hero');
const canvas = document.getElementById('heroCanvas');
const motionButton = document.getElementById('motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');
const ctx = canvas.getContext('2d', { alpha: false });
let width = 0, height = 0, raf = 0, last = 0, elapsed = 0;
let visible = false, paused = false, pageActive = true;
      const TRACK_COLORS = ["#ee5946", "#59b9dc", "#8abd7a", "#dbbb70"];

      // Each track line is a stretch of open sea. Ships need the same maths.
      const seaLeft = () => width * 0.10;
      const seaRight = () => width * 0.92;
      function waveY(x, y, t, offset) {
        const left = seaLeft();
        const right = seaRight();
        const amp = 10 + offset * 2;
        const n = (x - left) / Math.max(1, right - left);
        return y + Math.sin(n * 18 + t * (0.8 + offset * 0.1)) * Math.cos(n * 7 - t * 0.33) * amp;
      }

      function drawTrack(y, color, t, offset) {
        const left = seaLeft();
        const right = seaRight();
        const amp = 10 + offset * 2;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.52;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = left; x <= right; x += 6) {
          const n = (x - left) / Math.max(1, right - left);
          const wave = Math.sin(n * 18 + t * (0.8 + offset * 0.1)) * Math.cos(n * 7 - t * 0.33);
          const yy = y + wave * amp;
          if (x === left) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // The ten invented staves from the app\'s Galdr visualiser, verbatim.
      const RUNES = [
        [[[.5,.08],[.5,.92]],[[.5,.22],[.82,.36]],[[.5,.48],[.78,.62]]],
        [[[.5,.08],[.5,.92]],[[.18,.28],[.82,.72]],[[.82,.28],[.18,.72]]],
        [[[.28,.1],[.28,.9]],[[.28,.27],[.76,.5],[.28,.73]]],
        [[[.5,.08],[.5,.92]],[[.5,.34],[.82,.14]],[[.5,.34],[.18,.14]],[[.5,.58],[.78,.76]],[[.5,.58],[.22,.76]]],
        [[[.18,.18],[.82,.18],[.26,.82],[.82,.82]]],
        [[[.22,.12],[.76,.5],[.22,.88]],[[.42,.5],[.82,.5]]],
        [[[.22,.12],[.78,.88]],[[.78,.12],[.22,.88]],[[.2,.5],[.8,.5]]],
        [[[.5,.08],[.5,.92]],[[.18,.28],[.5,.48],[.82,.24]],[[.18,.72],[.5,.52],[.82,.76]]],
        [[[.18,.2],[.5,.08],[.82,.2]],[[.5,.08],[.5,.9]],[[.22,.62],[.78,.62]]],
        [[[.18,.14],[.82,.5],[.18,.86]],[[.34,.32],[.34,.68]]]
      ];
      function traceRune(variant, cx, cy, side) {
        const pattern = RUNES[((variant % RUNES.length) + RUNES.length) % RUNES.length];
        const x0 = cx - side * 0.5;
        const y0 = cy - side * 0.5;
        ctx.beginPath();
        for (const line of pattern) {
          for (let i = 0; i < line.length; i++) {
            const px = x0 + line[i][0] * side;
            const py = y0 + line[i][1] * side;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
        }
      }

      function drawGlyphMarks(t) {
        const marks = [
          [0.155, 0.28, 26, 0],
          [0.30, 0.80, 30, 3],
          [0.79, 0.855, 24, 7],
          [0.62, 0.135, 20, 5],
          [0.925, 0.44, 18, 9]
        ];
        ctx.save();
        ctx.lineCap = "square";
        ctx.lineJoin = "miter";
        for (let i = 0; i < marks.length; i++) {
          const [fx, fy, s, variant] = marks[i];
          const bob = Math.sin(t * 0.42 + i * 1.7) * 2;
          const breath = 0.5 + Math.sin(t * 0.23 + i * 2.3) * 0.5;
          traceRune(variant, width * fx, height * fy + bob, s);
          ctx.strokeStyle = "rgba(255,218,138," + (0.10 + breath * 0.09).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      function draw(time) {
        const t = time * 0.001;
        ctx.fillStyle = "#101210";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 72) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 72) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        drawGlyphMarks(t);

        const cx = width * 0.50;
        const cy = height * 0.54;
        ctx.strokeStyle = "rgba(255,199,26,0.46)";
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) {
          const x = width * (0.20 + i * 0.20);
          ctx.beginPath();
          ctx.moveTo(x, height * 0.20);
          ctx.lineTo(cx, cy + (i - 1.5) * 38);
          ctx.lineTo(width * 0.88, height * 0.72 + i * 12);
          ctx.stroke();
        }

        const colors = ["rgba(235,56,41,0.95)", "rgba(41,166,242,0.95)", "rgba(71,230,107,0.9)", "rgba(255,199,26,0.95)"];
        for (let i = 0; i < 4; i++) {
          const x = width * (0.20 + i * 0.20);
          const y = height * 0.18;
          ctx.fillStyle = "rgba(17,17,17,0.92)";
          ctx.strokeStyle = "rgba(255,255,255,0.30)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x - 28, y - 28, 56, 56, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = colors[i];
          ctx.globalAlpha = 0.96;
          ctx.fillRect(x - 14, y + 16 - i * 3, 28, 4 + i * 3);
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = "rgba(17,17,17,0.80)";
        ctx.strokeStyle = "rgba(255,255,255,0.34)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(width, height) * 0.115, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,255,255,0.76)";
        ctx.beginPath();
        ctx.moveTo(cx - 22, cy - 20);
        ctx.lineTo(cx - 4, cy - 20);
        ctx.lineTo(cx + 22, cy - 40);
        ctx.lineTo(cx + 22, cy + 40);
        ctx.lineTo(cx - 4, cy + 20);
        ctx.lineTo(cx - 22, cy + 20);
        ctx.closePath();
        ctx.stroke();

        drawTrack(height * 0.35, "rgba(235,56,41,0.9)", t, 1);
        drawTrack(height * 0.47, "rgba(41,166,242,0.9)", t, 2);
        drawTrack(height * 0.59, "rgba(71,230,107,0.86)", t, 3);
        drawTrack(height * 0.71, "rgba(255,199,26,0.9)", t, 4);

        ctx.fillStyle = "rgba(255,255,255,0.28)";
        for (let i = 0; i < 20; i++) {
          const x = width * 0.86 + Math.sin(t * 0.33 + i) * 22;
          const y = height * 0.17 + i * 20;
          ctx.fillRect(x, y, 48, 1);
        }


      }


function animate(now) {
  raf = 0;
  if (!visible || document.hidden || paused || reduced.matches || !pageActive) return;
  const interval = mobile.matches ? 1000 / 24 : 1000 / 30;
  if (now - last >= interval) {
    elapsed += Math.min(now - last, 80);
    last = now;
    if (ctx) draw(elapsed);
  }
  raf = requestAnimationFrame(animate);
}
function sync() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  const still = paused || reduced.matches;
  const running = visible && !document.hidden && !still && pageActive;
  motionButton.textContent = reduced.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
  motionButton.setAttribute('aria-pressed', String(still));
  motionButton.disabled = reduced.matches || !ctx;
  if (!ctx) motionButton.textContent = 'Still view';
  if (visible && !document.hidden && pageActive && ctx) draw(elapsed);
  last = performance.now();
  if (running && ctx) raf = requestAnimationFrame(animate);
}
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, mobile.matches ? 1.25 : 1.5);
  width = Math.max(1, canvas.clientWidth);
  height = Math.max(1, canvas.clientHeight);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sync();
}
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .01 }).observe(hero);
reduced.addEventListener('change', sync);
mobile.addEventListener('change', resize);
document.addEventListener('visibilitychange', sync);
motionButton.addEventListener('click', () => { paused = !paused; sync(); });
window.addEventListener('pagehide', () => { pageActive = false; sync(); });
window.addEventListener('pageshow', () => { pageActive = true; sync(); });
resize();



/* ------------------------------------------------------------------
   Flying ravens. The app's own raven is a perched grain silhouette;
   these are drawn in flight so the sections read as sky, not as a logo.
   ------------------------------------------------------------------ */
// The app's seedNoise: a deterministic hash the visualiser leans on everywhere.
const frac = v => v - Math.floor(v);
const noise = v => frac(Math.sin(v * 12.9898 + 78.233) * 43758.5453);

/* ------------------------------------------------------------------
   Jotunheim. A port of the app's drawOrganicMushrooms visualiser,
   driven by a slow idle pulse instead of the audio engine.
   ------------------------------------------------------------------ */
const shroomCanvas = document.getElementById('mushroomCanvas');
if (shroomCanvas) {
  const g = shroomCanvas.getContext('2d');
  let sw = 0, sh = 0, shroomRaf = 0, shroomLast = 0, shroomTime = 0;
  let shroomVisible = false;

  function smoothStep(from, to, v) {
    if (to <= from) return 0;
    const n = Math.min(1, Math.max(0, (v - from) / (to - from)));
    return n * n * (3 - 2 * n);
  }
  // The app's glowStroke: one wide faint halo pass, then the line itself.
  function glowStroke(color, w, alpha, halo) {
    if (alpha <= 0.004) return;
    g.strokeStyle = color;
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = alpha * 0.16;
    g.lineWidth = w * halo;
    g.stroke();
    g.globalAlpha = alpha;
    g.lineWidth = w;
    g.stroke();
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  function drawShrooms(time) {
    const t = time * 0.001;
    g.clearRect(0, 0, sw, sh);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // The app draws into a device screen; these keep its proportions in a strip.
    const ref = sh * 2.4;
    const vh = sh * 3.2;
    const horizon = sh * 0.99;
    const perTrack = Math.max(3, Math.round(sw / 230));

    for (let track = 0; track < 4; track++) {
      const act = 0.24 + Math.sin(t * 0.27 + track * 1.9) * 0.18;
      const color = TRACK_COLORS[track];
      for (let c = 0; c < perTrack; c++) {
        const seed = track * 179 + c * 43;
        const baseX = sw * (0.03 + noise(seed + 0.5) * 0.94);
        const baseY = horizon - sh * 0.15 * noise(seed + 1.8);
        const lc = frac(t * (0.038 + noise(seed + 8.8) * 0.024) + seed * 0.067);
        const life = smoothStep(0.02, 0.22, lc) * (1 - smoothStep(0.57, 0.94, lc));
        const disintegration = smoothStep(0.56, 0.96, lc);
        const depth = 0.5 + noise(seed + 12.4) * 0.5;

        const baseHeight = vh * (0.045 + noise(seed + 3.1) * 0.12);
        const breathing = 0.94 + Math.sin(t * 0.42 + seed) * (0.025 + act * 0.045);
        const matureHeight = baseHeight * (0.92 + act * 0.34) * breathing;
        const heightNow = matureHeight * (0.14 + life * 0.92);
        const sway = Math.sin(t * (0.42 + act * 0.22) + seed) * ref * (0.007 + act * 0.02) * (0.35 + life * 0.65);
        const matureCap = ref * (0.032 + noise(seed + 4.7) * 0.05) * (0.82 + act * 0.34);
        const capWidth = matureCap * (0.16 + Math.sqrt(life) * 0.88);
        const topX = baseX + sway;
        const topY = baseY - heightNow;

        // Mycelium threads across the ground.
        const threads = Math.round(2 + life * (4 + act * 8));
        for (let j = 0; j < threads; j++) {
          const dir = j % 2 ? 1 : -1;
          const len = ref * (0.025 + noise(seed + 40 + j) * 0.09);
          const ex = baseX + dir * len;
          const ey = baseY + sh * 0.012 * noise(seed + 60 + j);
          g.beginPath();
          g.moveTo(baseX, baseY);
          g.quadraticCurveTo((baseX + ex) / 2, (baseY + ey) / 2 - vh * 0.028, ex, ey);
          glowStroke(color, 0.4 + act * 0.75, (0.035 + act * 0.13) * life * depth, 5.5);
        }

        // Stem.
        g.beginPath();
        g.moveTo(baseX, baseY);
        g.quadraticCurveTo(baseX + sway * 0.32, baseY - heightNow * 0.52, topX, topY);
        glowStroke(color, (0.65 + act * 1.55) * depth, (0.10 + act * 0.44) * life * depth, 5.5);

        // Cap — the rim halo is what makes the scene read as lit.
        g.beginPath();
        g.moveTo(topX - capWidth, topY + capWidth * 0.2);
        g.quadraticCurveTo(topX, topY - capWidth * (0.5 + act * 0.18), topX + capWidth, topY + capWidth * 0.2);
        glowStroke(color, (0.8 + act * 1.65) * depth, (0.16 + act * 0.58) * life * depth, 4);

        // Spores let go as the colony breaks down.
        const grains = Math.round(3 + disintegration * 9);
        for (let j = 0; j < grains; j++) {
          const delay = noise(seed + 80 + j) * 0.58;
          const fl = Math.max(0, (disintegration - delay) / Math.max(0.05, 1 - delay));
          if (fl <= 0) continue;
          const gx = topX + (noise(seed + 100 + j) - 0.5) * matureCap * 2.4 * (0.3 + fl);
          const gy = topY - matureCap * 0.2 + fl * fl * vh * 0.10 - fl * vh * 0.05;
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = (0.10 + act * 0.34) * (1 - fl) * depth;
          g.fillStyle = color;
          g.beginPath();
          g.arc(gx, gy, Math.max(0.35, 0.7 + act * 0.9), 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
          g.globalCompositeOperation = 'source-over';
        }
      }
    }
  }

  function shroomFrame(now) {
    shroomRaf = 0;
    if (!shroomVisible || document.hidden || paused || reduced.matches || !pageActive) return;
    if (now - shroomLast >= 1000 / 20) {
      shroomTime += Math.min(now - shroomLast, 90);
      shroomLast = now;
      drawShrooms(shroomTime);
    }
    shroomRaf = requestAnimationFrame(shroomFrame);
  }
  function shroomSync() {
    if (shroomRaf) cancelAnimationFrame(shroomRaf);
    shroomRaf = 0;
    if (!shroomVisible || document.hidden || !pageActive) return;
    drawShrooms(shroomTime || 7000);
    shroomLast = performance.now();
    if (!paused && !reduced.matches) shroomRaf = requestAnimationFrame(shroomFrame);
  }
  function shroomResize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    sw = Math.max(1, shroomCanvas.clientWidth);
    sh = Math.max(1, shroomCanvas.clientHeight);
    shroomCanvas.width = Math.floor(sw * dpr);
    shroomCanvas.height = Math.floor(sh * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    shroomSync();
  }
  new ResizeObserver(shroomResize).observe(shroomCanvas);
  new IntersectionObserver(e => { shroomVisible = e[0].isIntersecting; shroomSync(); }, { threshold: .01 }).observe(shroomCanvas);
  reduced.addEventListener('change', shroomSync);
  document.addEventListener('visibilitychange', shroomSync);
  motionButton.addEventListener('click', () => shroomSync());
  shroomResize();
}


/* ------------------------------------------------------------------
   Huginn. The grain positions are read straight out of the app's own
   bird artwork, so the cloud is the real silhouette. Most grains
   shimmer in place; a share of them let go and stream off the bird.
   ------------------------------------------------------------------ */
const grainCanvas = document.getElementById('grainBird');
if (grainCanvas) {
  const g = grainCanvas.getContext('2d');
  const TAU = Math.PI * 2;
  const GRAIN_INK = ['#d7ba76'].concat(TRACK_COLORS);
  const LEVELS = 6;
  let grains = null, coreImg = null, w = 0, h = 0, raf = 0, last = 0, clock = 0, seen = false;

  const load = src => new Promise(res => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });

  // Every opaque speck in the source PNG becomes a grain.
  function sample(img, ink, step, out) {
    const c = document.createElement('canvas');
    c.width = c.height = 384;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, 384, 384);
    const d = x.getImageData(0, 0, 384, 384).data;
    for (let py = 0; py < 384; py += step) {
      for (let px = 0; px < 384; px += step) {
        const al = d[(py * 384 + px) * 4 + 3];
        if (al > 34) out.push([px / 384, py / 384, ink, al / 255]);
      }
    }
  }

  function build(pts) {
    return pts.map((p, i) => {
      const s1 = noise(i * 3.7 + 1.3);
      const s2 = noise(i * 11.1 + 5.9);
      const s3 = noise(i * 7.3 + 2.1);
      // Loose grains blow outward from the body, lifting and to the right.
      const ang = Math.atan2(p[1] - 0.54, p[0] - 0.46) + (s3 - 0.5) * 1.2;
      return {
        hx: p[0], hy: p[1], ink: p[2],
        r: 0.48 + s1 * 0.44 + p[3] * 0.42,
        free: s2 < 0.20,
        rate: 0.05 + s2 * 0.13,
        seed: s3,
        dx: Math.cos(ang) * 0.9 + 0.5,
        dy: Math.sin(ang) * 0.8 - 0.16,
        ox: s1 - 0.5, oy: s3 - 0.5,
        base: 0.42 + p[3] * 0.52
      };
    });
  }

  Promise.all(['run4-bird-core.png', 'run4-bird-grain-a.png', 'run4-bird-grain-b.png',
               'run4-bird-grain-c.png', 'run4-bird-grain-d.png'].map(f => load('assets/' + f)))
    .then(imgs => {
      if (!imgs[0]) return;
      const pts = [];
      try {
        sample(imgs[0], 0, 3, pts);
        for (let i = 1; i < 5; i++) if (imgs[i]) sample(imgs[i], i, 3, pts);
      } catch (e) { return; }   // tainted canvas (file://) — skip the scene
      if (!pts.length) return;
      grains = build(pts);
      coreImg = imgs[0];
      sync();
    });

  function drawBird(time) {
    const t = time * 0.001;
    g.clearRect(0, 0, w, h);
    if (!grains) return;
    const side = Math.min(w * 0.32, h * 0.54, 360);
    const x0 = w - side * 1.04;
    const y0 = 16;

    // The source artwork stays underneath: its dot sizes carry the edges
    // that a sampled cloud alone cannot hold. The grains ride on top.
    if (coreImg) {
      g.globalAlpha = 0.13;
      g.drawImage(coreImg, x0, y0, side, side);
      g.globalAlpha = 1;
    }

    // Batched by ink and quantised alpha, so a few thousand grains stay cheap.
    const paths = new Array(GRAIN_INK.length * LEVELS).fill(null);
    for (let i = 0; i < grains.length; i++) {
      const q = grains[i];
      let ux = q.hx, uy = q.hy, a = q.base;
      if (q.free) {
        const cyc = frac(q.seed + t * q.rate);
        const out = cyc * cyc;
        ux += q.dx * out * 0.38;
        uy += q.dy * out * 0.38;
        a *= Math.min(1, cyc * 10) * (1 - cyc) * (1 - cyc);
      } else {
        const ph = t * (0.30 + q.seed * 0.55) + q.seed * 9;
        ux += Math.cos(ph) * q.ox * 0.007;
        uy += Math.sin(ph * 0.83) * q.oy * 0.007;
        a *= 0.74 + Math.sin(ph * 0.6) * 0.26;
      }
      a *= 0.72;
      if (a < 0.012) continue;
      const lvl = Math.min(LEVELS - 1, (a * LEVELS) | 0);
      const key = q.ink * LEVELS + lvl;
      let p = paths[key];
      if (!p) p = paths[key] = new Path2D();
      const px = x0 + ux * side, py = y0 + uy * side;
      p.moveTo(px + q.r, py);
      p.arc(px, py, q.r, 0, TAU);
    }
    for (let c = 0; c < GRAIN_INK.length; c++) {
      for (let l = 0; l < LEVELS; l++) {
        const p = paths[c * LEVELS + l];
        if (!p) continue;
        g.fillStyle = GRAIN_INK[c];
        g.globalAlpha = (l + 0.5) / LEVELS;
        g.fill(p);
      }
    }
    g.globalAlpha = 1;
  }

  function frame(now) {
    raf = 0;
    if (!seen || document.hidden || paused || reduced.matches || !pageActive) return;
    if (now - last >= 1000 / 24) { clock += Math.min(now - last, 90); last = now; drawBird(clock); }
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (!seen || document.hidden || !pageActive) return;
    drawBird(clock || 5200);
    last = performance.now();
    if (!paused && !reduced.matches) raf = requestAnimationFrame(frame);
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = Math.max(1, grainCanvas.clientWidth);
    h = Math.max(1, grainCanvas.clientHeight);
    grainCanvas.width = Math.floor(w * dpr);
    grainCanvas.height = Math.floor(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    sync();
  }
  new ResizeObserver(resize).observe(grainCanvas);
  new IntersectionObserver(e => { seen = e[0].isIntersecting; sync(); }, { threshold: .01 }).observe(grainCanvas);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  motionButton.addEventListener('click', () => sync());
  resize();
}

// Load the shared Three.js sky without blocking the page or its controls.
import('./atmosphere.js').then(({ createAtmosphere }) => {
  createAtmosphere({ isPaused: () => paused, motionButton });
}).catch(() => {}); // Static atmosphere is the offline/WebGL fallback.
