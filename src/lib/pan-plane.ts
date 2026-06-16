import { gsap } from 'gsap';

export interface PanOptions {
  planeW: number;
  planeH: number;
  /** Velocity decay rate (1/s). Higher = stops sooner. ~2.5 → ~1.2s glide. */
  lambda?: number;
  /** New-sample weight for the release velocity EMA (0..1). */
  ema?: number;
  /** Target px/frame velocity per held arrow key. */
  keyStep?: number;
  /** Per-frame callback (tx, ty) — e.g. to drive a progress indicator. */
  onFrame?: (tx: number, ty: number) => void;
}

export interface PanController {
  destroy: () => void;
  recenter: () => void;
  centerOn: (x: number, y: number) => void;
  setEnabled: (v: boolean) => void;
}

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

/**
 * Infinite 2D pan over a toroidal plane. Each card is repositioned every frame
 * with a wrap-around transform, so the field scrolls forever in X and Y with no
 * boundary, no clamp, and no spring — just momentum.
 */
export function initPanPlane(
  viewport: HTMLElement,
  stage: HTMLElement,
  opts: PanOptions,
): PanController {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lambda = opts.lambda ?? 2.5;
  const ema = opts.ema ?? 0.4;
  const keyStep = opts.keyStep ?? 9;
  const PW = opts.planeW;
  const PH = opts.planeH;

  let tx = 0;
  let ty = 0;
  let vx = 0;
  let vy = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let enabled = true;
  const keys = new Set<string>();

  const cardData = [...stage.querySelectorAll<HTMLElement>('.ex-card')].map((el) => {
    const w = parseFloat(el.style.width) || 0;
    const aspect = Number(el.dataset.aspect) || 0.667;
    return {
      el,
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      w,
      h: w * aspect,
    };
  });

  function apply(): void {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    for (const c of cardData) {
      // Render at the wrap copy nearest the viewport centre, so wrapping
      // always happens far off-screen (opacity 0) instead of popping at an
      // edge — eliminates the asymmetric left/top pop-in/out.
      const sx = c.x + tx - PW * Math.round((c.x + tx - vw / 2) / PW);
      const sy = c.y + ty - PH * Math.round((c.y + ty - vh / 2) / PH);
      c.el.style.transform = `translate3d(${sx - c.x}px, ${sy - c.y}px, 0) translate(-50%, -50%)`;
      // Keep fully opaque while ≥50% of the card is on-screen; fade only once
      // more than half has scrolled past a viewport edge.
      const hw = c.w / 2;
      const hh = c.h / 2;
      const ix = Math.max(0, Math.min(sx + hw, vw) - Math.max(sx - hw, 0));
      const iy = Math.max(0, Math.min(sy + hh, vh) - Math.max(sy - hh, 0));
      const visible = (ix * iy) / (c.w * c.h || 1); // 0..1 of card inside viewport
      let t = visible / 0.5; // 0..1 across [0,0.5]; clamps to 1 for ≥0.5 visible
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      c.el.style.opacity = (t * t * (3 - 2 * t)).toFixed(3); // smoothstep 0→1
    }
    opts.onFrame?.(tx, ty);
  }

  function tick(): void {
    if (!enabled) return;
    const dt = gsap.ticker.deltaRatio(); // 60fps→1, 120fps→0.5
    if (reduced) {
      tx += vx;
      ty += vy;
      vx = 0;
      vy = 0;
      apply();
      return;
    }
    if (dragging) return; // pointermove drives position directly
    let kx = 0;
    let ky = 0;
    if (keys.has('ArrowLeft')) kx -= 1;
    if (keys.has('ArrowRight')) kx += 1;
    if (keys.has('ArrowUp')) ky -= 1;
    if (keys.has('ArrowDown')) ky += 1;
    if (kx !== 0 || ky !== 0) {
      vx = kx * keyStep;
      vy = ky * keyStep;
    } else {
      const decay = Math.exp((-lambda * dt) / 60);
      vx *= decay;
      vy *= decay;
      if (Math.abs(vx) < 0.3) vx = 0;
      if (Math.abs(vy) < 0.3) vy = 0;
    }
    tx += vx * dt;
    ty += vy * dt;
    apply();
  }

  function onPointerDown(e: PointerEvent): void {
    if (!enabled) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    vx = 0;
    vy = 0;
    viewport.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent): void {
    if (!enabled || !dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    tx += dx;
    ty += dy;
    if (!reduced) {
      vx = vx * (1 - ema) + dx * ema;
      vy = vy * (1 - ema) + dy * ema;
    }
    apply();
  }
  function onPointerUp(e: PointerEvent): void {
    dragging = false;
    viewport.releasePointerCapture?.(e.pointerId);
  }
  function onWheel(e: WheelEvent): void {
    if (!enabled) return;
    e.preventDefault();
    tx -= e.deltaX;
    ty -= e.deltaY;
    if (!reduced) {
      vx = vx * (1 - ema) - e.deltaX * ema;
      vy = vy * (1 - ema) - e.deltaY * ema;
    }
    apply();
  }
  function onKeyDown(e: KeyboardEvent): void {
    if (!enabled) return;
    if (!ARROWS.includes(e.key)) return;
    e.preventDefault();
    if (reduced) {
      const step = 80;
      if (e.key === 'ArrowLeft') tx += step;
      if (e.key === 'ArrowRight') tx -= step;
      if (e.key === 'ArrowUp') ty += step;
      if (e.key === 'ArrowDown') ty -= step;
      apply();
      return;
    }
    keys.add(e.key);
  }
  function onKeyUp(e: KeyboardEvent): void {
    keys.delete(e.key);
  }

  viewport.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  gsap.ticker.add(tick);

  apply();

  return {
    destroy() {
      viewport.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      gsap.ticker.remove(tick);
    },
    recenter() {
      tx = 0;
      ty = 0;
      vx = 0;
      vy = 0;
      apply();
    },
    centerOn(x: number, y: number) {
      tx = viewport.clientWidth / 2 - x;
      ty = viewport.clientHeight / 2 - y;
      vx = 0;
      vy = 0;
      apply();
    },
    setEnabled(v: boolean) {
      enabled = v;
      if (v) apply();
    },
  };
}
