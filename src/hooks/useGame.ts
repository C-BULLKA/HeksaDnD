// ============================================
// HOOK GŁÓWNY - LOGIKA GRY
// ============================================

import { useState, useCallback } from 'react';
import type { 
  GameState,
  Player,
  Character,
  Hex,
  HexType,
} from '@/types/game';
import {
  PLAYER_COLORS,
  createPlayer,
  createCharacter,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '@/types/game';
import {
  hexReachable,
  hexRange,
  getCharacterAtHex,
  isHexEmpty,
  hasLineOfSight,
  createEmptyMap,
  hexDistance,
} from '@/utils/hexGrid';
import {
  performAttack,
  applyDamage,
  isCharacterAlive,
  resetCharacterTurn,
  endCharacterMove,
  endCharacterAttack,
  generateAttackDescription,
} from '@/utils/combatSystem';

// ============================================
// STAN POCZĄTKOWY
// ============================================

const createInitialState = (): GameState => ({
  phase: 'setup',
  players: [],
  currentPlayerIndex: 0,
  selectedCharacter: null,
  selectedHex: null,
  map: createEmptyMap(),
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  hoveredHex: null,
  moveRangeHexes: [],
  attackRangeHexes: [],
  gameLog: [],
  winner: null,
  currentPlacingPlayer: 0,
  charactersPerPlayer: 2,
  selectedTerrainType: 'normal',
});

// ============================================
// HOOK
// ============================================

export const useGame = () => {
  const [state, setState] = useState<GameState>(createInitialState());

  // ==========================================
  // LOG POMOCNICZY
  // ==========================================

  const addLogEntry = useCallback((message: string, type: 'info' | 'attack' | 'move' | 'critical' = 'info') => {
    setState(prev => ({
      ...prev,
      gameLog: [
        ...prev.gameLog,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          message,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  // ==========================================
  // INICJALIZACJA GRY
  // ==========================================

  const startGame = useCallback((config: { playerCount: number; width: number; height: number }) => {
    const players: Player[] = [];

    // Stwórz graczy
    for (let i = 0; i < config.playerCount; i++) {
      const player = createPlayer(i, `Gracz ${i + 1}`, PLAYER_COLORS[i]);
      players.push(player);
    }

    setState(prev => ({
      ...prev,
      phase: 'map-building',
      players,
      gridWidth: config.width,
      gridHeight: config.height,
      map: createEmptyMap(),
    }));

    addLogEntry(`Rozpoczęto grę! Gracze: ${players.map(p => p.name).join(', ')}`);
  }, [addLogEntry]);

  // ==========================================
  // POMOCNICZE
  // ==========================================

  const getPlayerStartPositions = (playerIndex: number, playerCount: number): Hex[] => {
    const positions: Hex[] = [];

    switch (playerCount) {
      case 2: {
        // Przeciwne strony mapy
        if (playerIndex === 0) {
          positions.push({ q: 2, r: 2, type: 'normal' as const });
          positions.push({ q: 2, r: 3, type: 'normal' as const });
        } else {
          positions.push({ q: GRID_WIDTH - 3, r: GRID_HEIGHT - 3, type: 'normal' as const });
          positions.push({ q: GRID_WIDTH - 3, r: GRID_HEIGHT - 4, type: 'normal' as const });
        }
        break;
      }
      case 3: {
        // Trójkąt
        if (playerIndex === 0) {
          positions.push({ q: 2, r: 2, type: 'normal' as const });
          positions.push({ q: 2, r: 3, type: 'normal' as const });
        } else if (playerIndex === 1) {
          positions.push({ q: GRID_WIDTH - 3, r: 2, type: 'normal' as const });
          positions.push({ q: GRID_WIDTH - 3, r: 3, type: 'normal' as const });
        } else {
          positions.push({ q: Math.floor(GRID_WIDTH / 2), r: GRID_HEIGHT - 3, type: 'normal' as const });
          positions.push({ q: Math.floor(GRID_WIDTH / 2), r: GRID_HEIGHT - 4, type: 'normal' as const });
        }
        break;
      }
      case 4: {
        // Narożniki
        const corners: Hex[][] = [
          [{ q: 2, r: 2, type: 'normal' as const }, { q: 2, r: 3, type: 'normal' as const }],
          [{ q: GRID_WIDTH - 3, r: 2, type: 'normal' as const }, { q: GRID_WIDTH - 3, r: 3, type: 'normal' as const }],
          [{ q: 2, r: GRID_HEIGHT - 3, type: 'normal' as const }, { q: 2, r: GRID_HEIGHT - 4, type: 'normal' as const }],
          [{ q: GRID_WIDTH - 3, r: GRID_HEIGHT - 3, type: 'normal' as const }, { q: GRID_WIDTH - 3, r: GRID_HEIGHT - 4, type: 'normal' as const }],
        ];
        positions.push(...corners[playerIndex]);
        break;
      }
    }

    return positions;
  };

  // ==========================================
  // INTERAKCJE
  // ==========================================

  const selectCharacter = useCallback((character: Character | null) => {
    setState(prev => {
      const newState = {
        ...prev,
        selectedCharacter: character,
        selectedHex: character ? character.hex : null,
        moveRangeHexes: [] as Hex[],
        attackRangeHexes: [] as Hex[],
      };

      if (character && character.canMove) {
        newState.moveRangeHexes = hexReachable(character.hex, character.moveRange, prev.map);
      }

      if (character && character.canAttack) {
        const rangeHexes = hexRange(character.hex, character.attackRange);
        newState.attackRangeHexes = rangeHexes.filter(hex => {
          const target = getCharacterAtHex(hex, prev.players.flatMap(p => p.characters));
          return target && target.playerId !== character.playerId;
        });
      }

      return newState;
    });
  }, []);

  const selectHex = useCallback((hex: Hex | null) => {
    setState(prev => ({
      ...prev,
      selectedHex: hex,
    }));
  }, []);

  const hoverHex = useCallback((hex: Hex | null) => {
    setState(prev => ({
      ...prev,
      hoveredHex: hex,
    }));
  }, []);

  // ==========================================
  // AKCJE GRY
  // ==========================================

  const moveCharacter = useCallback((targetHex: Hex) => {
    setState(prev => {
      if (!prev.selectedCharacter || !prev.selectedCharacter.canMove) {
        return prev;
      }

      const character = prev.selectedCharacter;
      const distance = hexDistance(character.hex, targetHex);
      
      if (distance > character.moveRange) {
        addLogEntry('Za daleko!');
        return prev;
      }

      if (!isHexEmpty(targetHex, prev.players.flatMap(p => p.characters))) {
        addLogEntry('To pole jest zajęte!');
        return prev;
      }

      const mapHex = prev.map[targetHex.q]?.[targetHex.r];
      if (!mapHex || mapHex.type === 'wall') {
        addLogEntry('Nie można tam przejść!');
        return prev;
      }

      const updatedCharacter = endCharacterMove({
        ...character,
        hex: targetHex,
      });

      const newPlayers = prev.players.map(player => ({
        ...player,
        characters: player.characters.map(char =>
          char.id === character.id ? updatedCharacter : char
        ),
      }));

      addLogEntry(`${character.name} przesuwa się na pole (${targetHex.q}, ${targetHex.r})`, 'move');

      return {
        ...prev,
        players: newPlayers,
        selectedCharacter: updatedCharacter,
        moveRangeHexes: [],
      };
    });
  }, [addLogEntry]);

  const performCharacterAttack = useCallback((targetHex: Hex, attackType: 'melee' | 'ranged') => {
    let result: import('@/types/game').AttackResult | null = null;
    
    setState(prev => {
      if (!prev.selectedCharacter || !prev.selectedCharacter.canAttack) {
        return prev;
      }

      const attacker = prev.selectedCharacter;
      const target = getCharacterAtHex(targetHex, prev.players.flatMap(p => p.characters));

      if (!target) {
        addLogEntry('Nie ma celu!');
        return prev;
      }

      if (target.playerId === attacker.playerId) {
        addLogEntry('Nie możesz zaatakować sojusznika!');
        return prev;
      }

      const distance = hexDistance(attacker.hex, targetHex);
      
      if (attackType === 'melee' && distance > 1) {
        addLogEntry('Za daleko do ataku wręcz!');
        return prev;
      }

      if (attackType === 'ranged' && distance > attacker.attackRange) {
        addLogEntry('Cel poza zasięgiem!');
        return prev;
      }

      if (attackType === 'ranged' && !hasLineOfSight(attacker.hex, targetHex, prev.map)) {
        addLogEntry('Brak linii widoczności!');
        return prev;
      }

      result = performAttack(attacker, target, attackType);
      
      // Zadaj obrażenia
      const damagedTarget = applyDamage(target, result.damage);
      const updatedAttacker = endCharacterAttack(attacker);

      // Sprawdź czy cel przeżył
      const isTargetAlive = isCharacterAlive(damagedTarget);
      
      if (!isTargetAlive) {
        addLogEntry(`${target.name} został pokonany!`, 'critical');
      }

      // Aktualizuj graczy
      const newPlayers = prev.players.map(player => {
        const updatedChars = player.characters.map(char => {
          if (char.id === attacker.id) return updatedAttacker;
          if (char.id === target.id) return damagedTarget;
          return char;
        }).filter(char => isTargetAlive || char.id !== target.id);

        return {
          ...player,
          characters: updatedChars,
          isAlive: updatedChars.length > 0,
        };
      });

      // Sprawdź zwycięstwo
      const alivePlayers = newPlayers.filter(p => p.isAlive);
      let winner: Player | null = null;
      
      if (alivePlayers.length === 1) {
        winner = alivePlayers[0];
        addLogEntry(`KONIEC GRY! Zwycięża ${winner.name}!`, 'critical');
      }

      addLogEntry(generateAttackDescription(result), result.isCritical ? 'critical' : 'attack');

      return {
        ...prev,
        players: newPlayers,
        selectedCharacter: updatedAttacker,
        attackRangeHexes: [],
        winner,
        phase: winner ? 'ended' : prev.phase,
      };
    });
    
    return result;
  }, [addLogEntry]);

  const endTurn = useCallback(() => {
    setState(prev => {
      // Resetuj status postaci bieżącego gracza
      const updatedPlayers = prev.players.map((player, index) => {
        if (index === prev.currentPlayerIndex) {
          return {
            ...player,
            characters: player.characters.map(resetCharacterTurn),
          };
        }
        return player;
      });

      // Przejdź do następnego gracza
      let nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      
      // Pomiń nieżywych graczy
      while (!updatedPlayers[nextPlayerIndex].isAlive) {
        nextPlayerIndex = (nextPlayerIndex + 1) % prev.players.length;
      }

      addLogEntry(`Tura gracza ${updatedPlayers[nextPlayerIndex].name}`);

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        selectedCharacter: null,
        selectedHex: null,
        moveRangeHexes: [],
        attackRangeHexes: [],
      };
    });
  }, [addLogEntry]);

  // ==========================================
  // MAP BUILDING
  // ==========================================

  const placeTerrain = useCallback((hex: Hex, type: HexType) => {
    setState(prev => {
      const newMap = prev.map.map(col => [...col]);
      newMap[hex.q][hex.r] = { ...hex, type };
      return { ...prev, map: newMap };
    });
  }, []);

  const selectTerrainType = useCallback((type: HexType) => {
    setState(prev => ({ ...prev, selectedTerrainType: type }));
  }, []);

  const startPlacementPhase = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'placement',
      currentPlacingPlayer: 0,
    }));
    addLogEntry('Rozpoczęto fazę rozmieszczania postaci');
  }, [addLogEntry]);

  const placeCharacter = useCallback((hex: Hex) => {
    setState(prev => {
      if (prev.phase !== 'placement') return prev;

      const currentPlayer = prev.players[prev.currentPlacingPlayer];
      if (!currentPlayer) return prev;

      const placedCount = prev.players.flatMap(p => p.characters).filter(c => c.playerId === currentPlayer.id).length;
      if (placedCount >= prev.charactersPerPlayer) return prev;

      // Check if hex is empty
      const allCharacters = prev.players.flatMap(p => p.characters);
      if (allCharacters.some(c => c.hex.q === hex.q && c.hex.r === hex.r)) {
        addLogEntry('To pole jest już zajęte!');
        return prev;
      }

      // Create new character
      const character = createCharacter(
        currentPlayer.id,
        { ...hex, type: 'normal' },
        `${currentPlayer.name} ${String.fromCharCode(65 + placedCount)}`
      );

      const updatedPlayers = prev.players.map(player =>
        player.id === currentPlayer.id
          ? { ...player, characters: [...player.characters, character] }
          : player
      );

      // Check if all players have placed their characters
      const newPlacedCount = placedCount + 1;
      let nextPlacingPlayer = prev.currentPlacingPlayer;

      if (newPlacedCount >= prev.charactersPerPlayer) {
        // Current player is done, find next player who needs to place
        let found = false;
        for (let i = 0; i < prev.players.length; i++) {
          const playerIndex = (prev.currentPlacingPlayer + i + 1) % prev.players.length;
          const playerChars = updatedPlayers[playerIndex].characters.length;
          if (playerChars < prev.charactersPerPlayer) {
            nextPlacingPlayer = playerIndex;
            found = true;
            break;
          }
        }
        if (!found) {
          // All players have placed their characters, start the game
          return {
            ...prev,
            players: updatedPlayers,
            phase: 'playing',
            currentPlayerIndex: 0,
          };
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
        currentPlacingPlayer: nextPlacingPlayer,
      };
    });
  }, [addLogEntry]);

  const startPlayingPhase = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'playing',
      currentPlayerIndex: 0,
    }));
    addLogEntry('Rozpoczęto fazę gry!');
  }, [addLogEntry]);

  const saveMap = useCallback(() => {
    const mapData = JSON.stringify(state.map);
    localStorage.setItem('hexGameMap', mapData);
    addLogEntry('Mapa zapisana!');
  }, [state.map, addLogEntry]);

  const loadMap = useCallback(() => {
    const savedMap = localStorage.getItem('hexGameMap');
    if (savedMap) {
      const map = JSON.parse(savedMap);
      setState(prev => ({ ...prev, map }));
      addLogEntry('Mapa wczytana!');
    } else {
      addLogEntry('Brak zapisanej mapy!');
    }
  }, [addLogEntry]);

  // ==========================================
  // RESET
  // ==========================================

  const restart = useCallback(() => {
    setState(createInitialState());
  }, []);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    state,
    currentPlayer: state.players[state.currentPlayerIndex] || null,
    allCharacters: state.players.flatMap(p => p.characters),

    // Akcje
    startGame,
    selectCharacter,
    selectHex,
    hoverHex,
    moveCharacter,
    performCharacterAttack,
    endTurn,
    placeTerrain,
    selectTerrainType,
    startPlacementPhase,
    placeCharacter,
    startPlayingPhase,
    saveMap,
    loadMap,
    restart,
    addLog: addLogEntry,
  };
};
