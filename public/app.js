// ======================================================
//  HeksaDnD – Edytor + Gra turowa z animacjami (Część 1)
// ======================================================

// ===== USTAWIENIA PODSTAWOWE =====
const HEX_SIZE = 28;
let mapData = new Map(); // key: JSON.stringify({q,r}) -> { terrain }
let mapWidth = 12, mapHeight = 10;
let selectedTerrain = 'stones';
let isPainting = false;
let eraseMode = false;

// ===== KONVA: STAGE + WARSTWY =====
const parent = document.getElementById('stage-parent');
function getParentSize() {
  return { w: parent.clientWidth || window.innerWidth, h: parent.clientHeight || window.innerHeight };
}
const size = getParentSize();
const stage = new Konva.Stage({ container: 'stage-parent', width: size.w, height: size.h });

// TRZY WARSTWY (kolejność jest krytyczna!)
const terrainLayer = new Konva.Layer();     // heksy mapy
const highlightLayer = new Konva.Layer();   // podświetlenia ruchu/ataku
const unitsLayer = new Konva.Layer();  

highlightLayer.listening(false);

// jednostki + animacje

stage.add(terrainLayer);
stage.add(highlightLayer);
stage.add(unitsLayer);


// ===== HEX MATH (pointy-top, axial q,r) =====
function hexToPixel(q, r, size = HEX_SIZE) {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * 3 / 2 * r;
  return { x, y };
}

function pixelToHex(x, y, size = HEX_SIZE) {
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  return hexRound(q, r);
}

function hexRound(qf, rf) {
  const xf = qf, zf = rf, yf = -xf - zf;
  let rx = Math.round(xf), ry = Math.round(yf), rz = Math.round(zf);
  const x_diff = Math.abs(rx - xf), y_diff = Math.abs(ry - yf), z_diff = Math.abs(rz - zf);

  if (x_diff > y_diff && x_diff > z_diff) rx = -ry - rz;
  else if (y_diff > z_diff) ry = -rx - rz;
  else rz = -rx - ry;

  return { q: rx, r: rz };
}

// ===== RYSOWANIE POJEDYNCZEGO HEXA =====
function drawHex(cx, cy, size = HEX_SIZE, fill = '#eee', stroke = '#999') {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    points.push(cx + size * Math.cos(angle));
    points.push(cy + size * Math.sin(angle));
  }
  return new Konva.Line({ points, closed: true, fill, stroke, strokeWidth: 1 });
}

// ===== KOLORY TERENU =====
const terrainColor = {
  none: '#e8e8e8',
  stones: '#bfbfbf',
  mud: '#8b5a2b',
  wall: '#333333'
};

// ===== TEREN – KOSZTY RUCHU =====
const terrainCost = {
  none: Infinity,  // pustka = śmierć
  stones: 1,       // normalny teren
  mud: 2,          // błoto = koszt 2
  wall: Infinity   // ściana = nieprzechodnia
};

const MOVE_POINTS = 1;
const ATTACKS_PER_TURN = 1;
// ===== GENEROWANIE KSZTAŁTÓW MAPY =====
function generateShape(shape, w, h) {
  const coords = [];
  if (shape === 'empty') return coords;

  if (shape === 'rectangle') {
    for (let r = 0; r < h; r++) {
      const r_offset = Math.floor(r / 2);
      for (let q = -r_offset; q < w - r_offset; q++) {
        coords.push({ q, r });
      }
    }
    return coords;
  }

  if (shape === 'diamond') {
    const radius = Math.max(w, h);
    for (let q = -radius; q <= radius; q++) {
      for (let r = -radius; r <= radius; r++) {
        if (Math.abs(q + r) <= radius) coords.push({ q, r });
      }
    }
    return coords;
  }

  if (shape === 'hexagon') {
    const radius = Math.floor(Math.min(w, h) / 2) || 1;
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
        coords.push({ q, r });
      }
    }
    return coords;
  }

  return coords;
}

