// Логика «Гномов и подарков» без DOM: доступность блоков, генерация уровней, проверка решаемости.
// Блок доступен, если он соседствует (по стороне) с пустой клеткой, связанной с краем поля.
// Мешок в ячейке отправляет гномов за доступными блоками своего цвета, пока его число не станет 0.
(function (root) {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function gridFromPicture(pic) {
    return pic.rows.map(r => [...r].map(ch => (ch === '.' ? null : ch)));
  }

  // Пустые клетки, связанные с краем (поле дополнено рамкой из пустоты).
  function outside(grid) {
    const H = grid.length, W = grid[0].length;
    const seen = Array.from({ length: H + 2 }, () => new Array(W + 2).fill(false));
    const empty = (x, y) => x < 0 || y < 0 || x >= W || y >= H || !grid[y][x];
    const stack = [[-1, -1]];
    seen[0][0] = true;
    while (stack.length) {
      const [x, y] = stack.pop();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (nx < -1 || ny < -1 || nx > W || ny > H || seen[ny + 1][nx + 1] || !empty(nx, ny)) continue;
        seen[ny + 1][nx + 1] = true;
        stack.push([nx, ny]);
      }
    }
    return (x, y) => seen[y + 1] && seen[y + 1][x + 1];
  }

  // Доступные блоки по цветам: { color: [[x, y], ...] }.
  function available(grid) {
    const out = outside(grid);
    const res = {};
    grid.forEach((row, y) => row.forEach((c, x) => {
      if (c && DIRS.some(([dx, dy]) => out(x + dx, y + dy))) (res[c] = res[c] || []).push([x, y]);
    }));
    return res;
  }

  // Слой очистки каждого блока: 0 — доступен сразу, 1 — после снятия слоя 0 и т. д.
  function peelLayers(pic) {
    const grid = gridFromPicture(pic);
    const layer = {};
    for (let k = 0; ; k++) {
      const av = Object.values(available(grid)).flat();
      if (!av.length) break;
      av.forEach(([x, y]) => { layer[x + ',' + y] = k; grid[y][x] = null; });
    }
    return layer;
  }

  // Правила уровня из главы: ячейки, колонки и наибольший размер плитки.
  // Первые два уровня — обучение: у них на одну ячейку больше.
  // Внутри главы порядок подарков постепенно перемешивается сильнее.
  function difficulty(L, chapter) {
    const k = L % 12;
    const top = chapter.maxTile;
    return {
      slots: chapter.slots + (L < 2 ? 1 : 0),
      queues: chapter.queues,
      jitter: Math.min(0.8 + Math.floor(L / 12) * 1.2 + k * 0.25, 7),
      sizes: [Math.round(top * 0.4), Math.round(top * 0.6), Math.round(top * 0.8), top].filter(n => n >= 8)
    };
  }

  function makeBags(pic, d, rnd) {
    const layer = peelLayers(pic);
    const byColor = {};
    pic.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== '.') (byColor[ch] = byColor[ch] || []).push(layer[x + ',' + y]);
    }));
    const bags = [];
    Object.entries(byColor).forEach(([color, layers]) => {
      layers.sort((a, b) => a - b);
      let i = 0;
      while (i < layers.length) {
        // не оставляем крошечных остатков и не превышаем наибольшую плитку главы
        const left = layers.length - i, top = Math.max(...d.sizes);
        let n = d.sizes[Math.floor(rnd() * d.sizes.length)];
        if (left <= n) n = left;
        else if (left - n < 6) n = left <= top ? left : Math.ceil(left / 2);
        const part = layers.slice(i, i + n);
        bags.push({ color, n, key: part.reduce((a, b) => a + b, 0) / part.length });
        i += n;
      }
    });
    return bags;
  }

  // Упрощённая модель партии: мешок в ячейке сразу забирает все доступные блоки своего цвета.
  // Это честно, потому что блоки только исчезают, а доступность от этого лишь растёт.
  function createState(level) {
    return {
      grid: gridFromPicture(level.pic),
      queues: level.queues.map(q => q.map(b => ({ ...b }))),
      slots: Array(level.slots).fill(null)
    };
  }

  function settle(st) {
    let changed = true;
    while (changed) {
      changed = false;
      const av = available(st.grid);
      st.slots.forEach((bag, i) => {
        if (!bag) return;
        const list = av[bag.color] || [];
        while (bag.n > 0 && list.length) {
          const [x, y] = list.pop();
          if (!st.grid[y][x]) continue;
          st.grid[y][x] = null; bag.n--; changed = true;
        }
        if (bag.n === 0) { st.slots[i] = null; changed = true; }
      });
    }
  }

  function solved(st) { return st.grid.every(r => r.every(c => !c)); }

  // Жадный игрок: берёт передний мешок, для которого сейчас больше всего доступных блоков.
  function autoPlay(level) {
    const st = createState(level);
    for (let guard = 0; guard < 500; guard++) {
      settle(st);
      if (solved(st)) return true;
      const free = st.slots.indexOf(null);
      if (free < 0) return false;
      const av = available(st.grid);
      let best = -1, score = -1;
      st.queues.forEach((q, i) => {
        if (!q.length) return;
        const s = Math.min(q[0].n, (av[q[0].color] || []).length);
        if (s > score) { score = s; best = i; }
      });
      if (best < 0) return false;
      st.slots[free] = st.queues[best].shift();
    }
    return false;
  }

  function buildLevel(pic, L, chapter) {
    const d = difficulty(L, chapter);
    for (let attempt = 0; attempt < 80; attempt++) {
      const rnd = mulberry32(L * 7919 + 77 + attempt * 104729);
      const bags = makeBags(pic, d, rnd)
        .map(b => ({ ...b, sort: b.key + rnd() * d.jitter }))
        .sort((a, b) => a.sort - b.sort);
      const queues = Array.from({ length: d.queues }, () => []);
      bags.forEach((b, i) => queues[i % d.queues].push({ color: b.color, n: b.n }));
      const level = { pic, queues, slots: d.slots };
      if (autoPlay(level)) return level;
    }
    // запасной вариант: строгий порядок по слоям
    const bags = makeBags(pic, d, mulberry32(L + 5)).sort((a, b) => a.key - b.key);
    const queues = Array.from({ length: d.queues }, () => []);
    bags.forEach((b, i) => queues[i % d.queues].push({ color: b.color, n: b.n }));
    return { pic, queues, slots: d.slots };
  }

  const api = { buildLevel, autoPlay, available, outside, gridFromPicture, difficulty };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(this);
