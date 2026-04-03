import React, { useState, useCallback, useMemo } from 'react';
import SetupScreen from '@/components/game/SetupScreen';
import GameBoard from '@/components/game/GameBoard';
import TerrainPalette from '@/components/game/TerrainPalette';
import GameControls from '@/components/game/GameControls';
import PlacementPhase from '@/components/game/PlacementPhase';
import AttackDialog from '@/components/game/AttackDialog';
import { Button } from "@/components/ui/button";
import { Dices, ArrowRight } from 'lucide-react';
import archerImage from '../../archer.bmp';
import warriorImage from '../../wojownik.bmp';

const PLAYER_COLORS = ['#DC2626', '#2563EB', '#16A34A', '#EAB308'];
const CHARACTERS_PER_PLAYER = 2;
const CHARACTER_LOADOUT = ['tank', 'shooter'];

const CHARACTER_TYPES = {
  tank: {
    label: 'Tank',
    shortLabel: 'T',
    maxHp: 40,
    armorClass: 12,
    stats: {
      strength: 16,
      dexterity: 10,
      constitution: 16,
    },
    attackRange: 1,
    attackStat: 'strength',
  },
  shooter: {
    label: 'Strzelec',
    shortLabel: 'S',
    maxHp: 20,
    armorClass: 6,
    stats: {
      strength: 10,
      dexterity: 16,
      constitution: 12,
    },
    attackRange: 2,
    attackStat: 'dexterity',
  },
};

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function calculateModifier(stat) {
  return Math.floor((stat - 10) / 2);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createCharacter(playerId, q, r, name, role) {
  const typeConfig = CHARACTER_TYPES[role] || CHARACTER_TYPES.tank;
  const stats = typeConfig.stats;
  const maxHp = typeConfig.maxHp;
  const armorClass = typeConfig.armorClass;
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    q,
    r,
    name,
    role,
    roleLabel: typeConfig.label,
    hp: maxHp,
    maxHp,
    strength: stats.strength,
    dexterity: stats.dexterity,
    constitution: stats.constitution,
    armorClass,
    moveRange: 4,
    canMove: true,
    canAttack: true,
  };
}

function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

function getNeighbors(q, r) {
  return [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 },
  ];
}

function axialToCube(q, r) {
  return { x: q, y: -q - r, z: r };
}

function cubeToAxial(cube) {
  return { q: cube.x, r: cube.z };
}

function cubeLerp(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function cubeRound(cube) {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);

  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { x: rx, y: ry, z: rz };
}

function getHexLine(q1, r1, q2, r2) {
  const start = axialToCube(q1, r1);
  const end = axialToCube(q2, r2);
  const distance = hexDistance(q1, r1, q2, r2);
  const results = [];

  for (let step = 0; step <= distance; step++) {
    const t = distance === 0 ? 0 : step / distance;
    results.push(cubeToAxial(cubeRound(cubeLerp(start, end, t))));
  }

  return results;
}

function hasLineOfSight(q1, r1, q2, r2, hexMap) {
  const line = getHexLine(q1, r1, q2, r2);

  for (let index = 1; index < line.length - 1; index++) {
    const hex = line[index];
    if ((hexMap[`${hex.q},${hex.r}`] || 'normal') === 'wall') {
      return false;
    }
  }

  return true;
}

function calculateMoveRange(startQ, startR, maxMove, hexMap, width, height, characters, currentCharId) {
  const reachable = [];
  const visited = new Set();
  const queue = [{ q: startQ, r: startR, cost: 0 }];
  while (queue.length > 0) {
    const { q, r, cost } = queue.shift();
    const key = `${q},${r}`;
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (q < 0 || q >= width || r < 0 || r >= height) continue;
    const terrainType = hexMap[key] || 'normal';
    if (terrainType === 'wall') continue;
    const isOccupied = characters.some(c => c.id !== currentCharId && c.q === q && c.r === r && c.hp > 0);
    if (isOccupied && (q !== startQ || r !== startR)) continue;
    
    const moveCost = terrainType === 'mud' ? 2 : 1;
    const totalCost = cost + (q === startQ && r === startR ? 0 : moveCost);
    if (totalCost <= maxMove) {
      if (q !== startQ || r !== startR) {
        reachable.push({ q, r });
      }
      
      for (const neighbor of getNeighbors(q, r)) {
        queue.push({ q: neighbor.q, r: neighbor.r, cost: totalCost });
      }
    }
  }
  
  return reachable;
}

