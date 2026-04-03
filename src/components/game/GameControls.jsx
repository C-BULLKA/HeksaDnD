import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sword, Move, RotateCcw, Save, Play, Shield, Crosshair } from 'lucide-react';

export default function GameControls({
  phase,
  currentPlayer,
  selectedCharacter,
  selectedCharacterImage,
  players,
  gameLog,
  onEndTurn,
  onStartGame,
  onRestart,
  onSaveMap,
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Stan gry</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            className={`
              ${phase === 'setup' ? "bg-yellow-600" : ""}
              ${phase === 'map-building' ? "bg-blue-600" : ""}
              ${phase === 'playing' ? "bg-green-600" : ""}
              ${phase === 'ended' ? "bg-red-600" : ""}
            `}
          >
            {phase === 'setup' && 'Konfiguracja'}
            {phase === 'map-building' && 'Budowa mapy'}
            {phase === 'playing' && 'Gra w toku'}
            {phase === 'ended' && 'Koniec gry'}
          </Badge>
          
          {currentPlayer && phase === 'playing' && (
            <div className="mt-3">
              <div className="text-gray-400 text-sm">Tura gracza:</div>
              <div 
                className="text-lg font-bold flex items-center gap-2 mt-1"
                style={{ color: currentPlayer.color }}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentPlayer.color }}
                />
                {currentPlayer.name}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCharacter && phase === 'playing' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Wybrana postać</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-white font-bold">{selectedCharacter.name}</div>

            {selectedCharacterImage && (
              <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Portret jednostki
                </div>
                <img
                  src={selectedCharacterImage}
                  alt={selectedCharacter.roleLabel}
                  className="w-full max-h-48 object-contain rounded-md bg-black/20"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge className={selectedCharacter.role === 'tank' ? 'bg-emerald-600' : 'bg-sky-600'}>
                {selectedCharacter.role === 'tank' ? <Shield className="w-3 h-3 mr-1" /> : <Crosshair className="w-3 h-3 mr-1" />}
                {selectedCharacter.roleLabel}
              </Badge>
              <Badge variant="outline">Zasięg ataku: {selectedCharacter.role === 'tank' ? 1 : 2}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">HP:</div>
              <div className="text-white">{selectedCharacter.hp}/{selectedCharacter.maxHp}</div>
              
              <div className="text-gray-400">Siła:</div>
              <div className="text-white">{selectedCharacter.strength}</div>
              
              <div className="text-gray-400">Zręczność:</div>
              <div className="text-white">{selectedCharacter.dexterity}</div>
              
              <div className="text-gray-400">KP:</div>
              <div className="text-white">{selectedCharacter.armorClass}</div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Badge variant={selectedCharacter.canMove ? "default" : "secondary"}>
                <Move className="w-3 h-3 mr-1" />
                {selectedCharacter.canMove ? 'Może się ruszyć' : 'Ruszył się'}
              </Badge>
              <Badge variant={selectedCharacter.canAttack ? "default" : "secondary"}>
                <Sword className="w-3 h-3 mr-1" />
                {selectedCharacter.canAttack ? 'Może atakować' : 'Atakował'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {players && players.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Gracze</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {players.map((player) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-2 rounded ${
                  currentPlayer?.id === player.id ? "bg-gray-700" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-white">{player.name}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {phase === 'map-building' && (
          <>
            <Button 
              onClick={onStartGame}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Rozpocznij grę
            </Button>
            <Button 
              onClick={onSaveMap}
              variant="outline"
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Zapisz mapę
            </Button>
          </>
        )}
        
        {phase === 'playing' && (
          <Button 
            onClick={onEndTurn}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Zakończ turę
          </Button>
        )}
        
        {(phase === 'playing' || phase === 'ended') && (
          <Button 
            onClick={onRestart}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Nowa gra
          </Button>
        )}
      </div>

      {gameLog && gameLog.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Log gry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {gameLog.slice(-10).reverse().map((entry, i) => (
                <div 
                  key={i}
                  className={`text-sm ${
                    entry.type === 'critical' ? "text-yellow-400" :
                    entry.type === 'attack' ? "text-red-400" :
                    entry.type === 'move' ? "text-blue-400" :
                    "text-gray-400"
                  }`}
                >
                  {entry.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}