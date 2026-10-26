// Генерирует levels.js — заранее посчитанный пакет уровней, чтобы игра не тратила время на генерацию.
// Запуск: node tools/make-levels.js [количество]
const fs = require('fs');
const path = require('path');
const P = require('../puzzle.js');

const count = +process.argv[2] || 150;
const levels = [];
for (let L = 0; L < count; L++) {
  const p = P.levelPuzzle(L);
  levels.push({ r: p.regions.map(row => row.join('')).join('/'), s: p.solution.join('') });
}
const out = `// Сгенерировано tools/make-levels.js — не редактировать вручную.
// r: дворики по строкам (цифра = номер дворика), s: столбец снеговика в каждой строке.
var LEVELS = ${JSON.stringify(levels)};
if (typeof module !== 'undefined') module.exports = LEVELS;
`;
fs.writeFileSync(path.join(__dirname, '..', 'levels.js'), out);
console.log(`levels.js: ${count} levels`);
