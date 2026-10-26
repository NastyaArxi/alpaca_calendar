(function () {
  const STR = {
    ru: {
      title: 'Гномы и подарки', subtitle: 'Помоги гномам Деда Мороза собрать игрушки в мешок',
      play: 'Играть', level: 'Уровень', addSlot: '+1 ячейка', restart: 'Заново',
      hint0: 'Нажми на подарок: гномы побегут за блоками его цвета.',
      hint1: 'Гномы берут только блоки с краю. Разбирай игрушку снаружи внутрь!',
      hint2: 'Если всем подаркам в ячейках нечего брать, уровень проигран. Выбирай порядок!',
      noSlot: 'Все ячейки заняты. Подожди, пока гномы освободят место.',
      winTitle: 'Игрушка в мешке!', winText: '{n} поедет к ребёнку на Новый год', next: 'Дальше',
      loseTitle: 'Гномы застряли', loseText: 'Подаркам в ячейках нечего брать. Добавь ячейку или начни заново.',
      revive: 'Ещё ячейка ▶'
    },
    en: {
      title: 'Gnomes & Gifts', subtitle: "Help Santa's gnomes pack the toys into the sack",
      play: 'Play', level: 'Level', addSlot: '+1 slot', restart: 'Restart',
      hint0: 'Tap a gift: the gnomes will run for blocks of its color.',
      hint1: 'Gnomes only take blocks at the edge. Take the toy apart from the outside in!',
      hint2: 'If no gift in the slots has anything to take, you lose. Choose the order!',
      noSlot: 'All slots are busy. Wait for the gnomes to free one.',
      winTitle: 'Toy packed!', winText: 'The {n} is going to a child for New Year', next: 'Next',
      loseTitle: 'The gnomes are stuck', loseText: 'No gift in the slots has anything to take. Add a slot or restart.',
      revive: 'One more slot ▶'
    }
  };
  let T = STR.ru, lang = 'ru';

  const $ = id => document.getElementById(id);
  const els = {
    menu: $('screen-menu'), game: $('screen-game'), stage: $('stage'), board: $('board'),
    slots: $('slots'), queues: $('queues'), level: $('level-label'), hint: $('hint'),
    addSlot: $('btn-slot'), play: $('btn-play'), sound: $('btn-sound'),
    modal: $('modal'), modalTitle: $('modal-title'), modalText: $('modal-text'),
    modalArt: $('modal-art'), modalButtons: $('modal-buttons'), fx: $('fx')
  };

  const SPEED = 16;       // клеток в секунду
  const PER_BAG = 8;      // гномов одного подарка одновременно в пути
  const SEND_GAP = 60;    // мс между выходами гномов одного подарка
  const SKIN = '#ffd2a8';

  // ---------- звук ----------
  const Sound = {
    ctx: null, on: true, paused: false, last: 0,
    beep(freq, dur, type = 'sine', vol = 0.1, delay = 0) {
      if (!this.on || this.paused) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const t = this.ctx.currentTime + delay;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(this.ctx.destination);
        o.start(t); o.stop(t + dur);
      } catch (e) {}
    },
    tap() { this.beep(520, 0.07, 'triangle'); this.beep(780, 0.08, 'triangle', 0.08, 0.05); },
    drop() { const n = performance.now(); if (n - this.last < 60) return; this.last = n; this.beep(900 + Math.random() * 400, 0.04, 'square', 0.025); },
    done() { [784, 1047, 1319].forEach((f, i) => this.beep(f, 0.12, 'triangle', 0.08, i * 0.07)); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.beep(f, 0.25, 'triangle', 0.1, i * 0.1)); },
    lose() { [300, 220].forEach((f, i) => this.beep(f, 0.3, 'sawtooth', 0.06, i * 0.18)); },
    deny() { this.beep(180, 0.12, 'square', 0.05); }
  };

  // ---------- состояние ----------
  let save = { level: 0 };
  let levelIndex = 0, pic = null, level = null;
  let grid = null, W = 0, H = 0, queues = [], slots = [], gnomes = [], reserved = new Set();
  let running = false, over = false, extraSlot = false, geo = null, uid = 0;
  let avCache = null;

  // ---------- рисование ----------
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawGnome(ctx, x, y, s, color, carry) {
    ctx.fillStyle = '#c81f37';
    ctx.beginPath(); ctx.arc(x, y + s * 0.28, s * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(x, y - 0.02 * s, s * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x - s * 0.18, y + s * 0.02); ctx.quadraticCurveTo(x, y + s * 0.42, x + s * 0.18, y + s * 0.02); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x - s * 0.22, y - s * 0.1); ctx.lineTo(x + s * 0.22, y - s * 0.1); ctx.lineTo(x + s * 0.06, y - s * 0.55); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0005'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + s * 0.06, y - s * 0.55, s * 0.08, 0, Math.PI * 2); ctx.fill();
    if (carry) {
      const b = s * 0.42;
      ctx.fillStyle = carry; ctx.strokeStyle = '#0004'; ctx.lineWidth = 1;
      roundRect(ctx, x - b / 2, y - s * 0.62 - b, b, b, b * 0.2); ctx.fill(); ctx.stroke();
    }
  }

  function drawSack(ctx, x, y, s) {
    ctx.fillStyle = '#d42a3a';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y - s * 0.15);
    ctx.quadraticCurveTo(x - s * 0.95, y + s * 0.9, x, y + s * 0.85);
    ctx.quadraticCurveTo(x + s * 0.95, y + s * 0.9, x + s * 0.55, y - s * 0.15);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff33';
    ctx.beginPath(); ctx.ellipse(x - s * 0.3, y + s * 0.35, s * 0.12, s * 0.3, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a1018';
    ctx.beginPath(); ctx.ellipse(x, y - s * 0.15, s * 0.55, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + s * 0.05); ctx.quadraticCurveTo(x, y + s * 0.2, x + s * 0.5, y + s * 0.05); ctx.stroke();
  }

  function drawBlock(ctx, px, py, c, color) {
    ctx.fillStyle = color;
    roundRect(ctx, px + 0.6, py + 0.6, c - 1.2, c - 1.2, Math.max(1, c * 0.2)); ctx.fill();
    ctx.fillStyle = '#ffffff40';
    ctx.fillRect(px + c * 0.2, py + c * 0.16, c * 0.32, c * 0.14);
    ctx.fillStyle = '#00000018';
    ctx.fillRect(px + c * 0.1, py + c * 0.78, c * 0.8, c * 0.12);
  }

  function setupCanvas(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawToy(canvas, p, size) {
    const c = Math.floor(size / Math.max(p.w, p.h));
    const ctx = setupCanvas(canvas, c * p.w, c * p.h);
    p.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') drawBlock(ctx, x * c, y * c, c, PALETTE[ch]); }));
    return ctx;
  }

  // ---------- раскладка ----------
  // Поле (рамка + блоки) рисуется на #board. Гномы — на слое #fx поверх всего экрана игры,
  // чтобы они могли добежать от игрушки до мешка в ряду ячеек.
  function layout() {
    if (!grid) return;
    const width = Math.min(window.innerWidth, 560) - 24;
    const n = Math.max(slots.length, queues.length);
    const gift = Math.floor(Math.max(40, Math.min(60, width / n - 8, (window.innerHeight - 160) / 9)));
    document.documentElement.style.setProperty('--gift', gift + 'px');
    const r = els.stage.getBoundingClientRect();
    const c = Math.max(6, Math.floor(Math.min(r.width / (W + 2.6), r.height / (H + 2.8))));
    const pad = Math.round(c * 0.3);
    const w = (W + 2) * c + pad * 2, h = (H + 2) * c + pad * 2;
    geo = { c, pad, ox: pad + c, oy: pad + c, w, h, ctx: setupCanvas(els.board, w, h) };
    const g = els.game.getBoundingClientRect();
    geo.fxCtx = setupCanvas(els.fx, g.width, g.height);
    geo.fw = g.width; geo.fh = g.height;
    locate();
  }

  // Где поле и мешок находятся на слое гномов.
  function locate() {
    if (!geo) return;
    const g = els.game.getBoundingClientRect(), b = els.board.getBoundingClientRect();
    geo.bx = b.left - g.left; geo.by = b.top - g.top;
    const sack = $('sack');
    if (sack) {
      const s = sack.getBoundingClientRect();
      geo.mouth = { x: s.left - g.left + s.width / 2, y: s.top - g.top + s.height * 0.35 };
    } else geo.mouth = { x: geo.bx + geo.w / 2, y: geo.by + geo.h };
  }

  const cellXY = (x, y) => ({ x: geo.bx + geo.ox + (x + 0.5) * geo.c, y: geo.by + geo.oy + (y + 0.5) * geo.c });

  function render() {
    if (!geo) return;
    const { ctx, c, ox, oy, w, h } = geo;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fffaf2'; ctx.shadowColor = '#0002'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    roundRect(ctx, ox - c, oy - c, (W + 2) * c, (H + 2) * c, c * 0.6); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#f1e4d2';
    roundRect(ctx, ox - c * 0.35, oy - c * 0.35, (W + 0.7) * c, (H + 0.7) * c, c * 0.35); ctx.fill();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (ch) drawBlock(ctx, ox + x * c, oy + y * c, c, PALETTE[ch]);
    }
    const fx = geo.fxCtx;
    fx.clearRect(0, 0, geo.fw, geo.fh);
    gnomes.forEach(g => drawGnome(fx, g.x, g.y, Math.max(14, c * 1.5), PALETTE[g.color], g.carry ? PALETTE[g.carry] : null));
  }

  // ---------- подарки в очередях и ячейках ----------
  const SACK_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true">
    <path d="M9 13 Q2 36 20 37 Q38 36 31 13 Z" fill="#d42a3a"/>
    <ellipse cx="14" cy="25" rx="2.5" ry="6" fill="#ffffff33" transform="rotate(-15 14 25)"/>
    <ellipse cx="20" cy="13" rx="11" ry="4.5" fill="#5a1018"/>
    <path d="M10 17 Q20 21 30 17" stroke="#ffc93c" stroke-width="2.2" fill="none"/></svg>`;

  function giftEl(bag, remaining) {
    const d = document.createElement('div');
    d.className = 'gift' + (bag.color === 'w' ? ' light' : '');
    d.style.background = PALETTE[bag.color];
    d.innerHTML = `<b>${remaining}</b>`;
    return d;
  }

  function renderUI() {
    els.queues.innerHTML = '';
    queues.forEach((q, qi) => {
      const col = document.createElement('div');
      col.className = 'queue';
      q.slice(0, 3).forEach((bag, i) => {
        const el = giftEl(bag, bag.n);
        if (i === 0) {
          el.classList.add('front');
          el.addEventListener('pointerdown', e => { e.preventDefault(); pick(qi); });
        } else el.classList.add('under');
        col.appendChild(el);
      });
      const more = document.createElement('div');
      more.className = 'more';
      more.textContent = q.length > 3 ? `+${q.length - 3}` : '';
      col.appendChild(more);
      els.queues.appendChild(col);
    });
    els.slots.innerHTML = '';
    slots.forEach((bag, i) => {
      const s = document.createElement('div');
      s.className = 'slot' + (extraSlot && i === slots.length - 1 ? ' extra' : '');
      if (bag) {
        const el = giftEl(bag, bag.n - bag.delivered);
        el.classList.add('active');
        el.dataset.id = bag.id;
        s.appendChild(el);
      }
      els.slots.appendChild(s);
    });
    els.slots.classList.toggle('danger', slots.every(Boolean));
    els.addSlot.disabled = extraSlot;
    locate();
  }

  function updateCounter(bag) {
    const el = els.slots.querySelector(`[data-id="${bag.id}"] b`);
    if (el) el.textContent = bag.n - bag.delivered;
  }

  function pick(qi) {
    if (!running || over) return;
    const q = queues[qi];
    if (!q || !q.length) return;
    const free = slots.indexOf(null);
    if (free < 0) {
      Sound.deny();
      setHint(T.noSlot);
      return;
    }
    const b = q.shift();
    slots[free] = { id: ++uid, color: b.color, n: b.n, delivered: 0, claimed: 0, out: 0, lastSend: 0 };
    Sound.tap();
    if (levelIndex === 0 || els.hint.textContent === T.noSlot) setHint('');
    renderUI();
  }

  function setHint(text) {
    els.hint.textContent = text;
    els.hint.style.visibility = text ? 'visible' : 'hidden';
  }

  // ---------- гномы ----------
  function availableNow() {
    if (!avCache) avCache = Engine.available(grid);
    return avCache;
  }

  // Путь по пустым клеткам от мешка до соседней с блоком клетки.
  function findPath(tx, ty) {
    const out = Engine.outside(grid);
    const sx = Math.floor(W / 2), sy = H;
    const key = (x, y) => x + ',' + y;
    const prev = new Map([[key(sx, sy), null]]);
    const queue = [[sx, sy]];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (Math.abs(x - tx) + Math.abs(y - ty) === 1) {
        const path = [[tx, ty]];
        for (let k = key(x, y); k; k = prev.get(k)) path.unshift(k.split(',').map(Number));
        return path;
      }
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < -1 || ny < -1 || nx > W || ny > H || prev.has(key(nx, ny)) || !out(nx, ny)) continue;
        prev.set(key(nx, ny), key(x, y));
        queue.push([nx, ny]);
      }
    }
    return null;
  }

  function dispatch(now) {
    slots.forEach(bag => {
      if (!bag || bag.claimed >= bag.n || bag.out >= PER_BAG || now - bag.lastSend < SEND_GAP) return;
      const list = (availableNow()[bag.color] || []).filter(([x, y]) => !reserved.has(x + ',' + y));
      if (!list.length) return;
      const cx = W / 2, cy = H;
      list.sort((a, b) => (a[0] - cx) ** 2 + (a[1] - cy) ** 2 - ((b[0] - cx) ** 2 + (b[1] - cy) ** 2));
      for (const [tx, ty] of list.slice(0, 6)) {
        const path = findPath(tx, ty);
        if (!path) continue;
        reserved.add(tx + ',' + ty);
        bag.claimed++; bag.out++; bag.lastSend = now;
        const pts = [{ ...geo.mouth }, ...path.map(([x, y]) => cellXY(x, y))];
        gnomes.push({ bag, color: bag.color, pts, i: 0, x: pts[0].x, y: pts[0].y, target: [tx, ty], carry: null, back: false });
        return;
      }
    });
  }

  function moveGnomes(dt) {
    const step = SPEED * geo.c * dt;
    let changed = false;
    gnomes = gnomes.filter(g => {
      let left = step;
      while (left > 0 && g.i < g.pts.length - 1) {
        const a = { x: g.x, y: g.y }, b = g.pts[g.i + 1];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d <= left) { g.x = b.x; g.y = b.y; g.i++; left -= d; }
        else { g.x += ((b.x - a.x) / d) * left; g.y += ((b.y - a.y) / d) * left; left = 0; }
      }
      if (g.i < g.pts.length - 1) return true;
      if (!g.back) {
        // дошёл до блока: забирает его и несёт обратно
        const [tx, ty] = g.target;
        grid[ty][tx] = null; reserved.delete(tx + ',' + ty); avCache = null;
        g.carry = g.color; g.back = true; g.i = 0;
        g.pts = g.pts.slice(0, -1).reverse();
        Sound.drop();
        return true;
      }
      // вернулся в мешок
      const bag = g.bag;
      bag.delivered++; bag.out--;
      if (bag.delivered >= bag.n) {
        const idx = slots.indexOf(bag);
        if (idx >= 0) slots[idx] = null;
        Sound.done();
        changed = true;
      } else updateCounter(bag);
      return false;
    });
    if (changed) renderUI();
  }

  function isStuck() {
    if (gnomes.length || slots.some(s => !s)) return false;
    const av = availableNow();
    return slots.every(bag => !(av[bag.color] || []).some(([x, y]) => !reserved.has(x + ',' + y)));
  }

  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    if (running && !over && geo) {
      dispatch(now);
      moveGnomes(dt);
      if (!gnomes.length && grid.every(r => r.every(c => !c))) win();
      else if (isStuck()) lose();
    }
    render();
    requestAnimationFrame(frame);
  }

  // ---------- уровни ----------
  function startLevel(index) {
    levelIndex = index;
    pic = PICTURES[index % PICTURES.length];
    level = Engine.buildLevel(pic, index);
    grid = Engine.gridFromPicture(pic);
    W = pic.w; H = pic.h;
    queues = level.queues.map(q => q.map(b => ({ ...b })));
    slots = Array(level.slots).fill(null);
    gnomes = []; reserved = new Set(); avCache = null;
    over = false; extraSlot = false;
    els.level.textContent = `${T.level} ${index + 1}`;
    const hint = [T.hint0, T.hint1, T.hint2][index] || '';
    setHint(hint);
    closeModal();
    show('game');
    layout();      // размер подарков
    renderUI();    // ряды подарков и мешок
    layout();      // поле под оставшееся место
    running = true;
    Platform.gameplayStart();
  }

  function win() {
    over = true;
    Platform.gameplayStop();
    Sound.win();
    save.level = Math.max(save.level, levelIndex + 1);
    Platform.save(save);
    const done = levelIndex;
    setTimeout(() => {
      openModal({
        title: T.winTitle, text: T.winText.replace('{n}', pic.name[lang] || pic.name.ru),
        buttons: [{ label: T.next, primary: true, action: async () => {
          closeModal();
          if (done >= 4) await Platform.showInterstitial();
          startLevel(done + 1);
        } }]
      });
      els.modalArt.hidden = false;
      drawToy(els.modalArt, pic, 170);
    }, 400);
  }

  function lose() {
    over = true;
    Platform.gameplayStop();
    Sound.lose();
    openModal({
      title: T.loseTitle, text: T.loseText,
      buttons: [
        { label: T.revive, primary: true, action: async () => {
          if (!(await Platform.showRewarded())) return;
          slots.push(null); extraSlot = true;
          closeModal(); renderUI(); layout();
          over = false;
          Platform.gameplayStart();
        } },
        { label: T.restart, action: () => startLevel(levelIndex) }
      ]
    });
  }

  async function addSlot() {
    if (extraSlot || over || !running) return;
    running = false;
    const ok = await Platform.showRewarded();
    running = true;
    if (!ok) return;
    slots.push(null); extraSlot = true;
    renderUI(); layout();
  }

  // ---------- экраны ----------
  function openModal({ title, text, buttons }) {
    els.modalTitle.textContent = title;
    els.modalText.textContent = text || '';
    els.modalArt.hidden = true;
    els.modalButtons.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'btn' + (b.primary ? ' primary' : '');
      btn.textContent = b.label;
      btn.addEventListener('click', b.action);
      els.modalButtons.appendChild(btn);
    });
    els.modal.hidden = false;
  }
  function closeModal() { els.modal.hidden = true; }

  function show(name) {
    els.menu.hidden = name !== 'menu';
    els.game.hidden = name !== 'game';
  }

  function openMenu() {
    running = false;
    gnomes = [];
    if (geo) geo.fxCtx.clearRect(0, 0, geo.fw, geo.fh);
    Platform.gameplayStop();
    closeModal();
    show('menu');
    els.play.innerHTML = `${T.play}<span class="sub">${T.level} ${save.level + 1}</span>`;
    const art = $('menu-art');
    const ctx = drawToy(art, PICTURES[0], 170);
    const colors = ['#ff3b3b', '#20b85a', '#2f6bff', '#ffd21f'];
    const cw = parseFloat(art.style.width);
    colors.forEach((c, i) => drawGnome(ctx, cw * (0.15 + i * 0.23), parseFloat(art.style.height) - 14, 26, c, i % 2 ? c : null));
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T[el.dataset.i18n]; });
    document.title = T.title;
    document.documentElement.lang = lang;
  }

  async function main() {
    await Platform.init();
    lang = STR[Platform.lang] ? Platform.lang : 'en';
    T = STR[lang];
    applyI18n();
    $('sack').innerHTML = SACK_SVG;
    const saved = await Platform.load();
    if (saved && typeof saved.level === 'number') save = Object.assign(save, saved);

    Platform.onPause = () => { Sound.paused = true; };
    Platform.onResume = () => { Sound.paused = false; };
    document.addEventListener('visibilitychange', () => { Sound.paused = document.hidden; });

    els.play.addEventListener('click', () => startLevel(save.level));
    $('btn-home').addEventListener('click', openMenu);
    $('btn-restart').addEventListener('click', () => startLevel(levelIndex));
    els.addSlot.addEventListener('click', addSlot);
    els.sound.addEventListener('click', () => { Sound.on = !Sound.on; els.sound.classList.toggle('off', !Sound.on); });
    window.addEventListener('resize', () => { if (grid) { renderUI(); layout(); } });
    document.addEventListener('contextmenu', e => e.preventDefault());

    // для автотестов: index.html#debug
    if (location.hash === '#debug') window.__gifts = { state: () => ({ queues, slots, grid, gnomes: gnomes.length, over }), Engine };

    openMenu();
    requestAnimationFrame(frame);
    Platform.ready();
  }

  main();
})();
