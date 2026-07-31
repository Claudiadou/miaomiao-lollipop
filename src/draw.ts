import * as PIXI from 'pixi.js';

export function createPot(scale = 1): PIXI.Container {
  const c = new PIXI.Container();
  const s = scale;

  // Shadow
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.15);
  shadow.drawEllipse(0, 42 * s, 30 * s, 6 * s);
  shadow.endFill();
  c.addChild(shadow);

  // Body
  const body = new PIXI.Graphics();
  body.beginFill(0x7B5EA7);
  body.drawRoundedRect(-30 * s, 0, 60 * s, 42 * s, 8 * s);
  body.endFill();
  body.lineStyle(3 * s, 0x5B3A7A);
  body.drawRoundedRect(-30 * s, 0, 60 * s, 42 * s, 8 * s);
  c.addChild(body);

  // Rim
  const rim = new PIXI.Graphics();
  rim.beginFill(0x9B6FC0);
  rim.drawEllipse(0, 0, 30 * s, 8 * s);
  rim.endFill();
  rim.lineStyle(2 * s, 0x5B3A7A);
  rim.drawEllipse(0, 0, 30 * s, 8 * s);
  c.addChild(rim);

  // Liquid (named for later color change)
  const liquid = new PIXI.Graphics();
  liquid.name = 'liquid';
  liquid.beginFill(0xFFD166);
  liquid.drawEllipse(0, -2 * s, 25 * s, 6 * s);
  liquid.endFill();
  liquid.beginFill(0xFFD166);
  liquid.drawRoundedRect(-25 * s, -8 * s, 50 * s, 8 * s, 4 * s);
  liquid.endFill();
  c.addChild(liquid);

  // Eyes
  const eyeL = new PIXI.Graphics();
  eyeL.beginFill(0xFFFFFF);
  eyeL.drawCircle(-10 * s, 18 * s, 6 * s);
  eyeL.endFill();
  eyeL.beginFill(0x333333);
  eyeL.drawCircle(-9 * s, 19 * s, 3 * s);
  eyeL.endFill();
  c.addChild(eyeL);

  const eyeR = new PIXI.Graphics();
  eyeR.beginFill(0xFFFFFF);
  eyeR.drawCircle(10 * s, 18 * s, 6 * s);
  eyeR.endFill();
  eyeR.beginFill(0x333333);
  eyeR.drawCircle(11 * s, 19 * s, 3 * s);
  eyeR.endFill();
  c.addChild(eyeR);

  // Handles
  const hl = new PIXI.Graphics();
  hl.lineStyle(3 * s, 0x7B5EA7);
  hl.drawCircle(-30 * s, 20 * s, 6 * s);
  c.addChild(hl);

  const hr = new PIXI.Graphics();
  hr.lineStyle(3 * s, 0x7B5EA7);
  hr.drawCircle(30 * s, 20 * s, 6 * s);
  c.addChild(hr);

  return c;
}

export function updatePotLiquid(pot: PIXI.Container, color: number) {
  const liquid = pot.getChildByName('liquid') as PIXI.Graphics | null;
  if (!liquid) return;
  liquid.clear();
  const s = 1;
  liquid.beginFill(color);
  liquid.drawEllipse(0, -2 * s, 25 * s, 6 * s);
  liquid.endFill();
  liquid.beginFill(color);
  liquid.drawRoundedRect(-25 * s, -8 * s, 50 * s, 8 * s, 4 * s);
  liquid.endFill();
}

export function createBubble(): PIXI.Container {
  const c = new PIXI.Container();
  const bg = new PIXI.Graphics();
  bg.beginFill(0xFFFFFF);
  bg.drawRoundedRect(-70, -22, 140, 44, 14);
  bg.endFill();
  bg.lineStyle(3, 0xE75480);
  bg.drawRoundedRect(-70, -22, 140, 44, 14);
  // Tail
  bg.beginFill(0xFFFFFF);
  bg.moveTo(-6, 22);
  bg.lineTo(6, 22);
  bg.lineTo(0, 32);
  bg.closePath();
  bg.endFill();
  c.addChild(bg);
  return c;
}

export function makeText(content: string, size: number, color = '#333333'): PIXI.Text {
  return new PIXI.Text(content, {
    fontSize: size,
    fill: color,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 'bold',
  });
}
