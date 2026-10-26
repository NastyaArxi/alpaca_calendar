// Каждый уровень решаем, и мешки несут ровно столько блоков, сколько есть в картинке.
const assert = require('assert');
const { PICTURES, CHAPTERS } = require('../toys.js');
const E = require('../engine.js');

const t0 = Date.now();
for (let L = 0; L < 48; L++) {
  const pic = PICTURES[L];
  const ch = CHAPTERS[Math.floor(L / 12)];
  const level = E.buildLevel(pic, L, ch);
  assert.strictEqual(level.slots, ch.slots, `level ${L}: slots`);
  assert.strictEqual(level.queues.length, ch.queues, `level ${L}: queues`);
  assert(level.queues.flat().every(b => b.n <= ch.maxTile), `level ${L}: tile too big`);
  const blocks = pic.rows.join('').replace(/\./g, '').length;
  const carried = level.queues.flat().reduce((s, b) => s + b.n, 0);
  assert.strictEqual(carried, blocks, `level ${L}: bags ${carried} vs blocks ${blocks}`);
  assert(E.autoPlay(level), `level ${L} (${pic.id}) not solvable`);
}
console.log(`ok: 48 levels solvable, ${Date.now() - t0}ms`);
