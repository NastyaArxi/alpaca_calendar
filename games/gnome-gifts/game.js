(function () {
  const TOTAL = PICTURES.length; // 48 уровней = 48 игрушек

  const STR = {
    ru: {
      title: 'Гномы и подарки', logo1: 'Гномы', logo2: 'и подарки',
      subtitle: 'Помоги гномам Деда Мороза собрать игрушки в мешок до Нового года',
      play: 'Играть', levelsCount: '{n} уровней', howto: 'Как играть',
      hint0: 'Нажми на цветной квадрат — гномы побегут за блоками этого цвета.',
      hint1: 'Гномы берут только блоки с краю. Разбирай игрушку снаружи внутрь!',
      hint2: 'Если всем квадратам в ячейках нечего брать — проигрыш. Выбирай порядок!',
      levels: 'Уровни', done: 'Пройдено {n} из {t}', daysLeft: 'до Нового года {n} {w}', newYear: 'С Новым годом!',
      chapter: 'Глава', chSub: 'Уровни {a}–{b} · {s} {sw} · {q} колонки', playCard: 'Играть ▸',
      level: 'Уровень', addSlot: '+1 ячейка', restart: 'Заново', forAd: 'за просмотр рекламы',
      next: 'Дальше', replay: 'Сыграть ещё раз', toLevels: 'К уровням', startOver: 'Начать заново',
      nextSub: 'Уровень {n} · {name}', eyebrow: 'Уровень {n} из {t} пройден', winTitle: '{name} в мешке!',
      winText: 'Гномы унесли все {b} {bw}. Дед Мороз доволен!', allDone: 'Все игрушки собраны!',
      loseTitle: 'Гномам нечего брать', loseText: 'Все ячейки заняты, а снаружи игрушки нет блоков нужных цветов.'
    },
    en: {
      title: 'Gnomes & Gifts', logo1: 'Gnomes', logo2: '& Gifts',
      subtitle: "Help Grandfather Frost's gnomes pack the toys into the sack before New Year",
      play: 'Play', levelsCount: '{n} levels', howto: 'How to play',
      hint0: 'Tap a color square: the gnomes will run for blocks of that color.',
      hint1: 'Gnomes only take blocks at the edge. Take the toy apart from the outside in!',
      hint2: 'If no square in the slots has anything to take, you lose. Choose the order!',
      levels: 'Levels', done: '{n} of {t} done', daysLeft: '{n} {w} to New Year', newYear: 'Happy New Year!',
      chapter: 'Chapter', chSub: 'Levels {a}–{b} · {s} slots · {q} columns', playCard: 'Play ▸',
      level: 'Level', addSlot: '+1 slot', restart: 'Restart', forAd: 'watch an ad',
      next: 'Next', replay: 'Play again', toLevels: 'Levels', startOver: 'Start over',
      nextSub: 'Level {n} · {name}', eyebrow: 'Level {n} of {t} complete', winTitle: '{name} packed!',
      winText: 'The gnomes carried all {b} blocks. Grandfather Frost is happy!', allDone: 'All toys packed!',
      loseTitle: 'Nothing to take', loseText: 'All slots are busy, and no blocks of those colors are on the outside of the toy.'
    }
  };
  let T = STR.ru, lang = 'ru';

  // русские окончания: 1 блок, 2 блока, 5 блоков
  function plural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }
  const blocksWord = n => (lang === 'ru' ? plural(n, 'блок', 'блока', 'блоков') : n === 1 ? 'block' : 'blocks');
  const daysWord = n => (lang === 'ru' ? plural(n, 'день', 'дня', 'дней') : n === 1 ? 'day' : 'days');
  const slotsWord = n => plural(n, 'ячейка', 'ячейки', 'ячеек');
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (k in o ? o[k] : ''));
  const toyName = p => p.name[lang] || p.name.ru;
  const chapterOf = i => CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor(i / 12))];

  const $ = id => document.getElementById(id);
  const els = {
    app: $('app'), menu: $('screen-menu'), map: $('screen-map'), game: $('screen-game'),
    stage: $('stage'), board: $('board'), slots: $('slots'), queues: $('queues'),
    level: $('level-label'), levelSub: $('level-sub'), addSlot: $('btn-slot'), sound: $('btn-sound'),
    sack: $('sack'), fx: $('fx'), win: $('win'), lose: $('lose'), mapList: $('map-list')
  };

  const SPEED = 16;       // клеток в секунду
  const PER_BAG = 11;     // гномов одного квадрата одновременно в пути
  const SEND_GAP = 60;    // мс между выходами гномов одного квадрата

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
    // мягкое «пу»: синус, плавно съезжающий вниз, без резкого начала и с приглушёнными верхами
    drop() {
      const n = performance.now();
      if (n - this.last < 70 || !this.on || this.paused) return;
      this.last = n;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this.ctx, t = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        const f0 = 360 + Math.random() * 140;
        o.type = 'sine';
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + 0.1);
        f.type = 'lowpass'; f.frequency.value = 1100;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        o.connect(f).connect(g).connect(ctx.destination);
        o.start(t); o.stop(t + 0.15);
      } catch (e) {}
    },
    done() { [784, 1047, 1319].forEach((f, i) => this.beep(f, 0.12, 'triangle', 0.08, i * 0.07)); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.beep(f, 0.25, 'triangle', 0.1, i * 0.1)); },
    lose() { [300, 220].forEach((f, i) => this.beep(f, 0.3, 'sawtooth', 0.06, i * 0.18)); },
    deny() { this.beep(180, 0.12, 'square', 0.05); }
  };

  // ---------- фоновая музыка ----------
  // Своя мелодия «музыкальной шкатулки»: тихие арпеджио C–Am–F–G и колокольчик сверху.
  const Music = {
    on: true, playing: false, timer: null, next: 0, step: 0, gain: null,
    NOTE: n => 440 * Math.pow(2, ({ C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[n[0]] + (+n.slice(1) - 4) * 12) / 12),
    CHORDS: [['C3', ['C4', 'E4', 'G4', 'E4', 'C5', 'G4', 'E4', 'G4']], ['A2', ['A3', 'C4', 'E4', 'C4', 'A4', 'E4', 'C4', 'E4']],
      ['F2', ['F3', 'A3', 'C4', 'A3', 'F4', 'C4', 'A3', 'C4']], ['G2', ['G3', 'B3', 'D4', 'B3', 'G4', 'D4', 'B3', 'D4']]],
    // по четыре четверти на такт, '-' — пауза; 8 тактов
    MELODY: ['E5', 'G5', 'E5', 'D5', 'C5', 'E5', 'A4', '-', 'A4', 'C5', 'F5', 'E5', 'D5', 'B4', 'G4', '-',
      'E5', 'G5', 'C6', 'G5', 'A5', 'G5', 'E5', '-', 'F5', 'E5', 'D5', 'C5', 'D5', '-', 'G4', '-'],
    EIGHTH: 0.3,
    note(freq, t, dur, type, vol) {
      const ctx = Sound.ctx;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.gain);
      o.start(t); o.stop(t + dur + 0.05);
    },
    schedule() {
      const ctx = Sound.ctx;
      while (this.next < ctx.currentTime + 0.4) {
        const s = this.step % 64, bar = Math.floor(s / 8) % 4, i = s % 8;
        const [bass, arp] = this.CHORDS[bar];
        if (i === 0 || i === 4) this.note(this.NOTE(bass), this.next, 0.9, 'triangle', 0.5);
        this.note(this.NOTE(arp[i]), this.next, 0.35, 'triangle', 0.22);
        if (i % 2 === 0) {
          const m = this.MELODY[Math.floor(s / 2)];
          if (m !== '-') {
            this.note(this.NOTE(m), this.next, 0.9, 'sine', 0.45);
            this.note(this.NOTE(m) * 2, this.next, 0.4, 'sine', 0.08);
          }
        }
        this.next += this.EIGHTH; this.step++;
      }
    },
    start() {
      if (!this.on || this.playing) return;
      try {
        Sound.ctx = Sound.ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (Sound.ctx.state === 'suspended') Sound.ctx.resume();
        if (!this.gain) { this.gain = Sound.ctx.createGain(); this.gain.connect(Sound.ctx.destination); }
        this.gain.gain.value = 0.06;
        this.playing = true;
        this.next = Sound.ctx.currentTime + 0.1;
        this.timer = setInterval(() => this.schedule(), 150);
        this.schedule();
      } catch (e) {}
    },
    stop() {
      this.playing = false;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.gain) this.gain.gain.value = 0;
    }
  };

  // ---------- состояние ----------
  let save = { level: 0, stars: {} };
  let levelIndex = 0, pic = null, level = null;
  let grid = null, W = 0, H = 0, queues = [], slots = [], gnomes = [], reserved = new Set();
  let running = false, over = false, extraSlot = false, revived = false, geo = null, uid = 0;
  let avCache = null, lastGulp = 0;

  // ---------- персонажи (рисунок из UI-кита) ----------
  function gnomeSVG(hat, box) {
    const gift = box ? `<rect x="11" y="1" width="18" height="15" rx="2.5" fill="${box}"/>` +
      '<rect x="18.4" y="1" width="3.2" height="15" fill="#fff"/><rect x="11" y="6.8" width="18" height="3.2" fill="#fff"/>' +
      '<path d="M20 1.5 C15 -3 13 1 20 1.5 Z M20 1.5 C25 -3 27 1 20 1.5 Z" fill="#fff"/>' : '';
    return `<svg viewBox="0 -4 40 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${gift}` +
      '<ellipse cx="20" cy="55" rx="10" ry="8" fill="#C8102E"/><rect x="10" y="54" width="20" height="2.6" fill="#3A1A10"/>' +
      '<rect x="18" y="53.4" width="4" height="3.8" rx="1" fill="#F5C04A"/>' +
      '<ellipse cx="15" cy="63" rx="4" ry="1.6" fill="#3A2416"/><ellipse cx="25" cy="63" rx="4" ry="1.6" fill="#3A2416"/>' +
      `<path d="M20 19 L9 38 H31 Z" fill="${hat}"/><rect x="8" y="35.5" width="24" height="4.5" rx="2.2" fill="#FFFFFF"/>` +
      '<circle cx="20" cy="19" r="3.2" fill="#FFFFFF"/><path d="M11 44 Q20 61 29 44 Z" fill="#FFFFFF"/>' +
      '<rect x="12.5" y="39.5" width="15" height="6.5" rx="3" fill="#FFD3A8"/>' +
      '<circle cx="16.3" cy="42" r="1" fill="#2A2D3E"/><circle cx="23.7" cy="42" r="1" fill="#2A2D3E"/>' +
      '<circle cx="20" cy="44.2" r="1.9" fill="#F28B82"/></svg>';
  }

  const SAD_GNOME = '<svg viewBox="0 0 40 64" aria-hidden="true">' +
    '<ellipse cx="20" cy="55" rx="10" ry="8" fill="#C8102E"/><rect x="10" y="54" width="20" height="2.6" fill="#3A1A10"/>' +
    '<rect x="18" y="53.4" width="4" height="3.8" rx="1" fill="#F5C04A"/>' +
    '<ellipse cx="15" cy="63" rx="4" ry="1.6" fill="#3A2416"/><ellipse cx="25" cy="63" rx="4" ry="1.6" fill="#3A2416"/>' +
    '<path d="M22 22 L8 37 H31 Z" fill="#2F6BEB"/><circle cx="25" cy="21" r="3.2" fill="#fff"/>' +
    '<rect x="8" y="35.5" width="24" height="4.5" rx="2.2" fill="#FFFFFF"/><path d="M11 44 Q20 61 29 44 Z" fill="#FFFFFF"/>' +
    '<rect x="12.5" y="39.5" width="15" height="6.5" rx="3" fill="#FFD3A8"/>' +
    '<path d="M14.8 42.4 q1.5 -1.2 3 0 M22.2 42.4 q1.5 -1.2 3 0" stroke="#2A2D3E" stroke-width="1" fill="none" stroke-linecap="round"/>' +
    '<circle cx="20" cy="44.6" r="1.7" fill="#F28B82"/><path d="M26 44 q1 2.5 0 4" stroke="#7FD8FF" stroke-width="1.2" fill="none"/></svg>';

  const SACK_SVG = '<svg viewBox="0 0 68 62" aria-hidden="true">' +
    '<ellipse cx="34" cy="38" rx="27" ry="22" fill="#C8102E"/>' +
    '<path d="M14 30 Q11 46 21 54" stroke="rgba(255,255,255,.3)" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="34" cy="14" rx="20" ry="8" fill="#4A0612"/>' +
    '<path d="M14 14 Q34 26 54 14" stroke="#F5C04A" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<circle cx="46" cy="44" r="3" fill="#FFFFFF" opacity=".85"/><circle cx="24" cy="46" r="2" fill="#FFFFFF" opacity=".7"/>' +
    '<circle cx="38" cy="52" r="1.6" fill="#FFFFFF" opacity=".7"/></svg>';

  const STAR = (on, mid) => `<svg viewBox="0 0 24 24" class="${mid ? 'mid' : ''}" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${on ? '#F5C04A' : '#E3D6BF'}" stroke="${on ? '#C48A1E' : '#D3C4A8'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;

  // Картинки гномов для холста: по одной на каждый цвет колпака.
  const GNOME_IMG = {};
  Object.keys(PALETTE).forEach(k => {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(gnomeSVG(PALETTE[k]));
    GNOME_IMG[k] = img;
  });

  // ---------- рисование ----------
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // Блок игрушки: скругление, снизу тень (тот же цвет темнее), сверху блик.
  function drawBlock(ctx, x, y, s, key) {
    const r = Math.max(1, s * 0.22);
    ctx.fillStyle = SHADE[key];
    roundRect(ctx, x, y, s, s, r); ctx.fill();
    ctx.fillStyle = PALETTE[key];
    roundRect(ctx, x, y, s, s - Math.max(1, s * 0.16), r); ctx.fill();
    if (s >= 7) {
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.fillRect(x + r, y + s * 0.08, s - 2 * r, Math.max(1, s * 0.1));
    }
  }

  // Гном на холсте: x, y — точка у ног; s — высота. Переваливается при ходьбе.
  function drawGnome(ctx, x, y, s, key, carry, t) {
    const img = GNOME_IMG[key];
    const w = s * 40 / 70;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 19.6) * 0.14);
    if (img && img.complete) ctx.drawImage(img, -w / 2, -s, w, s);
    if (carry) {
      const b = s * 0.3;
      drawBlock(ctx, -b / 2, -s * 0.98, b, carry);
    }
    ctx.restore();
  }

  function setupCanvas(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawToy(canvas, p, maxW, maxH) {
    const c = Math.max(1, Math.floor(Math.min(maxW / p.w, maxH / p.h) * 4) / 4);
    const ctx = setupCanvas(canvas, c * p.w, c * p.h);
    p.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      if (c >= 5) drawBlock(ctx, x * c + 0.4, y * c + 0.4, c - 0.8, ch);
      else { ctx.fillStyle = PALETTE[ch]; ctx.fillRect(x * c, y * c, c * 0.86, c * 0.86); }
    }));
  }

  // ---------- гирлянда ----------
  function buildGarland() {
    const lc = ['#FF4D4F', '#FFD23F', '#2BD46F', '#4DB8FF', '#FF7AD9'];
    const n = 14, wave = x => 6 + 9 * Math.abs(Math.sin(Math.PI * x * 4));
    let pts = '';
    for (let i = 0; i <= 100; i++) pts += `${i},${wave(i / 100).toFixed(1)} `;
    let bulbs = '';
    for (let i = 0; i < n; i++) {
      const fx = (i + 0.5) / n;
      bulbs += `<ellipse class="bulb" cx="${fx * 100}" cy="${wave(fx) + 6}" rx=".9" ry="5" fill="${lc[i % 5]}" style="animation-delay:${((i * 0.37) % 1.6).toFixed(2)}s;filter:drop-shadow(0 0 3px ${lc[i % 5]})"/>`;
    }
    $('garland').innerHTML = `<svg viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#1B3A2C" stroke-width="1.5" vector-effect="non-scaling-stroke"/>${bulbs}</svg>`;
  }

  // ---------- раскладка уровня ----------
  // Поле рисуется на #board внутри карточки. Гномы — на слое #fx поверх всего экрана,
  // потому что бегают от ячеек к игрушке и обратно в мешок.
  function layout() {
    if (!grid) return;
    const width = Math.min(window.innerWidth, 480) - 32;
    const n = Math.max(slots.length, queues.length);
    const tile = Math.floor(Math.max(40, Math.min(62, (width - (n - 1) * 8) / n, window.innerHeight / 13.6)));
    document.documentElement.style.setProperty('--tile', tile + 'px');
    const r = els.stage.getBoundingClientRect();
    const c = Math.max(6, Math.min(22, Math.floor(Math.min((r.width - 20) / (W + 2), (r.height - 30) / (H + 2)))));
    const w = (W + 2) * c, h = (H + 2) * c;
    geo = { c, w, h, ox: c, oy: c, ctx: setupCanvas(els.board, w, h) };
    const g = els.app.getBoundingClientRect();
    geo.fxCtx = setupCanvas(els.fx, g.width, g.height);
    geo.fw = g.width; geo.fh = g.height;
    locate();
  }

  // Где поле, мешок и квадраты в ячейках находятся на слое гномов.
  function locate() {
    if (!geo) return;
    const g = els.app.getBoundingClientRect(), b = els.board.getBoundingClientRect(), s = els.sack.getBoundingClientRect();
    geo.bx = b.left - g.left; geo.by = b.top - g.top;
    geo.mouth = { x: s.left - g.left + s.width / 2, y: s.top - g.top + s.height * 0.3 };
    slots.forEach(bag => {
      if (!bag) return;
      const el = els.slots.querySelector(`[data-id="${bag.id}"]`);
      if (!el) return;
      const e = el.getBoundingClientRect();
      bag.origin = { x: e.left - g.left + e.width / 2, y: e.top - g.top + 4 };
    });
  }

  const cellXY = (x, y) => ({ x: geo.bx + geo.ox + (x + 0.5) * geo.c, y: geo.by + geo.oy + (y + 0.5) * geo.c });

  function render(now) {
    if (!geo || !grid) return;
    const { ctx, c, ox, oy, w, h } = geo;
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (ch) drawBlock(ctx, ox + x * c + 0.5, oy + y * c + 0.5, c - 1, ch);
    }
    const fx = geo.fxCtx, t = now / 1000;
    fx.clearRect(0, 0, geo.fw, geo.fh);
    const s = Math.max(20, c * 1.9);
    gnomes.forEach((g, i) => drawGnome(fx, g.x, g.y + s * 0.45, s, g.color, g.carry, t + i * 0.13));
  }

  // ---------- плитки в очередях и ячейках ----------
  function tileEl(key, n, cls) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'tile ' + cls;
    d.style.background = PALETTE[key];
    d.style.color = INK[key];
    d.style.boxShadow = `0 5px 0 ${SHADE[key]}, inset 0 3px 0 rgba(255,255,255,.3)`;
    d.innerHTML = `<span class="n">${n}</span>`;
    return d;
  }

  function renderUI() {
    els.queues.innerHTML = '';
    queues.forEach((q, qi) => {
      const col = document.createElement('div');
      col.className = 'queue';
      q.slice(0, 2).forEach((bag, i) => {
        const el = tileEl(bag.color, bag.n, i === 0 ? 'front' : 'back');
        if (i === 0) el.addEventListener('pointerdown', e => { e.preventDefault(); pick(qi); });
        else el.tabIndex = -1;
        col.appendChild(el);
      });
      const more = document.createElement('div');
      more.className = 'more';
      more.textContent = q.length > 2 ? `+${q.length - 2}` : '';
      col.appendChild(more);
      els.queues.appendChild(col);
    });
    els.slots.innerHTML = '';
    slots.forEach((bag, i) => {
      const s = document.createElement('div');
      s.className = 'slot' + (extraSlot && i === slots.length - 1 ? ' extra' : '');
      if (bag) {
        const el = tileEl(bag.color, bag.n - bag.delivered, 'active');
        el.dataset.id = bag.id;
        el.tabIndex = -1;
        s.appendChild(el);
      }
      els.slots.appendChild(s);
    });
    els.slots.classList.toggle('full', slots.every(Boolean));
    els.addSlot.disabled = extraSlot;
    locate();
  }

  function updateCounter(bag) {
    const el = els.slots.querySelector(`[data-id="${bag.id}"] .n`);
    if (el) el.textContent = bag.n - bag.delivered;
  }

  function pick(qi) {
    if (!running || over) return;
    const q = queues[qi];
    if (!q || !q.length) return;
    const free = slots.indexOf(null);
    if (free < 0) {
      Sound.deny();
      els.slots.classList.remove('shake'); void els.slots.offsetWidth; els.slots.classList.add('shake');
      return;
    }
    const b = q.shift();
    slots[free] = { id: ++uid, color: b.color, n: b.n, delivered: 0, claimed: 0, out: 0, lastSend: 0 };
    Sound.tap();
    renderUI();
  }

  // ---------- гномы ----------
  function availableNow() {
    if (!avCache) avCache = Engine.available(grid);
    return avCache;
  }

  // Путь по пустым клеткам от клетки под полем до соседней с блоком клетки.
  function findPath(tx, ty, sx) {
    const out = Engine.outside(grid);
    const sy = H;
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
      const origin = bag.origin || geo.mouth;
      // клетка под полем напротив квадрата — отсюда гномы заходят на поле
      const sx = Math.max(-1, Math.min(W, Math.round((origin.x - geo.bx - geo.ox) / geo.c - 0.5)));
      list.sort((a, b) => (a[0] - sx) ** 2 + (a[1] - H) ** 2 - ((b[0] - sx) ** 2 + (b[1] - H) ** 2));
      for (const [tx, ty] of list.slice(0, 6)) {
        const path = findPath(tx, ty, sx);
        if (!path) continue;
        reserved.add(tx + ',' + ty);
        bag.claimed++; bag.out++; bag.lastSend = now;
        const pts = [{ ...origin }, ...path.map(([x, y]) => cellXY(x, y))];
        gnomes.push({ bag, color: bag.color, pts, i: 0, x: pts[0].x, y: pts[0].y, target: [tx, ty], carry: null, back: false });
        return;
      }
    });
  }

  function moveGnomes(dt, now) {
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
        // дошёл до блока: забирает его и несёт в мешок
        const [tx, ty] = g.target;
        grid[ty][tx] = null; reserved.delete(tx + ',' + ty); avCache = null;
        g.carry = g.color; g.back = true; g.i = 0;
        g.pts = [...g.pts.slice(1, -1).reverse(), { ...geo.mouth }];
        Sound.drop();
        return true;
      }
      // донёс до мешка
      const bag = g.bag;
      bag.delivered++; bag.out--;
      if (now - lastGulp > 280) {
        lastGulp = now;
        els.sack.classList.remove('gulp'); void els.sack.offsetWidth; els.sack.classList.add('gulp');
      }
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
      moveGnomes(dt, now);
      if (!gnomes.length && grid.every(r => r.every(c => !c))) win();
      else if (isStuck()) lose();
    }
    if (!els.game.hidden) render(now);
    requestAnimationFrame(frame);
  }

  // ---------- уровни ----------
  function blocksIn(p) { return p.rows.join('').replace(/\./g, '').length; }

  function startLevel(index) {
    levelIndex = Math.min(index, TOTAL - 1);
    pic = PICTURES[levelIndex];
    const ch = chapterOf(levelIndex);
    level = Engine.buildLevel(pic, levelIndex, ch);
    grid = Engine.gridFromPicture(pic);
    W = pic.w; H = pic.h;
    queues = level.queues.map(q => q.map(b => ({ ...b })));
    slots = Array(level.slots).fill(null);
    gnomes = []; reserved = new Set(); avCache = null;
    over = false; extraSlot = false; revived = false;
    els.level.textContent = `${T.level} ${levelIndex + 1}`;
    const b = blocksIn(pic);
    els.levelSub.textContent = `${ch.name[lang] || ch.name.ru} · ${toyName(pic)} · ${b} ${blocksWord(b)}`;
    els.win.hidden = true; els.lose.hidden = true;
    show('game');
    layout();      // размер плиток
    renderUI();    // плитки, ячейки и мешок
    layout();      // поле под оставшееся место
    running = true;
    Platform.gameplayStart();
  }

  function confetti() {
    const pal = ['#E8383D', '#F5C04A', '#3EC1F3', '#22A45D', '#FF6FB5', '#8B4DF0', '#FF8A1F', '#FFFFFF'];
    let html = '';
    for (let i = 0; i < 26; i++) {
      html += `<i style="left:${(i * 53) % 100}%;width:${6 + (i % 3) * 2}px;height:${10 + (i % 2) * 4}px;background:${pal[i % pal.length]};` +
        `animation-duration:${(4 + (i % 5) * 0.7).toFixed(1)}s;animation-delay:${(-(i * 0.47) % 5).toFixed(2)}s"></i>`;
    }
    $('confetti').innerHTML = html;
  }

  function gnomeRow(el, boxes, hats) {
    el.innerHTML = boxes.map((b, i) => `<div class="g" style="animation-delay:${(i * 0.14).toFixed(2)}s">${gnomeSVG(hats[i % hats.length], b)}</div>`).join('');
  }

  function win() {
    over = true;
    running = false;
    Platform.gameplayStop();
    Sound.win();
    const stars = Math.max(1, 3 - (extraSlot ? 1 : 0) - (revived ? 1 : 0));
    save.stars[levelIndex] = Math.max(save.stars[levelIndex] || 0, stars);
    save.level = Math.max(save.level, levelIndex + 1);
    Platform.save(save);
    const b = blocksIn(pic), last = levelIndex >= TOTAL - 1;
    setTimeout(() => {
      $('win-stars').innerHTML = STAR(stars >= 1) + STAR(stars >= 2, true) + STAR(stars >= 3);
      $('win-eyebrow').textContent = fill(T.eyebrow, { n: levelIndex + 1, t: TOTAL });
      $('win-title').textContent = last ? T.allDone : fill(T.winTitle, { name: toyName(pic) });
      $('win-text').textContent = fill(T.winText, { b, bw: blocksWord(b) });
      drawToy($('win-toy'), pic, 220, 130);
      $('btn-next').querySelector('b').textContent = last ? T.toLevels : T.next;
      $('next-sub').textContent = last ? T.newYear : fill(T.nextSub, { n: levelIndex + 2, name: toyName(PICTURES[levelIndex + 1]) });
      gnomeRow($('win-gnomes'), ['#E8383D', '#3EC1F3', '#F5C04A', '#22A45D', '#FF8A1F'], ['#22A45D', '#C8102E', '#2F6BEB', '#C8102E', '#8B4DF0']);
      confetti();
      els.win.hidden = false;
    }, 450);
  }

  function lose() {
    over = true;
    running = false;
    Platform.gameplayStop();
    Sound.lose();
    const box = $('lose-slots');
    box.innerHTML = '';
    slots.filter(Boolean).forEach(bag => { const t = tileEl(bag.color, bag.n - bag.delivered, ''); t.tabIndex = -1; box.appendChild(t); });
    els.lose.hidden = false;
  }

  async function revive() {
    if (!(await Platform.showRewarded())) return;
    slots.push(null); extraSlot = true; revived = true;
    els.lose.hidden = true;
    renderUI(); layout();
    over = false; running = true;
    Platform.gameplayStart();
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
  function show(name) {
    els.menu.hidden = name !== 'menu';
    els.map.hidden = name !== 'map';
    els.game.hidden = name !== 'game';
    if (name !== 'game') {
      running = false;
      gnomes = [];
      if (geo) geo.fxCtx.clearRect(0, 0, geo.fw, geo.fh);
      Platform.gameplayStop();
    }
  }

  function openMenu() {
    els.win.hidden = true; els.lose.hidden = true;
    show('menu');
    $('play-sub').textContent = fill(T.levelsCount, { n: TOTAL });
    const colors = ['#FF8A1F', '#22A45D', '#E8383D'];
    $('howto-list').innerHTML = [T.hint0, T.hint1, T.hint2].map((t, i) => `<li><i style="background:${colors[i]}">${i + 1}</i><span>${t}</span></li>`).join('');
    gnomeRow($('menu-gnomes'), ['#22A45D', '#3EC1F3', '#C8102E', '#8B4DF0', '#FF8A1F', '#FF6FB5', '#2F6BEB'],
      ['#C8102E', '#F5C04A', '#22A45D', '#C8102E', '#2F6BEB', '#F5C04A', '#22A45D']);
  }

  function daysToNewYear() {
    const now = new Date();
    const ny = new Date(now.getFullYear() + 1, 0, 1);
    return Math.ceil((ny - now) / 86400000);
  }

  function openMap(scrollToCurrent = true) {
    els.win.hidden = true; els.lose.hidden = true;
    show('map');
    const done = Math.min(save.level, TOTAL);
    const stars = Object.values(save.stars).reduce((a, b) => a + b, 0);
    $('stars-total').textContent = stars;
    $('map-done').textContent = fill(T.done, { n: done, t: TOTAL });
    const d = daysToNewYear();
    $('map-days').textContent = d <= 7 && new Date().getMonth() === 0 ? T.newYear : fill(T.daysLeft, { n: d, w: daysWord(d) });
    $('map-bar').style.width = (done / TOTAL) * 100 + '%';
    const list = els.mapList;
    list.innerHTML = '';
    let currentEl = null;
    CHAPTERS.forEach((ch, ci) => {
      const sec = document.createElement('section');
      const a = ci * 12 + 1, b = ci * 12 + 12;
      const sub = lang === 'ru'
        ? `Уровни ${a}–${b} · ${ch.slots} ${slotsWord(ch.slots)} · ${ch.queues} колонки`
        : fill(T.chSub, { a, b, s: ch.slots, q: ch.queues });
      const flakes = [0, 1, 2, 3].map(k => `<span class="${k <= ci ? '' : 'dim'}">❄</span>`).join('');
      sec.innerHTML = `<div class="chapter-head"><div class="ch-num" style="background:${ch.color}">${ci + 1}</div>` +
        `<div><div class="ch-title">${T.chapter} ${ci + 1} · ${ch.name[lang] || ch.name.ru}</div><div class="ch-sub">${sub}</div></div>` +
        `<div class="flakes" aria-hidden="true">${flakes}</div></div><div class="levels-grid"></div>`;
      const gridEl = sec.querySelector('.levels-grid');
      for (let i = ci * 12; i < ci * 12 + 12 && i < TOTAL; i++) {
        const card = document.createElement('button');
        card.type = 'button';
        const state = i < done ? 'done' : i === done ? 'current' : 'locked';
        card.className = 'lvl ' + state;
        card.setAttribute('aria-label', `${T.level} ${i + 1} · ${toyName(PICTURES[i])}`);
        const cv = document.createElement('canvas');
        if (state === 'current') {
          const inner = document.createElement('div'); inner.className = 'inner'; inner.appendChild(cv); card.appendChild(inner);
          card.insertAdjacentHTML('beforeend', `<span class="num">${i + 1}</span><span class="go">${T.playCard}</span>`);
          currentEl = card;
        } else {
          card.appendChild(cv);
          const st = save.stars[i] || 0;
          card.insertAdjacentHTML('beforeend', `<span class="num">${i + 1}</span>` +
            (state === 'done' ? `<span class="st">${'★'.repeat(st)}<span class="e">${'★'.repeat(3 - st)}</span></span>` : '<span class="lock"></span>'));
        }
        card.addEventListener('click', () => {
          if (state === 'locked') { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); Sound.deny(); return; }
          startLevel(i);
        });
        gridEl.appendChild(card);
        requestAnimationFrame(() => drawToy(cv, PICTURES[i], 84, 62));
      }
      list.appendChild(sec);
    });
    // прокручиваем к началу главы с текущим уровнем, чтобы её заголовок был виден
    if (scrollToCurrent && currentEl) {
      const sec = currentEl.closest('section');
      requestAnimationFrame(() => { list.scrollTop = sec.offsetTop - list.offsetTop - 12; });
    } else list.scrollTop = 0;
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => { if (T[el.dataset.i18n]) el.textContent = T[el.dataset.i18n]; });
    document.title = T.title;
    document.documentElement.lang = lang;
  }

  async function main() {
    await Platform.init();
    lang = STR[Platform.lang] ? Platform.lang : 'en';
    T = STR[lang];
    applyI18n();
    els.sack.innerHTML = SACK_SVG;
    $('sad-gnome').innerHTML = SAD_GNOME;
    buildGarland();
    const saved = await Platform.load();
    if (saved && typeof saved.level === 'number') save = { level: saved.level, stars: saved.stars || {} };

    Platform.onPause = () => { Sound.paused = true; Music.stop(); };
    Platform.onResume = () => { Sound.paused = false; Music.start(); };
    document.addEventListener('visibilitychange', () => (document.hidden ? Platform.onPause() : Platform.onResume()));

    $('btn-play').addEventListener('click', () => openMap());
    $('btn-map-back').addEventListener('click', openMenu);
    $('btn-map').addEventListener('click', () => openMap());
    $('btn-restart').addEventListener('click', () => startLevel(levelIndex));
    els.addSlot.addEventListener('click', addSlot);
    $('btn-next').addEventListener('click', async () => {
      const done = levelIndex;
      els.win.hidden = true;
      if (done >= TOTAL - 1) return openMap();
      if (done >= 4) await Platform.showInterstitial();
      startLevel(done + 1);
    });
    $('btn-replay').addEventListener('click', () => startLevel(levelIndex));
    $('btn-revive').addEventListener('click', revive);
    $('btn-lose-map').addEventListener('click', () => openMap());
    $('btn-lose-restart').addEventListener('click', () => startLevel(levelIndex));
    els.sound.addEventListener('click', () => {
      Sound.on = Music.on = !Sound.on;
      els.sound.classList.toggle('off', !Sound.on);
      if (Music.on) Music.start(); else Music.stop();
    });
    // музыка стартует после первого нажатия: браузеры не дают играть звук без действия игрока
    document.addEventListener('pointerdown', () => Music.start(), { once: true });
    window.addEventListener('resize', () => { if (grid && !els.game.hidden) { renderUI(); layout(); } });
    document.addEventListener('contextmenu', e => e.preventDefault());

    // для автотестов: index.html#debug
    if (location.hash === '#debug') window.__gifts = { state: () => ({ queues, slots, grid, gnomes: gnomes.length, over }), Engine, start: startLevel, lose };

    openMenu();
    requestAnimationFrame(frame);
    Platform.ready();
  }

  main();
})();
