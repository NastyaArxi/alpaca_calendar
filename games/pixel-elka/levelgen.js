// Генератор уровней. Уровень решаем по построению:
// 1) строим последовательность ходов, при которой полка никогда не переполняется;
// 2) раскладываем её по колонкам в обратном порядке, так что каждый следующий
//    блок этой последовательности оказывается сверху в момент своего хода.
(function (root) {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const CAP = 7;

  function difficulty(levelIndex) {
    return {
      triples: Math.min(6 + Math.floor(levelIndex * 0.9), 24),
      cols: Math.min(4 + Math.floor(levelIndex / 3), 7),
      // сколько ячеек полки остаётся свободными в «идеальной» игре
      slack: levelIndex < 3 ? 4 : levelIndex < 10 ? 3 : 2,
      cap: CAP
    };
  }

  function countColors(pic) {
    const counts = {};
    pic.rows.forEach(row => {
      for (const ch of row) if (ch !== '.') counts[ch] = (counts[ch] || 0) + 1;
    });
    return counts;
  }

  function allocateTriples(counts, target) {
    const colors = Object.keys(counts);
    const total = colors.reduce((s, c) => s + counts[c], 0);
    const triples = {};
    colors.forEach(c => {
      triples[c] = Math.min(counts[c], Math.max(1, Math.round((counts[c] / total) * target)));
    });
    return triples;
  }

  function buildSequence(triples, cap, slack, rnd) {
    const remaining = {};
    Object.keys(triples).forEach(c => { remaining[c] = triples[c] * 3; });
    const barCount = {};
    let barSize = 0;
    const maxBar = cap - slack;
    const seq = [];
    let left = Object.values(remaining).reduce((a, b) => a + b, 0);

    while (left > 0) {
      const options = Object.keys(remaining).filter(c => remaining[c] > 0);
      const allowed = options.filter(c => (barCount[c] || 0) === 2 || barSize + 1 <= maxBar);
      let pick;
      if (allowed.length) {
        // чаще открываем новый цвет — это создаёт напряжение на полке
        const fresh = allowed.filter(c => !(barCount[c] > 0));
        const pool = fresh.length && rnd() < 0.55 ? fresh : allowed;
        pick = pool[Math.floor(rnd() * pool.length)];
      } else {
        pick = options.reduce((best, c) => ((barCount[c] || 0) > (barCount[best] || 0) ? c : best), options[0]);
      }
      seq.push(pick);
      remaining[pick]--; left--;
      barCount[pick] = (barCount[pick] || 0) + 1;
      if (barCount[pick] === 3) { barCount[pick] = 0; barSize -= 2; } else barSize++;
    }
    return seq;
  }

  function distribute(seq, nCols, rnd) {
    const cols = Array.from({ length: nCols }, () => []);
    const colOf = new Array(seq.length);
    for (let i = seq.length - 1; i >= 0; i--) {
      const a = Math.floor(rnd() * nCols);
      const b = Math.floor(rnd() * nCols);
      const col = cols[a].length <= cols[b].length ? a : b;
      cols[col].push(seq[i]); // конец массива — верх колонки
      colOf[i] = col;
    }
    return { cols, colOf };
  }

  function paintOrder(pic, rnd) {
    // красим снизу вверх с небольшим разбросом — картинка «вырастает»
    const order = {};
    for (let y = pic.h - 1; y >= 0; y--) {
      for (let x = 0; x < pic.w; x++) {
        const ch = pic.rows[y][x];
        if (ch === '.') continue;
        (order[ch] = order[ch] || []).push({ x, y, k: (pic.h - y) + rnd() * 2 });
      }
    }
    Object.values(order).forEach(list => list.sort((p, q) => p.k - q.k));
    return order;
  }

  function buildLevel(pic, levelIndex) {
    const d = difficulty(levelIndex);
    const rnd = mulberry32(levelIndex * 7919 + 13);
    const counts = countColors(pic);
    const triples = allocateTriples(counts, d.triples);
    const seq = buildSequence(triples, d.cap, d.slack, rnd);
    const { cols, colOf } = distribute(seq, d.cols, rnd);
    // seq + colOf — эталонное решение (пригодится для подсказок)
    return { cap: d.cap, cols, triples, counts, paint: paintOrder(pic, rnd), seq, colOf };
  }

  const api = { buildLevel, difficulty, countColors, mulberry32, CAP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(this);
