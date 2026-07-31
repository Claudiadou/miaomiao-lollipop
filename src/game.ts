import * as PIXI from 'pixi.js';
import { FRUITS, MOLDS, DECORS, CUSTOMERS, STAGES } from './config';
import { sfx } from './audio';
import { tweenTo, easeOutCubic, scalePop, updateTweens } from './tween';
import { burst, setParticleLayer, updateParticles } from './particles';
import { createPot, updatePotLiquid, createBubble, makeText } from './draw';

// ===== STATE =====
let coins = parseInt(localStorage.getItem('mm_coins') || '0', 10);
let step = 1;
let stageIdx = 0;
let pickedFruit = -1;
let pickedMold = -1;
let pickedDecors: number[] = [];

let targetFruit = 0;
let targetMold = 0;
let lastCustIdx = -1;
let isLocked = false;

// ===== PIXI OBJECTS =====
let app: PIXI.Application;
let bgLayer: PIXI.Container;
let mainLayer: PIXI.Container;
let fxLayer: PIXI.Container;

let pot: PIXI.Container;
let catText: PIXI.Text;
let customerText: PIXI.Text;
let bubble: PIXI.Container;
let bubbleText: PIXI.Text;
let lolliPreview: PIXI.Container;
let steamGfx: PIXI.Graphics;

let W = 400;
let H = 600;

// ===== DOM REFS =====
const $ = (id: string) => document.getElementById(id)!;
const stepTitle = $('step-title') as HTMLElement;
const stepRow   = $('step-row') as HTMLElement;
const btnFinish = $('btn-finish') as HTMLElement;
const coinCount = $('coin-count') as HTMLElement;
const diffBadge = $('diff-badge') as HTMLElement;
const stepDots  = document.querySelectorAll('.step-dot') as NodeListOf<HTMLElement>;

