// Игрушки-картинки. Каждая описана фигурами в системе координат SIZE×SIZE
// и переводится в пиксели сетки GRID×GRID: клетка получает цвет последней фигуры, которая накрывает её центр.
(function (root) {
  const SIZE = 22;   // координаты, в которых описаны фигуры
  const GRID = 32;   // сколько клеток получается в картинке по стороне

  // Яркая палитра: символ → цвет.
  const PALETTE = {
    r: '#ff3b3b', o: '#ff8c1a', y: '#ffd21f', l: '#9be22d', g: '#20b85a', t: '#14c2b3',
    s: '#3ec3ff', b: '#2f6bff', v: '#8a4dff', p: '#ff6fb5', m: '#e0219c', n: '#a0622d',
    w: '#ffffff', k: '#333344', e: '#ffd9b0'
  };

  // ---------- фигуры ----------
  const rect = (x, y, w, h, c) => ({ c, hit: (px, py) => px >= x && px < x + w && py >= y && py < y + h });
  const circle = (cx, cy, r, c) => ({ c, hit: (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r });
  const ellipse = (cx, cy, rx, ry, c) => ({ c, hit: (px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1 });
  const poly = (pts, c) => ({ c, hit: (px, py) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  } });
  const line = (x1, y1, x2, y2, wdt, c) => ({ c, hit: (px, py) => {
    const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    return (px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2 <= (wdt / 2) ** 2;
  } });
  // часть круга между углами (в градусах, 0 = вправо, по часовой)
  const sector = (cx, cy, r, a1, a2, c) => ({ c, hit: (px, py) => {
    if ((px - cx) ** 2 + (py - cy) ** 2 > r * r) return false;
    let a = (Math.atan2(py - cy, px - cx) * 180) / Math.PI; if (a < 0) a += 360;
    return a1 <= a2 ? a >= a1 && a < a2 : a >= a1 || a < a2;
  } });

  const TOYS = [
    { id: 'car', name: { ru: 'Машинка', en: 'Toy car' }, shapes: [
      poly([[2, 13], [5, 13], [7, 8], [15, 8], [17, 13], [20, 13], [20, 17], [2, 17]], 'r'),
      poly([[8, 9], [11, 9], [11, 13], [7, 13]], 's'), poly([[12, 9], [14.5, 9], [16, 13], [12, 13]], 's'),
      rect(2, 14, 2, 1.5, 'y'), rect(18.5, 14, 1.5, 1.5, 'o'),
      circle(6.5, 17.5, 2.6, 'k'), circle(15.5, 17.5, 2.6, 'k'), circle(6.5, 17.5, 1, 'w'), circle(15.5, 17.5, 1, 'w')
    ] },
    { id: 'doll', name: { ru: 'Кукла', en: 'Doll' }, shapes: [
      ellipse(11, 7, 6, 6, 'y'), rect(5, 7, 12, 8, 'y'),
      circle(11, 8, 4, 'e'), circle(9.5, 7.5, 0.7, 'b'), circle(12.5, 7.5, 0.7, 'b'), rect(10, 10, 2, 0.8, 'r'),
      poly([[6.5, 2.5], [9.5, 4], [6.5, 5.5]], 'v'), poly([[9.5, 4], [12.5, 2.5], [12.5, 5.5]], 'v'),
      poly([[8, 12], [14, 12], [18, 21], [4, 21]], 'p'), rect(8, 12, 6, 2, 'm'),
      rect(5, 14, 2, 4, 'e'), rect(15, 14, 2, 4, 'e'), rect(7, 20, 8, 1, 'w')
    ] },
    { id: 'bear', name: { ru: 'Мишка', en: 'Teddy bear' }, shapes: [
      circle(5.5, 4.5, 2.5, 'n'), circle(16.5, 4.5, 2.5, 'n'), circle(5.5, 4.5, 1.2, 'e'), circle(16.5, 4.5, 1.2, 'e'),
      circle(11, 8, 6, 'n'), ellipse(11, 16.5, 6.5, 5.5, 'n'), ellipse(11, 17, 4, 3.5, 'e'),
      circle(4.5, 14, 2, 'n'), circle(17.5, 14, 2, 'n'), circle(7, 20.5, 2, 'n'), circle(15, 20.5, 2, 'n'),
      ellipse(11, 10, 2.8, 2, 'e'), circle(11, 9.3, 0.9, 'k'), circle(8.5, 6.8, 0.8, 'k'), circle(13.5, 6.8, 0.8, 'k'),
      poly([[7.5, 12], [11, 13.5], [7.5, 15]], 'r'), poly([[14.5, 12], [11, 13.5], [14.5, 15]], 'r')
    ] },
    { id: 'ball', name: { ru: 'Мяч', en: 'Beach ball' }, shapes: [
      sector(11, 11, 9.5, 0, 60, 'r'), sector(11, 11, 9.5, 60, 120, 'y'), sector(11, 11, 9.5, 120, 180, 'b'),
      sector(11, 11, 9.5, 180, 240, 'g'), sector(11, 11, 9.5, 240, 300, 'p'), sector(11, 11, 9.5, 300, 360, 'o'),
      circle(11, 11, 2, 'w'), circle(7, 6.5, 1.3, 'w')
    ] },
    { id: 'pyramid', name: { ru: 'Пирамидка', en: 'Stacking rings' }, shapes: [
      rect(10, 1, 2, 18, 'n'), circle(11, 2, 1.6, 'y'),
      ellipse(11, 5, 3, 1.6, 'v'), ellipse(11, 8, 4.5, 1.7, 'b'), ellipse(11, 11, 6, 1.8, 'g'),
      ellipse(11, 14, 7.5, 1.9, 'y'), ellipse(11, 17, 9, 2, 'r'), rect(2, 19.5, 18, 2, 'n')
    ] },
    { id: 'boat', name: { ru: 'Кораблик', en: 'Toy boat' }, shapes: [
      rect(10.5, 2, 1, 12, 'n'), poly([[11.5, 3], [18, 12], [11.5, 12]], 'w'), poly([[10.5, 5], [10.5, 12], [5, 12]], 'y'),
      poly([[10.5, 1], [14, 2], [10.5, 3]], 'r'),
      poly([[2, 13], [20, 13], [17, 17], [5, 17]], 'r'), rect(4, 13, 14, 1, 'w'),
      circle(7.5, 15, 0.8, 'y'), circle(11, 15, 0.8, 'y'), circle(14.5, 15, 0.8, 'y'),
      rect(0, 18, 22, 1.5, 's'), rect(0, 19.5, 22, 2, 'b')
    ] },
    { id: 'robot', name: { ru: 'Робот', en: 'Robot' }, shapes: [
      rect(10.5, 0.5, 1, 2.5, 'k'), circle(11, 1, 1.2, 'r'),
      rect(6, 3, 10, 7, 'n'), rect(6, 3, 10, 7, 's'), circle(9, 6, 1.5, 'w'), circle(13, 6, 1.5, 'w'),
      circle(9, 6, 0.7, 'k'), circle(13, 6, 0.7, 'k'), rect(8.5, 8, 5, 1, 'k'),
      rect(5, 11, 12, 7, 'b'), rect(7, 12.5, 8, 3.5, 's'), circle(9, 14, 0.8, 'r'), circle(11, 14, 0.8, 'y'), circle(13, 14, 0.8, 'l'),
      rect(2, 11.5, 3, 5, 'o'), rect(17, 11.5, 3, 5, 'o'), rect(6.5, 18, 3, 3.5, 'k'), rect(12.5, 18, 3, 3.5, 'k')
    ] },
    { id: 'train', name: { ru: 'Паровозик', en: 'Toy train' }, shapes: [
      rect(3, 5, 3, 4, 'k'), ellipse(4.5, 3.5, 2.5, 1.5, 'w'),
      rect(2, 9, 10, 6, 'g'), rect(12, 5, 7, 10, 'r'), rect(13.5, 6.5, 4, 3.5, 's'), rect(11, 4, 9, 1.5, 'k'),
      rect(1, 15, 20, 1.5, 'y'), circle(5, 18, 2.5, 'k'), circle(10.5, 18, 2.5, 'k'), circle(16.5, 18, 2.5, 'k'),
      circle(5, 18, 0.9, 'y'), circle(10.5, 18, 0.9, 'y'), circle(16.5, 18, 0.9, 'y'), rect(0, 12, 2, 2, 'y')
    ] },
    { id: 'horse', name: { ru: 'Лошадка-качалка', en: 'Rocking horse' }, shapes: [
      ellipse(11, 11, 6.5, 3.5, 'w'), poly([[14, 9], [16, 3], [19.5, 4], [20, 7], [17, 8], [16.5, 11]], 'w'),
      poly([[13.5, 8], [15.5, 2.5], [16.5, 3], [15, 9]], 'o'), circle(18, 5, 0.6, 'k'),
      poly([[4.5, 9], [2, 14], [3.5, 14.5], [5.5, 11]], 'o'),
      rect(6, 13, 1.6, 5, 'w'), rect(9, 13, 1.6, 5, 'w'), rect(12.5, 13, 1.6, 5, 'w'), rect(15, 13, 1.6, 5, 'w'),
      ellipse(11, 9, 3, 1.2, 'r'),
      line(1, 18, 21, 18, 1.6, 'n'), line(1, 18, 3, 20.5, 1.6, 'n'), line(21, 18, 19, 20.5, 1.6, 'n')
    ] },
    { id: 'top', name: { ru: 'Юла', en: 'Spinning top' }, shapes: [
      rect(10, 1, 2, 4, 'n'), circle(11, 1.5, 1.3, 'r'),
      ellipse(11, 11, 9, 6, 'r'), ellipse(11, 11, 9, 4.2, 'y'), ellipse(11, 11, 9, 2.4, 'b'), ellipse(11, 11, 9, 0.9, 'w'),
      poly([[6, 15.5], [16, 15.5], [11, 21]], 'v'), circle(11, 20.5, 0.9, 'k')
    ] },
    { id: 'plane', name: { ru: 'Самолётик', en: 'Toy plane' }, shapes: [
      ellipse(11, 11, 9.5, 2.6, 'y'), poly([[8, 10], [13, 10], [10, 2], [8, 2]], 'b'), poly([[8, 12], [13, 12], [10, 20], [8, 20]], 'b'),
      poly([[1.5, 8.5], [4, 8.5], [5, 11], [1.5, 11]], 'r'), circle(18, 10.5, 1.2, 's'), circle(15, 10.5, 1, 's'),
      rect(20.3, 7.5, 1, 7, 'k'), circle(11, 11, 0.8, 'r')
    ] },
    { id: 'rocket', name: { ru: 'Ракета', en: 'Rocket' }, shapes: [
      poly([[11, 0.5], [15, 6], [15, 16], [7, 16], [7, 6]], 'w'), poly([[11, 0.5], [14, 4.5], [8, 4.5]], 'r'),
      circle(11, 9, 2.2, 'b'), circle(11, 9, 1.2, 's'),
      poly([[7, 11], [3, 17], [7, 16]], 'r'), poly([[15, 11], [19, 17], [15, 16]], 'r'), rect(10, 11, 2, 5, 'r'),
      poly([[8, 16], [14, 16], [11, 21.5]], 'o'), poly([[9.5, 16], [12.5, 16], [11, 19.5]], 'y')
    ] }
  ];

  function rasterize(toy) {
    const rows = [];
    const k = SIZE / GRID;
    for (let y = 0; y < GRID; y++) {
      let row = '';
      for (let x = 0; x < GRID; x++) {
        let ch = '.';
        for (const s of toy.shapes) if (s.hit((x + 0.5) * k, (y + 0.5) * k)) ch = s.c;
        row += ch;
      }
      rows.push(row);
    }
    // обрезаем пустые края, чтобы картинка была по центру поля
    let top = 0, bottom = GRID - 1, left = GRID, right = -1;
    while (top < GRID && !/[^.]/.test(rows[top])) top++;
    while (bottom > top && !/[^.]/.test(rows[bottom])) bottom--;
    rows.forEach(r => { const a = r.search(/[^.]/); if (a >= 0) { left = Math.min(left, a); right = Math.max(right, r.length - 1 - [...r].reverse().join('').search(/[^.]/)); } });
    const cut = rows.slice(top, bottom + 1).map(r => r.slice(left, right + 1));
    return { id: toy.id, name: toy.name, rows: cut, w: cut[0].length, h: cut.length };
  }

  const PICTURES = TOYS.map(rasterize);

  const api = { PALETTE, PICTURES, SIZE, GRID };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(this);
