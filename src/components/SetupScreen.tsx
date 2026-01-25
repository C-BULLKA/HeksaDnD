import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SetupScreen = ({ onStart }: { onStart: (config: { playerCount: number; width: number; height: number }) => void }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ playerCount, width, height });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">HeksaDnD</CardTitle>
          <p className="text-blue-200">Konfiguracja gry</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="playerCount" className="text-white text-sm font-medium">Liczba graczy</Label>
              <Input
                id="playerCount"
                type="number"
                min="2"
                max="4"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-white text-sm font-medium">Szerokość mapy (heksagony)</Label>
              <Input
                id="width"
                type="number"
                min="5"
                max="20"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-white text-sm font-medium">Wysokość mapy (heksagony)</Label>
              <Input
                id="height"
                type="number"
                min="5"
                max="20"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
              Rozpocznij grę
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupScreen;
