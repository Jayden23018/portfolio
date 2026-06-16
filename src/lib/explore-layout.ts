import type { ImageMetadata } from 'astro';

export interface ExplorePhotoInput {
  globalIdx: number;
  src: ImageMetadata;
  alt: string;
  caption?: string;
  aspect?: number; // height / width — drives <img width/height> to prevent CLS
  year?: string;
}

export interface ExploreSeriesInput {
  title: string;
  order: number;
  photos: ExplorePhotoInput[];
}

export interface PlacedPhoto {
  globalIdx: number;
  seriesTitle: string;
  seriesIndex: number;
  x: number; // cluster-space center x (px)
  y: number; // cluster-space center y (px)
  width: number; // px
  aspect: number; // height / width
  alt: string;
  year: string;
}

export interface PlaneLayout {
  placed: PlacedPhoto[];
  planeW: number;
  planeH: number;
}

export interface GlobalLayoutOptions {
  /** Minimum centre-to-centre distance (drives Bridson annulus / density). */
  minDist?: number;
  /** Photo width range. */
  wMin?: number;
  wMax?: number;
  /** >1 leaves more headroom (sparser); the period grows adaptively if too tight. */
  densityPad?: number;
  /** Bridson candidates per active point. */
  k?: number;
  /** Global seed for deterministic output across builds. */
  seed?: number;
  /** Edge keep-out so cards (translate -50%) never clip the period. */
  margin?: number;
}

// Deterministic PRNG so positions are stable across builds.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mod = (v: number, p: number): number => ((v % p) + p) % p;

// Visual gap between cards (px) on top of the exact AABB bound.
const CARD_PAD = 24;

interface Pt {
  x: number;
  y: number;
}
interface Item {
  w: number;
  h: number;
}
interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Toroidal Poisson-disk scatter using **AABB overlap** (not centre distance), so
 * rectangular cards of differing aspect ratios never overlap at a corner. Each
 * item carries its own w/h; the period is square and wraps in X and Y.
 */
