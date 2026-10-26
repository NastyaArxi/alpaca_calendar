// Каждый уровень решаем, и мешки несут ровно столько блоков, сколько есть в картинке.
const assert = require('assert');
const { PICTURES } = require('../toys.js');
const E = require('../engine.js');

const t0 = Date.now();
for (let L = 0; L < 48; L++) {
  const pic = PICTURES[L % PICTURES.length];
  const level = E.buildLevel(pic, L);
  const blocks = pic.rows.join('').replace(/\./g, '').length;
  const carried = level.queues.flat().reduce((s, b) => s + b.n, 0);
  assert.strictEqual(carried, blocks, `level ${L}: bags ${carried} vs blocks ${blocks}`);
  assert(E.autoPlay(level), `level ${L} (${pic.id}) not solvable`);
}
console.log(`ok: 48 levels solvable, ${Date.now() - t0}ms`);
