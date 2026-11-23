import { registerCleanup } from '../../utils/cleanup';
import type { Sfx } from '../audio/sfx';
import type { SceneHandle } from './burnScene';

interface ShredOptions {
  canvas: HTMLCanvasElement;
  paper: HTMLCanvasElement;
  reducedMotion: boolean;
  lowPower: boolean;
  sfx: Sfx | null;
  onDone: () => void;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Shaded desk cross-cut shredder. The sheet slides into the feed slot, the rollers turn,
 * strips hang out of the base, drop with spin into the bin, and build up into a pile.
 */
export function runShred(opts: ShredOptions): SceneHandle {
  const { canvas, paper, reducedMotion, lowPower, sfx, onDone } = opts;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');

  const STRIPS = lowPower ? 16 : 24;
  const T_APPEAR = reducedMotion ? 0.3 : 0.8;
  const T_APPROACH = reducedMotion ? 0.3 : 0.7;
  const T_FEED = reducedMotion ? 1.8 : lowPower ? 3.6 : 4.4;
  const T_DROP = reducedMotion ? 0.5 : 1.3;
  const T_END = T_APPEAR + T_APPROACH + T_FEED + T_DROP + 0.8;
  const feedStart = T_APPEAR + T_APPROACH;
  const feedEnd = feedStart + T_FEED;

  const hashf = (i: number, k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const strips = Array.from({ length: STRIPS }, (_, i) => ({
    delay: hashf(i, 1),
    sway: hashf(i, 2),
    spin: (hashf(i, 3) - 0.5) * 0.7,
    pileX: hashf(i, 4),
    pileY: hashf(i, 5),
    pileRot: (hashf(i, 6) - 0.5) * 0.9,
    pileSrc: hashf(i, 7),
  }));

  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let pw = 0;
  let ph = 0;
  let slotY = 0;
  let bodyH = 0;
  let bodyW = 0;
  let bodyBottom = 0;
  let binTop = 0;
  let cx = 0;
  let raf = 0;
  let stopped = false;
  let finished = false;
  let t = 0;
  let last = 0;
  let motorOn = false;

  const layout = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 2);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    const aspect = paper.width / paper.height;
    cx = vw / 2;
    slotY = vh * (vw < 640 ? 0.4 : 0.44);
    // The sheet must fit above the slot with room to spare.
    pw = Math.min(vw * 0.6, 380, (slotY - 40) * aspect);
    pw = Math.max(110, pw);
    ph = pw / aspect;
    bodyW = Math.min(vw * 0.82, pw * 1.6, 520);
    bodyH = Math.min(vh * 0.16, 150);
    bodyBottom = slotY + bodyH;
    binTop = bodyBottom + Math.min(vh * 0.12, 110);
  };

