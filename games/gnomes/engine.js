// Движок «Гномов Деда Мороза»: чистая логика без DOM, общая для игры и тестов.
// Отряды гномов бегут по кольцу вокруг картинки. С каждой клетки кольца отряд
// смотрит вдоль ряда или столбца и уносит первый блок, если тот его цвета.
(function (root) {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SPACING = 3; // минимальная дистанция между отрядами на старте

  // Кольцо против часовой стрелки, начиная с левого нижнего угла.
  function buildRing(W, H) {
    const ring = [{ x: -1, y: H, dir: null }];
    for (let x = 0; x < W; x++) ring.push({ x, y: H, dir: 'up' });
    ring.push({ x: W, y: H, dir: null });
    for (let y = H - 1; y >= 0; y--) ring.push({ x: W, y, dir: 'left' });
    ring.push({ x: W, y: -1, dir: null });
    for (let x = W - 1; x >= 0; x--) ring.push({ x, y: -1, dir: 'down' });
    ring.push({ x: -1, y: -1, dir: null });
    for (let y = 0; y < H; y++) ring.push({ x: -1, y, dir: 'right' });
    return ring;
  }

  function firstInLine(grid, W, H, cell) {
    const { x, y, dir } = cell;
    if (dir === 'up') { for (let j = H - 1; j >= 0; j--) if (grid[j][x]) return { x, y: j }; }
    else if (dir === 'down') { for (let j = 0; j < H; j++) if (grid[j][x]) return { x, y: j }; }
    else if (dir === 'left') { for (let i = W - 1; i >= 0; i--) if (grid[y][i]) return { x: i, y }; }
    else if (dir === 'right') { for (let i = 0; i < W; i++) if (grid[y][i]) return { x: i, y }; }
    return null;
  }

  // Блоки, видимые хотя бы с одной стороны: { color: Set("x,y") }.
  function exposed(grid, W, H) {
    const out = {};
    const add = p => { if (!p) return; const c = grid[p.y][p.x]; (out[c] = out[c] || new Set()).add(p.x + ',' + p.y); };
    for (let x = 0; x < W; x++) { add(firstInLine(grid, W, H, { x, dir: 'up' })); add(firstInLine(grid, W, H, { x, dir: 'down' })); }
    for (let y = 0; y < H; y++) { add(firstInLine(grid, W, H, { y, dir: 'left' })); add(firstInLine(grid, W, H, { y, dir: 'right' })); }
    return out;
  }

  function gridFromPicture(pic) {
    return pic.rows.map(r => [...r].map(ch => (ch === '.' ? null : ch)));
  }

  // ---------- состояние игры ----------
  function createGame(level) {
    const grid = gridFromPicture(level.pic);
    const W = level.pic.w, H = level.pic.h;
    let uid = 0;
    return {
      W, H, grid, ring: buildRing(W, H),
      queues: level.queues.map(q => q.map(s => ({ id: ++uid, color: s.color, n: s.n }))),
      slots: Array(level.slots).fill(null),
      conveyor: [], pending: [], cap: level.cap,
      left: grid.flat().filter(Boolean).length,
      status: 'play', tick: 0, events: []
    };
  }

  function onBoard(st) { return st.conveyor.length + st.pending.length; }

  function launchFromQueue(st, qi) {
    const q = st.queues[qi];
    if (st.status !== 'play' || !q || !q.length || onBoard(st) >= st.cap) return false;
    st.pending.push(q.shift());
    return true;
  }

  function launchFromSlot(st, si) {
    const s = st.slots[si];
    if (st.status !== 'play' || !s || onBoard(st) >= st.cap) return false;
    st.slots[si] = null;
    st.pending.push(s);
    return true;
  }

  function addSlot(st) { st.slots.push(null); }

  function step(st) {
    if (st.status !== 'play') return;
    st.tick++;
    st.events = [];
    const P = st.ring.length;

    for (const sq of st.conveyor) { sq.prev = sq.pos; sq.pos++; }

    // новый отряд выходит на кольцо, если старт свободен
    if (st.pending.length && !st.conveyor.some(s => s.pos < SPACING)) {
      const sq = st.pending.shift();
      sq.pos = 0; sq.prev = 0;
      st.conveyor.push(sq);
    }

    const still = [];
    for (const sq of st.conveyor) {
      if (sq.pos >= P) {
        const free = st.slots.indexOf(null);
        if (free < 0) {
          st.status = 'lose';
          st.events.push({ type: 'overflow', squad: sq });
          still.push(sq);
          continue;
        }
        st.slots[free] = sq;
        st.events.push({ type: 'parked', squad: sq, slot: free });
        continue;
      }
      const cell = st.ring[sq.pos];
      if (cell.dir && sq.n > 0) {
        const p = firstInLine(st.grid, st.W, st.H, cell);
        if (p && st.grid[p.y][p.x] === sq.color) {
          st.grid[p.y][p.x] = null;
          sq.n--; st.left--;
          st.events.push({ type: 'eat', x: p.x, y: p.y, color: sq.color, squad: sq });
        }
      }
      if (sq.n === 0) { st.events.push({ type: 'done', squad: sq }); continue; }
      still.push(sq);
    }
    st.conveyor = still;
    if (st.left === 0) st.status = 'win';
  }

  // ---------- генерация уровней ----------
  function difficulty(L) {
    return {
      cap: 4,
      slots: L < 8 ? 5 : 4,
      queues: Math.min(2 + Math.floor(L / 4), 4),
      jitter: Math.min(0.3 + L * 0.15, 2.5),
      sizes: L < 3 ? [20] : L < 8 ? [10, 15, 20] : [6, 8, 10, 12, 15, 20]
    };
  }

  // Слой «очистки» каждого блока: 0 — виден сразу, 1 — после снятия слоя 0, ...
  function peelLayers(pic) {
    const grid = gridFromPicture(pic);
    const W = pic.w, H = pic.h;
    const layer = {};
    let k = 0;
    for (;;) {
      const ex = exposed(grid, W, H);
      const cells = Object.values(ex).flatMap(s => [...s]);
      if (!cells.length) break;
      cells.forEach(key => {
        layer[key] = k;
        const [x, y] = key.split(',').map(Number);
        grid[y][x] = null;
      });
      k++;
    }
    return layer;
  }

  function makeSquads(pic, d, rnd) {
    const layer = peelLayers(pic);
    const byColor = {};
    pic.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== '.') (byColor[ch] = byColor[ch] || []).push(layer[x + ',' + y]);
    }));
    const squads = [];
    Object.entries(byColor).forEach(([color, layers]) => {
      layers.sort((a, b) => a - b);
      let i = 0;
      while (i < layers.length) {
        let n = d.sizes[Math.floor(rnd() * d.sizes.length)];
        if (layers.length - i - n < 4) n = layers.length - i; // без крошечных остатков
        const part = layers.slice(i, i + n);
        squads.push({ color, n, key: part.reduce((a, b) => a + b, 0) / part.length });
        i += n;
      }
    });
    return squads;
  }

  // Жадный игрок: запускает отряд, который сейчас может унести больше всего.
  function autoPlay(level, maxTicks = 20000) {
    const st = createGame(level);
    while (st.status === 'play' && st.tick < maxTicks) {
      if (onBoard(st) < st.cap) {
        const ex = exposed(st.grid, st.W, st.H);
        const vis = c => (ex[c] ? ex[c].size : 0);
        const reserved = {};
        [...st.conveyor, ...st.pending].forEach(s => { reserved[s.color] = (reserved[s.color] || 0) + s.n; });
        const freeSlots = st.slots.filter(s => !s).length;
        let best = null;
        st.slots.forEach((s, i) => {
          if (!s) return;
          const score = Math.min(s.n, vis(s.color) - (reserved[s.color] || 0)) + 0.5;
          if (score > 0.5 && (!best || score > best.score)) best = { score, act: () => launchFromSlot(st, i) };
        });
        st.queues.forEach((q, i) => {
          if (!q.length) return;
          const s = q[0];
          const avail = vis(s.color) - (reserved[s.color] || 0);
          const score = Math.min(s.n, avail);
          // не берём отряд, который точно вернётся, если ставить его некуда
          if (score > 0 && (freeSlots > 1 || avail >= s.n) && (!best || score > best.score)) best = { score, act: () => launchFromQueue(st, i) };
        });
        if (best) best.act();
        else if (!st.conveyor.length && !st.pending.length) {
          // ничего полезного: запускаем любой отряд, чтобы не застрять
          const qi = st.queues.findIndex(q => q.length);
          const si = st.slots.findIndex(Boolean);
          if (si >= 0) launchFromSlot(st, si);
          else if (qi >= 0) launchFromQueue(st, qi);
          else break;
        }
      }
      step(st);
    }
    return st;
  }

  function buildLevel(pic, L) {
    const d = difficulty(L);
    for (let attempt = 0; attempt < 60; attempt++) {
      const rnd = mulberry32(L * 7919 + 101 + attempt * 31337);
      const squads = makeSquads(pic, d, rnd)
        .map(s => ({ ...s, sort: s.key + rnd() * d.jitter }))
        .sort((a, b) => a.sort - b.sort);
      const queues = Array.from({ length: d.queues }, () => []);
      squads.forEach((s, i) => queues[i % d.queues].push({ color: s.color, n: s.n }));
      const level = { pic, queues, slots: d.slots, cap: d.cap };
      if (autoPlay(level).status === 'win') return level;
    }
    // запасной вариант: строгий порядок по слоям и лишний слот
    const rnd = mulberry32(L + 1);
    const squads = makeSquads(pic, d, rnd).sort((a, b) => a.key - b.key);
    return { pic, queues: [squads.map(s => ({ color: s.color, n: s.n }))], slots: d.slots + 1, cap: d.cap };
  }

  const api = { createGame, step, launchFromQueue, launchFromSlot, addSlot, buildLevel, autoPlay, exposed, onBoard, difficulty };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(this);
