import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Target, 
  SkipForward, 
  RotateCcw,
  Save,
  FolderOpen,
  Users,
  Shield,
  Zap,
  Heart,
  Move,
  Info
} from 'lucide-react';
import {
  calculateModifier,
} from '@/types/game';
import type { Character, Player, AttackType } from '@/types/game';

// ============================================
// PROPS
// ============================================

interface GameControlsProps {
  currentPlayer: Player | null;
  selectedCharacter: Character | null;
  gamePhase: string;
  playerCount: number;
  gameLog: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: number;
  }>;
  
  // Callbacki
  onEndTurn: () => void;
  onAttack: (type: AttackType) => void;
  onMove: () => void;
  onRestart: () => void;
  onSaveMap: () => void;
  onLoadMap: () => void;
  onStartGame: (playerCount: number) => void;
}

// ============================================
// KOMPONENT
// ============================================

export const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  selectedCharacter,
  gamePhase,
  playerCount,
  gameLog,
  onEndTurn,
  onAttack,
  onMove,
  onRestart,
  onSaveMap,
  onLoadMap,
  onStartGame,
}) => {
  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Panel gry / startu */}
      {gamePhase === 'setup' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Nowa Gra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">Wybierz liczbę graczy:</p>
            <div className="flex gap-2">
              {[2, 3, 4].map((count) => (
                <Button
                  key={count}
                  variant={playerCount === count ? 'default' : 'outline'}
                  onClick={() => onStartGame(count)}
                  className="flex-1"
                >
                  {count} graczy
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel tury */}
      {currentPlayer && gamePhase === 'playing' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: currentPlayer.color }}>
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: currentPlayer.color }}
              />
              Tura gracza: {currentPlayer.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button 
                onClick={onMove}
                disabled={!selectedCharacter?.canMove}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Move className="w-4 h-4 mr-2" />
                Ruch
              </Button>
              <Button 
                onClick={() => onAttack('melee')}
                disabled={!selectedCharacter?.canAttack}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Sword className="w-4 h-4 mr-2" />
                Atak wręcz
              </Button>
              <Button 
                onClick={() => onAttack('ranged')}
                disabled={!selectedCharacter?.canAttack}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Strzał
              </Button>
            </div>
            <Button 
              onClick={onEndTurn}
              className="w-full bg-gray-600 hover:bg-gray-700"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Zakończ turę
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Panel wybranej postaci */}
      {selectedCharacter && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5" />
              {selectedCharacter.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* HP */}
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  Punkty Życia
                </span>
                <span>{selectedCharacter.hp} / {selectedCharacter.maxHp}</span>
              </div>
              <Progress 
                value={(selectedCharacter.hp / selectedCharacter.maxHp) * 100}
                className="h-2"
              />
            </div>

            {/* Statystyki */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-300">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Siła
                </span>
                <Badge variant="secondary">
                  {selectedCharacter.strength} ({calculateModifier(selectedCharacter.strength) >= 0 ? '+' : ''}{calculateModifier(selectedCharacter.strength)})
                </Badge>
              </div>
              <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-300">
                  <Move className="w-4 h-4 text-blue-500" />
                  Zręczność
                </span>
                <Badge variant="secondary">
                  {selectedCharacter.dexterity} ({calculateModifier(selectedCharacter.dexterity) >= 0 ? '+' : ''}{calculateModifier(selectedCharacter.dexterity)})
                </Badge>
              </div>
              <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-300">
                  <Shield className="w-4 h-4 text-green-500" />
                  Wytrzymałość
                </span>
                <Badge variant="secondary">
                  {selectedCharacter.constitution} ({calculateModifier(selectedCharacter.constitution) >= 0 ? '+' : ''}{calculateModifier(selectedCharacter.constitution)})
                </Badge>
              </div>
              <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-300">
                  <Shield className="w-4 h-4 text-purple-500" />
                  Klasa Pancerza
                </span>
                <Badge variant="secondary">
                  {selectedCharacter.armorClass}
                </Badge>
              </div>
            </div>

            {/* Zasięgi */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                <span className="text-gray-300">Ruch</span>
                <Badge variant="outline">{selectedCharacter.moveRange}</Badge>
              </div>
              <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                <span className="text-gray-300">Zasięg strzału</span>
                <Badge variant="outline">{selectedCharacter.attackRange}</Badge>
              </div>
            </div>

            {/* Status tury */}
            <div className="flex gap-2">
              <Badge 
                variant={selectedCharacter.canMove ? 'default' : 'secondary'}
                className={selectedCharacter.canMove ? 'bg-blue-600' : ''}
              >
                {selectedCharacter.canMove ? 'Może się poruszyć' : 'Już się poruszył'}
              </Badge>
              <Badge 
                variant={selectedCharacter.canAttack ? 'default' : 'secondary'}
                className={selectedCharacter.canAttack ? 'bg-red-600' : ''}
              >
                {selectedCharacter.canAttack ? 'Może atakować' : 'Już atakował'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel budowy mapy */}
      {gamePhase === 'map-building' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Budowa Mapy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-sm">Kliknij na mapę aby umieścić teren:</p>
            <div className="space-y-2">
              <Button 
                onClick={onSaveMap}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Zapisz mapę
              </Button>
              <Button 
                onClick={onLoadMap}
                variant="outline"
                className="w-full"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Wczytaj mapę
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dziennik gry */}
      <Card className="bg-gray-800 border-gray-700 flex-1">
        <CardHeader>
          <CardTitle className="text-white text-sm">Dziennik gry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-64 overflow-y-auto">
          {gameLog.length === 0 ? (
            <p className="text-gray-400 text-sm">Brak zdarzeń...</p>
          ) : (
            gameLog.slice(-10).reverse().map((entry) => (
              <div 
                key={entry.id}
                className={`text-xs p-2 rounded ${
                  entry.type === 'critical' ? 'bg-red-900/30 text-red-300' :
                  entry.type === 'attack' ? 'bg-orange-900/30 text-orange-300' :
                  entry.type === 'move' ? 'bg-blue-900/30 text-blue-300' :
                  'bg-gray-700/50 text-gray-300'
                }`}
              >
                {entry.message}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Przycisk restartu */}
      <Button 
        onClick={onRestart}
        variant="outline"
        className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Nowa gra
      </Button>
    </div>
  );
};
