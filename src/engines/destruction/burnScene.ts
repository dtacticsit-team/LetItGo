import { registerCleanup } from '../../utils/cleanup';
import type { Sfx } from '../audio/sfx';

export interface SceneHandle {
  /** Jump straight to the end of the animation (still runs onDone once). */
  skip(): void;
  /** Stop everything and release GPU/canvas resources. */
  stop(): void;
}

interface BurnOptions {
  glCanvas: HTMLCanvasElement;
  fxCanvas: HTMLCanvasElement;
  paper: HTMLCanvasElement;
  seed: number;
  reducedMotion: boolean;
  lowPower: boolean;
  sfx: Sfx | null;
  onDone: () => void;
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Procedural fire. The burn front is driven by domain-warped fractal noise, so it
// spreads organically rather than as a wipe. Around the front we get char, an ember
// ramp (black > red > orange > yellow > white), heat shimmer, and rising flame tongues.
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPaper;
uniform vec4 uRect;   // paper rectangle in screen UV: x, y (bottom-left), w, h
uniform float uThr;   // burn threshold
uniform float uIntro; // 0..1 fade-in
uniform float uTime;
uniform float uSeed;
uniform float uHeat;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}

vec3 ramp(float h) {
  vec3 c = vec3(0.0);
  c = mix(c, vec3(0.42, 0.05, 0.01), smoothstep(0.02, 0.28, h));
  c = mix(c, vec3(1.0, 0.36, 0.06), smoothstep(0.22, 0.5, h));
  c = mix(c, vec3(1.0, 0.74, 0.28), smoothstep(0.46, 0.76, h));
  c = mix(c, vec3(1.0, 0.97, 0.86), smoothstep(0.8, 1.0, h));
  return c;
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 q = p * 2.4 + vec2(uSeed, uSeed * 0.7);

  // Burn field: bottom of the sheet burns first, with organic noise breaking the edge.
  vec2 warp = vec2(fbm(q * 1.1 + 3.1), fbm(q * 1.1 - 4.7)) - 0.5;
  float n = fbm(q * 1.5 + warp * 1.6);
  float f = p.y * 0.85 + (n - 0.5) * 0.42;
  float d = f - uThr;             // d < 0 means already burned
  float inside = step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0);

  // Paper sample with heat distortion near the front.
  float nearFront = exp(-max(d, 0.0) * 16.0);
  vec2 wv = (vec2(fbm(q * 3.2), fbm(q * 3.2 + 5.3)) - 0.5) * 0.018 * nearFront;
  vec4 tex = texture2D(uPaper, clamp(p + wv, 0.0, 1.0));
  float visible = smoothstep(-0.003, 0.003, d);
  float aPaper = tex.a * inside * visible * uIntro;
  vec3 col = tex.rgb;

  // Char: black at the edge, fading into brown-tan paper.
  float cn = fbm(q * 7.0);
  float charBand = 1.0 - smoothstep(0.0, 0.1, d);
  vec3 charCol = mix(vec3(0.03, 0.018, 0.01), vec3(0.22, 0.13, 0.06), cn * 0.85);
  col = mix(col, charCol, clamp(pow(max(charBand, 0.0), 1.3) * 0.94, 0.0, 1.0));

  // Ember glow along the burning edge with flicker.
  float heat = clamp(exp(-max(d, 0.0) * 34.0) * (0.65 + 0.7 * fbm(q * 9.0 + vec2(0.0, uTime * 0.9))), 0.0, 1.0);
  col = mix(col, ramp(heat), heat * 0.85);

  // Flames: rising noise tongues over the burned zone and just ahead of the front.
  float side = smoothstep(-0.03, 0.02, p.x) * (1.0 - smoothstep(0.98, 1.03, p.x));
  float vert = smoothstep(-0.15, 0.0, p.y) * (1.0 - smoothstep(1.0, 1.15, p.y));
  vec2 fq = vec2(p.x * 3.4 + uSeed * 0.5, (p.y - uTime * 0.45) * 2.4);
  vec2 fw = vec2(fbm(fq * 0.9 + 1.7), fbm(fq * 0.9 - 2.3)) - 0.5;
  float fn = fbm(fq + fw * 1.9);
  float tongue = smoothstep(0.34, 0.8, fn);
  float zone = smoothstep(-0.22, -0.01, d) * exp(-max(d, 0.0) * 16.0);
  float fI = clamp(tongue * zone * side * vert * (0.6 + 0.6 * uHeat), 0.0, 1.0) * uIntro;
  vec3 flame = ramp(clamp(fI * 1.2, 0.0, 1.0));

  // Warm light spilling from the front onto the surroundings.
  float glow = exp(-abs(d) * 7.0) * 0.2 * uHeat * side * vert * uIntro;

  vec3 total = col * aPaper + flame + vec3(1.0, 0.42, 0.12) * glow;
  total = clamp(total, 0.0, 1.0);
  // Premultiplied output: alpha must be >= every colour channel.
  float a = max(aPaper, max(total.r, max(total.g, total.b)));
  gl_FragColor = vec4(total, a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error('WEBGL_UNAVAILABLE');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error('WEBGL_UNAVAILABLE');
  }
  return s;
}