// ===== INIT PIXI =====
export function init() {
  const stageEl = $('pixi-stage');
  app = new PIXI.Application({
    resizeTo: stageEl,
    backgroundAlpha: 0,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  stageEl.appendChild(app.view as HTMLCanvasElement);

  bgLayer = new PIXI.Container();
  mainLayer = new PIXI.Container();
  fxLayer = new PIXI.Container();
  app.stage.addChild(bgLayer, mainLayer, fxLayer);
  setParticleLayer(fxLayer);

  app.ticker.add((delta) => {
    const dt = delta / 60;
    updateTweens(dt);
    updateParticles(dt);
    if (bubble) {
      bubble.y += Math.sin(Date.now() / 500) * 0.3;
    }
  });

  window.addEventListener('resize', buildScene);

  coinCount.textContent = String(coins);
  updateStageBadge();
  buildScene();
  nextOrder();

  // expose game API to window for DOM buttons
  (window as any).game = { goStep, finish };
}

function Wx() { return app.screen.width; }
function Hy() { return app.screen.height; }

function buildScene() {
  W = Wx();
  H = Hy();
  bgLayer.removeChildren();
  mainLayer.removeChildren();

  // Background
  const bg = new PIXI.Graphics();
  bg.beginFill(0xB3E5FC); bg.drawRect(0, 0, W, H * 0.30); bg.endFill();
  bg.beginFill(0x81D4FA); bg.drawRect(0, H * 0.26, W, H * 0.05); bg.endFill();
  bg.beginFill(0xE8D5B7); bg.drawRect(0, H * 0.31, W, H * 0.05); bg.endFill();
  bg.beginFill(0xDEB887); bg.drawRect(0, H * 0.36, W, H * 0.04); bg.endFill();
  bg.beginFill(0xFFE4C9); bg.drawRect(0, H * 0.40, W, H * 0.60); bg.endFill();
  // Counter
  bg.beginFill(0xDEB887); bg.drawRoundedRect(W * 0.06, H * 0.56, W * 0.88, 14, 7); bg.endFill();
  bg.lineStyle(2, 0xB8956A); bg.drawRoundedRect(W * 0.06, H * 0.56, W * 0.88, 14, 7);
  // Floor dots
  for (let i = 0; i < 15; i++) {
    bg.beginFill(0xFFCDD2, 0.3);
    bg.drawCircle(Math.random() * W, H * 0.46 + Math.random() * H * 0.48, 1.5);
    bg.endFill();
  }
  bgLayer.addChild(bg);

  // Cat
  catText = makeText('🐱', W * 0.13, '#000');
  catText.anchor.set(0.5);
  catText.x = W * 0.15;
  catText.y = H * 0.68;
  mainLayer.addChild(catText);

  // Pot
  pot = createPot(W / 360);
  pot.x = W * 0.5;
  pot.y = H * 0.55;
  mainLayer.addChild(pot);

  // Customer
  customerText = makeText('🐰', W * 0.12, '#000');
  customerText.anchor.set(0.5);
  customerText.x = W * 0.85;
  customerText.y = H * 0.68;
  mainLayer.addChild(customerText);

  // Bubble
  bubble = createBubble();
  bubble.x = W * 0.85;
  bubble.y = H * 0.34;
  bubble.alpha = 0;
  bubbleText = makeText('🍓+⭐', 20, '#666');
  bubbleText.anchor.set(0.5);
  bubble.addChild(bubbleText);
  mainLayer.addChild(bubble);

  // Lollipop preview (above pot, hidden)
  lolliPreview = new PIXI.Container();
  lolliPreview.x = W * 0.5;
  lolliPreview.y = H * 0.28;
  lolliPreview.scale.set(0);
  mainLayer.addChild(lolliPreview);

  // Steam
  steamGfx = new PIXI.Graphics();
  steamGfx.alpha = 0;
  steamGfx.x = W * 0.5;
  steamGfx.y = H * 0.42;
  mainLayer.addChild(steamGfx);
}

// ===== STEP UI =====
function updateStepDots() {
  stepDots.forEach((d, i) => d.classList.toggle('active', i + 1 === step));
}

export function goStep(s: number) {
  if (isLocked) return;
  if (s === 2 && pickedFruit < 0) { goStep(1); return; }
  if (s === 3 && pickedMold < 0) { goStep(2); return; }
  step = s;
  updateStepDots();
  renderStepButtons();
}

function renderStepButtons() {
  stepRow.innerHTML = '';
  btnFinish.style.display = 'none';

  if (step === 1) {
    stepTitle.textContent = '① 选一个水果';
    const n = STAGES[stageIdx].n;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div');
      b.className = 'btn-sel';
      if (i === pickedFruit) b.classList.add('selected');
      b.textContent = FRUITS[i].emoji;
      b.onclick = () => selectFruit(i);
      stepRow.appendChild(b);
    }
  } else if (step === 2) {
    stepTitle.textContent = '② 选一个模具造型';
    for (let i = 0; i < MOLDS.length; i++) {
      const b = document.createElement('div');
      b.className = 'btn-sel';
      if (i === pickedMold) b.classList.add('selected');
      b.textContent = MOLDS[i].emoji;
      b.onclick = () => selectMold(i);
      stepRow.appendChild(b);
    }
  } else if (step === 3) {
    stepTitle.textContent = '③ 撒上装饰粒（可多选）';
    btnFinish.style.display = 'block';
    for (let i = 0; i < DECORS.length; i++) {
      const b = document.createElement('div');
      b.className = 'btn-sel';
      if (pickedDecors.includes(i)) b.classList.add('selected');
      b.textContent = DECORS[i].emoji;
      b.onclick = () => toggleDecor(i);
      stepRow.appendChild(b);
    }
    updateLolliPreview();
  }
}

// ===== SELECTIONS =====
function selectFruit(i: number) {
  if (isLocked) return;
  sfx.tap();
  pickedFruit = i;
  renderStepButtons();

  // Update pot liquid color
  updatePotLiquid(pot, FRUITS[i].color);
  // Shake pot
  tweenTo(pot, { y: pot.y - 4 }, 0.15, easeOutCubic, () => {
    tweenTo(pot, { y: pot.y + 4 }, 0.15);
  });
  burst(8, FRUITS[i].color, pot.x, pot.y - 10);

  sfx.pour();
  setTimeout(() => goStep(2), 600);
}

function selectMold(i: number) {
  if (isLocked) return;
  sfx.tap();
  pickedMold = i;
  renderStepButtons();
  updateLolliPreview();
  setTimeout(() => goStep(3), 400);
}

function toggleDecor(i: number) {
  sfx.tap();
  const idx = pickedDecors.indexOf(i);
  if (idx >= 0) pickedDecors.splice(idx, 1);
  else pickedDecors.push(i);
  renderStepButtons();
  updateLolliPreview();
}

function updateLolliPreview() {
  lolliPreview.removeChildren();
  lolliPreview.scale.set(0);
  if (pickedFruit < 0 || pickedMold < 0) return;

  const s = W / 400;
  // Stick
  const stick = new PIXI.Graphics();
  stick.beginFill(0xFFFFFF);
  stick.lineStyle(1, 0xDDDDDD);
  stick.drawRoundedRect(-4 * s, 0, 8 * s, 40 * s, 3 * s);
  stick.endFill();
  lolliPreview.addChild(stick);

  // Candy head
  const head = new PIXI.Graphics();
  head.beginFill(FRUITS[pickedFruit].color);
  head.drawCircle(0, -12 * s, 26 * s);
  head.endFill();
  head.beginFill(0xFFFFFF, 0.25);
  head.drawCircle(-8 * s, -18 * s, 6 * s);
  head.endFill();
  lolliPreview.addChild(head);

  // Mold emoji
  const moldText = makeText(MOLDS[pickedMold].emoji, 24 * s, '#FFF');
  moldText.anchor.set(0.5);
  moldText.y = -12 * s;
  lolliPreview.addChild(moldText);

  // Decors
  pickedDecors.forEach((di, idx) => {
    const t = makeText(DECORS[di].item, 14 * s, '#333');
    t.anchor.set(0.5);
    t.x = (Math.sin(idx * 2.5) * 20) * s;
    t.y = (-12 + Math.cos(idx * 2.5) * 16) * s;
    lolliPreview.addChild(t);
  });

  scalePop(lolliPreview, 0.5);
}

// ===== GAME FLOW =====
export function finish() {
  if (isLocked || pickedFruit < 0 || pickedMold < 0) return;
  isLocked = true;
  sfx.pop();

  // Cooking animation
  tweenTo(pot, { y: pot.y - 3 }, 0.2, easeOutCubic, () => tweenTo(pot, { y: pot.y + 3 }, 0.2));
  burst(16, FRUITS[pickedFruit].color, pot.x, pot.y);
  scalePop(lolliPreview, 0.6);

  // Steam
  steamGfx.alpha = 0.5;
  tweenTo(steamGfx, { alpha: 0 }, 1.5);

  setTimeout(() => {
    const correct = pickedFruit === targetFruit && pickedMold === targetMold;
    if (correct) {
      coins += 10;
      burst(20, 0xFFD700, catText.x, catText.y - 20);
      sfx.correct();
    } else {
      coins += 5;
      sfx.wrong();
    }
    coinCount.textContent = String(coins);
    localStorage.setItem('mm_coins', String(coins));

    updateStageBadge();
    scalePop(catText as any, 0.5);

    bubbleText.text = correct ? '一模一样！🥰' : '创新口味！😋';
    bubble.alpha = 1;
    tweenTo(bubble, { alpha: 0 }, 1.5, easeOutCubic);

    setTimeout(() => nextOrder(), 2000);
  }, 1200);
}

function nextOrder() {
  isLocked = false;
  pickedFruit = -1;
  pickedMold = -1;
  pickedDecors = [];
  lolliPreview.scale.set(0);
  steamGfx.alpha = 0;

  const s = STAGES[stageIdx];
  targetFruit = Math.floor(Math.random() * s.n);
  targetMold = Math.floor(Math.random() * MOLDS.length);

  let ci: number;
  do { ci = Math.floor(Math.random() * CUSTOMERS.length); } while (ci === lastCustIdx && CUSTOMERS.length > 1);
  lastCustIdx = ci;
  customerText.text = CUSTOMERS[ci];

  bubbleText.text = `${FRUITS[targetFruit].emoji}+${MOLDS[targetMold].emoji}`;
  bubble.alpha = 0;
  tweenTo(bubble, { alpha: 1 }, 0.4, easeOutCubic);

  goStep(1);
}

function updateStageBadge() {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (coins >= STAGES[i].threshold) { stageIdx = i; break; }
  }
  diffBadge.textContent = STAGES[stageIdx].star + ' ' + STAGES[stageIdx].name;
}
