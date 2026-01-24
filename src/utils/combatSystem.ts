// ============================================
// SYSTEM WALKI D&D (D20)
// ============================================

import type { Character, AttackType } from '@/types/game';
import { 
  rollD20, 
  calculateModifier,
  rollDice 
} from '@/types/game';

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

/**
 * Przeprowadza atak zgodnie z zasadami D&D
 */
export function performAttack(
  attacker: Character,
  defender: Character,
  attackType: AttackType = 'melee'
): AttackResult {
  // Rzut ataku na D20
  const attackRoll = rollD20();
  
  // Krytyczna porażka (zawsze chybienie)
  if (attackRoll === 1) {
    return {
      attacker,
      defender,
      attackRoll,
      defenseRoll: 0,
      damage: 0,
      isHit: false,
      isCritical: false,
      isFumble: true,
      attackType,
    };
  }
  
  // Krytyczny sukces (zawsze trafienie z max obrażeniami)
  if (attackRoll === 20) {
    const damage = calculateCriticalDamage(attacker, attackType);
    return {
      attacker,
      defender,
      attackRoll,
      defenseRoll: 0,
      damage,
      isHit: true,
      isCritical: true,
      isFumble: false,
      attackType,
    };
  }
  
  // Normalny atak - obrońca rzuca na obronę
  const defenseRoll = rollD20();
  
  // Modyfikatory
  const strMod = calculateModifier(attacker.strength);
  const dexMod = calculateModifier(attacker.dexterity);
  const defenderDexMod = calculateModifier(defender.dexterity);
  
  // Klasa pancerza obrońcy (podstawowa obrona)
  const armorClass = defender.armorClass;
  
  // Całkowity wynik ataku
  let attackTotal = attackRoll;
  
  // Modyfikator do ataku (Siła dla wręcz, Zręczność dla dystansowego)
  if (attackType === 'melee') {
    attackTotal += strMod;
  } else {
    attackTotal += dexMod;
  }
  
  // Wynik obrony
  const defenseTotal = defenseRoll + defenderDexMod;
  
  // Sprawdzenie trafienia (atak musi przekroczyć klasę pancerza ORAZ wynik obrony)
  const isHit = attackTotal > armorClass && attackTotal > defenseTotal;
  
  let damage = 0;
  
  if (isHit) {
    damage = calculateDamage(attacker, attackType, attackTotal - defenseTotal);
  }
  
  return {
    attacker,
    defender,
    attackRoll,
    defenseRoll,
    damage,
    isHit,
    isCritical: false,
    isFumble: false,
    attackType,
  };
}

/**
 * Oblicza obrażenia przy normalnym trafieniu
 */
function calculateDamage(
  attacker: Character,
  attackType: AttackType,
  margin: number
): number {
  const strMod = calculateModifier(attacker.strength);
  const dexMod = calculateModifier(attacker.dexterity);
  
  let baseDamage = 0;
  let modifier = 0;
  
  if (attackType === 'melee') {
    // Atak wręcz: 1D8 + modyfikator siły
    baseDamage = rollDice(8);
    modifier = strMod;
  } else {
    // Atak dystansowy: 1D6 + modyfikator zręczności
    baseDamage = rollDice(6);
    modifier = dexMod;
  }
  
  // Premia za dużą różnicę w rzutach
  const marginBonus = Math.max(0, Math.floor(margin / 5));
  
  // Minimalne obrażenia to 1
  return Math.max(1, baseDamage + modifier + marginBonus);
}

/**
 * Oblicza obrażenia przy krytycznym trafieniu (zawsze max + bonus)
 */
function calculateCriticalDamage(
  attacker: Character,
  attackType: AttackType
): number {
  const strMod = calculateModifier(attacker.strength);
  const dexMod = calculateModifier(attacker.dexterity);
  
  let maxDamage = 0;
  let modifier = 0;
  
  if (attackType === 'melee') {
    // Max z 2x rzutów D8
    maxDamage = rollDice(8) + rollDice(8);
    modifier = strMod * 2; // Podwójny modyfikator siły
  } else {
    // Max z 2x rzutów D6
    maxDamage = rollDice(6) + rollDice(6);
    modifier = dexMod * 2; // Podwójny modyfikator zręczności
  }
  
  // Bonus za krytyka
  const criticalBonus = rollDice(6);
  
  return maxDamage + modifier + criticalBonus;
}

/**
 * Zadaje obrażenia postaci
 */
export function applyDamage(character: Character, damage: number): Character {
  const newHp = Math.max(0, character.hp - damage);
  return {
    ...character,
    hp: newHp,
  };
}

/**
 * Sprawdza czy postać żyje
 */
export function isCharacterAlive(character: Character): boolean {
  return character.hp > 0;
}

/**
 * Sprawdza czy postać może wykonać akcję w turze
 */
export function canCharacterAct(character: Character): boolean {
  return isCharacterAlive(character) && (!character.hasMoved || !character.hasAttacked);
}

/**
 * Resetuje status postaci na początek tury
 */
export function resetCharacterTurn(character: Character): Character {
  return {
    ...character,
    canMove: true,
    canAttack: true,
    hasMoved: false,
    hasAttacked: false,
  };
}

/**
 * Kończy ruch postaci
 */
export function endCharacterMove(character: Character): Character {
  return {
    ...character,
    canMove: false,
    hasMoved: true,
  };
}

/**
 * Kończy atak postaci
 */
export function endCharacterAttack(character: Character): Character {
  return {
    ...character,
    canAttack: false,
    hasAttacked: true,
  };
}

/**
 * Generuje opis ataku do logu
 */
export function generateAttackDescription(result: AttackResult): string {
  const attackerName = result.attacker.name;
  const defenderName = result.defender.name;
  
  if (result.isFumble) {
    return `${attackerName} próbuje zaatakować, ale potyka się! (rzut: 1)`;
  }
  
  if (result.isCritical) {
    return `KRYTYCZNE UDERZENIE! ${attackerName} trafia ${defenderName} perfekcyjnie za ${result.damage} obrażeń! (rzut: 20)`;
  }
  
  if (result.isHit) {
    const attackTypeText = result.attackType === 'melee' ? 'wręcz' : 'z dystansu';
    return `${attackerName} trafia ${defenderName} ${attackTypeText} za ${result.damage} obrażeń! (atak: ${result.attackRoll} vs obrona: ${result.defenseRoll})`;
  }
  
  const attackTypeText = result.attackType === 'melee' ? 'wręcz' : 'z dystansu';
  return `${attackerName} chybia ${defenderName} ${attackTypeText}! (atak: ${result.attackRoll} vs obrona: ${result.defenseRoll})`;
}

/**
 * Oblicza inicjatywę postaci (kto zaczyna turę)
 */
export function calculateInitiative(character: Character): number {
  const dexMod = calculateModifier(character.dexterity);
  return rollD20() + dexMod;
}

/**
 * Sortuje postacie według inicjatywy
 */
export function sortByInitiative(characters: Character[]): Character[] {
  return [...characters].sort((a, b) => calculateInitiative(b) - calculateInitiative(a));
}

/**
 * Pusta funkcja addLog - placeholder
 */
export function addLog(_message: string, _type?: string): void {
  // Ta funkcja jest placeholderem, prawdziwa implementacja jest w hooku
}
