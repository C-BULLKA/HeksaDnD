// ============================================
// TYPY PODSTAWOWE
// ============================================

export type HexType = 'normal' | 'difficult' | 'wall' | 'water';
export type AttackType = 'melee' | 'ranged';
export type GamePhase = 'setup' | 'map-building' | 'playing' | 'ended';

// ============================================
// INTERFEJSY GŁÓWNE
// ============================================

export interface Hex {
  q: number; // kolumna (axial coordinates)
  r: number; // rząd (axial coordinates)
  type: HexType;
}

export interface Character {
  id: string;
  playerId: number;
  hex: Hex;
  name: string;
  hp: number;
  maxHp: number;
  strength: number;    // Siła - modyfikator obrażeń wręcz
  dexterity: number;   // Zręczność - modyfikator inicjatywy, obrony
  constitution: number;// Wytrzymałość - modyfikator HP
  armorClass: number;  // Klasa pancerza (podstawowa obrona)
  moveRange: number;   // Zasięg ruchu w turze
  attackRange: number; // Zasięg ataku dystansowego
  canMove: boolean;    // Czy może się poruszyć w tej turze
  canAttack: boolean;  // Czy może atakować w tej turze
  hasMoved: boolean;   // Czy już się poruszył
  hasAttacked: boolean;// Czy już atakował
}

export interface Player {
  id: number;
  name: string;
  color: string;
  isAlive: boolean;
  characters: Character[];
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  selectedCharacter: Character | null;
  selectedHex: Hex | null;
  map: Hex[][];
  gridWidth: number;
  gridHeight: number;
  hoveredHex: Hex | null;
  moveRangeHexes: Hex[];
  attackRangeHexes: Hex[];
  gameLog: GameLogEntry[];
  winner: Player | null;
}

export interface GameLogEntry {
  id: string;
  type: 'attack' | 'move' | 'info' | 'critical';
  message: string;
  timestamp: number;
}

export interface AttackResult {
  attacker: Character;
  defender: Character;
  attackRoll: number;
  defenseRoll: number;
  damage: number;
  isHit: boolean;
  isCritical: boolean;
  isFumble: boolean;
  attackType: AttackType;
}

// ============================================
// STAŁE GRY
// ============================================

export const PLAYER_COLORS = [
  '#DC2626', // Czerwony
  '#2563EB', // Niebieski
  '#16A34A', // Zielony
  '#EAB308', // Żółty
];

export const HEX_COLORS: Record<HexType, string> = {
  normal: '#6B7280',     // Szary
  difficult: '#92400E',  // Brązowy (trudny teren)
  wall: '#1F2937',       // Ciemnoszary (nieprzejezdny)
  water: '#0EA5E9',      // Błękitny (woda)
};

export const HEX_SIZE = 30; // Rozmiar heksagonu w pikselach
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 15;

// ============================================
// FUNKCJE POMOCNICZE
// ============================================

/**
 * Generuje losową wartość z zakresu 1-20 (kość D20)
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Generuje losową wartość z zakresu 1-max (kość Dx)
 */
export function rollDice(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Oblicza modyfikator statystyki D&D (10 = 0, 12 = +1, 8 = -1 itd.)
 */
export function calculateModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

/**
 * Generuje losowe statystyki postaci (3x rzut 4k6, usunięcie najniższego)
 */
export function rollStats(): { str: number; dex: number; con: number } {
  const roll4d6DropLowest = (): number => {
    const rolls = [rollDice(6), rollDice(6), rollDice(6), rollDice(6)];
    rolls.sort((a, b) => b - a);
    return rolls[0] + rolls[1] + rolls[2]; // suma 3 najwyższych
  };

  return {
    str: roll4d6DropLowest(),
    dex: roll4d6DropLowest(),
    con: roll4d6DropLowest(),
  };
}

/**
 * Oblicza maksymalne HP na podstawie wytrzymałości
 * Bazowe HP + modyfikator CON
 */
export function calculateMaxHp(constitution: number): number {
  const baseHp = 10;
  const conMod = calculateModifier(constitution);
  return Math.max(1, baseHp + conMod);
}

/**
 * Oblicza klasę pancerza na podstawie zręczności
 * 10 + modyfikator DEX
 */
export function calculateArmorClass(dexterity: number): number {
  const baseAc = 10;
  const dexMod = calculateModifier(dexterity);
  return Math.max(1, baseAc + dexMod);
}

/**
 * Tworzy nową postać z losowymi statystykami
 */
export function createCharacter(
  playerId: number,
  hex: Hex,
  name: string
): Character {
  const stats = rollStats();
  const maxHp = calculateMaxHp(stats.con);
  const armorClass = calculateArmorClass(stats.dex);

  return {
    id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    hex,
    name,
    hp: maxHp,
    maxHp,
    strength: stats.str,
    dexterity: stats.dex,
    constitution: stats.con,
    armorClass,
    moveRange: 3,
    attackRange: 4,
    canMove: true,
    canAttack: true,
    hasMoved: false,
    hasAttacked: false,
  };
}

/**
 * Tworzy nowego gracza
 */
export function createPlayer(id: number, name: string, color: string): Player {
  return {
    id,
    name,
    color,
    isAlive: true,
    characters: [],
  };
}