// ===== OFFSETY DO CENTROWANIA MAPY =====
function computeOffsetsForRender() {
  const keys = Array.from(mapData.keys());
  if (keys.length === 0) return { offsetX: 0, offsetY: 0 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const key of keys) {
    const { q, r } = JSON.parse(key);
    const p = hexToPixel(q, r);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const mapW = maxX - minX + HEX_SIZE * 2;
  const mapH = maxY - minY + HEX_SIZE * 2;
  const offsetX = (stage.width() - mapW) / 2 - minX + HEX_SIZE;
  const offsetY = (stage.height() - mapH) / 2 - minY + HEX_SIZE;

  return { offsetX, offsetY };
}

// ===== RENDER MAPY (TEREN + JEDNOSTKI + CZYŚCZENIE HIGHLIGHTÓW) =====
function renderMap() {
  terrainLayer.destroyChildren();
  highlightLayer.destroyChildren();

  const keys = Array.from(mapData.keys());
  if (keys.length === 0) {
    terrainLayer.draw();
    highlightLayer.draw();
    unitsLayer.draw();
    return;
  }

  const offs = computeOffsetsForRender();

  for (const [key, cell] of mapData.entries()) {
    const { q, r } = JSON.parse(key);
    const p = hexToPixel(q, r);
    const hex = drawHex(
      p.x + offs.offsetX,
      p.y + offs.offsetY,
      HEX_SIZE,
      terrainColor[cell.terrain] || terrainColor.none,
      '#999'
    );
    hex._hex = { q, r };

    hex.on('mousedown touchstart', () => {
      if (gameMode === 'edit') {
        paintAt(q, r);
      } else if (gameMode === 'play') {
        handleMoveClick(q, r);
      }
    });

    hex.on('mouseenter', () => { document.body.style.cursor = 'pointer'; });
    hex.on('mouseleave', () => { document.body.style.cursor = 'default'; });

    terrainLayer.add(hex);
  }

  terrainLayer.draw();
  renderUnits();
}

// ===== MALOWANIE TERENU =====
function paintAt(q, r) {
  const key = JSON.stringify({ q, r });
  if (!mapData.has(key)) return;

  if (eraseMode || selectedTerrain === 'none') {
    mapData.set(key, { terrain: 'stones' });
  } else {
    mapData.set(key, { terrain: selectedTerrain });
  }

  renderMap();
}

// ===== HANDLERY EDYTORA (MYSZ) =====
stage.on('contentMousedown contentTouchstart', () => {
  if (gameMode !== 'edit') return;
  isPainting = true;

  const pos = stage.getPointerPosition();
  if (!pos) return;

  const offs = computeOffsetsForRender();
  const px = pos.x - offs.offsetX;
  const py = pos.y - offs.offsetY;
  const { q, r } = pixelToHex(px, py);

  paintAt(q, r);
});

stage.on('contentMouseup contentTouchend', () => {
  isPainting = false;
});

stage.on('contentMousemove contentTouchmove', () => {
  if (gameMode !== 'edit') return;
  if (!isPainting) return;

  const pos = stage.getPointerPosition();
  if (!pos) return;

  const offs = computeOffsetsForRender();
  const px = pos.x - offs.offsetX;
  const py = pos.y - offs.offsetY;
  const { q, r } = pixelToHex(px, py);

  paintAt(q, r);
});

stage.on('contentContextmenu', (e) => {
  if (gameMode !== 'edit') return;
  e.evt.preventDefault();

  eraseMode = true;
  const pos = stage.getPointerPosition();
  if (!pos) { eraseMode = false; return; }

  const offs = computeOffsetsForRender();
  const px = pos.x - offs.offsetX;
  const py = pos.y - offs.offsetY;
  const { q, r } = pixelToHex(px, py);

  paintAt(q, r);
  eraseMode = false;
});

// ===== UI EDYTORA =====
document.querySelectorAll('.terrain-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.terrain-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTerrain = btn.dataset.terrain;
  });
});

const createMapBtn = document.getElementById('create-map');
if (createMapBtn) {
  createMapBtn.addEventListener('click', () => {
    const shape = document.getElementById('shape-select').value;
    mapWidth = parseInt(document.getElementById('map-w').value, 10);
    mapHeight = parseInt(document.getElementById('map-h').value, 10);
    createMap(shape, mapWidth, mapHeight);
  });
}

