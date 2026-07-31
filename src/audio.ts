let ctx: AudioContext | null = null;
function ac(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

export function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.1) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch (_) {}
}

export const sfx = {
  tap:    () => tone(800, 0.06),
  pour:   () => { tone(400, 0.12, 'triangle'); setTimeout(() => tone(300, 0.15, 'triangle'), 100); },
  pop:    () => { tone(600, 0.08); setTimeout(() => tone(900, 0.1), 80); setTimeout(() => tone(1200, 0.12), 150); },
  correct:() => { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.12), i * 100)); },
  wrong:  () => { tone(180, 0.15, 'triangle'); setTimeout(() => tone(140, 0.2, 'triangle'), 120); },
  upgrade:() => { [523, 659, 784, 1047, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.15), i * 100)); },
  coin:   () => { tone(1200, 0.08); setTimeout(() => tone(1600, 0.1), 80); },
};
