import { useState, useCallback } from 'react';
import { HexCanvas } from '@/components/HexCanvas';
import { GameControls } from '@/components/GameControls';
import { useGame } from '@/hooks/useGame';
import type { Hex, Character, AttackType } from '@/types/game';
import { Dices } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sword, Target } from 'lucide-react';
import { generateAttackDescription } from '@/utils/combatSystem';

// ============================================
// GŁÓWNY KOMPONENT APLIKACJI
// ============================================

function App() {
  const {
    state,
    currentPlayer,
    allCharacters,
    startGame,
    selectCharacter,
    selectHex,
    hoverHex,
    moveCharacter,
    performCharacterAttack,
    endTurn,
    placeTerrain,
    saveMap,
    loadMap,
    restart,
  } = useGame();

  const [playerCount, setPlayerCount] = useState(2);
  const [attackDialog, setAttackDialog] = useState<{
    isOpen: boolean;
    result: any;
  }>({ isOpen: false, result: null });

  // ==========================================
  // HANDLERY
  // ==========================================

  const handleHexClick = useCallback((hex: Hex) => {
    // Tryb budowy mapy
    if (state.phase === 'map-building') {
      placeTerrain(hex, 'wall');
      return;
    }

    // Tryb gry
    if (state.phase === 'playing') {
      // Jeśli wybrano postać i kliknięto na pole w zasięgu ruchu - przesuń
      if (state.selectedCharacter && state.moveRangeHexes.some(h => h.q === hex.q && h.r === hex.r)) {
        moveCharacter(hex);
        return;
      }

      // Jeśli wybrano postać i kliknięto na pole w zasięgu ataku - atakuj
      if (state.selectedCharacter && state.attackRangeHexes.some(h => h.q === hex.q && h.r === hex.r)) {
        const target = getCharacterAtHex(hex, allCharacters);
        if (target) {
          const dq = Math.abs(state.selectedCharacter.hex.q - hex.q);
          const dr = Math.abs(state.selectedCharacter.hex.r - hex.r);
          const distance = (dq + dr + Math.abs(state.selectedCharacter.hex.q + state.selectedCharacter.hex.r - hex.q - hex.r)) / 2;
          const attackType: AttackType = distance <= 1 ? 'melee' : 'ranged';
          const result = performCharacterAttack(hex, attackType);
          setAttackDialog({ isOpen: true, result });
        }
        return;
      }

      // Jeśli kliknięto na puste pole - odznacz postać
      const character = getCharacterAtHex(hex, allCharacters);
      if (!character) {
        selectCharacter(null);
        selectHex(hex);
      }
    }
  }, [
    state.phase,
    state.selectedCharacter,
    state.moveRangeHexes,
    state.attackRangeHexes,
    placeTerrain,
    moveCharacter,
    performCharacterAttack,
    selectCharacter,
    selectHex,
    allCharacters,
  ]);

  const handleCharacterClick = useCallback((character: Character) => {
    // Tylko postacie aktywnego gracza mogą być wybierane
    if (state.phase === 'playing' && currentPlayer && character.playerId === currentPlayer.id) {
      selectCharacter(character);
    }
  }, [state.phase, currentPlayer, selectCharacter]);

  const handleAttack = useCallback((_attackType: AttackType) => {
    // Przełącz w tryb ataku - zaznacz zasięg ataku
    if (state.selectedCharacter) {
      // To jest obsługiwane w hooku useGame automatycznie
    }
  }, [state.selectedCharacter]);

  const handleStartGame = useCallback((count: number) => {
    setPlayerCount(count);
    startGame(count);
  }, [startGame]);

  const handleMove = useCallback(() => {
    // Funkcja pusta - ruch jest obsługiwany przez kliknięcie
  }, []);

  // Pomocnicza funkcja do znajdowania postaci na heksagonie
  function getCharacterAtHex(hex: Hex, characters: Character[]): Character | null {
    return characters.find(char => char.hex.q === hex.q && char.hex.r === hex.r) || null;
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Nagłówek */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-blue-500 rounded flex items-center justify-center">
              <Dices className="w-5 h-5 text-white" />
            </div>
            Hex Strategy Game
          </h1>
          <div className="text-sm text-gray-400">
            Turowa strategia z systemem D&D D20
          </div>
        </div>
      </header>

      {/* Główna zawartość */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Canvas z mapą */}
          <div className="lg:col-span-3 h-full min-h-[600px]">
            <HexCanvas
              map={state.map}
              characters={allCharacters}
              players={state.players}
              selectedCharacter={state.selectedCharacter}
              selectedHex={state.selectedHex}
              hoveredHex={state.hoveredHex}
              moveRangeHexes={state.moveRangeHexes}
              attackRangeHexes={state.attackRangeHexes}
              currentPlayer={currentPlayer}
              onHexClick={handleHexClick}
              onHexHover={hoverHex}
              onCharacterClick={handleCharacterClick}
              isMapBuilding={state.phase === 'map-building'}
              selectedTerrainType={'wall'}
            />
          </div>

          {/* Panel sterowania */}
          <div className="lg:col-span-1 h-full">
            <GameControls
              currentPlayer={currentPlayer}
              selectedCharacter={state.selectedCharacter}
              gamePhase={state.phase}
              playerCount={playerCount}
              gameLog={state.gameLog}
              onEndTurn={endTurn}
              onAttack={handleAttack}
              onMove={handleMove}
              onRestart={restart}
              onSaveMap={saveMap}
              onLoadMap={loadMap}
              onStartGame={handleStartGame}
            />
          </div>
        </div>
      </main>

      {/* Okno dialogowe wyniku ataku */}
      <Dialog open={attackDialog.isOpen} onOpenChange={(open) => setAttackDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {attackDialog.result?.isCritical ? (
                <>
                  <Sword className="w-5 h-5 text-yellow-500" />
                  Krytyczne trafienie!
                </>
              ) : attackDialog.result?.isFumble ? (
                <>
                  <Target className="w-5 h-5 text-red-500" />
                  Porażka!
                </>
              ) : attackDialog.result?.isHit ? (
                <>
                  <Sword className="w-5 h-5 text-green-500" />
                  Trafienie!
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 text-gray-500" />
                  Chybienie!
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {attackDialog.result && generateAttackDescription(attackDialog.result)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Rzut ataku</div>
                <div className="text-2xl font-bold text-blue-400">
                  {attackDialog.result?.attackRoll}
                  {attackDialog.result && attackDialog.result.attackRoll !== 1 && attackDialog.result.attackRoll !== 20 && (
                    <span className="text-sm text-gray-400 ml-1">
                      (+{Math.floor((attackDialog.result.attacker.strength - 10) / 2)})
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Rzut obrony</div>
                <div className="text-2xl font-bold text-red-400">
                  {attackDialog.result?.defenseRoll || '-'}
                  {attackDialog.result && attackDialog.result.defenseRoll > 0 && (
                    <span className="text-sm text-gray-400 ml-1">
                      (+{Math.floor((attackDialog.result.defender.dexterity - 10) / 2)})
                    </span>
                  )}
                </div>
              </div>
            </div>
            {attackDialog.result?.isHit && (
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-sm text-gray-400">Zadane obrażenia</div>
                <div className="text-3xl font-bold text-red-500">
                  {attackDialog.result.damage}
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={() => setAttackDialog({ isOpen: false, result: null })}
            className="w-full mt-4"
          >
            OK
          </Button>
        </DialogContent>
      </Dialog>

      {/* Ekran końca gry */}
      {state.winner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4" style={{ color: state.winner.color }}>
              Gratulacje!
            </h2>
            <p className="text-xl mb-6">
              Zwycięża <span style={{ color: state.winner.color }}>{state.winner.name}</span>!
            </p>
            <Button 
              onClick={restart}
              className="bg-green-600 hover:bg-green-700"
            >
              Nowa gra
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
