import { useState, useCallback } from 'react';
import { HexCanvas } from '@/components/HexCanvas';
import { GameControls } from '@/components/GameControls';
import SetupScreen from '@/components/SetupScreen';
import TerrainPalette from '@/components/TerrainPalette';
import PlacementPhase from '@/components/PlacementPhase';
import AttackDialog from '@/components/AttackDialog';
import { useGame } from '@/hooks/useGame';
import type { Hex, Character, AttackType } from '@/types/game';
import { Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Map, Users, Play } from 'lucide-react';

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
    selectTerrainType,
    startPlacementPhase,
    placeCharacter,
    startPlayingPhase,
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

  const handleStartGame = useCallback((config: { playerCount: number; width: number; height: number }) => {
    setPlayerCount(config.playerCount);
    startGame(config);
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
        {state.phase === 'setup' && (
          <SetupScreen onStart={handleStartGame} />
        )}

        {(state.phase === 'map-building' || state.phase === 'placement' || state.phase === 'playing') && (
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
                selectedTerrainType={state.selectedTerrainType}
              />
            </div>

            {/* Panel sterowania */}
            <div className="lg:col-span-1 h-full space-y-4">
              {state.phase === 'map-building' && (
                <div className="space-y-4">
                  <TerrainPalette
                    selectedTerrain={state.selectedTerrainType}
                    onSelect={selectTerrainType}
                  />
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Map className="w-5 h-5" />
                      Budowa mapy
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Kliknij na pola, aby zmienić teren. Aktualnie wybrany: {state.selectedTerrainType}
                    </p>
                    <div className="space-y-2">
                      <Button onClick={saveMap} variant="outline" className="w-full">
                        Zapisz mapę
                      </Button>
                      <Button onClick={loadMap} variant="outline" className="w-full">
                        Wczytaj mapę
                      </Button>
                      <Button onClick={startPlacementPhase} className="w-full bg-green-600 hover:bg-green-700">
                        <Users className="w-4 h-4 mr-2" />
                        Rozmieść postacie
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {state.phase === 'placement' && (
                <PlacementPhase
                  players={state.players}
                  characters={allCharacters}
                  currentPlacingPlayer={state.currentPlacingPlayer}
                  charactersPerPlayer={state.charactersPerPlayer}
                  onStartGame={startPlayingPhase}
                />
              )}

              {state.phase === 'playing' && (
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
              )}
            </div>
          </div>
        )}
      </main>

      {/* Okno dialogowe wyniku ataku */}
      <AttackDialog
        isOpen={attackDialog.isOpen}
        result={attackDialog.result}
        onClose={() => setAttackDialog({ isOpen: false, result: null })}
      />

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
