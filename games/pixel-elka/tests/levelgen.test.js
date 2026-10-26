// Проверка: каждый уровень решаем последовательностью, из которой он построен.
const assert = require('assert');
const { PICTURES } = require('../pictures.js');
const { buildLevel } = require('../levelgen.js');

let checked = 0;
for (let L = 0; L < 120; L++) {
  const pic = PICTURES[L % PICTURES.length];
  const lvl = buildLevel(pic, L);
  const cols = lvl.cols.map(c => c.slice());
  const bar = {};
  let barSize = 0, maxSeen = 0;
  for (let i = 0; i < lvl.seq.length; i++) {
    const color = lvl.seq[i], ci = lvl.colOf[i];
    assert.strictEqual(cols[ci][cols[ci].length - 1], color, `level ${L}: ${color} not on top`);
    cols[ci].pop();
    bar[color] = (bar[color] || 0) + 1;
    if (bar[color] === 3) { bar[color] = 0; barSize -= 2; } else barSize++;
    maxSeen = Math.max(maxSeen, barSize);
    assert(barSize < lvl.cap, `level ${L}: bar overflow ${barSize}`);
  }
  assert(cols.every(c => c.length === 0), `level ${L}: blocks left`);
  assert.strictEqual(barSize, 0, `level ${L}: bar not empty`);
  for (const c of Object.keys(lvl.counts)) {
    assert(lvl.triples[c] >= 1 && lvl.triples[c] <= lvl.counts[c], `level ${L}: bad triples for ${c}`);
  }
  checked++;
}
console.log(`ok: ${checked} levels solvable`);
