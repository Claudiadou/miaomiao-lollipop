import * as PIXI from 'pixi.js';

interface Particle {
  gfx: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
}

const particles: Particle[] = [];
let layer: PIXI.Container;

export function setParticleLayer(l: PIXI.Container) {
  layer = l;
}

export function burst(count: number, color: number, x: number, y: number) {
  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics();
    const r = 3 + Math.random() * 6;
    if (i % 2 === 0) {
      g.beginFill(color);
      g.drawCircle(0, 0, r);
      g.endFill();
    } else {
      g.beginFill(color, 0.7);
      g.moveTo(0, -r);
      for (let j = 1; j <= 5; j++) {
        const angle = (j * 4 * Math.PI) / 5;
        g.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      g.closePath();
      g.endFill();
    }
    g.x = x;
    g.y = y;
    layer.addChild(g);
    particles.push({
      gfx: g,
      vx: (Math.random() - 0.5) * 8,
      vy: -(2 + Math.random() * 6),
      life: 1,
    });
  }
}

export function updateParticles(dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.gfx.x += p.vx * dt;
    p.gfx.y += p.vy * dt;
    p.vy += 0.2 * dt;
    p.life -= 0.025 * dt;
    p.gfx.alpha = Math.max(0, p.life);
    p.gfx.scale.set(p.life);
    if (p.life <= 0) {
      layer.removeChild(p.gfx);
      p.gfx.destroy();
      particles.splice(i, 1);
    }
  }
}