  const onResize = () => {
    if (!stopped) layout();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    sfx?.stopShredder();
    onDone();
  };

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /** Draws a slice of the paper canvas, optionally rotated and shadowed. */
  const piece = (
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    angle: number,
    shadow: boolean,
  ) => {
    ctx.save();
    ctx.translate(dx + dw / 2, dy + dh / 2);
    ctx.rotate(angle);
    if (shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 3;
    }
    ctx.drawImage(paper, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };

  const draw = (now: number) => {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    if (!motorOn && t >= feedStart) {
      motorOn = true;
      sfx?.startShredder();
    }

    const feeding = t >= feedStart && t < feedEnd;
    const feedK = clamp01((t - feedStart) / T_FEED);
    const dropT = Math.max(0, t - feedEnd);
    const shake = feeding && !reducedMotion ? Math.sin(t * 64) * 0.6 + Math.sin(t * 23) * 0.4 : 0;
    const stripW = pw / STRIPS;
    const srcW = paper.width / STRIPS;
    const x0 = cx - pw / 2;
    const binW = bodyW * 0.9;
    const binX = cx - binW / 2;
    const lip = binTop + 40;
    const emitted = Math.max(0, Math.min(ph, feedK * (ph + bodyH) - bodyH));
    const fallK = (i: number) => clamp01((dropT - strips[i].delay * 0.4) / T_DROP);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    // Warm pool of light around the machine.
    const amb = ctx.createRadialGradient(cx, slotY, 10, cx, slotY, vh * 0.8);
    amb.addColorStop(0, 'rgba(96,76,48,0.26)');
    amb.addColorStop(1, 'rgba(10,10,10,0)');
    ctx.fillStyle = amb;
    ctx.fillRect(0, 0, vw, vh);

    // The sheet: appears, approaches the slot, then slides in (clipped at the slot line).
    const restTop = slotY - ph - 40;
    const dockTop = slotY - ph;
    let paperTop = restTop;
    let paperAlpha = 1;
    if (t < T_APPEAR) {
      const e = easeOut(t / T_APPEAR);
      paperTop = restTop - (1 - e) * 24;
      paperAlpha = e;
    } else if (t < feedStart) {
      const k = clamp01((t - T_APPEAR) / T_APPROACH);
      const e = k * k * (3 - 2 * k);
      paperTop = restTop + (dockTop - restTop) * e;
    } else {
      paperTop = dockTop + feedK * (ph + bodyH);
    }
    if (paperAlpha > 0 && paperTop < slotY - 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, vw, slotY - 1);
      ctx.clip();
      ctx.globalAlpha = paperAlpha;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
      ctx.drawImage(paper, x0 + shake, paperTop, pw, ph);
      ctx.restore();
    }

    // Bin back wall.
    const backGrad = ctx.createLinearGradient(0, binTop, 0, vh);
    backGrad.addColorStop(0, '#0f0e0c');
    backGrad.addColorStop(1, '#060606');
    ctx.fillStyle = backGrad;
    ctx.fillRect(binX, binTop, binW, vh - binTop);

    // Pile of strips already landed in the bin.
    for (let i = 0; i < STRIPS; i++) {
      const s = strips[i];
      if (fallK(i) < 1) continue;
      const pw2 = stripW * 1.25;
      const ph2 = 16 + s.pileY * 14;
      const px = binX + 14 + s.pileX * (binW - 28 - pw2);
      const py = binTop + 6 + (1 - s.pileY) * 20;
      const sy = s.pileSrc * paper.height * 0.8;
      piece(i * srcW, sy, srcW, paper.height * 0.2, px, py, pw2, ph2, s.pileRot, true);
    }

    // Strips: hanging from the base while feeding, then dropping with spin into the bin.
    for (let i = 0; i < STRIPS; i++) {
      const s = strips[i];
      const fk = fallK(i);
      if (fk >= 1) continue;
      const sx = i * srcW;
      const x = x0 + i * stripW + shake;
      if (fk <= 0) {
        if (emitted <= 0) continue;
        const sway = Math.sin(t * 3 + i * 0.7) * (reducedMotion ? 0 : 1.2) * Math.min(1, emitted / 60);
        piece(sx, 0, srcW, paper.height * (emitted / ph), x + sway, bodyBottom, stripW - 0.8, emitted, 0, true);
      } else {
        const e = fk * fk;
        const y = bodyBottom + (binTop + 14 - bodyBottom) * e;
        const angle = s.spin * fk + Math.sin(t * 6 + i) * 0.02 * fk;
        const dx = s.sway * 10 * fk;
        piece(sx, 0, srcW, paper.height, x + dx, y, stripW - 0.8, ph, angle, true);
      }
    }

    // Bin front wall: covers strips that fall below the lip.
    const frontGrad = ctx.createLinearGradient(0, lip, 0, vh);
    frontGrad.addColorStop(0, '#2b2926');
    frontGrad.addColorStop(0.12, '#1d1c1a');
    frontGrad.addColorStop(1, '#0a0a09');
    ctx.beginPath();
    ctx.moveTo(binX, lip);
    ctx.lineTo(binX + binW, lip);
    ctx.lineTo(binX + binW + 14, vh);
    ctx.lineTo(binX - 14, vh);
    ctx.closePath();
    ctx.fillStyle = frontGrad;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,236,200,0.14)';
    ctx.fillRect(binX, lip, binW, 2);