const exportBtn = document.getElementById('export-json');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const obj = { cells: Array.from(mapData.entries()) };
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

const importInput = document.getElementById('import-file');
if (importInput) {
  importInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        mapData = new Map(obj.cells);
        renderMap();
      } catch (err) {
        alert('Błąd importu JSON');
      }
    };
    reader.readAsText(f);
  });
}

function createMap(shape, w, h) {
  mapData.clear();
  const coords = generateShape(shape, w, h);

  for (const c of coords) {
    const key = JSON.stringify({ q: c.q, r: c.r });
    mapData.set(key, { terrain: 'none' });
  }

  const sizeLabel = document.getElementById('map-size');
  if (sizeLabel) sizeLabel.textContent = `${w} x ${h}`;

  renderMap();
}

// ======================================================
//                LOGIKA GRY TUROWEJ
// ======================================================

let gameMode = 'edit';

const players = [
  { id: 1, name: 'Gracz 1', color: '#ff5555', type: 'melee' },
  { id: 2, name: 'Gracz 2', color: '#5555ff', type: 'ranged' },
];

let currentPlayerIndex = 0;
let units = [];
let selectedUnitId = null;
let movesLeft = MOVE_POINTS;
let attacksLeft = ATTACKS_PER_TURN;

// ===== HEX DIST, D20, HELPERY =====
function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -a.q - a.r - (-b.q - b.r);
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function getUnitAt(q, r) {
  return units.find(u => u.q === q && u.r === r);
}

function isWalkable(q, r) {
  const key = JSON.stringify({ q, r });
  const cell = mapData.get(key);
  if (!cell) return false;
  if (terrainCost[cell.terrain] === Infinity) return false;
  if (getUnitAt(q, r)) return false;
  return true;
}

// ===== BFS – ZASIĘG RUCHU =====
function getReachableTiles(unit) {
  const visited = new Map();
  const queue = [{
    q: unit.q,
    r: unit.r,
    cost: 0,
    slowed: false
  }];

  visited.set(JSON.stringify({ q: unit.q, r: unit.r }), { cost: 0, slowed: false });

  const dirs = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];

  while (queue.length > 0) {
    const cur = queue.shift();

    for (const d of dirs) {
      const nq = cur.q + d.q;
      const nr = cur.r + d.r;
      const key = JSON.stringify({ q: nq, r: nr });

      const cell = mapData.get(key);
      if (!cell || cell.terrain === 'none' || cell.terrain === 'wall') continue;

      let stepCost = 1;
      let nextSlowed = cur.slowed;

      if (cell.terrain === 'mud') {
        stepCost = 2;
        nextSlowed = true;
      } else if (cur.slowed) {
        stepCost = 2;
      }

      const newCost = cur.cost + stepCost;
      if (newCost > MOVE_POINTS) continue;

      const prev = visited.get(key);
      if (!prev || prev.cost > newCost) {
        visited.set(key, { cost: newCost, slowed: nextSlowed });
        queue.push({ q: nq, r: nr, cost: newCost, slowed: nextSlowed });
      }
    }
  }

  return visited;
}



// ===== PODŚWIETLANIE RUCHU =====
function highlightMovement(unit) {
  highlightLayer.destroyChildren();

  const reachable = getReachableTiles(unit);
  const offs = computeOffsetsForRender();

  for (const [key, cost] of reachable.entries()) {
    const { q, r } = JSON.parse(key);
    const { x, y } = hexToPixel(q, r);
    const hex = drawHex(
      x + offs.offsetX,
      y + offs.offsetY,
      HEX_SIZE,
      'rgba(0,255,0,0.25)',
      '#0f0'
    );
    highlightLayer.add(hex);
  }

  highlightLayer.draw();
}