interface Particle {
  kind: 'ember' | 'ash';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  age: number;
  life: number;
  tint: number;
}

/** Pre-rendered sprites so particles cost a single drawImage each. */
function makeSprites() {
  const ember = document.createElement('canvas');
  ember.width = 48;
  ember.height = 48;
  const ec = ember.getContext('2d');
  if (ec) {
    const g = ec.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(255,250,215,1)');
    g.addColorStop(0.18, 'rgba(255,190,80,0.95)');
    g.addColorStop(0.5, 'rgba(255,90,20,0.35)');
    g.addColorStop(1, 'rgba(255,30,0,0)');
    ec.fillStyle = g;
    ec.fillRect(0, 0, 48, 48);
  }

  const ash = document.createElement('canvas');
  ash.width = 32;
  ash.height = 32;
  const ac = ash.getContext('2d');
  if (ac) {
    ac.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = 8 + Math.random() * 6;
      const x = 16 + Math.cos(a) * r;
      const y = 16 + Math.sin(a) * r * 0.5;
      if (i === 0) ac.moveTo(x, y);
      else ac.lineTo(x, y);
    }
    ac.closePath();
    ac.fillStyle = 'rgba(150,144,136,0.85)';
    ac.fill();
    ac.strokeStyle = 'rgba(255,140,50,0.55)';
    ac.lineWidth = 1;
    ac.stroke();
  }
  return { ember, ash };
}

