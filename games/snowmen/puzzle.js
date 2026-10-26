// Генератор и решатель задач «Снеговичков» (правила как у «Королев»):
// по одному снеговику в каждой строке, столбце и цветном дворике,
// снеговики не касаются друг друга даже по диагонали.
(function (root) {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Случайная расстановка: столбец снеговика для каждой строки.
  function randomPlacement(N, rnd) {
    const cols = [];
    const used = new Array(N).fill(false);
    function go(r) {
      if (r === N) return true;
      for (const c of shuffle([...Array(N).keys()], rnd)) {
        if (used[c] || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
        used[c] = true; cols[r] = c;
        if (go(r + 1)) return true;
        used[c] = false;
      }
      return false;
    }
    return go(0) ? cols : null;
  }

  // Дворики растут из клеток снеговиков, пока не заполнят поле.
  function growRegions(N, placement, rnd) {
    const reg = Array.from({ length: N }, () => new Array(N).fill(-1));
    placement.forEach((c, r) => { reg[r][c] = r; });
    let left = N * N - N;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (left > 0) {
      const id = Math.floor(rnd() * N);
      const frontier = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (reg[r][c] !== id) continue;
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N && reg[nr][nc] === -1) frontier.push([nr, nc]);
        }
      }
      if (!frontier.length) continue;
      const [fr, fc] = frontier[Math.floor(rnd() * frontier.length)];
      reg[fr][fc] = id;
      left--;
    }
    return reg;
  }

  // Решения задачи (не больше limit штук).
  function solve(N, reg, limit = 2) {
    const found = [];
    const cols = [];
    const colUsed = new Array(N).fill(false);
    const regUsed = new Array(N).fill(false);
    function go(r) {
      if (found.length >= limit) return;
      if (r === N) { found.push(cols.slice()); return; }
      for (let c = 0; c < N; c++) {
        const g = reg[r][c];
        if (colUsed[c] || regUsed[g] || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
        colUsed[c] = regUsed[g] = true; cols[r] = c;
        go(r + 1);
        colUsed[c] = regUsed[g] = false;
      }
    }
    go(0);
    return found;
  }

  function countSolutions(N, reg, limit = 2) { return solve(N, reg, limit).length; }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function connected(N, reg, id) {
    let start = null, total = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (reg[r][c] === id) { total++; start = start || [r, c]; }
    if (!start) return false;
    const seen = new Set([start.join()]);
    const stack = [start];
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc, k = nr + ',' + nc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && reg[nr][nc] === id && !seen.has(k)) { seen.add(k); stack.push([nr, nc]); }
      }
    }
    return seen.size === total;
  }

  // Убираем лишние решения: клетку из чужого решения переводим в соседний дворик.
  function repair(N, reg, placement, rnd, steps) {
    const isQueen = (r, c) => placement[r] === c;
    let count = countSolutions(N, reg, 50);
    for (let i = 0; i < steps && count > 1; i++) {
      const sols = solve(N, reg, 2).filter(s => s.some((c, r) => c !== placement[r]));
      if (!sols.length) break;
      const alt = sols[Math.floor(rnd() * sols.length)];
      const cells = alt.map((c, r) => [r, c]).filter(([r, c]) => !isQueen(r, c));
      const [r, c] = cells[Math.floor(rnd() * cells.length)];
      const from = reg[r][c];
      const targets = DIRS.map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) => nr >= 0 && nr < N && nc >= 0 && nc < N && reg[nr][nc] !== from)
        .map(([nr, nc]) => reg[nr][nc]);
      if (!targets.length) continue;
      reg[r][c] = targets[Math.floor(rnd() * targets.length)];
      const next = connected(N, reg, from) ? countSolutions(N, reg, 50) : Infinity;
      if (next <= count) count = next;
      else reg[r][c] = from;
    }
    return count === 1;
  }

  function generate(N, seed) {
    const rnd = mulberry32(seed);
    for (let attempt = 0; attempt < 200; attempt++) {
      const placement = randomPlacement(N, rnd);
      const regions = growRegions(N, placement, rnd);
      if (repair(N, regions, placement, rnd, 400)) return { N, regions, solution: placement };
    }
    throw new Error('no unique puzzle for N=' + N);
  }

  function sizeForLevel(L) {
    return L < 3 ? 5 : L < 10 ? 6 : L < 20 ? 7 : L < 35 ? 8 : 9;
  }

  function levelPuzzle(L) { return generate(sizeForLevel(L), L * 7919 + 17); }

  function dailyPuzzle(date) {
    const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    return generate(7, key);
  }

  const api = { generate, countSolutions, levelPuzzle, dailyPuzzle, sizeForLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Puzzle = api;
})(this);