function calculateAttackRange(q, r, range, characters, playerId, hexMap) {
  const targets = [];
  for (const char of characters) {
    if (char.playerId !== playerId && char.hp > 0) {
      const dist = hexDistance(q, r, char.q, char.r);
      if (dist <= range && dist > 0 && hasLineOfSight(q, r, char.q, char.r, hexMap)) {
        targets.push({ q: char.q, r: char.r });
      }
    }
  }
  
  return targets;
}

export default function Game() {
  const [phase, setPhase] = useState('setup');
  const [config, setConfig] = useState(null);
  const [hexMap, setHexMap] = useState({});
  const [selectedTerrain, setSelectedTerrain] = useState('normal');
  const [players, setPlayers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [attackResult, setAttackResult] = useState(null);
  const [showAttackDialog, setShowAttackDialog] = useState(false);
  const [currentPlacingPlayer, setCurrentPlacingPlayer] = useState(0);
  const [selectedPlacementRole, setSelectedPlacementRole] = useState('tank');
  const handleSetupComplete = useCallback((setupConfig) => {
    setConfig(setupConfig);
    setPhase('map-building');
    setHexMap({});
    
    const newPlayers = [];
    for (let i = 0; i < setupConfig.playerCount; i++) {
      newPlayers.push({
        id: i,
        name: `Gracz ${i + 1}`,
        color: PLAYER_COLORS[i],
        characters: [],
      });
    }
    
    setPlayers(newPlayers);
  }, []);

  const handleHexChange = useCallback((q, r, terrainType) => {
    setHexMap(prev => ({
      ...prev,
      [`${q},${r}`]: terrainType,
    }));
  }, []);
  const handleFinishMapBuilding = useCallback(() => {
    setPhase('placement');
    setCurrentPlacingPlayer(0);
    setSelectedPlacementRole('tank');
    setCharacters([]);
    addLog('Faza rozmieszczania postaci - każdy gracz umieszcza swoje postacie', 'info');
  }, []);
  const getPlacedRoleCount = useCallback((playerId, role) => {
    return characters.filter(c => c.playerId === playerId && c.role === role).length;
  }, [characters]);
  const handlePlacementClick = useCallback((q, r) => {
    const terrainType = hexMap[`${q},${r}`] || 'normal';
    if (terrainType === 'wall') return;
    
    const isOccupied = characters.some(c => c.q === q && c.r === r);
    if (isOccupied) return;
    
    const currentPlayer = players[currentPlacingPlayer];
    const playerCharCount = characters.filter(c => c.playerId === currentPlayer.id).length;
    
    if (playerCharCount >= CHARACTERS_PER_PLAYER) return;

    const role = selectedPlacementRole;
    if (getPlacedRoleCount(currentPlayer.id, role) >= 1) return;
    
    const charName = `${currentPlayer.name[0]}${playerCharCount + 1}`;
    const newChar = createCharacter(currentPlayer.id, q, r, charName, role);
    
    setCharacters(prev => [...prev, newChar]);
    addLog(`${currentPlayer.name} umieszcza ${newChar.roleLabel.toLowerCase()} ${charName} na (${q}, ${r})`, 'info');
    
    const nextPlayerHasTank = getPlacedRoleCount(currentPlayer.id, 'tank') + (role === 'tank' ? 1 : 0) >= 1;
    const nextPlayerHasShooter = getPlacedRoleCount(currentPlayer.id, 'shooter') + (role === 'shooter' ? 1 : 0) >= 1;
    if (nextPlayerHasTank && nextPlayerHasShooter) {
      const nextPlayer = (currentPlacingPlayer + 1) % players.length;
      const nextPlayerCharCount = characters.filter(c => c.playerId === players[nextPlayer]?.id).length;
      if (nextPlayerCharCount < CHARACTERS_PER_PLAYER) {
        setCurrentPlacingPlayer(nextPlayer);
        setSelectedPlacementRole('tank');
      }
    }
  }, [hexMap, characters, players, currentPlacingPlayer, selectedPlacementRole, getPlacedRoleCount]);
  const handleStartGameFromPlacement = useCallback(() => {
    setCharacters(prev => prev.map(c => ({
      ...c,
      canMove: true,
      canAttack: true,
    })));
    setPhase('playing');
    setCurrentPlayerIndex(0);
    addLog('Gra rozpoczęta! Tura Gracza 1', 'info');
  }, []);
  const addLog = useCallback((message, type = 'info') => {
    setGameLog(prev => [...prev, { message, type, timestamp: Date.now() }]);
  }, []);
  const currentPlayer = players[currentPlayerIndex];
  const selectedCharacterImage = selectedCharacter
    ? (selectedCharacter.role === 'shooter' ? archerImage : warriorImage)
    : null;
  
  const moveRangeHexes = useMemo(() => {
    if (!selectedCharacter || !selectedCharacter.canMove || phase !== 'playing') return [];
    if (selectedCharacter.playerId !== currentPlayer?.id) return [];
    
    const terrainType = hexMap[`${selectedCharacter.q},${selectedCharacter.r}`] || 'normal';
    const maxMove = terrainType === 'mud' ? 2 : selectedCharacter.moveRange;
    
    return calculateMoveRange(
      selectedCharacter.q,
      selectedCharacter.r,
      maxMove,
      hexMap,
      config?.width || 0,
      config?.height || 0,
      characters,
      selectedCharacter.id
    );
  }, [selectedCharacter, hexMap, config, characters, phase, currentPlayer]);
  const attackRangeHexes = useMemo(() => {
    if (!selectedCharacter || !selectedCharacter.canAttack || phase !== 'playing') return [];
    if (selectedCharacter.playerId !== currentPlayer?.id) return [];

    const typeConfig = CHARACTER_TYPES[selectedCharacter.role] || CHARACTER_TYPES.tank;
    
    return calculateAttackRange(
      selectedCharacter.q,
      selectedCharacter.r,
      typeConfig.attackRange,
      characters,
      selectedCharacter.playerId,
      hexMap
    );
  }, [selectedCharacter, characters, phase, currentPlayer, hexMap]);
  const handleHexClick = useCallback((q, r) => {
    if (phase === 'placement') {
      handlePlacementClick(q, r);
      return;
    }
    
    if (phase !== 'playing') return;
    
    const clickedChar = characters.find(c => c.q === q && c.r === r && c.hp > 0);
    
    if (clickedChar) {
      if (clickedChar.playerId === currentPlayer?.id) {
        setSelectedCharacter(clickedChar);
        return;
      }
      
      if (selectedCharacter && selectedCharacter.canAttack && selectedCharacter.playerId === currentPlayer?.id) {
        const isInRange = attackRangeHexes.some(h => h.q === q && h.r === r);
        if (isInRange) {
          performAttack(selectedCharacter, clickedChar);
          return;
        }
      }
      return;
    }
    
    if (selectedCharacter && selectedCharacter.canMove && selectedCharacter.playerId === currentPlayer?.id) {
      const isInRange = moveRangeHexes.some(h => h.q === q && h.r === r);
      if (isInRange) {
        moveCharacter(selectedCharacter, q, r);
        return;
      }
    }
    
    setSelectedCharacter(null);
  }, [phase, characters, currentPlayer, selectedCharacter, moveRangeHexes, attackRangeHexes, handlePlacementClick]);

  const moveCharacter = useCallback((char, toQ, toR) => {
    const updatedChar = { ...char, q: toQ, r: toR, canMove: false };
    
    setCharacters(prev => prev.map(c => {
      if (c.id === char.id) {
        return updatedChar;
      }
      return c;
    }));
    
    setSelectedCharacter(updatedChar);
    addLog(`${char.name} rusza się na (${toQ}, ${toR})`, 'move');
  }, [addLog]);
  const performAttack = useCallback((attacker, defender) => {
    const attackRoll = rollD20();
    const attackConfig = CHARACTER_TYPES[attacker.role] || CHARACTER_TYPES.tank;
    const attackStat = attackConfig.attackStat === 'dexterity' ? attacker.dexterity : attacker.strength;
    const attackMod = calculateModifier(attackStat);
    
    const isCritical = attackRoll === 20;
    const isFumble = attackRoll === 1;
    const attackTotal = attackRoll + attackMod;
    const isHit = isCritical || (!isFumble && attackTotal >= defender.armorClass);
    
    const maxDamage = Math.max(1, attacker.strength);
    const hitQuality = clamp(0.25 + Math.max(0, attackTotal - defender.armorClass) * 0.05, 0.25, 1);
    let rawDamage = 0;
    let damage = 0;
    let shieldRoll = null;
    let shieldMod = null;
    let shieldTotal = null;
    let shieldBlocked = false;
    if (isHit) {
      rawDamage = isCritical ? maxDamage : Math.max(1, Math.ceil(maxDamage * hitQuality));
      damage = rawDamage;

      if (defender.role === 'tank') {
        shieldRoll = rollD20();
        shieldMod = calculateModifier(defender.strength);
        shieldTotal = shieldRoll + shieldMod;
        shieldBlocked = shieldTotal >= 15;
        if (shieldBlocked) {
          damage = Math.max(1, Math.ceil(damage / 2));
        }
      }
    }
    
    const newDefenderHp = Math.max(0, defender.hp - damage);
    
    const updatedAttacker = { ...attacker, canAttack: false };
    
    setCharacters(prev => prev.map(c => {
      if (c.id === attacker.id) {
        return updatedAttacker;
      }
      if (c.id === defender.id) {
        return { ...c, hp: newDefenderHp };
      }
      return c;
    }));
    
    setSelectedCharacter(updatedAttacker);
    setAttackResult({
      attacker,
      defender,
      attackRoll,
      attackStatLabel: attackConfig.attackStat === 'dexterity' ? 'Zręczność' : 'Siła',
      attackStatRoll: attackMod,
      attackTotal,
      targetAC: defender.armorClass,
      maxDamage,
      hitQuality,
      isHit,
      isCritical,
      isFumble,
      rawDamage,
      damage,
      shieldRoll,
      shieldMod,
      shieldTotal,
      shieldBlocked,
      defenderHpAfter: newDefenderHp,
    });
    setShowAttackDialog(true);
    
    if (isCritical) {
      addLog(`KRYTYK! ${attacker.name} przebija obronę ${defender.name} za ${damage} obrażeń!`, 'critical');
    } else if (isHit) {
      addLog(`${attacker.name} trafia ${defender.name} za ${damage} obrażeń!`, 'attack');
    } else {
      addLog(`${attacker.name} chybia ${defender.name}!`, 'attack');
    }
    
    if (newDefenderHp <= 0) {
      addLog(`${defender.name} zostaje pokonany!`, 'critical');
      checkVictory(defender.id);
    }
  }, [addLog]);

  const checkVictory = useCallback((deadCharId) => {
    setTimeout(() => {
      const aliveByPlayer = {};
      characters.forEach(c => {
        if (c.id !== deadCharId && c.hp > 0) {
          aliveByPlayer[c.playerId] = (aliveByPlayer[c.playerId] || 0) + 1;
        }
      });
      
      const alivePlayers = Object.keys(aliveByPlayer);
      
      if (alivePlayers.length === 1) {
        const winner = players.find(p => p.id === parseInt(alivePlayers[0]));
        addLog(`${winner?.name} wygrywa!`, 'critical');
        setPhase('ended');
      }
    }, 100);
  }, [characters, players, addLog]);
  const handleEndTurn = useCallback(() => {
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    
    setCharacters(prev => prev.map(c => {
      if (c.playerId === players[nextIndex]?.id) {
        return { ...c, canMove: true, canAttack: true };
      }
      return c;
    }));
    
    setCurrentPlayerIndex(nextIndex);
    setSelectedCharacter(null);
    
    addLog(`Tura gracza ${players[nextIndex]?.name}`, 'info');
  }, [currentPlayerIndex, players, addLog]);
  const handleRestart = useCallback(() => {
    setPhase('setup');
    setConfig(null);
    setHexMap({});
    setPlayers([]);
    setCharacters([]);
    setSelectedCharacter(null);
    setGameLog([]);
    setCurrentPlayerIndex(0);
    setCurrentPlacingPlayer(0);
    setSelectedPlacementRole('tank');
  }, []);
  if (phase === 'setup') {
    return <SetupScreen onStart={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(220,38,38,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#020617_100%)]">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-md p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-blue-500 rounded flex items-center justify-center">
              <Dices className="w-5 h-5 text-white" />
            </div>
            HeksaDnD
          </h1>
          <div className="text-sm text-gray-400">
            Mapa: {config?.width} x {config?.height} | {players.length} graczy
          </div>
        </div>
      </header>

      <main className="p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
          {phase === 'map-building' && (
            <div className="lg:col-span-1 space-y-4">
              <TerrainPalette 
                selectedTerrain={selectedTerrain}
                onSelect={setSelectedTerrain}
              />
              <Button 
                onClick={handleFinishMapBuilding}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Przejdź do rozmieszczania
              </Button>
            </div>
          )}

          {phase === 'placement' && (
            <div className="lg:col-span-1">
              <PlacementPhase
                players={players}
                characters={characters}
                currentPlacingPlayer={currentPlacingPlayer}
                charactersPerPlayer={CHARACTERS_PER_PLAYER}
                selectedPlacementRole={selectedPlacementRole}
                onSelectPlacementRole={setSelectedPlacementRole}
                currentPlayerTankPlaced={getPlacedRoleCount(players[currentPlacingPlayer]?.id, 'tank')}
                currentPlayerShooterPlaced={getPlacedRoleCount(players[currentPlacingPlayer]?.id, 'shooter')}
                onStartGame={handleStartGameFromPlacement}
              />
            </div>
          )}

          <div className={phase === 'playing' || phase === 'ended' ? "lg:col-span-3" : "lg:col-span-2"}>
            <GameBoard
              width={config?.width || 10}
              height={config?.height || 10}
              hexMap={hexMap}
              onHexChange={handleHexChange}
              characters={characters}
              players={players}
              selectedCharacter={selectedCharacter}
              moveRangeHexes={moveRangeHexes}
              attackRangeHexes={attackRangeHexes}
              onHexClick={handleHexClick}
              isMapBuilding={phase === 'map-building'}
              selectedTerrain={selectedTerrain}
            />
          </div>

          <div className="lg:col-span-1">
            <GameControls
              phase={phase}
              currentPlayer={currentPlayer}
              selectedCharacter={selectedCharacter}
              selectedCharacterImage={selectedCharacterImage}
              players={players}
              gameLog={gameLog}
              onEndTurn={handleEndTurn}
              onStartGame={handleStartGameFromPlacement}
              onRestart={handleRestart}
              onSaveMap={() => console.log('Save map:', hexMap)}
            />
          </div>
        </div>
      </main>

      <AttackDialog
        isOpen={showAttackDialog}
        onClose={() => setShowAttackDialog(false)}
        result={attackResult}
      />
    </div>
  );
}