(function () {
  const STR = {
    ru: {
      title: 'Пиксельная Ёлка', subtitle: 'Собирай цвета — рисуй Новый год', play: 'Играть',
      gallery: 'Открытки', undo: 'Отменить', slot: '+1 полка', level: 'Уровень',
      hint0: 'Нажимай на верхние блоки. Три одного цвета закрашивают картинку!',
      hint1: 'Следи за полкой: если она заполнится — проигрыш.',
      winTitle: 'Картинка собрана!', next: 'Дальше',
      loseTitle: 'Полка заполнена!', loseText: 'Верни три блока и попробуй ещё раз.',
      revive: 'Вернуть 3 блока ▶', restart: 'Начать заново', menu: 'В меню'
    },
    en: {
      title: 'Pixel Tree', subtitle: 'Match colors, paint the holidays', play: 'Play',
      gallery: 'Postcards', undo: 'Undo', slot: '+1 slot', level: 'Level',
      hint0: 'Tap the top blocks. Three of a color paint the picture!',
      hint1: 'Watch the shelf: if it fills up, you lose.',
      winTitle: 'Picture complete!', next: 'Next',
      loseTitle: 'Shelf is full!', loseText: 'Return three blocks and try again.',
      revive: 'Return 3 blocks ▶', restart: 'Restart', menu: 'Menu'
    }
  };
  let T = STR.ru;
  let lang = 'ru';

  const $ = id => document.getElementById(id);
  const els = {
    menu: $('screen-menu'), game: $('screen-game'), galleryScreen: $('screen-gallery'),
    board: $('board'), boardWrap: $('board-wrap'), bar: $('bar'), columns: $('columns'),
    level: $('level-label'), hint: $('hint'), undo: $('btn-undo'), slot: $('btn-slot'),
    modal: $('modal'), modalTitle: $('modal-title'), modalText: $('modal-text'),
    modalArt: $('modal-art'), modalButtons: $('modal-buttons'), fly: $('fly-layer'),
    sound: $('btn-sound'), grid: $('gallery-grid')
  };

  // ---------- звук ----------
  const Sound = {
    ctx: null, on: true, paused: false,
    beep(freq, dur, type = 'sine', vol = 0.12, delay = 0) {
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
    tap() { this.beep(620, 0.06, 'triangle'); },
    match() { [660, 880, 1100].forEach((f, i) => this.beep(f, 0.12, 'triangle', 0.1, i * 0.06)); },
    win() { [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 0.25, 'triangle', 0.12, i * 0.12)); },
    lose() { [300, 220].forEach((f, i) => this.beep(f, 0.3, 'sawtooth', 0.06, i * 0.18)); }
  };

  // ---------- состояние ----------
  const S = {
    save: { level: 0, done: [] },
    levelIndex: 0, pic: null, lvl: null, cols: [], bar: [], history: [],
    cap: CAP, extraSlot: false, freeUndo: true, painted: null, paintPtr: {},
    triplesDone: {}, paintQueue: [], busy: false, over: false, uid: 0
  };

  // ---------- рисование картинок ----------
  function drawPicture(canvas, pic, sizeCss, isPainted, ghost = 0.18) {
    const dpr = window.devicePixelRatio || 1;
    const cell = Math.max(1, Math.floor(sizeCss / Math.max(pic.w, pic.h)));
    const w = cell * pic.w, h = cell * pic.h;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#16224a';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < pic.h; y++) {
      for (let x = 0; x < pic.w; x++) {
        const ch = pic.rows[y][x];
        if (ch === '.') continue;
        ctx.fillStyle = PALETTE[ch];
        if (isPainted(x, y)) {
          ctx.globalAlpha = 1;
          ctx.fillRect(x * cell, y * cell, cell, cell);
        } else {
          ctx.globalAlpha = ghost;
          ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBoard() {
    const r = els.boardWrap.getBoundingClientRect();
    const size = Math.max(64, Math.min(r.width, r.height) - 4);
    drawPicture(els.board, S.pic, size, (x, y) => S.painted[y][x]);
  }

  // ---------- раскладка ----------
  function layout() {
    const width = Math.min(window.innerWidth, 520) - 24;
    const nCols = S.lvl ? S.lvl.cols.length : 5;
    const byCols = (width - (nCols - 1) * 6 - nCols * 8) / nCols;
    const bySlots = (width - 12) / ((S.cap + 1) * 0.9 + (S.cap + 1) * 0.1);
    const byHeight = (window.innerHeight - 260) / 5.5;
    const block = Math.floor(Math.max(26, Math.min(56, byCols, bySlots, byHeight)));
    document.documentElement.style.setProperty('--block', block + 'px');
    if (S.pic) drawBoard();
  }

  // ---------- уровень ----------
  function startLevel(index) {
    S.levelIndex = index;
    S.pic = PICTURES[index % PICTURES.length];
    S.lvl = buildLevel(S.pic, index);
    S.cols = S.lvl.cols.map(c => c.slice());
    S.bar = []; S.history = [];
    S.cap = S.lvl.cap; S.extraSlot = false; S.freeUndo = true;
    S.painted = S.pic.rows.map(r => Array(r.length).fill(false));
    S.paintPtr = {}; S.triplesDone = {}; S.paintQueue = [];
    S.busy = false; S.over = false;
    els.level.textContent = `${T.level} ${index + 1}`;
    const hint = index === 0 ? T.hint0 : index === 1 ? T.hint1 : '';
    els.hint.textContent = hint; els.hint.hidden = !hint;
    show('game');
    layout();
    renderAll();
    Platform.gameplayStart();
  }

  function renderAll() { renderColumns(); renderBar(); renderTools(); drawBoard(); }

  function makeBlock(color) {
    const d = document.createElement('div');
    d.className = 'block';
    d.style.background = PALETTE[color];
    return d;
  }

  function renderColumns() {
    els.columns.innerHTML = '';
    S.cols.forEach((col, ci) => {
      const c = document.createElement('div');
      c.className = 'column';
      const visible = col.slice(-4).reverse();
      visible.forEach((color, i) => {
        const b = makeBlock(color);
        if (i === 0) {
          b.classList.add('top');
          b.addEventListener('pointerdown', e => { e.preventDefault(); pick(ci, b); });
        } else b.classList.add('under');
        c.appendChild(b);
      });
      const more = document.createElement('div');
      more.className = 'more';
      more.textContent = col.length > 4 ? `+${col.length - 4}` : '';
      c.appendChild(more);
      els.columns.appendChild(c);
    });
  }

  function renderBar(hiddenId) {
    els.bar.innerHTML = '';
    for (let i = 0; i < S.cap; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot' + (S.extraSlot && i === S.cap - 1 ? ' extra' : '');
      const item = S.bar[i];
      if (item) {
        const b = makeBlock(item.color);
        b.dataset.id = item.id;
        if (item.id === hiddenId) b.classList.add('hidden-b');
        slot.appendChild(b);
      }
      els.bar.appendChild(slot);
    }
    els.bar.classList.toggle('danger', S.bar.length >= S.cap - 1);
  }

  function renderTools() {
    els.undo.querySelector('.ad').hidden = S.freeUndo;
    els.undo.disabled = !S.history.length;
    els.slot.disabled = S.extraSlot;
  }

  // ---------- ходы ----------
  function pick(ci, srcEl) {
    if (S.busy || S.over) return;
    const col = S.cols[ci];
    if (!col.length || S.bar.length >= S.cap) return;
    const srcRect = srcEl.getBoundingClientRect();
    const color = col.pop();
    const colors = S.bar.map(b => b.color);
    let idx = colors.lastIndexOf(color);
    idx = idx < 0 ? S.bar.length : idx + 1;
    const item = { id: ++S.uid, color, from: ci };
    S.bar.splice(idx, 0, item);
    S.history.push(item.id);
    els.hint.hidden = S.levelIndex !== 1 || els.hint.hidden;
    Sound.tap();
    renderColumns();
    renderBar(item.id);
    renderTools();
    S.busy = true;
    const target = els.bar.querySelector(`[data-id="${item.id}"]`);
    fly(srcRect, target, color, () => {
      target.classList.remove('hidden-b');
      afterPlace(color);
    });
  }

  function fly(srcRect, targetEl, color, done) {
    const dst = targetEl.getBoundingClientRect();
    const f = makeBlock(color);
    f.classList.add('flying');
    Object.assign(f.style, {
      left: srcRect.left + 'px', top: srcRect.top + 'px',
      width: srcRect.width + 'px', height: srcRect.height + 'px'
    });
    els.fly.appendChild(f);
    requestAnimationFrame(() => {
      const sx = dst.width / srcRect.width;
      f.style.transformOrigin = '0 0';
      f.style.transform = `translate(${dst.left - srcRect.left}px, ${dst.top - srcRect.top}px) scale(${sx})`;
    });
    setTimeout(() => { f.remove(); done(); }, 170);
  }

  function afterPlace(color) {
    const same = S.bar.filter(b => b.color === color);
    if (same.length >= 3) {
      const ids = new Set(same.slice(0, 3).map(b => b.id));
      els.bar.querySelectorAll('.block').forEach(b => { if (ids.has(+b.dataset.id)) b.classList.add('clearing'); });
      Sound.match();
      setTimeout(() => {
        S.bar = S.bar.filter(b => !ids.has(b.id));
        S.history = S.history.filter(id => !ids.has(id));
        paintTriple(color);
        renderBar(); renderTools();
        S.busy = false;
        checkWin();
      }, 240);
      return;
    }
    S.busy = false;
    if (S.bar.length >= S.cap) lose();
  }

  function paintTriple(color) {
    const list = S.lvl.paint[color];
    const total = S.lvl.triples[color];
    S.triplesDone[color] = (S.triplesDone[color] || 0) + 1;
    const ptr = S.paintPtr[color] || 0;
    const chunk = S.triplesDone[color] >= total ? list.length - ptr : Math.ceil(list.length / total);
    S.paintQueue.push(...list.slice(ptr, ptr + chunk));
    S.paintPtr[color] = ptr + chunk;
    animatePaint();
  }

  let painting = false;
  function animatePaint() {
    if (painting) return;
    painting = true;
    const step = () => {
      const n = Math.max(2, Math.ceil(S.paintQueue.length / 12));
      for (let i = 0; i < n && S.paintQueue.length; i++) {
        const p = S.paintQueue.shift();
        S.painted[p.y][p.x] = true;
      }
      drawBoard();
      if (S.paintQueue.length) requestAnimationFrame(step);
      else { painting = false; checkWin(); }
    };
    requestAnimationFrame(step);
  }

  function checkWin() {
    if (S.over || painting || S.bar.length || S.cols.some(c => c.length)) return;
    S.over = true;
    Platform.gameplayStop();
    Sound.win();
    if (!S.save.done.includes(S.pic.id)) S.save.done.push(S.pic.id);
    S.save.level = Math.max(S.save.level, S.levelIndex + 1);
    Platform.save(S.save);
    const finished = S.levelIndex;
    setTimeout(() => openModal({
      title: T.winTitle, text: S.pic.name[lang] || S.pic.name.ru, art: S.pic,
      buttons: [{ label: T.next, primary: true, action: async () => {
        closeModal();
        if (finished >= 4) await Platform.showInterstitial();
        startLevel(finished + 1);
      } }]
    }), 350);
  }

  function lose() {
    S.over = true;
    Platform.gameplayStop();
    Sound.lose();
    openModal({
      title: T.loseTitle, text: T.loseText,
      buttons: [
        { label: T.revive, primary: true, action: async () => {
          if (await Platform.showRewarded()) {
            closeModal();
            returnBlocks(3);
            S.over = false;
            Platform.gameplayStart();
          }
        } },
        { label: T.restart, action: () => { closeModal(); startLevel(S.levelIndex); } }
      ]
    });
  }

  // Возвращает последние положенные блоки обратно наверх их колонок.
  function returnBlocks(n) {
    const order = S.bar.slice().sort((a, b) => b.id - a.id).slice(0, n);
    order.forEach(item => {
      S.bar = S.bar.filter(b => b.id !== item.id);
      S.cols[item.from].push(item.color);
    });
    const removed = new Set(order.map(i => i.id));
    S.history = S.history.filter(id => !removed.has(id));
    renderAll();
  }

  async function undo() {
    if (S.busy || S.over || !S.history.length) return;
    if (!S.freeUndo && !(await Platform.showRewarded())) return;
    S.freeUndo = false;
    const id = S.history.pop();
    const item = S.bar.find(b => b.id === id);
    if (item) {
      S.bar = S.bar.filter(b => b.id !== id);
      S.cols[item.from].push(item.color);
    }
    renderAll();
  }

  async function addSlot() {
    if (S.busy || S.over || S.extraSlot) return;
    if (!(await Platform.showRewarded())) return;
    S.extraSlot = true;
    S.cap += 1;
    layout();
    renderAll();
  }

  // ---------- модалки и экраны ----------
  function openModal({ title, text, art, buttons }) {
    els.modalTitle.textContent = title;
    els.modalText.textContent = text || '';
    els.modalArt.hidden = !art;
    if (art) drawPicture(els.modalArt, art, 192, () => true);
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
    els.galleryScreen.hidden = name !== 'gallery';
  }

  function openMenu() {
    Platform.gameplayStop();
    closeModal();
    S.pic = null;
    show('menu');
    drawPicture($('menu-art'), PICTURES[0], 160, () => true);
  }

  function openGallery() {
    show('gallery');
    els.grid.innerHTML = '';
    PICTURES.forEach(pic => {
      const done = S.save.done.includes(pic.id);
      const card = document.createElement('div');
      card.className = 'card' + (done ? '' : ' locked');
      const c = document.createElement('canvas');
      card.appendChild(c);
      const label = document.createElement('div');
      label.textContent = done ? (pic.name[lang] || pic.name.ru) : '?';
      card.appendChild(label);
      els.grid.appendChild(card);
      drawPicture(c, pic, 96, () => done, 0.25);
    });
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T[el.dataset.i18n]; });
    document.title = T.title;
    document.documentElement.lang = lang;
  }

  // ---------- старт ----------
  async function main() {
    await Platform.init();
    lang = STR[Platform.lang] ? Platform.lang : (Platform.lang === 'ru' ? 'ru' : 'en');
    T = STR[lang];
    applyI18n();
    const saved = await Platform.load();
    if (saved && typeof saved.level === 'number') S.save = { level: saved.level, done: saved.done || [] };

    Platform.onPause = () => { Sound.paused = true; };
    Platform.onResume = () => { Sound.paused = false; };
    document.addEventListener('visibilitychange', () => { Sound.paused = document.hidden; });

    $('btn-play').addEventListener('click', () => startLevel(S.save.level));
    $('btn-gallery').addEventListener('click', openGallery);
    $('btn-gallery-back').addEventListener('click', openMenu);
    $('btn-home').addEventListener('click', openMenu);
    els.undo.addEventListener('click', undo);
    els.slot.addEventListener('click', addSlot);
    els.sound.addEventListener('click', () => {
      Sound.on = !Sound.on;
      els.sound.classList.toggle('off', !Sound.on);
    });
    window.addEventListener('resize', layout);
    document.addEventListener('contextmenu', e => e.preventDefault());

    openMenu();
    Platform.ready();
  }

  main();
})();
