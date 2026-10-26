// Генерирует calendar-levels.js — 31 задача адвент-календаря (1–31 декабря).
// Запуск: node tools/make-calendar.js
const fs = require('fs');
const path = require('path');
const P = require('../puzzle.js');

const sizeForDay = d => (d <= 10 ? 6 : d <= 20 ? 7 : 8);
const days = [];
for (let d = 1; d <= 31; d++) {
  const p = P.generate(sizeForDay(d), 900000 + d * 7907);
  days.push({ r: p.regions.map(row => row.join('')).join('/'), s: p.solution.join('') });
}
fs.writeFileSync(path.join(__dirname, '..', 'calendar-levels.js'), `// Сгенерировано tools/make-calendar.js — не редактировать вручную.
// Задачи адвент-календаря: индекс 0 = 1 декабря.
var CALENDAR = ${JSON.stringify(days)};
if (typeof module !== 'undefined') module.exports = CALENDAR;
`);
console.log('calendar-levels.js: 31 days');
