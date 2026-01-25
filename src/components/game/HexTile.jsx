import React from 'react';

const HEX_SIZE = 30;

const TERRAIN_COLORS = {
  normal: '#6B7280',
  mud: '#92400E',
  wall: '#1F2937',
};

const TERRAIN_NAMES = {
  normal: 'Kamienie',
  mud: 'Błoto',
  wall: 'Ściana',
};

export function getHexPoints(size = HEX_SIZE) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

export function hexToPixel(q, r, size = HEX_SIZE) {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x: x + size * 2, y: y + size * 2 };
}

export function pixelToHex(px, py, size = HEX_SIZE) {
  const x = px - size * 2;
  const y = py - size * 2;
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  return hexRound(q, r);
}

function hexRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  
  return { q: rq, r: rr };
}

export default function HexTile({ 
  q, 
  r, 
  type = 'normal', 
  isSelected,
  isInMoveRange,
  isInAttackRange,
  character,
  playerColor,
  onClick,
  onDrop,
  size = HEX_SIZE 
}) {
  const { x, y } = hexToPixel(q, r, size);
  
  let fillColor = TERRAIN_COLORS[type] || TERRAIN_COLORS.normal;
  let strokeColor = '#000';
  let strokeWidth = 1;
  
  if (isInMoveRange) {
    fillColor = 'rgba(34, 197, 94, 0.5)';
    strokeColor = '#22C55E';
    strokeWidth = 2;
  }
  
  if (isInAttackRange) {
    fillColor = 'rgba(239, 68, 68, 0.5)';
    strokeColor = '#EF4444';
    strokeWidth = 2;
  }
  
  if (isSelected) {
    strokeColor = '#FFFFFF';
    strokeWidth = 3;
  }

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const terrainType = e.dataTransfer.getData('terrainType');
    if (terrainType && onDrop) {
      onDrop(q, r, terrainType);
    }
  };

  return (
    <g 
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick && onClick(q, r)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: 'pointer' }}
    >
      <polygon
        points={getHexPoints(size)}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      
      {character && (
        <>
          <circle
            cx={0}
            cy={0}
            r={size * 0.6}
            fill={playerColor}
            stroke="#000"
            strokeWidth={2}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={10}
            fontWeight="bold"
          >
            {character.name}
          </text>
          <rect
            x={-size * 0.6}
            y={size * 0.5}
            width={size * 1.2}
            height={4}
            fill="#333"
          />
          <rect
            x={-size * 0.6}
            y={size * 0.5}
            width={size * 1.2 * (character.hp / character.maxHp)}
            height={4}
            fill={character.hp / character.maxHp > 0.5 ? '#22C55E' : character.hp / character.maxHp > 0.25 ? '#EAB308' : '#EF4444'}
          />
        </>
      )}
    </g>
  );
}

export { TERRAIN_COLORS, TERRAIN_NAMES, HEX_SIZE };