import { CONFIG } from '../../config';
import parchmentUrl from '../../assets/parchment.jpg';

/** Small deterministic PRNG so the same session always renders the same sheet. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let parchmentPromise: Promise<HTMLImageElement | null> | null = null;
function loadParchment(): Promise<HTMLImageElement | null> {
  if (!parchmentPromise) {
    parchmentPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = parchmentUrl;
    });
  }
  return parchmentPromise;
}

function hash2(x: number, y: number, s: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function valueNoise(x: number, y: number, s: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s);
  const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s);
  const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, s: number): number {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * valueNoise(x * f, y * f, s + i * 13);
    f *= 2.03;
    a *= 0.5;
  }
  return v;
}

function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Organic tea-like stains from low-frequency noise (drawn at half resolution for speed). */
function paintStains(ctx: CanvasRenderingContext2D, W: number, H: number, s: number) {
  const sw = Math.round(W / 2);
  const sh = Math.round(H / 2);
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const cc = c.getContext('2d');
  if (!cc) return;
  const img = cc.createImageData(sw, sh);
  const d = img.data;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const v = fbm(x * 0.05, y * 0.05, s);
      const m = smooth(0.5, 0.8, v);
      const i = (y * sw + x) * 4;
      d[i] = 128;
      d[i + 1] = 90;
      d[i + 2] = 45;
      d[i + 3] = m * 110;
    }
  }
  cc.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = 0.9;
  ctx.drawImage(c, 0, 0, W, H);
  ctx.restore();
}