export function runBurn(opts: BurnOptions): SceneHandle {
  const { glCanvas, fxCanvas, paper, seed, reducedMotion, lowPower, sfx, onDone } = opts;

  const gl = glCanvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) throw new Error('WEBGL_UNAVAILABLE');
  const fx = fxCanvas.getContext('2d');
  if (!fx) throw new Error('CANVAS_UNAVAILABLE');

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!prog) throw new Error('WEBGL_UNAVAILABLE');
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('WEBGL_UNAVAILABLE');
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRect = gl.getUniformLocation(prog, 'uRect');
  const uThr = gl.getUniformLocation(prog, 'uThr');
  const uIntro = gl.getUniformLocation(prog, 'uIntro');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uSeed = gl.getUniformLocation(prog, 'uSeed');
  const uHeat = gl.getUniformLocation(prog, 'uHeat');
  const uPaper = gl.getUniformLocation(prog, 'uPaper');

  // Paper texture (flipped so UV (0,0) is bottom-left, matching the burn direction).
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paper);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.uniform1i(uPaper, 0);

  // Timeline (seconds).
  const T_INTRO = 0.9;
  const T_BURN = reducedMotion ? 2.6 : lowPower ? 5.6 : 7.0;
  const T_TAIL = reducedMotion ? 0.3 : 1.2;

  const sprites = makeSprites();
  const rnd = Math.random;
  const seedF = (seed % 997) / 97;
  let particles: Particle[] = [];
  const quality = lowPower || reducedMotion ? 0.5 : 1;
  let vw = 0;
  let vh = 0;
  let pw = 0;
  let ph = 0;
  let raf = 0;
  let finished = false;
  let stopped = false;
  let t = 0;
  let last = 0;
  let frameSamples = 0;
  let frameSum = 0;
  let dprUsed = 1;

  const layout = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dprUsed = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    glCanvas.width = Math.round(vw * dprUsed);
    glCanvas.height = Math.round(vh * dprUsed);
    fxCanvas.width = glCanvas.width;
    fxCanvas.height = glCanvas.height;
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    const aspect = paper.width / paper.height;
    pw = Math.min(vw * 0.72, vh * 0.7 * aspect);
    ph = pw / aspect;
    const topCss = (vh - ph) / 2;
    const bottomCss = topCss + ph;
    const x0 = (vw - pw) / 2 / vw;
    const y0 = 1 - bottomCss / vh;
    gl.uniform4f(uRect, x0, y0, pw / vw, ph / vh);
    fx.setTransform(dprUsed, 0, 0, dprUsed, 0, 0);
  };

  const onResize = () => {
    if (!stopped) layout();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    sfx?.stopFire(1.2);
    onDone();
  };

  const draw = (now: number) => {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    // Adaptive quality: if frames are consistently slow, reduce particle density.
    if (t > T_INTRO && frameSamples < 40) {
      frameSamples++;
      frameSum += dt;
      if (frameSamples === 40 && frameSum / 40 > 0.04) particleScale = 0.4;
    }

    const burnT = Math.max(0, Math.min(1, (t - T_INTRO) / T_BURN));
    const eased = burnT * burnT * (3 - 2 * burnT);
    const intro = Math.max(0, Math.min(1, t / T_INTRO));
    const burning = t >= T_INTRO && burnT < 1;
    const thr = -0.25 + eased * 1.4;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uThr, thr);
    gl.uniform1f(uIntro, intro);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uSeed, seedF);
    gl.uniform1f(uHeat, intro * (0.3 + 0.7 * eased));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Particle layer (embers and ash), in CSS pixels.
    fx.setTransform(dprUsed, 0, 0, dprUsed, 0, 0);
    fx.clearRect(0, 0, vw, vh);
    const topCss = (vh - ph) / 2;
    const bottomCss = topCss + ph;
    const left = (vw - pw) / 2;
    const frontP = thr / 0.85;
    const frontAt = () => bottomCss - frontP * ph;

    if (burning) {
      const n = reducedMotion ? 0 : Math.round(1.1 * quality * particleScale * dt * 60);
      for (let i = 0; i < n; i++) {
        particles.push({
          kind: 'ember',
          x: left + rnd() * pw,
          y: frontAt() + rnd() * 8,
          vx: (rnd() - 0.5) * 50,
          vy: -(60 + rnd() * 110),
          size: 3 + rnd() * 4,
          rot: 0,
          vr: 0,
          age: 0,
          life: 0.9 + rnd() * 1.6,
          tint: rnd(),
        });
      }
    }
    if (t > T_INTRO) {
      const n = Math.round((reducedMotion ? 0.2 : 1.3) * quality * particleScale * dt * 60 * (burning ? 1 : 0.35));
      for (let i = 0; i < n; i++) {
        particles.push({
          kind: 'ash',
          x: left + rnd() * pw,
          y: frontAt() + rnd() * 10,
          vx: (rnd() - 0.5) * 24,
          vy: -(10 + rnd() * 26),
          size: 2 + rnd() * 3.5,
          rot: rnd() * Math.PI * 2,
          vr: (rnd() - 0.5) * 3,
          age: 0,
          life: 2.8 + rnd() * 2.4,
          tint: rnd(),
        });
      }
    }

    particles = particles.filter((p) => {
      p.age += dt;
      if (p.age >= p.life) return false;
      const k = p.age / p.life;
      if (p.kind === 'ember') {
        p.vx += (rnd() - 0.5) * 90 * dt;
        p.vy -= 16 * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const flick = 0.75 + 0.25 * Math.sin(p.age * 38 + p.tint * 10);
        const a = (1 - k) * (1 - k) * flick;
        const s = p.size * (1 - k * 0.5);
        fx.globalCompositeOperation = 'lighter';
        fx.globalAlpha = Math.max(0, Math.min(1, a));
        fx.drawImage(sprites.ember, p.x - s, p.y - s, s * 2, s * 2);
      } else {
        p.vx += Math.sin(p.age * 2.3 + p.tint * 6) * 14 * dt;
        p.vy -= 6 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const s = p.size;
        fx.globalCompositeOperation = 'source-over';
        fx.globalAlpha = Math.min(1, (1 - k) * 2) * 0.9;
        fx.save();
        fx.translate(p.x, p.y);
        fx.rotate(p.rot);
        fx.drawImage(sprites.ash, -s, -s, s * 2, s * 2);
        fx.restore();
      }
      return true;
    });
    fx.globalAlpha = 1;
    fx.globalCompositeOperation = 'source-over';

    if (t >= T_INTRO + T_BURN + T_TAIL && particles.length === 0) {
      finish();
      return;
    }
    if (t >= T_INTRO + T_BURN + T_TAIL + 1.6) {
      finish();
      return;
    }
    raf = requestAnimationFrame(draw);
  };

  let particleScale = 1;

  const teardown = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    particles = [];
    try {
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      /* ignore */
    }
    fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    glCanvas.width = 0;
    glCanvas.height = 0;
    fxCanvas.width = 0;
    fxCanvas.height = 0;
    sfx?.stopFire(0.2);
  };

  const unregister = registerCleanup(teardown);

  layout();
  window.addEventListener('resize', onResize);
  sfx?.startFire();
  raf = requestAnimationFrame((now) => {
    last = now;
    draw(now);
  });

  return {
    skip() {
      if (stopped) return;
      teardown();
      finish();
    },
    stop() {
      teardown();
      unregister();
    },
  };
}
