// Адвент-календарь: даты, награды и новогодняя открытка, которая открывается по кусочкам.
(function (root) {
  const COLS = 5, ROWS = 7; // 35 окошек: 31 день + 4 открытых украшения

  // Сегодняшняя дата. window.SNOWMEN_TODAY = 'YYYY-MM-DD' подменяет её для проверки.
  function today() {
    const o = root.SNOWMEN_TODAY;
    if (o) { const [y, m, d] = o.split('-').map(Number); return new Date(y, m - 1, d); }
    return new Date();
  }

  // Какой год у календаря и какой сегодня день календаря:
  // 0 — декабрь ещё не наступил, 1..31 — декабрь, 32 — январь (всё уже прошло).
  function state() {
    const t = today();
    const m = t.getMonth();
    if (m === 11) return { year: t.getFullYear(), day: t.getDate() };
    if (m === 0) return { year: t.getFullYear() - 1, day: 32 };
    const dec1 = new Date(t.getFullYear(), 11, 1);
    return { year: t.getFullYear(), day: 0, daysLeft: Math.ceil((dec1 - t) / 86400000) };
  }

  // Окошки перемешаны, как в настоящем адвент-календаре, но порядок одинаков у всех.
  function layout() {
    const cells = [];
    for (let d = 1; d <= 31; d++) cells.push(d);
    for (let i = 0; i < COLS * ROWS - 31; i++) cells.push(0);
    let seed = 2027;
    for (let i = cells.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const j = seed % (i + 1);
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells;
  }

  function puzzleForDay(day) {
    const lv = CALENDAR[day - 1];
    const regions = lv.r.split('/').map(row => [...row].map(Number));
    return { N: regions.length, regions, solution: [...lv.s].map(Number) };
  }

  // ---------- открытка ----------
  function rng(seed) {
    return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  }

  function drawPostcard(ctx, w, h, greeting) {
    const r = rng(31);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0d1a40'); sky.addColorStop(1, '#2d4486');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`;
      ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.6, 0.6 + r() * 1.4, 0, Math.PI * 2); ctx.fill();
    }
    // луна
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(w * 0.83, h * 0.1, w * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f1d45';
    ctx.beginPath(); ctx.arc(w * 0.86, h * 0.09, w * 0.06, 0, Math.PI * 2); ctx.fill();
    // салют
    [[0.18, 0.12, '#ff7eb6'], [0.5, 0.07, '#ffd23f'], [0.3, 0.27, '#7fd8ff']].forEach(([x, y, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, w * 0.006); ctx.lineCap = 'round';
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2, r1 = w * 0.03, r2 = w * 0.08;
        ctx.beginPath();
        ctx.moveTo(x * w + Math.cos(a) * r1, y * h + Math.sin(a) * r1);
        ctx.lineTo(x * w + Math.cos(a) * r2, y * h + Math.sin(a) * r2);
        ctx.stroke();
      }
    });
    // поздравление
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(w * 0.085)}px "Trebuchet MS", sans-serif`;
    ctx.shadowColor = '#0008'; ctx.shadowBlur = 8;
    ctx.fillText(greeting[0], w * 0.5, h * 0.37);
    ctx.font = `bold ${Math.round(w * 0.12)}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(greeting[1], w * 0.5, h * 0.45);
    ctx.shadowBlur = 0;
    // панельные дома с окнами
    const house = (x, hw, hh, cols) => {
      ctx.fillStyle = '#3a4b78';
      ctx.fillRect(x, h * 0.82 - hh, hw, hh);
      const cw = hw / cols, rows = Math.floor(hh / (cw * 1.2));
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        ctx.fillStyle = r() < 0.55 ? '#ffd86b' : '#24335c';
        ctx.fillRect(x + j * cw + cw * 0.25, h * 0.82 - hh + i * cw * 1.2 + cw * 0.3, cw * 0.5, cw * 0.55);
      }
    };
    house(w * 0.0, w * 0.26, h * 0.3, 4);
    house(w * 0.76, w * 0.24, h * 0.26, 4);
    // снег
    ctx.fillStyle = '#eef3f9';
    ctx.beginPath(); ctx.moveTo(0, h * 0.84);
    ctx.quadraticCurveTo(w * 0.3, h * 0.78, w * 0.55, h * 0.83);
    ctx.quadraticCurveTo(w * 0.8, h * 0.87, w, h * 0.8);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    // ёлка
    const tx = w * 0.5, base = h * 0.84;
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(tx - w * 0.03, base - h * 0.03, w * 0.06, h * 0.05);
    ctx.fillStyle = '#1f8a3f';
    [[0.22, 0.13], [0.17, 0.11], [0.12, 0.09]].forEach(([hw, th], i) => {
      const y = base - h * 0.03 - i * h * 0.075;
      ctx.beginPath(); ctx.moveTo(tx - w * hw, y); ctx.lineTo(tx + w * hw, y); ctx.lineTo(tx, y - h * th); ctx.closePath(); ctx.fill();
    });
    const lights = ['#ffd23f', '#ff7eb6', '#7fd8ff', '#ff5d6c'];
    for (let i = 0; i < 18; i++) {
      const t = r(), y = base - h * 0.05 - t * h * 0.22, spread = w * (0.2 - t * 0.15);
      ctx.fillStyle = lights[i % 4];
      ctx.beginPath(); ctx.arc(tx + (r() - 0.5) * 2 * spread * 0.8, y, w * 0.012, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffd23f';
    ctx.font = `${Math.round(w * 0.09)}px sans-serif`;
    ctx.fillText('★', tx, base - h * 0.03 - 2 * h * 0.075 - h * 0.09);
    // снеговики у ёлки
    const sm = (x, s) => {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#22324a'; ctx.lineWidth = Math.max(1, s * 0.08);
      ctx.beginPath(); ctx.arc(x, base + s * 0.2, s * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, base - s * 0.6, s * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d93a52'; ctx.fillRect(x - s * 0.3, base - s * 1.15, s * 0.6, s * 0.25);
      ctx.fillStyle = '#ff8a1c'; ctx.fillRect(x, base - s * 0.62, s * 0.3, s * 0.08);
    };
    sm(w * 0.25, w * 0.07);
    sm(w * 0.78, w * 0.06);
  }

  const api = { COLS, ROWS, today, state, layout, puzzleForDay, drawPostcard };
  root.Calendar = api;
})(this);
