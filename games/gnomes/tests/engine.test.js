// Каждый уровень должен проходиться жадным ботом, а сумма отрядов — равняться числу блоков.
const assert = require('assert');
const { PICTURES } = require('../pictures.js');
const E = require('../engine.js');

let fallback = 0;
for (let L = 0; L < 40; L++) {
  const pic = PICTURES[L % PICTURES.length];
  const level = E.buildLevel(pic, L);
  const blocks = pic.rows.join('').replace(/\./g, '').length;
  const total = level.queues.flat().reduce((s, q) => s + q.n, 0);
  assert.strictEqual(total, blocks, `level ${L}: squads carry ${total}, picture has ${blocks}`);
  const st = E.autoPlay(level);
  assert.strictEqual(st.status, 'win', `level ${L} (${pic.id}) not solved: ${st.status}, left ${st.left}`);
  if (level.queues.length === 1) fallback++;
  console.log(`L${L + 1} ${pic.id}: squads=${level.queues.flat().length} queues=${level.queues.length} slots=${level.slots} ticks=${st.tick}`);
}
console.log(`ok, fallback levels: ${fallback}`);
