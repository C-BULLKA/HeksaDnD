import React, { useState, useMemo, useCallback } from 'react';
import HexTile, { hexToPixel, pixelToHex, HEX_SIZE } from './HexTile';

export default function GameBoard({
  width,
  height,
  hexMap,
  onHexChange,
  characters,
  players,
  selectedCharacter,
  moveRangeHexes,
  attackRangeHexes,
  onHexClick,
  isMapBuilding,
  selectedTerrain,
}) {
  const [isPainting, setIsPainting] = useState(false);

  const svgWidth = useMemo(() => {
    const lastHex = hexToPixel(width - 1, height - 1);
    return lastHex.x + HEX_SIZE * 3;
  }, [width, height]);

  const svgHeight = useMemo(() => {
    const lastHex = hexToPixel(width - 1, height - 1);
    return lastHex.y + HEX_SIZE * 3;
  }, [width, height]);

  const hexagons = useMemo(() => {
    const hexes = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        const key = `${q},${r}`;
        const type = hexMap[key] || 'normal';
        hexes.push({ q, r, type, key });
      }
    }
    return hexes;
  }, [width, height, hexMap]);

  const handleHexClick = useCallback((q, r) => {
    if (isMapBuilding && selectedTerrain) {
      onHexChange(q, r, selectedTerrain);
    } else if (onHexClick) {
      onHexClick(q, r);
    }
  }, [isMapBuilding, selectedTerrain, onHexChange, onHexClick]);

  const handleHexDrop = useCallback((q, r, terrainType) => {
    if (isMapBuilding) {
      onHexChange(q, r, terrainType);
    }
  }, [isMapBuilding, onHexChange]);

  const handleMouseDown = (e) => {
    if (e.button === 0 && isMapBuilding) {
      setIsPainting(true);
    }
  };

  const handleMouseUp = () => {
    setIsPainting(false);
  };

  const handleMouseMove = (e) => {
    if (isPainting && isMapBuilding && selectedTerrain) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hex = pixelToHex(x, y);
      
      if (hex.q >= 0 && hex.q < width && hex.r >= 0 && hex.r < height) {
        onHexChange(hex.q, hex.r, selectedTerrain);
      }
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (isMapBuilding) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hex = pixelToHex(x, y);
      
      if (hex.q >= 0 && hex.q < width && hex.r >= 0 && hex.r < height) {
        onHexChange(hex.q, hex.r, 'normal');
      }
    }
  };

  const getCharacterAt = (q, r) => {
    return characters?.find(c => c.q === q && c.r === r);
  };

  const getPlayerColor = (playerId) => {
    const player = players?.find(p => p.id === playerId);
    return player?.color || '#888';
  };

  const isInMoveRange = (q, r) => {
    return moveRangeHexes?.some(h => h.q === q && h.r === r) || false;
  };

  const isInAttackRange = (q, r) => {
    return attackRangeHexes?.some(h => h.q === q && h.r === r) || false;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-slate-950/40 overflow-auto p-4 backdrop-blur-sm" style={{ maxHeight: '70vh' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
        className="select-none drop-shadow-[0_0_24px_rgba(15,23,42,0.35)]"
      >
        {hexagons.map((hex) => {
          const character = getCharacterAt(hex.q, hex.r);
          return (
            <HexTile
              key={hex.key}
              q={hex.q}
              r={hex.r}
              type={hex.type}
              isSelected={selectedCharacter?.q === hex.q && selectedCharacter?.r === hex.r}
              isInMoveRange={isInMoveRange(hex.q, hex.r)}
              isInAttackRange={isInAttackRange(hex.q, hex.r)}
              character={character}
              playerColor={character ? getPlayerColor(character.playerId) : null}
              onClick={handleHexClick}
              onDrop={handleHexDrop}
            />
          );
        })}
      </svg>
    </div>
  );
}