// Каждая задача: ровно одно решение, и оно соблюдает все правила.
const assert = require('assert');
const P = require('../puzzle.js');

function check(p, label) {
  const { N, regions, solution } = p;
  assert.strictEqual(P.countSolutions(N, regions, 3), 1, `${label}: not unique`);
  assert.strictEqual(new Set(solution).size, N, `${label}: column repeats`);
  assert.strictEqual(new Set(solution.map((c, r) => regions[r][c])).size, N, `${label}: region repeats`);
  for (let r = 1; r < N; r++) assert(Math.abs(solution[r] - solution[r - 1]) > 1, `${label}: touching`);
  const ids = new Set(regions.flat());
  assert.strictEqual(ids.size, N, `${label}: region count`);
}

const t0 = Date.now();
for (let L = 0; L < 60; L++) {
  const s = Date.now();
  check(P.levelPuzzle(L), `level ${L}`);
  const ms = Date.now() - s;
  if (ms > 300) console.log(`slow level ${L} (N=${P.sizeForLevel(L)}): ${ms}ms`);
}
for (let d = 0; d < 30; d++) check(P.dailyPuzzle(new Date(2026, 11, 1 + d)), `daily ${d}`);
console.log(`ok: 60 levels + 30 dailies unique, ${Date.now() - t0}ms`);

// Пакет уровней: каждый уровень уникален и совпадает с генератором.
const LEVELS = require('../levels.js');
LEVELS.forEach((lv, i) => {
  const regions = lv.r.split('/').map(row => [...row].map(Number));
  const solution = [...lv.s].map(Number);
  check({ N: regions.length, regions, solution }, `pack ${i}`);
});
console.log(`ok: pack of ${LEVELS.length} levels`);

// Задачи календаря: тоже по одному решению.
const CALENDAR = require('../calendar-levels.js');
assert.strictEqual(CALENDAR.length, 31);
CALENDAR.forEach((lv, i) => {
  const regions = lv.r.split('/').map(row => [...row].map(Number));
  check({ N: regions.length, regions, solution: [...lv.s].map(Number) }, `calendar day ${i + 1}`);
});
console.log('ok: calendar of 31 days');