// ===== PODŚWIETLANIE ATAKU =====
function highlightAttack(unit) {
  const offs = computeOffsetsForRender();

  for (const enemy of units) {
    if (enemy.playerId === unit.playerId) continue;

    const dist = hexDistance(unit, enemy);
    const isRanged = players.find(p => p.id === unit.playerId).type === 'ranged';

    if ((!isRanged && dist === 1) || (isRanged && dist >= 2 && dist <= 4)) {
      const { x, y } = hexToPixel(enemy.q, enemy.r);
      const hex = drawHex(
        x + offs.offsetX,
        y + offs.offsetY,
        HEX_SIZE,
        'rgba(255,0,0,0.25)',
        '#f00'
      );
      highlightLayer.add(hex);
    }
  }

  highlightLayer.draw();
}

// ===== RYSOWANIE JEDNOSTEK + ANIMACJE =====
function renderUnits() {
  unitsLayer.destroyChildren();

  const offs = computeOffsetsForRender();

  for (const unit of units) {
    const { x, y } = hexToPixel(unit.q, unit.r);
    const cx = x + offs.offsetX;
    const cy = y + offs.offsetY;
    const radius = HEX_SIZE * 0.5;

    const circle = new Konva.Circle({
      x: cx,
      y: cy,
      radius,
      fill: unit.color,
      stroke: (unit.id === selectedUnitId) ? '#000' : '#222',
      strokeWidth: (unit.id === selectedUnitId) ? 3 : 1
    });

    circle._unitId = unit.id;

    circle.on('mousedown touchstart', () => {
      if (gameMode !== 'play') return;

      const currentPlayer = players[currentPlayerIndex];

      if (unit.playerId !== currentPlayer.id) {
        if (selectedUnitId != null) {
          const attacker = units.find(u => u.id === selectedUnitId);
          if (!attacker) return;
          handleAttack(attacker, unit);
        }
        return;
      }

      selectedUnitId = unit.id;
      renderMap();
      highlightMovement(unit);
      highlightAttack(unit);
      updateGameInfo();
    });

    unitsLayer.add(circle);
  }

  unitsLayer.draw();
}

// ===== ANIMOWANY RUCH JEDNOSTKI =====
function animateUnitMove(unit, targetQ, targetR, onFinish) {
  const offs = computeOffsetsForRender();
  const { x: sx, y: sy } = hexToPixel(unit.q, unit.r);
  const { x: tx, y: ty } = hexToPixel(targetQ, targetR);

  const startX = sx + offs.offsetX;
  const startY = sy + offs.offsetY;
  const endX = tx + offs.offsetX;
  const endY = ty + offs.offsetY;

  const circle = unitsLayer.find(node => node._unitId === unit.id)[0];
  if (!circle) {
    // fallback: bez animacji
    unit.q = targetQ;
    unit.r = targetR;
    renderMap();
    if (onFinish) onFinish();
    return;
  }

  const tween = new Konva.Tween({
    node: circle,
    x: endX,
    y: endY,
    duration: 0.25,
    onFinish: () => {
      unit.q = targetQ;
      unit.r = targetR;
      renderMap();
      if (onFinish) onFinish();
    }
  });

  tween.play();
}

// ===== RUCH (Z KOSZTAMI I ŚMIERCIĄ NA PUSTCE) =====
function handleMoveClick(q, r) {
  if (selectedUnitId == null) return;

  const unit = units.find(u => u.id === selectedUnitId);
  if (!unit) return;

  const reachable = getReachableTiles(unit);
  const key = JSON.stringify({ q, r });

  if (!reachable.has(key)) return; // nie możesz tam wejść

  movesLeft = 0;

  animateUnitMove(unit, q, r, () => {
    highlightMovement(unit);
    highlightAttack(unit);
    updateGameInfo();
  });
}



