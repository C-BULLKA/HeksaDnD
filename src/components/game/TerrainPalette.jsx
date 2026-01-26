import React from 'react';
import { getHexPoints, TERRAIN_COLORS } from './HexTile';

const terrainTypes = [
  { type: 'normal', name: 'Kamienie', description: 'Pełny ruch (4 hex)', color: TERRAIN_COLORS.normal },
  { type: 'mud', name: 'Błoto', description: 'Ograniczony ruch (2 hex)', color: TERRAIN_COLORS.mud },
  { type: 'wall', name: 'Ściana', description: 'Nieprzejezdna', color: TERRAIN_COLORS.wall },
];

export default function TerrainPalette({ selectedTerrain, onSelect }) {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('terrainType', type);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-white font-bold text-lg mb-4">Paleta terenu</h3>
      <p className="text-gray-400 text-sm mb-4">Przeciągnij na mapę lub kliknij, aby wybrać i malować</p>
      
      {terrainTypes.map((terrain) => (
        <div
          key={terrain.type}
          draggable
          onDragStart={(e) => handleDragStart(e, terrain.type)}
          onClick={() => onSelect(terrain.type)}
          className={`
            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
            ${selectedTerrain === terrain.type 
              ? "bg-blue-600 ring-2 ring-blue-400" 
              : "bg-gray-700 hover:bg-gray-600"}
          `}
        >
          <svg width="50" height="50" viewBox="-35 -35 70 70">
            <polygon
              points={getHexPoints(25)}
              fill={terrain.color}
              stroke={selectedTerrain === terrain.type ? '#fff' : '#000'}
              strokeWidth={2}
            />
          </svg>
          <div>
            <div className="text-white font-medium">{terrain.name}</div>
            <div className="text-gray-400 text-xs">{terrain.description}</div>
          </div>
        </div>
      ))}
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-white font-medium mb-2">Instrukcja:</h4>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Przeciągnij teren na mapę</li>
          <li>• Lub kliknij teren i maluj na mapie</li>
          <li>• Prawy przycisk myszy usuwa</li>
        </ul>
      </div>
    </div>
  );
}