function paintAging(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.28, W / 2, H / 2, W * 0.78);
  g.addColorStop(0, 'rgba(120,84,40,0)');
  g.addColorStop(0.7, 'rgba(120,84,40,0.12)');
  g.addColorStop(1, 'rgba(90,60,28,0.42)');
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function paintFibers(ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 340; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const a = rnd() * Math.PI * 2;
    const len = 5 + rnd() * 18;
    const bend = (rnd() - 0.5) * 6;
    ctx.strokeStyle =
      rnd() < 0.5
        ? `rgba(110,84,52,${(0.05 + rnd() * 0.06).toFixed(3)})`
        : `rgba(255,250,235,${(0.1 + rnd() * 0.12).toFixed(3)})`;
    ctx.lineWidth = 0.4 + rnd() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + (Math.cos(a) * len) / 2 + bend,
      y + (Math.sin(a) * len) / 2 - bend,
      x + Math.cos(a) * len,
      y + Math.sin(a) * len,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** A faint horizontal fold, like a letter that was folded once. */
function paintCrease(ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) {
  const y = H * (0.44 + rnd() * 0.12);
  const g = ctx.createLinearGradient(0, y - 6, 0, y + 6);
  g.addColorStop(0, 'rgba(120,88,50,0)');
  g.addColorStop(0.45, 'rgba(120,88,50,0.10)');
  g.addColorStop(0.55, 'rgba(255,252,240,0.22)');
  g.addColorStop(1, 'rgba(255,252,240,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 6, W, 12);
}

function paintGrain(ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 14;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n * 0.85;
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * One abstract "handwritten" word: a trochoid curve (loops like cursive) stamped with
 * a pressure-varying nib, so the ink has natural weight changes. Never readable text.
 */
function inkWord(ctx: CanvasRenderingContext2D, x0: number, y0: number, rnd: () => number): number {
  const R = 2.4 + rnd() * 2.4;
  const k = R * (0.5 + rnd() * 0.7);
  const span = 24 + rnd() * 60;
  const thMax = span / k;
  const baseW = 0.9 + rnd() * 1.0;
  const tone = 34 + Math.floor(rnd() * 22);
  const alpha = 0.55 + rnd() * 0.3;
  const phase = rnd() * 6.28;
  const lean = (rnd() - 0.5) * 0.5;
  ctx.fillStyle = `rgba(${tone},${tone - 8},${tone - 14},${alpha.toFixed(3)})`;
  for (let th = 0; th <= thMax; th += 0.12) {
    const px = x0 + th * k - R * Math.sin(th) + lean * th * 2;
    const py = y0 - R * 0.8 * Math.cos(th) + (rnd() - 0.5) * 0.35;
    const press = 0.5 + 0.5 * Math.sin(th * 1.7 + phase);
    const w = baseW * (0.45 + 0.75 * press) * (0.85 + 0.3 * rnd());
    ctx.beginPath();
    ctx.arc(px, py, w * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  return span;
}

function inkScribble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, rnd: () => number) {
  ctx.strokeStyle = `rgba(40,32,26,${(0.3 + rnd() * 0.25).toFixed(3)})`;
  ctx.lineWidth = 0.8 + rnd() * 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  let cx = x;
  let cy = y;
  for (let i = 0; i < 8; i++) {
    cx += w / 8;
    cy += (rnd() - 0.5) * 8;
    ctx.quadraticCurveTo(cx - w / 16, cy + (rnd() - 0.5) * 14, cx, cy);
  }
  ctx.stroke();
}

/** Renders the physical parchment base (no ink yet). */
async function renderBase(seed: number): Promise<{ base: HTMLCanvasElement; rnd: () => number }> {
  const W = CONFIG.PAPER_W;
  const H = CONFIG.PAPER_H;
  const rnd = mulberry32(seed);
  const img = await loadParchment();

  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  const ctx = base.getContext('2d');
  if (!ctx) return { base, rnd };

  // 1. Parchment base, cover-fitted with a random crop so each sheet differs.
  ctx.fillStyle = '#E8DCC4';
  ctx.fillRect(0, 0, W, H);
  if (img) {
    const s = Math.max(W / img.width, H / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, -(dw - W) * rnd(), -(dh - H) * rnd(), dw, dh);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(239,228,204,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 2. Physical imperfections.
  paintStains(ctx, W, H, seed % 500);
  paintAging(ctx, W, H);
  paintFibers(ctx, W, H, rnd);
  paintCrease(ctx, W, H, rnd);
  paintGrain(ctx, W, H, rnd);

  return { base, rnd };
}

/** Applies the deckled (torn) edge so the sheet looks like a physical page. */
function applyDeckle(base: HTMLCanvasElement, rnd: () => number): HTMLCanvasElement {
  const W = base.width;
  const H = base.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d');
  if (!octx) return base;
  octx.drawImage(base, 0, 0);
  octx.globalCompositeOperation = 'destination-in';
  octx.fillStyle = '#000';
  octx.beginPath();
  const m = 10;
  const jit = () => (rnd() - 0.5) * 3.4;
  octx.moveTo(m + jit(), m + jit());
  for (let x = m; x <= W - m; x += 5) octx.lineTo(x, m + jit());
  for (let y = m; y <= H - m; y += 5) octx.lineTo(W - m + jit(), y);
  for (let x = W - m; x >= m; x -= 5) octx.lineTo(x, H - m + jit());
  for (let y = H - m; y >= m; y -= 5) octx.lineTo(m + jit(), y);
  octx.closePath();
  octx.fill();
  octx.globalCompositeOperation = 'source-over';
  return out;
}

/**
 * Renders a physical-looking sheet: parchment photo base, stains, aging, fibres, a fold,
 * grain, abstract ink with bleed, and a deckled (torn-looking) edge with transparent corners.
 * Spoken words are never transcribed; the marks are procedural shapes only.
 */
export async function renderPaper(seed: number, strokes: number): Promise<HTMLCanvasElement> {
  const { base, rnd } = await renderBase(seed);
  const W = base.width;
  const H = base.height;
  const ctx = base.getContext('2d');
  if (!ctx) return applyDeckle(base, rnd);

  // 3. Abstract ink on a separate layer, so it can be bled and composited.
  const ink = document.createElement('canvas');
  ink.width = W;
  ink.height = H;
  const ictx = ink.getContext('2d');
  if (ictx) {
    const margin = 62;
    const rows = Math.max(5, Math.min(22, Math.round(strokes * 0.7)));
    const gap = 33;
    for (let r = 0; r < rows; r++) {
      const y = margin + 30 + r * gap + (rnd() - 0.5) * 5;
      if (y > H - margin) break;
      let x = margin + rnd() * 18;
      const right = W - margin - rnd() * 30;
      while (x < right) {
        x += inkWord(ictx, x, y, rnd) + 8 + rnd() * 12;
        if (rnd() < 0.08) {
          inkScribble(ictx, x, y + 4, 40, rnd);
          x += 50;
        }
      }
      if (rnd() < 0.3) {
        // Occasional strike-through.
        ictx.strokeStyle = 'rgba(40,32,26,0.35)';
        ictx.lineWidth = 1.1;
        const sx = margin + rnd() * (W - 2 * margin - 120);
        ictx.beginPath();
        ictx.moveTo(sx, y - 6);
        ictx.lineTo(sx + 60 + rnd() * 80, y - 4 + (rnd() - 0.5) * 3);
        ictx.stroke();
      }
    }
    for (let i = 0; i < Math.max(3, Math.floor(strokes / 2)); i++) {
      inkScribble(ictx, margin + rnd() * (W - 2 * margin - 80), margin + rnd() * (H - 2 * margin), 40 + rnd() * 60, rnd);
    }
  }

  // Multiply the ink into the paper, with a soft bleed halo under a crisper pass.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.45;
  ctx.filter = 'blur(1.1px)';
  ctx.drawImage(ink, 0, 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 0.85;
  ctx.drawImage(ink, 0, 0);
  ctx.restore();

  return applyDeckle(base, rnd);
}

const HAND_FONT = `'Caveat', 'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive`;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width <= maxW || !line) {
        line = test;
      } else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Writes the user's typed words onto the sheet in a handwriting style, with ink bleed. */
async function drawHandwriting(ctx: CanvasRenderingContext2D, text: string, rnd: () => number): Promise<void> {
  const W = CONFIG.PAPER_W;
  const H = CONFIG.PAPER_H;
  try {
    await document.fonts.load('600 44px Caveat');
  } catch {
    /* fall back to system cursive stack */
  }
  const margin = 58;
  const maxW = W - margin * 2;
  const maxH = H - margin * 2 - 10;

  // Pick the largest size that fits the sheet.
  const sizes = [46, 42, 38, 34, 30, 26];
  let size = sizes[0];
  let lines: string[] = [];
  for (const s of sizes) {
    size = s;
    ctx.font = `600 ${s}px ${HAND_FONT}`;
    lines = wrapText(ctx, text, maxW);
    if (lines.length * s * 1.2 <= maxH) break;
  }
  const lh = size * 1.2;
  const totalH = lines.length * lh;
  const startY = margin + (maxH - totalH) / 2 + size * 0.85;

  // Precompute word placement so bleed and crisp passes align.
  const layout = lines.map((line) => {
    let x = 0;
    const words = line
      .split(' ')
      .filter(Boolean)
      .map((w) => {
        const px = x;
        x += ctx.measureText(`${w} `).width;
        return { w, x: px, jy: (rnd() - 0.5) * 1.6 };
      });
    return { words, rot: (rnd() - 0.5) * 0.02 };
  });

  const passes = [
    { blur: 1.1, alpha: 0.4 },
    { blur: 0, alpha: 0.92 },
  ];
  for (const pass of passes) {
    ctx.save();
    ctx.filter = pass.blur ? `blur(${pass.blur}px)` : 'none';
    ctx.fillStyle = `rgba(43,34,26,${pass.alpha})`;
    layout.forEach((lineLayout, i) => {
      const y = startY + i * lh;
      ctx.save();
      ctx.translate(margin, y);
      ctx.rotate(lineLayout.rot);
      for (const word of lineLayout.words) {
        ctx.fillText(word.w, word.x, word.jy);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  // If the message is short, add a few abstract strokes below.
  if (lines.length < 4) {
    let sy = startY + totalH + 26;
    while (sy < H - margin && sy < startY + totalH + 90) {
      inkScribble(ctx, margin + rnd() * 30, sy, 70 + rnd() * 50, rnd);
      sy += 28;
    }
  }
}

/**
 * Renders the sheet with the user's actual typed words in handwriting.
 * The text exists only in this canvas, which is discarded after destruction.
 */
export async function renderPaperWithText(seed: number, text: string): Promise<HTMLCanvasElement> {
  const { base, rnd } = await renderBase(seed);
  const ctx = base.getContext('2d');
  if (ctx) await drawHandwriting(ctx, text, rnd);
  return applyDeckle(base, rnd);
}
