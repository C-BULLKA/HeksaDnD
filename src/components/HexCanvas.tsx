import { useRef, useEffect, useCallback } from 'react';
import type { Hex, Character, Player, HexType } from '@/types/game';
import {
  HEX_COLORS,
  HEX_SIZE,
} from '@/types/game';
import {
  hexToPixel,
  pixelToHex,
  getCharacterAtHex,
} from '@/utils/hexGrid';

// ============================================
// PROPS
// ============================================

interface HexCanvasProps {
  // Mapa i postacie
  map: Hex[][];
  characters: Character[];
  players: Player[];
  
  // Stan gry
  selectedCharacter: Character | null;
  selectedHex: Hex | null;
  hoveredHex: Hex | null;
  moveRangeHexes: Hex[];
  attackRangeHexes: Hex[];
  currentPlayer: Player | null;
  
  // Callbacki
  onHexClick: (hex: Hex) => void;
  onHexHover: (hex: Hex | null) => void;
  onCharacterClick: (character: Character) => void;
  
  // Tryb
  isMapBuilding: boolean;
  selectedTerrainType: HexType;
}

// ============================================
// KOMPONENT
// ============================================

export const HexCanvas: React.FC<HexCanvasProps> = ({
  map,
  characters,
  players,
  selectedCharacter,
  selectedHex,
  hoveredHex,
  moveRangeHexes,
  attackRangeHexes,
  currentPlayer,
  onHexClick,
  onHexHover,
  onCharacterClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // RYSOWANIE
  // ==========================================

  const drawHexagon = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    fillColor: string,
    strokeColor: string = '#000',
    lineWidth: number = 1
  ) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }, []);

  const drawCharacter = useCallback((
    ctx: CanvasRenderingContext2D,
    character: Character,
    player: Player,
    centerX: number,
    centerY: number,
    size: number,
    isSelected: boolean,
    isCurrentPlayer: boolean
  ) => {
    const charSize = size * 0.7;
    
    // Cień/aura
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, charSize + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
    
    if (isCurrentPlayer) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, charSize + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Postać (koło)
    ctx.beginPath();
    ctx.arc(centerX, centerY, charSize, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pasek HP
    const hpPercent = character.hp / character.maxHp;
    const barWidth = charSize * 1.5;
    const barHeight = 4;
    const barY = centerY + size * 0.8;
    
    // Tło paska
    ctx.fillStyle = '#333333';
    ctx.fillRect(centerX - barWidth / 2, barY, barWidth, barHeight);
    
    // HP
    ctx.fillStyle = hpPercent > 0.5 ? '#22C55E' : hpPercent > 0.25 ? '#EAB308' : '#EF4444';
    ctx.fillRect(centerX - barWidth / 2, barY, barWidth * hpPercent, barHeight);
    
    // Imię postaci
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character.name, centerX, centerY);
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Wyczyść canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Tło
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rysuj heksagony
    for (let q = 0; q < map.length; q++) {
      for (let r = 0; r < map[q].length; r++) {
        const hex = map[q][r];
        if (!hex) continue;

        const { x, y } = hexToPixel(hex, HEX_SIZE);
        
        // Pomijaj heksagony poza widocznym obszarem
        if (x < -HEX_SIZE || x > canvas.width + HEX_SIZE || y < -HEX_SIZE || y > canvas.height + HEX_SIZE) {
          continue;
        }

        // Kolor heksagonu
        let fillColor = HEX_COLORS[hex.type];
        let strokeColor = '#000000';
        let lineWidth = 1;

        // Zaznaczenie zasięgu ruchu
        const inMoveRange = moveRangeHexes.some(h => h.q === hex.q && h.r === hex.r);
        if (inMoveRange && selectedCharacter) {
          fillColor = 'rgba(34, 197, 94, 0.3)';
          strokeColor = '#22C55E';
          lineWidth = 2;
        }

        // Zaznaczenie zasięgu ataku
        const inAttackRange = attackRangeHexes.some(h => h.q === hex.q && h.r === hex.r);
        if (inAttackRange && selectedCharacter) {
          fillColor = 'rgba(239, 68, 68, 0.3)';
          strokeColor = '#EF4444';
          lineWidth = 2;
        }

        // Hovered hex
        if (hoveredHex && hoveredHex.q === hex.q && hoveredHex.r === hex.r) {
          strokeColor = '#FFFFFF';
          lineWidth = 2;
        }

        // Selected hex
        if (selectedHex && selectedHex.q === hex.q && selectedHex.r === hex.r) {
          strokeColor = '#FFFFFF';
          lineWidth = 3;
        }

        // Rysuj heksagon
        drawHexagon(ctx, x, y, HEX_SIZE, fillColor, strokeColor, lineWidth);
      }
    }

    // Rysuj postacie
    characters.forEach(character => {
      const player = players.find(p => p.id === character.playerId);
      if (!player) return;

      const { x, y } = hexToPixel(character.hex, HEX_SIZE);
      const isSelected = selectedCharacter?.id === character.id;
      const isCurrentPlayer = currentPlayer?.id === character.playerId;

      drawCharacter(
        ctx,
        character,
        player,
        x,
        y,
        HEX_SIZE,
        isSelected,
        isCurrentPlayer
      );
    });
  }, [
    map,
    characters,
    players,
    selectedCharacter,
    selectedHex,
    hoveredHex,
    moveRangeHexes,
    attackRangeHexes,
    currentPlayer,
    drawHexagon,
    drawCharacter,
  ]);

  // ==========================================
  // OBSŁUGA ZDARZEŃ
  // ==========================================

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedHex = pixelToHex(x, y, HEX_SIZE);

    // Sprawdź czy kliknięto w postać
    const character = getCharacterAtHex(clickedHex, characters);
    if (character) {
      onCharacterClick(character);
      return;
    }

    // Sprawdź czy heksagon jest w granicach mapy
    if (
      clickedHex.q >= 0 &&
      clickedHex.q < map.length &&
      clickedHex.r >= 0 &&
      clickedHex.r < map[0].length
    ) {
      onHexClick(clickedHex);
    }
  }, [map, characters, onCharacterClick, onHexClick]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hex = pixelToHex(x, y, HEX_SIZE);

    // Sprawdź czy heksagon jest w granicach
    if (
      hex.q >= 0 &&
      hex.q < map.length &&
      hex.r >= 0 &&
      hex.r < map[0].length
    ) {
      onHexHover(hex);
    } else {
      onHexHover(null);
    }
  }, [map, onHexHover]);

  const handleCanvasMouseLeave = useCallback(() => {
    onHexHover(null);
  }, [onHexHover]);

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      drawGrid();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawGrid]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />
    </div>
  );
};
