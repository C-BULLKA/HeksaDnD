import React from 'react';
import { Button } from '@/components/ui/button';
import type { HexType } from '@/types/game';

interface TerrainPaletteProps {
  selectedTerrain: HexType;
  onSelect: (terrain: HexType) => void;
}

const TerrainPalette: React.FC<TerrainPaletteProps> = ({ selectedTerrain, onSelect }) => {
  const terrains = [
    { type: 'normal' as HexType, label: 'Normalny', color: '#10B981' },
    { type: 'mud' as HexType, label: 'Błoto', color: '#92400E' },
    { type: 'wall' as HexType, label: 'Ściana', color: '#374151' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-white font-medium mb-3">Paleta terenu</h3>
      <div className="grid grid-cols-1 gap-2">
        {terrains.map((terrain) => (
          <Button
            key={terrain.type}
            onClick={() => onSelect(terrain.type)}
            variant={selectedTerrain === terrain.type ? "default" : "outline"}
            className={`justify-start ${
              selectedTerrain === terrain.type
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: terrain.color }}
              />
              <span className="text-white">{terrain.label}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TerrainPalette;
