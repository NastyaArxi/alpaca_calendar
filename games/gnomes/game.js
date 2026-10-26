(function () {
  const STR = {
    ru: {
      title: 'Гномы Деда Мороза', subtitle: 'Помоги гномам собрать подарки по цветам', play: 'Играть',
      slots: 'Ждут на скамейке', addSlot: '+1 место', restart: 'Заново', level: 'Уровень', track: 'На дорожке',
      hint0: 'Нажми на отряд: гномы побегут вокруг картинки и унесут блоки своего цвета.',
      hint1: 'Гномы берут только крайний блок в ряду. Разбирай картинку слоями, снаружи внутрь!',
      hint2: 'Отряду нечего забрать? Отправь его — он подождёт на скамейке.',
      winTitle: 'Подарок собран!', next: 'Дальше',
      loseTitle: 'Скамейка заполнена!', loseText: 'Гномам негде ждать. Добавь место или начни заново.',
      revive: 'Ещё место ▶', stuckTitle: 'Ходов нет', stuckText: 'Ни один отряд не может забрать блок. Попробуй другой порядок.'
    },
    en: {
      title: "Santa's Gnomes", subtitle: 'Help the gnomes collect gifts by color', play: 'Play',
      slots: 'Waiting bench', addSlot: '+1 seat', restart: 'Restart', level: 'Level', track: 'On track',
      hint0: 'Tap a squad: the gnomes run around the picture and carry away blocks of their color.',
      hint1: 'Gnomes only take the outermost block in a line. Peel the picture from the outside in!',
      hint2: 'Nothing to take yet? Send the squad anyway: it will wait on the bench.',
      winTitle: 'Gift collected!', next: 'Next',
      loseTitle: 'Bench is full!', loseText: 'The gnomes have nowhere to wait. Add a seat or restart.',
      revive: 'One more seat ▶', stuckTitle: 'No moves', stuckText: 'No squad can take a block. Try a different order.'
    }
  };
  let T = STR.ru, lang = 'ru';

  const $ = id => document.getElementById(id);
  const els = {
    menu: $('screen-menu'), game: $('screen-game'), stage: $('stage'), board: $('board'),
    slots: $('slots'), queues: $('queues'), level: $('level-label'), hint: $('hint'),
    track: $('track-info'), addSlot: $('btn-slot'), modal: $('modal'), modalTitle: $('modal-title'),
    modalText: $('modal-text'), modalArt: $('modal-art'), modalButtons: $('modal-buttons'), sound: $('btn-sound')
  };

  const TICK = 80;
  const SKIN = '#ffd2a8';

  // ---------- звук ----------
  const Sound = {
    ctx: null, on: true, paused: false, lastEat: 0,
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
    launch() { this.beep(440, 0.08, 'triangle'); this.beep(660, 0.08, 'triangle', 0.08, 0.06); },
    eat() { const now = performance.now(); if (now - this.lastEat < 45) return; this.lastEat = now; this.beep(900 + Math.random() * 300, 0.04, 'square', 0.03); },
    done() { [784, 1047].forEach((f, i) => this.beep(f, 0.12, 'triangle', 0.08, i * 0.07)); },
    park() { this.beep(330, 0.12, 'triangle', 0.08); },
    win() { [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 0.25, 'triangle', 0.12, i * 0.12)); },
    lose() { [300, 220].forEach((f, i) => this.beep(f, 0.3, 'sawtooth', 0.06, i * 0.18)); }
  };

  // ---------- состояние ----------
  let save = { level: 0, done: [] };
  let levelIndex = 0, pic = null, st = null;
  let running = false, extraSlot = false, particles = [];
  let geo = null;

  // ---------- рисование ----------
  function drawGnome(ctx, x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y + s * 0.28, s * 0.27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(x, y - 0.02 * s, s * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x - s * 0.18, y + s * 0.02); ctx.quadraticCurveTo(x, y + s * 0.42, x + s * 0.18, y + s * 0.02); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x - s * 0.22, y - s * 0.1); ctx.lineTo(x + s * 0.22, y - s * 0.1); ctx.lineTo(x + s * 0.08, y - s * 0.52); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0006'; ctx.lineWidth = Math.max(1, s * 0.04); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + s * 0.08, y - s * 0.52, s * 0.07, 0, Math.PI * 2); ctx.fill();
  }

  function gnomeSVG(color) {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="30" r="9" fill="${color}"/>` +
      `<circle cx="20" cy="19" r="6" fill="${SKIN}"/><path d="M13 20 Q20 34 27 20 Z" fill="#fff"/>` +
      `<polygon points="11,16 29,16 23,2" fill="${color}" stroke="#0006" stroke-width="1"/><circle cx="23" cy="2.5" r="2.4" fill="#fff"/></svg>`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawBlocks(ctx, grid, W, H, cell, ox, oy) {
    ctx.fillStyle = '#16224a';
    roundRect(ctx, ox - 2, oy - 2, W * cell + 4, H * cell + 4, 6); ctx.fill();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = grid[y][x];
        if (!c) continue;
        const px = ox + x * cell, py = oy + y * cell;
        ctx.fillStyle = PALETTE[c];
        roundRect(ctx, px + 0.5, py + 0.5, cell - 1, cell - 1, Math.max(1, cell * 0.18)); ctx.fill();
        ctx.fillStyle = '#ffffff30';
        ctx.fillRect(px + cell * 0.18, py + cell * 0.15, cell * 0.3, cell * 0.14);
      }
    }
  }

  function setupCanvas(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawStaticPicture(canvas, p, size) {
    const cell = Math.floor(size / Math.max(p.w, p.h));
    const ctx = setupCanvas(canvas, cell * p.w + 8, cell * p.h + 8);
    drawBlocks(ctx, p.rows.map(r => [...r].map(ch => (ch === '.' ? null : ch))), p.w, p.h, cell, 4, 4);
  }

  function layout() {
    if (!st) return;
    const r = els.stage.getBoundingClientRect();
    const span = Math.max(st.W, st.H) + 2;
    const cell = Math.max(8, Math.floor(Math.min(r.width, r.height) / (span + 0.6)));
    const pad = Math.round(cell * 0.3);
    const w = cell * (st.W + 2) + pad * 2, h = cell * (st.H + 2) + pad * 2;
    geo = { cell, pad, ctx: setupCanvas(els.board, w, h), w, h };
    const width = Math.min(window.innerWidth, 560) - 24;
    const maxCards = Math.max(st.slots.length, st.queues.length);
    const card = Math.floor(Math.max(36, Math.min(56, (width - 12) / maxCards - 8, (window.innerHeight - 200) / 8)));
    document.documentElement.style.setProperty('--card', card + 'px');
  }

  function ringXY(f) {
    const P = st.ring.length;
    const i = Math.floor(f), t = f - i;
    const a = st.ring[((i % P) + P) % P], b = st.ring[(((i + 1) % P) + P) % P];
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    return { x: geo.pad + (x + 1.5) * geo.cell, y: geo.pad + (y + 1.5) * geo.cell };
  }

  function render(t) {
    if (!st || !geo) return;
    const { ctx, cell, pad, w, h } = geo;
    ctx.clearRect(0, 0, w, h);
    // дорожка
    ctx.strokeStyle = '#0a1330'; ctx.lineWidth = cell * 0.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    st.ring.forEach((c, i) => {
      const x = pad + (c.x + 1.5) * cell, y = pad + (c.y + 1.5) * cell;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = '#ffffff18'; ctx.lineWidth = 2; ctx.setLineDash([cell * 0.3, cell * 0.5]); ctx.stroke(); ctx.setLineDash([]);
    const start = ringXY(0);
    ctx.fillStyle = '#ffd23f55';
    ctx.beginPath(); ctx.arc(start.x, start.y, cell * 0.45, 0, Math.PI * 2); ctx.fill();

    drawBlocks(ctx, st.grid, st.W, st.H, cell, pad + cell, pad + cell);

    // летящие блоки
    const now = performance.now();
    particles = particles.filter(p => now - p.t0 < 220);
    particles.forEach(p => {
      const k = (now - p.t0) / 220;
      const target = ringXY(p.squad.pos === undefined ? 0 : p.squad.pos);
      const x = p.x + (target.x - p.x) * k, y = p.y + (target.y - p.y) * k;
      const s = cell * (1 - k * 0.6);
      ctx.fillStyle = PALETTE[p.color];
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    });

    // отряды
    const P = st.ring.length;
    st.conveyor.forEach(sq => {
      const f = Math.min(sq.prev + (sq.pos - sq.prev) * t, P - 0.01);
      const len = Math.min(sq.n, 4);
      for (let i = len - 1; i >= 0; i--) {
        const fi = f - i * 0.8;
        if (fi < 0) continue;
        const p = ringXY(fi);
        drawGnome(ctx, p.x, p.y, cell * (i ? 0.85 : 1.05), PALETTE[sq.color]);
      }
      const lead = ringXY(f);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(lead.x + cell * 0.45, lead.y - cell * 0.55, cell * 0.36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a2a';
      ctx.font = `bold ${Math.round(cell * 0.46)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sq.n, lead.x + cell * 0.45, lead.y - cell * 0.53);
    });
  }

  // ---------- интерфейс отрядов ----------
  function squadEl(sq) {
    const d = document.createElement('div');
    d.className = 'squad';
    d.innerHTML = gnomeSVG(PALETTE[sq.color]) + `<b>${sq.n}</b>`;
    return d;
  }

  function renderUI() {
    const full = Engine.onBoard(st) >= st.cap;
    els.track.textContent = `${T.track}: ${Engine.onBoard(st)}/${st.cap}`;
    els.queues.innerHTML = '';
    st.queues.forEach((q, qi) => {
      const col = document.createElement('div');
      col.className = 'queue';
      q.slice(0, 3).forEach((sq, i) => {
        const el = squadEl(sq);
        if (i === 0) {
          el.classList.add('front');
          if (full) el.classList.add('busy');
          el.addEventListener('pointerdown', e => { e.preventDefault(); launch(() => Engine.launchFromQueue(st, qi)); });
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
    st.slots.forEach((sq, si) => {
      const slot = document.createElement('div');
      slot.className = 'slot' + (extraSlot && si === st.slots.length - 1 ? ' extra' : '');
      if (sq) {
        const el = squadEl(sq);
        el.classList.add('front');
        if (full) el.classList.add('busy');
        el.addEventListener('pointerdown', e => { e.preventDefault(); launch(() => Engine.launchFromSlot(st, si)); });
        slot.appendChild(el);
      }
      els.slots.appendChild(slot);
    });
    els.slots.classList.toggle('danger', st.slots.every(Boolean));
    els.addSlot.disabled = extraSlot;
  }

  function launch(fn) {
    if (!running || st.status !== 'play') return;
    if (fn()) {
      Sound.launch();
      if (levelIndex === 0) els.hint.hidden = true;
      renderUI();
    }
  }

  // ---------- игровой цикл ----------
  function tick() {
    const before = st.pending.length;
    Engine.step(st);
    let changed = st.pending.length !== before;
    st.events.forEach(ev => {
      if (ev.type === 'eat') {
        Sound.eat();
        particles.push({ x: geo.pad + (ev.x + 1.5) * geo.cell, y: geo.pad + (ev.y + 1.5) * geo.cell, color: ev.color, squad: ev.squad, t0: performance.now() });
      } else if (ev.type === 'done') { Sound.done(); changed = true; }
      else if (ev.type === 'parked') { Sound.park(); changed = true; }
    });
    if (changed) renderUI();
    if (st.status === 'win') return win();
    if (st.status === 'lose') return lose();
    if (!st.conveyor.length && !st.pending.length && isStuck()) stuck();
  }

  function isStuck() {
    const ex = Engine.exposed(st.grid, st.W, st.H);
    // пока есть свободное место на скамейке, любой отряд можно «отложить»
    if (st.slots.some(s => !s)) return false;
    const ready = [...st.queues.map(q => q[0]), ...st.slots].filter(Boolean);
    return ready.length > 0 && !ready.some(s => ex[s.color]);
  }

  let lastFrame = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(now - lastFrame, 250);
    lastFrame = now;
    if (running && st && st.status === 'play') {
      acc += dt;
      while (acc >= TICK && running) { acc -= TICK; tick(); }
    }
    render(running ? acc / TICK : 1);
    requestAnimationFrame(frame);
  }

  // ---------- уровни ----------
  function startLevel(index) {
    levelIndex = index;
    pic = PICTURES[index % PICTURES.length];
    st = Engine.createGame(Engine.buildLevel(pic, index));
    extraSlot = false; particles = []; acc = 0;
    els.level.textContent = `${T.level} ${index + 1}`;
    const hint = [T.hint0, T.hint1, T.hint2][index] || '';
    els.hint.textContent = hint; els.hint.hidden = !hint;
    closeModal();
    show('game');
    layout();
    renderUI();
    running = true;
    Platform.gameplayStart();
  }

  function win() {
    running = false;
    Platform.gameplayStop();
    Sound.win();
    if (!save.done.includes(pic.id)) save.done.push(pic.id);
    save.level = Math.max(save.level, levelIndex + 1);
    Platform.save(save);
    const finished = levelIndex;
    setTimeout(() => openModal({
      title: T.winTitle, text: pic.name[lang] || pic.name.ru, art: pic,
      buttons: [{ label: T.next, primary: true, action: async () => {
        closeModal();
        if (finished >= 4) await Platform.showInterstitial();
        startLevel(finished + 1);
      } }]
    }), 300);
  }

  function lose() {
    running = false;
    Platform.gameplayStop();
    Sound.lose();
    openModal({
      title: T.loseTitle, text: T.loseText,
      buttons: [
        { label: T.revive, primary: true, action: async () => {
          if (!(await Platform.showRewarded())) return;
          // отряд, которому не хватило места, садится на новое место
          const P = st.ring.length;
          const sq = st.conveyor.find(s => s.pos >= P);
          st.conveyor = st.conveyor.filter(s => s !== sq);
          Engine.addSlot(st);
          st.slots[st.slots.length - 1] = sq;
          st.status = 'play';
          extraSlot = true;
          closeModal(); layout(); renderUI();
          running = true;
          Platform.gameplayStart();
        } },
        { label: T.restart, action: () => startLevel(levelIndex) }
      ]
    });
  }

  function stuck() {
    running = false;
    Platform.gameplayStop();
    Sound.lose();
    openModal({ title: T.stuckTitle, text: T.stuckText, buttons: [{ label: T.restart, primary: true, action: () => startLevel(levelIndex) }] });
  }

  async function addSlot() {
    if (extraSlot || !st || st.status !== 'play') return;
    running = false;
    const ok = await Platform.showRewarded();
    running = true;
    if (!ok) return;
    Engine.addSlot(st);
    extraSlot = true;
    layout(); renderUI();
  }

  // ---------- экраны ----------
  function openModal({ title, text, art, buttons }) {
    els.modalTitle.textContent = title;
    els.modalText.textContent = text || '';
    els.modalArt.hidden = !art;
    if (art) drawStaticPicture(els.modalArt, art, 176);
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
    Platform.gameplayStop();
    closeModal();
    show('menu');
    const art = $('menu-art');
    drawStaticPicture(art, PICTURES[0], 160);
    const ctx = art.getContext('2d');
    const colors = ['#e63946', '#1f8a3f', '#2f6fe0', '#ffd23f'];
    colors.forEach((c, i) => drawGnome(ctx, 24 + i * 36, 150, 30, c));
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
    const saved = await Platform.load();
    if (saved && typeof saved.level === 'number') save = { level: saved.level, done: saved.done || [] };

    Platform.onPause = () => { Sound.paused = true; };
    Platform.onResume = () => { Sound.paused = false; };
    document.addEventListener('visibilitychange', () => { Sound.paused = document.hidden; });

    $('btn-play').addEventListener('click', () => startLevel(save.level));
    $('btn-home').addEventListener('click', openMenu);
    $('btn-restart').addEventListener('click', () => startLevel(levelIndex));
    els.addSlot.addEventListener('click', addSlot);
    els.sound.addEventListener('click', () => { Sound.on = !Sound.on; els.sound.classList.toggle('off', !Sound.on); });
    window.addEventListener('resize', () => { layout(); if (st) renderUI(); });
    document.addEventListener('contextmenu', e => e.preventDefault());

    // для автотестов: http://localhost/index.html#debug
    if (location.hash === '#debug') window.__gnomes = { state: () => st, Engine };

    openMenu();
    requestAnimationFrame(frame);
    Platform.ready();
  }

  main();
})();
