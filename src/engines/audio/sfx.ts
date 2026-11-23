import { registerCleanup } from '../../utils/cleanup';

/**
 * Synthesised sound effects (no audio files needed).
 * Everything routes through one master gain so mute is instant and global.
 */
export class Sfx {
  private ctx: AudioContext;
  private master: GainNode;
  private noise: AudioBuffer;
  private brown: AudioBuffer;
  private timers: number[] = [];
  private nodes: AudioNode[] = [];
  private disposed = false;
  private unregister: () => void;

  constructor(muted: boolean, private lowPower = false) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    // Some browsers start the context suspended; resume it from the user's gesture chain.
    void this.ctx.resume().catch(() => undefined);
    this.master = this.ctx.createGain();
    this.master.gain.value = muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);

    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    this.brown = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    const bd = this.brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      nd[i] = w;
      last = (last + 0.02 * w) / 1.02;
      bd[i] = last * 3.5;
    }
    this.unregister = registerCleanup(() => this.dispose());
  }

  setMuted(muted: boolean) {
    if (this.disposed) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  private src(buffer: AudioBuffer, loop = true) {
    const s = this.ctx.createBufferSource();
    s.buffer = buffer;
    s.loop = loop;
    s.start();
    this.nodes.push(s);
    return s;
  }

  private every(minMs: number, maxMs: number, fn: () => void) {
    const tick = () => {
      if (this.disposed) return;
      fn();
      this.timers.push(window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs)));
    };
    this.timers.push(window.setTimeout(tick, 50));
  }

  /** Gentle fire crackle plus low ambience. */
  startFire() {
    if (this.disposed) return;
    const now = this.ctx.currentTime;

    const ambient = this.ctx.createBiquadFilter();
    ambient.type = 'lowpass';
    ambient.frequency.value = 400;
    const ambGain = this.ctx.createGain();
    ambGain.gain.setValueAtTime(0, now);
    ambGain.gain.linearRampToValueAtTime(0.35, now + 1.5);
    this.src(this.brown).connect(ambient).connect(ambGain).connect(this.master);

    const roar = this.ctx.createBiquadFilter();
    roar.type = 'bandpass';
    roar.frequency.value = 1400;
    roar.Q.value = 0.6;
    const roarGain = this.ctx.createGain();
    roarGain.gain.setValueAtTime(0, now);
    roarGain.gain.linearRampToValueAtTime(0.12, now + 1.2);
    this.src(this.noise).connect(roar).connect(roarGain).connect(this.master);

    // Crackles: short, bright bursts at random intervals.
    const density = this.lowPower ? [140, 420] : [60, 260];
    this.every(density[0], density[1], () => this.crackle(0.25 + Math.random() * 0.5));
  }

  private crackle(level: number) {
    const dur = 0.004 + Math.random() * 0.012;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800 + Math.random() * 2500;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(level * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(hp).connect(g).connect(this.master);
    s.start(t, Math.random() * 1.5, dur + 0.02);
    s.stop(t + dur + 0.03);
  }

  stopFire(fadeSec = 1.2) {
    this.fadeOutAll(fadeSec);
  }

  /** Motor start, paper feed, rapid shredding, then motor shutdown. */
  startShredder() {
    if (this.disposed) return;
    const t = this.ctx.currentTime;

    // Motor: low saw that ramps up on start.
    const motor = this.ctx.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(22, t);
    motor.frequency.linearRampToValueAtTime(58, t + 0.9);
    const motorLp = this.ctx.createBiquadFilter();
    motorLp.type = 'lowpass';
    motorLp.frequency.value = 260;
    const motorGain = this.ctx.createGain();
    motorGain.gain.setValueAtTime(0, t);
    motorGain.gain.linearRampToValueAtTime(0.14, t + 0.8);
    motor.connect(motorLp).connect(motorGain).connect(this.master);
    motor.start(t);
    this.nodes.push(motor);
    this.motor = motor;
    this.motorGain = motorGain;

    // Paper feed: soft, filtered noise.
    const feed = this.ctx.createBiquadFilter();
    feed.type = 'highpass';
    feed.frequency.value = 900;
    const feedGain = this.ctx.createGain();
    feedGain.gain.setValueAtTime(0, t);
    feedGain.gain.linearRampToValueAtTime(0.05, t + 0.4);
    this.src(this.noise).connect(feed).connect(feedGain).connect(this.master);

    // Shredding: band-passed noise with an amplitude LFO for the cutting rhythm.
    const cut = this.ctx.createBiquadFilter();
    cut.type = 'bandpass';
    cut.frequency.value = 3200;
    cut.Q.value = 0.9;
    const cutGain = this.ctx.createGain();
    cutGain.gain.setValueAtTime(0, t);
    cutGain.gain.linearRampToValueAtTime(0.16, t + 0.8);
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 14;
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = 0.06;
    lfo.connect(lfoDepth).connect(cutGain.gain);
    lfo.start(t);
    this.nodes.push(lfo);
    this.src(this.noise).connect(cut).connect(cutGain).connect(this.master);

    this.every(this.lowPower ? 120 : 70, this.lowPower ? 200 : 120, () => this.crackle(0.12));
  }

  private motor: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  /** Motor shutdown: pitch and level fall away over about a second. */
  stopShredder() {
    if (this.disposed) return;
    const t = this.ctx.currentTime;
    if (this.motor && this.motorGain) {
      this.motor.frequency.cancelScheduledValues(t);
      this.motor.frequency.linearRampToValueAtTime(14, t + 1.0);
      this.motorGain.gain.cancelScheduledValues(t);
      this.motorGain.gain.linearRampToValueAtTime(0.0001, t + 1.0);
    }
    this.fadeOutAll(1.0);
  }

  private fadeOutAll(sec: number) {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.0001, t + sec);
    window.setTimeout(() => this.dispose(), sec * 1000 + 120);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    this.nodes.forEach((n) => {
      try {
        (n as AudioScheduledSourceNode).stop();
      } catch {
        /* already stopped */
      }
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.nodes = [];
    this.unregister();
    this.ctx.close().catch(() => undefined);
  }
}
