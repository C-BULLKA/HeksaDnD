// ============================================
// MATEMATYKA HEKSAGONALNA
// ============================================

import type { Hex, HexType } from '@/types/game';
import { HEX_SIZE, GRID_WIDTH, GRID_HEIGHT } from '@/types/game';

/**
 * Konwersja współrzędnych axial na pixel (dla rysowania)
 */
export function hexToPixel(hex: Hex, size: number = HEX_SIZE): { x: number; y: number } {
  const x = size * (3/2 * hex.q);
  const y = size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
  return { x, y };
}

/**
 * Konwersja pixeli na współrzędne heksagonalne (dla kliknięć myszką)
 */
export function pixelToHex(x: number, y: number, size: number = HEX_SIZE): Hex {
  const q = (2/3 * x) / size;
  const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
  return hexRound({ q, r, type: 'normal' });
}

/**
 * Zaokrąglenie współrzędnych heksagonalnych do najbliższego całkowitego
 */
export function hexRound(hex: Hex): Hex {
  let q = hex.q;
  let r = hex.r;
  let s = -q - r;

  const rq = Math.round(q);
  const rr = Math.round(r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -rr - rs;
  } else if (rDiff > sDiff) {
    r = -rq - rs;
  }

  return { q, r, type: hex.type };
}

/**
 * Oblicza odległość między dwoma heksagonami
 */
export function hexDistance(a: Hex, b: Hex): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Zwraca sąsiadów danego heksagona
 */
export function hexNeighbors(hex: Hex): Hex[] {
  const directions = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
  ];

  return directions.map(dir => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
    type: 'normal' as HexType,
  }));
}

/**
 * Liniowe interpolowanie między dwoma heksagonami
 */
export function hexLerp(a: Hex, b: Hex, t: number): Hex {
  return {
    q: a.q * (1 - t) + b.q * t,
    r: a.r * (1 - t) + b.r * t,
    type: a.type,
  };
}

/**
 * Zwraca heksagony na linii między dwoma punktami
 */
export function hexLine(start: Hex, end: Hex): Hex[] {
  const distance = hexDistance(start, end);
  const results: Hex[] = [];

  if (distance === 0) {
    return [start];
  }

  for (let i = 0; i <= distance; i++) {
    const t = i / distance;
    const interpolated = hexLerp(start, end, t);
    results.push(hexRound(interpolated));
  }

  return results;
}

/**
 * Zwraca heksagony w zasięgu (promień)
 */
export function hexRange(center: Hex, radius: number): Hex[] {
  const results: Hex[] = [];

  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      results.push({
        q: center.q + q,
        r: center.r + r,
        type: 'normal' as HexType,
      });
    }
  }

  return results;
}

/**
 * Zwraca heksagony w zasięgu ruchu z uwzględnieniem terenu
 */
export function hexReachable(
  start: Hex,
  movement: number,
  map: Hex[][]
): Hex[] {
  const visited = new Set<string>();
  const reachable: Hex[] = [];
  const queue: { hex: Hex; distance: number }[] = [{ hex: start, distance: 0 }];

  while (queue.length > 0) {
    const { hex, distance } = queue.shift()!;
    const key = `${hex.q},${hex.r}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const mapHex = getHexFromMap(hex.q, hex.r, map);
    if (!mapHex || mapHex.type === 'wall') continue;

    const moveCost = mapHex.type === 'difficult' ? 2 : 1;
    const newDistance = distance + moveCost;

    if (newDistance <= movement) {
      reachable.push(hex);

      const neighbors = hexNeighbors(hex);
      for (const neighbor of neighbors) {
        queue.push({ hex: neighbor, distance: newDistance });
      }
    }
  }

  return reachable;
}

/**
 * Pobiera heksagon z mapy
 */
export function getHexFromMap(q: number, r: number, map: Hex[][]): Hex | null {
  if (q < 0 || q >= GRID_WIDTH || r < 0 || r >= GRID_HEIGHT) {
    return null;
  }
  return map[q] && map[q][r] ? map[q][r] : null;
}

/**
 * Sprawdza czy heksagon jest w granicach mapy
 */
export function isInBounds(q: number, r: number): boolean {
  return q >= 0 && q < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT;
}

/**
 * Tworzy pustą mapę
 */
export function createEmptyMap(): Hex[][] {
  const map: Hex[][] = [];

  for (let q = 0; q < GRID_WIDTH; q++) {
    map[q] = [];
    for (let r = 0; r < GRID_HEIGHT; r++) {
      map[q][r] = { q, r, type: 'normal' };
    }
  }

  return map;
}

/**
 * Sprawdza czy heksagon jest pusty (bez postaci)
 */
export function isHexEmpty(hex: Hex, characters: any[]): boolean {
  return !characters.some((char: any) => char.hex.q === hex.q && char.hex.r === hex.r);
}

/**
 * Znajduje postać na danym heksagonie
 */
export function getCharacterAtHex(hex: Hex, characters: any[]): any {
  return characters.find((char: any) => char.hex.q === hex.q && char.hex.r === hex.r) || null;
}

/**
 * Sprawdza czy linia widoczności jest czysta (bez ścian)
 */
export function hasLineOfSight(
  start: Hex,
  end: Hex,
  map: Hex[][]
): boolean {
  const line = hexLine(start, end);
  
  // Usuwamy start i end z linii
  const middleHexes = line.slice(1, -1);
  
  for (const hex of middleHexes) {
    const mapHex = getHexFromMap(hex.q, hex.r, map);
    if (mapHex && mapHex.type === 'wall') {
      return false;
    }
  }
  
  return true;
}
