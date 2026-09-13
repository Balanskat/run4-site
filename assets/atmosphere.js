// One GPU draw call for the shared grain sky. Existing instrument visuals stay independent.
import * as THREE from './vendor/three.module.min.js';

export function createAtmosphere({ isPaused, motionButton }) {
  const canvas = document.getElementById('grain-sky');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch { return; } // The static CSS atmosphere remains available.
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const capacity = 560;
  const positions = new Float32Array(capacity * 3);
  const seeds = new Float32Array(capacity);
  let seed = 4217;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < capacity; i++) {
    positions[i * 3] = random() * 2 - 1;
    positions[i * 3 + 1] = random() * 2 - 1;
    positions[i * 3 + 2] = random();
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const uniforms = {
    uTime: { value: 0 }, uDpr: { value: 1 }, uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2() }
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `
      attribute float aSeed;
      uniform float uTime, uDpr, uScroll;
      uniform vec2 uPointer;
      varying float vSeed, vDepth, vBrightness;
      void main() {
        vSeed = aSeed;
        vDepth = position.z;
        float depth = .25 + position.z * .75;
        vec2 p = position.xy;
        // Nearby grains share a current, with a small independent flutter.
        float current = uTime * .32 + position.x * 2.4 + position.y * 3.1;
        float flutter = uTime * (.8 + aSeed * .5) + aSeed * 27.;
        p.x += (uTime * .005 + sin(current) * .026 + sin(flutter) * .0025) * depth;
        p.y += (uTime * .0035 + cos(current * .83) * .021 + cos(flutter * .71) * .002) * depth;
        p.y += uScroll * .018 * depth;
        p += uPointer * .009 * depth;
        p = mod(p + 1., 2.) - 1.;
        gl_Position = vec4(p, 0., 1.);
        float rare = step(.985, aSeed);
        gl_PointSize = (2. + position.z * 3.5 + rare * 8.) * uDpr;
        // Slow individual envelopes let grains emerge and dissolve, without flashing.
        float envelope = .58 + .42 * sin(uTime * (.24 + aSeed * .16) + aSeed * 38.);
        float edge = 1. - smoothstep(.94, 1., max(abs(p.x), abs(p.y)));
        vBrightness = (.21 + position.z * .43) * envelope * edge;
      }
    `,
    fragmentShader: `
      varying float vSeed, vDepth, vBrightness;
      void main() {
        vec2 p = gl_PointCoord - .5;
        float d = length(p);
        float core = exp(-d * d * 90.);
        float halo = exp(-d * d * 13.) * .12;
        float rays = 0.;
        if (vSeed > .985) {
          rays = (exp(-abs(p.x) * 80.) * exp(-abs(p.y) * 9.)
                + exp(-abs(p.y) * 80.) * exp(-abs(p.x) * 9.)) * .13;
        }
        vec3 warm = vec3(.88, .76, .49);
        vec3 pale = vec3(.72, .81, .83);
        vec3 color = mix(warm, pale, step(.62, vSeed));
        gl_FragColor = vec4(color, (core + halo + rays) * vBrightness);
      }
    `
  });
  const grains = new THREE.Points(geometry, material);
  grains.frustumCulled = false;
  scene.add(grains);
  let raf = 0, last = 0, elapsed = 0, pageActive = true, lost = false;
  let pointerX = 0, pointerY = 0, scrollDirty = true;
  function render() {
    if (lost) return;
    if (scrollDirty) { uniforms.uScroll.value = reduced.matches ? 0 : scrollY / Math.max(innerHeight, 1); scrollDirty = false; }
    uniforms.uTime.value = elapsed;
    uniforms.uPointer.value.set(reduced.matches ? 0 : pointerX, reduced.matches ? 0 : pointerY);
    renderer.render(scene, camera);
  }
  function frame(now) {
    raf = 0;
    if (!pageActive || document.hidden || reduced.matches || isPaused() || lost) return;
    if (now - last >= 1000 / (mobile.matches ? 20 : 24)) {
      elapsed += Math.min((now - last) / 1000, .09);
      last = now;
      render();
    }
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (!pageActive || document.hidden || lost) return;
    render();
    last = performance.now();
    if (!reduced.matches && !isPaused()) raf = requestAnimationFrame(frame);
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, mobile.matches ? 1 : 1.25);
    renderer.setPixelRatio(dpr);
    renderer.setSize(innerWidth, innerHeight, false);
    uniforms.uDpr.value = dpr;
    geometry.setDrawRange(0, mobile.matches ? 220 : capacity);
    scrollDirty = true;
    sync();
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => {
    scrollDirty = true;
    // Update parallax once when still; do not start an animation loop.
    if (reduced.matches || isPaused()) sync();
  }, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    pointerX = event.clientX / innerWidth - .5;
    pointerY = .5 - event.clientY / innerHeight;
  }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { scrollDirty = true; sync(); });
  mobile.addEventListener('change', resize);
  motionButton.addEventListener('click', sync);
  window.addEventListener('pagehide', () => { pageActive = false; sync(); });
  window.addEventListener('pageshow', () => { pageActive = true; sync(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0; document.body.classList.remove('sky-ready');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false; resize(); document.body.classList.add('sky-ready');
  });
  resize();
  document.body.classList.add('sky-ready');
}
