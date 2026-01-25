import React, { useState, useCallback, useMemo } from 'react';
import SetupScreen from '@/components/game/SetupScreen';
import GameBoard from '@/components/game/GameBoard';
import TerrainPalette from '@/components/game/TerrainPalette';
import GameControls from '@/components/game/GameControls';
import PlacementPhase from '@/components/game/PlacementPhase';
import AttackDialog from '@/components/game/AttackDialog';
import { Button } from "@/components/ui/button";
import { Dices, ArrowRight } from 'lucide-react';

const PLAYER_COLORS = ['#DC2626', '#2563EB', '#16A34A', '#EAB308'];
const CHARACTERS_PER_PLAYER = 2;

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function calculateModifier(stat) {
  return Math.floor((stat - 10) / 2);
}

function rollStats() {
  const roll4d6DropLowest = () => {
    const rolls = [rollDice(6), rollDice(6), rollDice(6), rollDice(6)];
    rolls.sort((a, b) => b - a);
    return rolls[0] + rolls[1] + rolls[2];
  };
  return {
    strength: roll4d6DropLowest(),
    dexterity: roll4d6DropLowest(),
    constitution: roll4d6DropLowest(),
  };
}

function createCharacter(playerId, q, r, name) {
  const stats = rollStats();
  const conMod = calculateModifier(stats.constitution);
  const dexMod = calculateModifier(stats.dexterity);
  const maxHp = Math.max(1, 10 + conMod);
  const armorClass = Math.max(1, 10 + dexMod);
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    q,
    r,
    name,
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

function calculateAttackRange(q, r, range, characters, playerId) {
  const targets = [];
  for (const char of characters) {
    if (char.playerId !== playerId && char.hp > 0) {
      const dist = hexDistance(q, r, char.q, char.r);
      if (dist <= range && dist > 0) {
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
    setCharacters([]);
    addLog('Faza rozmieszczania postaci - każdy gracz umieszcza swoje postacie', 'info');
  }, []);
  const handlePlacementClick = useCallback((q, r) => {
    const terrainType = hexMap[`${q},${r}`] || 'normal';
    if (terrainType === 'wall') return;
    
    const isOccupied = characters.some(c => c.q === q && c.r === r);
    if (isOccupied) return;
    
    const currentPlayer = players[currentPlacingPlayer];
    const playerCharCount = characters.filter(c => c.playerId === currentPlayer.id).length;
    
    if (playerCharCount >= CHARACTERS_PER_PLAYER) return;
    
    const charName = `${currentPlayer.name[0]}${playerCharCount + 1}`;
    const newChar = createCharacter(currentPlayer.id, q, r, charName);
    
    setCharacters(prev => [...prev, newChar]);
    addLog(`${currentPlayer.name} umieszcza postać ${charName} na (${q}, ${r})`, 'info');
    
    if (playerCharCount + 1 >= CHARACTERS_PER_PLAYER) {
      const nextPlayer = (currentPlacingPlayer + 1) % players.length;
      const nextPlayerCharCount = characters.filter(c => c.playerId === players[nextPlayer]?.id).length;
      if (nextPlayerCharCount < CHARACTERS_PER_PLAYER) {
        setCurrentPlacingPlayer(nextPlayer);
      }
    }
  }, [hexMap, characters, players, currentPlacingPlayer]);
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
    
    return calculateAttackRange(
      selectedCharacter.q,
      selectedCharacter.r,
      2,
      characters,
      selectedCharacter.playerId
    );
  }, [selectedCharacter, characters, phase, currentPlayer]);
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
    const strMod = calculateModifier(attacker.strength);
    
    const isCritical = attackRoll === 20;
    const isFumble = attackRoll === 1;
    const attackTotal = attackRoll + strMod;
    const isHit = isCritical || (!isFumble && attackTotal >= defender.armorClass);
    
    let damage = 0;
    if (isHit) {
      const baseDamage = rollDice(8);
      damage = isCritical ? (baseDamage + rollDice(8) + strMod * 2) : (baseDamage + strMod);
      damage = Math.max(1, damage);
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
      defenderAC: defender.armorClass,
      isHit,
      isCritical,
      isFumble,
      damage,
      defenderHpAfter: newDefenderHp,
    });
    setShowAttackDialog(true);
    
    if (isCritical) {
      addLog(`KRYTYK! ${attacker.name} zadaje ${damage} obrażeń ${defender.name}!`, 'critical');
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
  }, []);
  if (phase === 'setup') {
    return <SetupScreen onStart={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
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