    // Machine body.
    const bodyX = cx - bodyW / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 38;
    ctx.shadowOffsetY = 18;
    const bodyGrad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
    bodyGrad.addColorStop(0, '#141311');
    bodyGrad.addColorStop(0.12, '#3a3834');
    bodyGrad.addColorStop(0.3, '#24221f');
    bodyGrad.addColorStop(0.7, '#1f1e1b');
    bodyGrad.addColorStop(0.9, '#383632');
    bodyGrad.addColorStop(1, '#121110');
    ctx.fillStyle = bodyGrad;
    roundRect(bodyX, slotY - 4, bodyW, bodyH + 4, 16);
    ctx.fill();
    ctx.restore();

    // Vertical light falloff across the casing.
    const vg = ctx.createLinearGradient(0, slotY, 0, bodyBottom);
    vg.addColorStop(0, 'rgba(255,240,210,0.10)');
    vg.addColorStop(0.25, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    roundRect(bodyX, slotY - 4, bodyW, bodyH + 4, 16);
    ctx.fill();

    // Top bevel highlight.
    ctx.fillStyle = 'rgba(255,240,215,0.07)';
    roundRect(bodyX + 6, slotY - 4, bodyW - 12, 14, 6);
    ctx.fill();

    // Feed slot with rollers. Their ridges move while feeding.
    const slotW = pw + 22;
    roundRect(cx - slotW / 2, slotY - 5, slotW, 10, 5);
    ctx.fillStyle = '#050505';
    ctx.fill();
    ctx.save();
    roundRect(cx - slotW / 2, slotY - 5, slotW, 10, 5);
    ctx.clip();
    const rollerGrad = ctx.createLinearGradient(0, slotY - 5, 0, slotY + 5);
    rollerGrad.addColorStop(0, '#8a857c');
    rollerGrad.addColorStop(0.5, '#3d3a35');
    rollerGrad.addColorStop(1, '#11100f');
    ctx.fillStyle = rollerGrad;
    const off = feeding ? (t * 340) % 12 : 0;
    for (let x = cx - slotW / 2 - 12 + off; x < cx + slotW / 2 + 12; x += 12) {
      ctx.fillRect(x, slotY - 5, 5, 10);
    }
    ctx.restore();

    // Brand plate.
    ctx.fillStyle = 'rgba(245,242,234,0.42)';
    ctx.font = `600 ${Math.max(9, Math.round(bodyW * 0.022))}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('LET IT GO  \u2022  CROSS-CUT', bodyX + 22, slotY + 24);

    // Status LED with bloom while the motor runs.
    const ledX = bodyX + bodyW - 30;
    const ledY = slotY + 24;
    if (feeding) {
      const glow = ctx.createRadialGradient(ledX, ledY, 0, ledX, ledY, 16);
      glow.addColorStop(0, 'rgba(245,158,11,0.9)');
      glow.addColorStop(1, 'rgba(245,158,11,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ledX, ledY, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = feeding ? '#FFB347' : '#4a3a20';
    ctx.beginPath();
    ctx.arc(ledX, ledY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Ventilation slots.
    for (let k = 0; k < 7; k++) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bodyX + 22 + k * 7, bodyBottom - 34, 2, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(bodyX + 24 + k * 7, bodyBottom - 34, 1, 16);
    }

    // Screws at the corners.
    const screws: [number, number][] = [
      [bodyX + 12, slotY + 8],
      [bodyX + bodyW - 12, slotY + 8],
      [bodyX + 12, bodyBottom - 10],
      [bodyX + bodyW - 12, bodyBottom - 10],
    ];
    for (const [sx, sy] of screws) {
      const sg = ctx.createRadialGradient(sx - 1, sy - 1, 0, sx, sy, 4);
      sg.addColorStop(0, '#9a958c');
      sg.addColorStop(1, '#2a2824');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (t >= T_END) {
      finish();
      return;
    }
    raf = requestAnimationFrame(draw);
  };

  const teardown = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    sfx?.stopShredder();
  };

  const unregister = registerCleanup(teardown);

  layout();
  window.addEventListener('resize', onResize);
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
