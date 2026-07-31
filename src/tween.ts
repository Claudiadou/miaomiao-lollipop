type EaseFn = (t: number) => number;

interface Tween {
  obj: Record<string, any>;
  props: Record<string, number>;
  start: Record<string, number>;
  dur: number;
  elapsed: number;
  ease: EaseFn;
  done?: () => void;
}

const tweens: Tween[] = [];

export function tweenTo(
  obj: Record<string, any>,
  props: Record<string, number>,
  dur: number,
  ease: EaseFn = (t) => t,
  done?: () => void,
) {
  const start: Record<string, number> = {};
  for (const k in props) start[k] = obj[k] ?? 0;
  tweens.push({ obj, props, start, dur, elapsed: 0, ease, done });
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function updateTweens(dt: number) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.elapsed += dt;
    const p = Math.min(tw.elapsed / tw.dur, 1);
    const v = tw.ease(p);
    for (const k in tw.props) {
      tw.obj[k] = tw.start[k] + (tw.props[k] - tw.start[k]) * v;
    }
    if (p >= 1) {
      tw.done?.();
      tweens.splice(i, 1);
    }
  }
}

export function scalePop(obj: { scale: { x: number; y: number } }, dur = 0.4) {
  tweenTo(obj.scale, { x: 1.3, y: 1.3 }, dur * 0.4, easeOutBack, () => {
    tweenTo(obj.scale, { x: 1, y: 1 }, dur * 0.6, easeOutCubic);
  });
}
