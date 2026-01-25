import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Play, AlertCircle } from 'lucide-react';
import type { Player, Character } from '@/types/game';

interface PlacementPhaseProps {
  players: Player[];
  characters: Character[];
  currentPlacingPlayer: number;
  charactersPerPlayer: number;
  onStartGame: () => void;
}

const PlacementPhase: React.FC<PlacementPhaseProps> = ({
  players,
  characters,
  currentPlacingPlayer,
  charactersPerPlayer,
  onStartGame,
}) => {
  const getPlacedCount = (playerId: number) => {
    return characters.filter(c => c.playerId === playerId).length;
  };

  const allPlaced = players.every(p => getPlacedCount(p.id) >= charactersPerPlayer);
  const currentPlayer = players[currentPlacingPlayer];

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Rozmieszczenie postaci
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-gray-400 text-sm">
          Każdy gracz musi umieścić {charactersPerPlayer} postacie na mapie.
          Kliknij na puste pole, aby postawić postać.
        </div>

        {/* Status graczy */}
        <div className="space-y-2">
          {players.map((player, index) => {
            const placed = getPlacedCount(player.id);
            const isCurrentTurn = index === currentPlacingPlayer;
            const isDone = placed >= charactersPerPlayer;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isCurrentTurn ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-gray-750'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-white">{player.name}</span>
                  {isCurrentTurn && !isDone && (
                    <Badge className="bg-blue-600 text-xs">Twoja kolej</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isDone ? 'text-green-400' : 'text-gray-400'}`}>
                    {placed}/{charactersPerPlayer}
                  </span>
                  {isDone && (
                    <Badge className="bg-green-600 text-xs">Gotowy</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aktualny gracz */}
        {!allPlaced && currentPlayer && (
          <div
            className="p-4 rounded-lg border-2 text-center"
            style={{
              borderColor: currentPlayer.color,
              backgroundColor: `${currentPlayer.color}20`
            }}
          >
            <div className="text-white font-bold mb-1">
              {currentPlayer.name} - umieść postać
            </div>
            <div className="text-gray-400 text-sm">
              Kliknij na dowolne puste pole na mapie
            </div>
          </div>
        )}

        {/* Przycisk startu */}
        {allPlaced ? (
          <Button
            onClick={onStartGame}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Rozpocznij grę!
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-yellow-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            Wszyscy gracze muszą rozmieścić swoje postacie
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlacementPhase;