function sampleField(
  planeW: number,
  planeH: number,
  minDist: number,
  margin: number,
  items: Item[],
  k: number,
  rng: () => number,
): Pt[] {
  const cell = minDist / Math.SQRT2; // grid step
  const cols = Math.max(1, Math.floor(planeW / cell));
  const rows = Math.max(1, Math.floor(planeH / cell));
  const grid: (Cell | null)[][] = Array.from({ length: rows }, () =>
    Array<Cell | null>(cols).fill(null),
  );

  const tor = (a: number, b: number, period: number): number => {
    const d = Math.abs(a - b);
    return d > period / 2 ? period - d : d;
  };

  // Two cards overlap ⟺ they overlap on BOTH axes (AABB intersection).
  const overlaps = (px: number, py: number, w: number, h: number): boolean => {
    const gx = Math.floor(px / cell);
    const gy = Math.floor(py / cell);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const q = grid[(gy + dy + rows * 2) % rows][(gx + dx + cols * 2) % cols];
        if (!q) continue;
        if (
          tor(q.x, px, planeW) < (w + q.w) / 2 + CARD_PAD &&
          tor(q.y, py, planeH) < (h + q.h) / 2 + CARD_PAD
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const positions: Pt[] = [];
  const active: Cell[] = [];
  const place = (p: Pt, item: Item): void => {
    const c: Cell = { x: p.x, y: p.y, w: item.w, h: item.h };
    grid[Math.floor(p.y / cell) % rows][Math.floor(p.x / cell) % cols] = c;
    active.push(c);
    positions.push(p);
  };

  if (items.length > 0) place({ x: planeW / 2, y: planeH / 2 }, items[0]);

  let i = 1;
  while (active.length > 0 && i < items.length) {
    const idx = Math.floor(rng() * active.length);
    const c = active[idx];
    const item = items[i];
    let found = false;
    for (let t = 0; t < k; t++) {
      const ang = rng() * Math.PI * 2;
      const r = minDist * (1 + rng()); // annulus [minDist, 2·minDist]
      const x = mod(c.x + Math.cos(ang) * r, planeW);
      const y = mod(c.y + Math.sin(ang) * r, planeH);
      if (x < margin || x > planeW - margin || y < margin || y > planeH - margin) continue;
      if (!overlaps(x, y, item.w, item.h)) {
        place({ x, y }, item);
        i++;
        found = true;
        break;
      }
    }
    if (!found) active.splice(idx, 1);
  }

  // Rejection top-up (still AABB) for any items Bridson couldn't place.
  let guard = 0;
  while (i < items.length && guard < items.length * 1000) {
    const item = items[i];
    const x = margin + rng() * (planeW - 2 * margin);
    const y = margin + rng() * (planeH - 2 * margin);
    if (!overlaps(x, y, item.w, item.h)) {
      place({ x, y }, item);
      i++;
    }
    guard++;
  }

  // Last-resort: place remaining anywhere (may overlap — caller retries bigger).
  while (i < items.length) {
    place(
      { x: margin + rng() * (planeW - 2 * margin), y: margin + rng() * (planeH - 2 * margin) },
      items[i],
    );
    i++;
  }

  return positions;
}

/** Post-check: true if any pair of placed items overlaps (toroidal AABB). */
function hasOverlap(positions: Pt[], items: Item[], planeW: number, planeH: number): boolean {
  const tor = (a: number, b: number, p: number): number => {
    const d = Math.abs(a - b);
    return d > p / 2 ? p - d : d;
  };
  for (let a = 0; a < positions.length; a++) {
    for (let b = a + 1; b < positions.length; b++) {
      const ia = items[a];
      const ib = items[b];
      if (
        tor(positions[a].x, positions[b].x, planeW) < (ia.w + ib.w) / 2 + CARD_PAD &&
        tor(positions[a].y, positions[b].y, planeH) < (ia.h + ib.h) / 2 + CARD_PAD
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Toroidal Poisson-disk layout with AABB non-overlap. Photos scatter uniformly
 * across a periodic plane and never overlap (even with differing aspect
 * ratios). The period grows adaptively until an overlap-free layout is found.
 * Deterministic for a fixed seed.
 */
export function layoutGlobal(
  series: ExploreSeriesInput[],
  opts: GlobalLayoutOptions = {},
): PlaneLayout {
  const minDist = opts.minDist ?? 380;
  const wMin = opts.wMin ?? 240;
  const wMax = opts.wMax ?? 340;
  const densityPad = opts.densityPad ?? 2.2;
  const k = opts.k ?? 30;
  const seed = opts.seed ?? 0xc0ffee;
  const margin = opts.margin ?? wMax / 2 + 20;

  const sorted = [...series].sort((a, b) => a.order - b.order);
  const widthOf = (globalIdx: number): number => {
    const r = mulberry32(globalIdx * 7919 + 13);
    return Math.round(wMin + r() * (wMax - wMin));
  };
  const flat = sorted.flatMap((s) =>
    s.photos.map((p, idx) => {
      const aspect = p.aspect ?? 0.667;
      const w = widthOf(p.globalIdx);
      return {
        globalIdx: p.globalIdx,
        seriesTitle: s.title,
        seriesIndex: idx,
        src: p.src,
        alt: p.alt,
        aspect,
        year: p.year ?? '',
        w,
        h: w * aspect,
      };
    }),
  );
  const N = flat.length;
  if (N === 0) return { placed: [], planeW: 0, planeH: 0 };

  const items: Item[] = flat.map((p) => ({ w: p.w, h: p.h }));
  const cardArea = Math.PI * (minDist / 2) ** 2;

  // Adaptive period: grow until an overlap-free layout is found.
  let planeW = 0;
  let planeH = 0;
  let positions: Pt[] = [];
  let pad = densityPad;
  for (let attempt = 0; attempt < 6; attempt++) {
    const side = Math.sqrt(N * cardArea * pad);
    planeW = Math.max(Math.round(side), minDist * 4);
    planeH = planeW;
    positions = sampleField(planeW, planeH, minDist, margin, items, k, mulberry32(seed));
    if (!hasOverlap(positions, items, planeW, planeH)) break;
    pad *= 1.2;
  }

  const placed: PlacedPhoto[] = flat.map((p, i) => {
    const pos = positions[i];
    return {
      globalIdx: p.globalIdx,
      seriesTitle: p.seriesTitle,
      seriesIndex: p.seriesIndex,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      width: p.w,
      aspect: p.aspect,
      alt: p.alt,
      year: p.year,
    };
  });

  return { placed, planeW, planeH };
}