// ===== ATAK =====
function handleAttack(attacker, defender) {
  if (attacksLeft <= 0) return;
  attacksLeft--;

  const attackerPlayer = players.find(p => p.id === attacker.playerId);
  const isRanged = attackerPlayer.type === 'ranged';
  const dist = hexDistance(attacker, defender);

  if (!isRanged && dist !== 1) return;
  if (isRanged && (dist < 2 || dist > 4)) return;

  const attackRoll = rollD20();
  const defenseRoll = rollD20();

  let log = `${attackerPlayer.name} atakuje (ruch: ${attackRoll}) vs obrona (${defenseRoll}) → `;

  if (attackRoll <= defenseRoll) {
    log += 'chybienie.';
    showFloatingLog(log);
    updateGameInfo(log);
    return;
  }

  let damage = (attackRoll - defenseRoll) + 3;
  if (damage < 1) damage = 1;

  defender.hp -= damage;
  log += `trafienie za ${damage} obrażeń. HP celu: ${Math.max(defender.hp, 0)}`;
  showFloatingLog(log);

  if (defender.hp <= 0) {
    units = units.filter(u => u.id !== defender.id);
    if (selectedUnitId === defender.id) selectedUnitId = null;
  }

  renderMap();
  highlightMovement(attacker);
  highlightAttack(attacker);
  updateGameInfo(log);
}

// ===== INFO O GRZE =====
function updateGameInfo(extraText) {
  const el = document.getElementById('game-info');
  if (!el) return;

  const currentPlayer = players[currentPlayerIndex];
  let txt = `Tryb: ${gameMode === 'edit' ? 'Edycja' : 'Gra'} | Tura: ${currentPlayer.name}`;
  txt += ` | Ruchy: ${movesLeft}/${MOVE_POINTS} | Ataki: ${attacksLeft}/${ATTACKS_PER_TURN}`;

  if (selectedUnitId != null) {
    const u = units.find(u => u.id === selectedUnitId);
    if (u) txt += ` | Jednostka: P${u.playerId}, HP: ${u.hp}`;
  }

  if (extraText) txt += `\n${extraText}`;
  el.textContent = txt;
}

function showFloatingLog(text) {
  console.log(text);
}

// ===== SPAWN JEDNOSTEK =====
function spawnUnitsOnMap() {
  units = [];
  let idCounter = 1;

  const cells = Array.from(mapData.keys()).map(k => JSON.parse(k));
  if (cells.length === 0) return;

  const minR = Math.min(...cells.map(c => c.r));
  const maxR = Math.max(...cells.map(c => c.r));
  const usedPositions = new Set();

  function placeForPlayer(player, rowR) {
    const rowCells = cells
      .filter(c => c.r === rowR)
      .filter(c => {
        const key = JSON.stringify({ q: c.q, r: c.r });
        const cell = mapData.get(key);
        return cell && cell.terrain !== 'none' && cell.terrain !== 'wall';
    })
    .sort((a, b) => a.q - b.q);


    const midIndex = Math.floor(rowCells.length / 2);
    const pos = rowCells[midIndex];
    const key = JSON.stringify(pos);

    if (usedPositions.has(key)) return;
    usedPositions.add(key);

    units.push({
      id: idCounter++,
      playerId: player.id,
      q: pos.q,
      r: pos.r,
      hp: 20,
      type: player.type,
      color: player.color
    });
  }

  if (players[0]) placeForPlayer(players[0], minR);
  if (players[1]) placeForPlayer(players[1], maxR);

  renderMap();
}

// ===== UI GRY =====
const startGameBtn = document.getElementById('start-game');
if (startGameBtn) {
  startGameBtn.addEventListener('click', () => {
    if (gameMode === 'play') return;

    gameMode = 'play';
    currentPlayerIndex = 0;
    selectedUnitId = null;
    movesLeft = MOVE_POINTS;
    attacksLeft = ATTACKS_PER_TURN;

    spawnUnitsOnMap();
    updateGameInfo('Gra rozpoczęta.');
  });
}

const endTurnBtn = document.getElementById('end-turn');
if (endTurnBtn) {
  endTurnBtn.addEventListener('click', () => {
    if (gameMode !== 'play') return;

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    selectedUnitId = null;
    movesLeft = MOVE_POINTS;
    attacksLeft = ATTACKS_PER_TURN;

    renderMap();
    updateGameInfo('Kolejna tura.');
  });
}

// ===== INIT =====
createMap('rectangle', mapWidth, mapHeight);

window.addEventListener('resize', () => {
  const s = getParentSize();
  stage.width(s.w);
  stage.height(s.h);
  renderMap();
});

updateGameInfo();
console.log('Edytor + gra heksowa z animacjami uruchomione.');
