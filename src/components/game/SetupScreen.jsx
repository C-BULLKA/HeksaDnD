import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dices, Map, Users } from 'lucide-react';

export default function SetupScreen({ onStart }) {
  const [mapWidth, setMapWidth] = useState(12);
  const [mapHeight, setMapHeight] = useState(10);
  const [playerCount, setPlayerCount] = useState(2);

  const handleStart = () => {
    const w = Math.max(5, Math.min(50, parseInt(mapWidth) || 12));
    const h = Math.max(5, Math.min(50, parseInt(mapHeight) || 10));
    
    onStart({
      width: w,
      height: h,
      playerCount,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Dices className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">HeksaDnD</CardTitle>
          <CardDescription className="text-gray-400">
            Turowa strategia z systemem D&D D20
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Map className="w-5 h-5" />
              <span className="font-medium">Rozmiar mapy</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Szerokość (5-50)</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={mapWidth}
                  onChange={(e) => setMapWidth(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-400">Wysokość (5-50)</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={mapHeight}
                  onChange={(e) => setMapHeight(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="text-center text-gray-500 text-sm">
              Mapa: {mapWidth} x {mapHeight} = {(parseInt(mapWidth) || 0) * (parseInt(mapHeight) || 0)} heksagonów
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              <span className="font-medium">Liczba graczy: {playerCount}</span>
            </div>
            
            <div className="flex justify-center gap-2">
              {[2, 3, 4].map((count) => (
                <Button
                  key={count}
                  variant={playerCount === count ? "default" : "outline"}
                  size="lg"
                  onClick={() => setPlayerCount(count)}
                  className={playerCount === count ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {count} graczy
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleStart}
            className="w-full h-12 text-lg bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700"
          >
            <Map className="w-5 h-5 mr-2" />
            Rozpocznij budowę mapy
          </Button>
          
          <p className="text-gray-500 text-sm text-center">
            Po wybraniu rozmiaru przejdziesz do edytora mapy, gdzie ustawisz teren i pozycje startowe graczy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}