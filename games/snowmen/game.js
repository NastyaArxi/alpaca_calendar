(function () {
  const STR = {
    ru: {
      title: 'Снеговички', subtitle: 'Логическая головоломка: по снеговику в каждый дворик',
      play: 'Играть', level: 'Уровень', daily: 'Задача дня', dailyDone: 'решена сегодня ✓',
      rulesBtn: 'Как играть', hint: 'Подсказка', clear: 'Стереть крестики',
      legend: 'Нажми — крестик, ещё раз — снеговик. Проведи пальцем, чтобы ставить крестики.',
      rulesTitle: 'Как играть',
      rules: 'Поставь снеговиков так, чтобы в каждой строке, каждом столбце и каждом цветном дворике был ровно один.\nСнеговики не должны касаться друг друга, даже углами.\nЗа ошибку теряешь сердечко.',
      firstHint: 'По одному снеговику в каждой строке, столбце и дворике. Снеговики не касаются даже углами.',
      ok: 'Понятно', winTitle: 'Все снеговики на месте!', winText: 'Время: {t}', next: 'Дальше', menu: 'В меню',
      loseTitle: 'Сердечки закончились', loseText: 'Посмотри рекламу, чтобы получить ещё одно, или начни заново.',
      revive: 'Ещё сердечко ▶', restart: 'Начать заново',
      share: 'Скопировать результат', copied: 'Скопировано!',
      shareText: 'Снеговички, задача дня {d}: ⛄ за {t}, сердечки {h}'
    },
    en: {
      title: 'Snowmen', subtitle: 'A logic puzzle: one snowman in every yard',
      play: 'Play', level: 'Level', daily: 'Daily puzzle', dailyDone: 'solved today ✓',
      rulesBtn: 'How to play', hint: 'Hint', clear: 'Clear marks',
      legend: 'Tap for a mark, tap again for a snowman. Drag to place marks.',
      rulesTitle: 'How to play',
      rules: 'Place snowmen so every row, every column and every colored yard has exactly one.\nSnowmen must not touch each other, not even diagonally.\nEach mistake costs a heart.',
      firstHint: 'One snowman per row, column and yard. Snowmen never touch, not even diagonally.',
      ok: 'Got it', winTitle: 'All snowmen in place!', winText: 'Time: {t}', next: 'Next', menu: 'Menu',
      loseTitle: 'Out of hearts', loseText: 'Watch an ad for one more heart, or start over.',
      revive: 'One more heart ▶', restart: 'Start over',
      share: 'Copy result', copied: 'Copied!',
      shareText: 'Snowmen daily {d}: ⛄ in {t}, hearts {h}'
    }
  };
  let T = STR.ru, lang = 'ru';

  const SNOWMAN = '<svg viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="28" r="9" fill="#fff" stroke="#22324a" stroke-width="1.6"/>' +
    '<circle cx="20" cy="15.5" r="6.5" fill="#fff" stroke="#22324a" stroke-width="1.6"/>' +
    '<rect x="13.5" y="7" width="13" height="2.6" rx="1.2" fill="#d93a52"/>' +
    '<rect x="15.5" y="2" width="9" height="6" rx="1.5" fill="#d93a52"/>' +
    '<circle cx="17.8" cy="14.5" r="1" fill="#22324a"/><circle cx="22.2" cy="14.5" r="1" fill="#22324a"/>' +
    '<path d="M20 16.3 l5.5 1.3 -5.5 1.1z" fill="#ff8a1c"/>' +
    '<path d="M13.6 21.8 q6.4 3 12.8 0" stroke="#2e7a58" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
    '<circle cx="20" cy="26.5" r="1.1" fill="#22324a"/><circle cx="20" cy="30.5" r="1.1" fill="#22324a"/></svg>';

  const EMPTY = 0, MARK = 1, AUTO = 2, SNOW = 3;
  const $ = id => document.getElementById(id);
  const els = {
    menu: $('screen-menu'), game: $('screen-game'), board: $('board'), boardWrap: $('board-wrap'),
    level: $('level-label'), timer: $('timer'), hearts: $('hearts'), hintText: $('hint-text'),
    hint: $('btn-hint'), clear: $('btn-clear'), play: $('btn-play'), daily: $('btn-daily'),
    modal: $('modal'), modalTitle: $('modal-title'), modalText: $('modal-text'),
    modalArt: $('modal-art'), modalButtons: $('modal-buttons')
  };

  // ---------- звук ----------
  const Sound = {
    ctx: null, paused: false,
    beep(freq, dur, type = 'sine', vol = 0.1, delay = 0) {
      if (this.paused) return;
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
    mark() { this.beep(700, 0.03, 'triangle', 0.05); },
    place() { this.beep(880, 0.1, 'triangle'); this.beep(1320, 0.12, 'triangle', 0.08, 0.06); },
    wrong() { this.beep(200, 0.25, 'sawtooth', 0.06); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.beep(f, 0.25, 'triangle', 0.1, i * 0.1)); }
  };

  // ---------- состояние ----------
  let save = { level: 0, daily: '', best: {} };
  let mode = 'level', levelIndex = 0, puzzle = null, marks = null;
  let hearts = 3, freeHint = true, seconds = 0, timerId = null, finished = false;

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  function loadLevel(L) {
    if (L < LEVELS.length) {
      const lv = LEVELS[L];
      const regions = lv.r.split('/').map(row => [...row].map(Number));
      return { N: regions.length, regions, solution: [...lv.s].map(Number) };
    }
    return Puzzle.levelPuzzle(L);
  }

  // ---------- поле ----------
  function layout() {
    if (!puzzle) return;
    const r = els.boardWrap.getBoundingClientRect();
    const size = Math.min(r.width, r.height) - 8;
    const cell = Math.floor(Math.max(30, Math.min(64, size / puzzle.N)));
    document.documentElement.style.setProperty('--cell', cell + 'px');
  }

  function buildBoard() {
    const { N, regions } = puzzle;
    els.board.innerHTML = '';
    els.board.classList.remove('board-done');
    els.board.style.gridTemplateColumns = `repeat(${N}, var(--cell))`;
    const thick = '2.5px solid #22324a', thin = '1px solid #22324a22';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const d = document.createElement('div');
        d.className = 'cell';
        d.dataset.r = r; d.dataset.c = c;
        const g = regions[r][c];
        d.style.background = `var(--r${g})`;
        d.style.borderTop = r > 0 ? (regions[r - 1][c] !== g ? thick : thin) : 'none';
        d.style.borderLeft = c > 0 ? (regions[r][c - 1] !== g ? thick : thin) : 'none';
        els.board.appendChild(d);
      }
    }
  }

  function cellEl(r, c) { return els.board.children[r * puzzle.N + c]; }

  function paint(r, c) {
    const el = cellEl(r, c), m = marks[r][c];
    el.classList.toggle('x', m === MARK || m === AUTO);
    el.classList.toggle('auto', m === AUTO);
    el.classList.toggle('snow', m === SNOW);
    el.innerHTML = m === SNOW ? SNOWMAN : '';
  }

  function renderHearts() {
    els.hearts.innerHTML = [0, 1, 2].map(i => `<span class="${i < hearts ? '' : 'lost'}">♥</span>`).join('');
  }

  function renderTools() {
    els.hint.querySelector('.ad').hidden = freeHint;
  }

  // ---------- ходы ----------
  function autoMark(r, c) {
    const { N, regions } = puzzle;
    const g = regions[r][c];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const near = Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1;
        if ((i === r || j === c || regions[i][j] === g || near) && marks[i][j] === EMPTY) {
          marks[i][j] = AUTO; paint(i, j);
        }
      }
    }
  }

  function placeSnowman(r, c, viaHint) {
    if (puzzle.solution[r] === c) {
      marks[r][c] = SNOW; paint(r, c);
      if (viaHint) cellEl(r, c).classList.add('hinted');
      Sound.place();
      autoMark(r, c);
      if (marks.every(row => row.includes(SNOW))) win();
      return;
    }
    hearts--;
    marks[r][c] = MARK; paint(r, c);
    const el = cellEl(r, c);
    el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
    Sound.wrong();
    renderHearts();
    if (hearts <= 0) lose();
  }

  // Нажатие: пусто → крестик → снеговик. Протяжка ставит крестики на пустые клетки.
  let drag = null;
  function cellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    const cell = el && el.closest && el.closest('.cell');
    return cell && els.board.contains(cell) ? cell : null;
  }

  function onDown(e) {
    if (finished) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    const r = +cell.dataset.r, c = +cell.dataset.c;
    const m = marks[r][c];
    if (m === EMPTY) {
      marks[r][c] = MARK; paint(r, c); Sound.mark();
      drag = { last: cell };
    } else if (m === MARK || m === AUTO) {
      placeSnowman(r, c, false);
    }
    if (levelIndex === 0 && mode === 'level') els.hintText.hidden = true;
  }

  function onMove(e) {
    if (!drag || finished) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell || cell === drag.last) return;
    drag.last = cell;
    const r = +cell.dataset.r, c = +cell.dataset.c;
    if (marks[r][c] === EMPTY) { marks[r][c] = MARK; paint(r, c); Sound.mark(); }
  }

  function onUp() { drag = null; }

  async function hint() {
    if (finished) return;
    if (!freeHint) {
      stopTimer();
      const ok = await Platform.showRewarded();
      startTimer();
      if (!ok) return;
    }
    freeHint = false;
    renderTools();
    const r = marks.findIndex(row => !row.includes(SNOW));
    if (r >= 0) placeSnowman(r, puzzle.solution[r], true);
  }

  function clearMarks() {
    if (finished) return;
    const { N } = puzzle;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (marks[r][c] !== SNOW) marks[r][c] = EMPTY;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (marks[r][c] === SNOW) autoMark(r, c);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) paint(r, c);
  }

  // ---------- таймер ----------
  function startTimer() {
    stopTimer();
    timerId = setInterval(() => { seconds++; els.timer.textContent = fmt(seconds); }, 1000);
  }
  function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

  // ---------- партия ----------
  function startGame(m, L) {
    mode = m; levelIndex = L;
    puzzle = m === 'daily' ? Puzzle.dailyPuzzle(new Date()) : loadLevel(L);
    marks = Array.from({ length: puzzle.N }, () => new Array(puzzle.N).fill(EMPTY));
    hearts = 3; freeHint = true; seconds = 0; finished = false;
    els.level.textContent = m === 'daily' ? T.daily : `${T.level} ${L + 1}`;
    els.timer.textContent = fmt(0);
    els.hintText.textContent = T.firstHint;
    els.hintText.hidden = !(m === 'level' && L === 0);
    closeModal();
    show('game');
    layout();
    buildBoard();
    renderHearts(); renderTools();
    startTimer();
    Platform.gameplayStart();
  }

  function win() {
    finished = true;
    stopTimer();
    Platform.gameplayStop();
    Sound.win();
    els.board.classList.add('board-done');
    const t = fmt(seconds);
    const buttons = [];
    if (mode === 'daily') {
      save.daily = todayKey();
      const d = new Date();
      const text = T.shareText.replace('{d}', `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`)
        .replace('{t}', t).replace('{h}', '❤️'.repeat(hearts) + '🤍'.repeat(3 - hearts));
      buttons.push({ label: T.share, primary: true, action: btn => copy(text, btn) });
      buttons.push({ label: T.menu, action: openMenu });
    } else {
      save.level = Math.max(save.level, levelIndex + 1);
      const key = String(levelIndex);
      if (!save.best[key] || seconds < save.best[key]) save.best[key] = seconds;
      const done = levelIndex;
      buttons.push({ label: T.next, primary: true, action: async () => {
        closeModal();
        if (done >= 4) await Platform.showInterstitial();
        startGame('level', done + 1);
      } });
    }
    Platform.save(save);
    setTimeout(() => openModal({ title: T.winTitle, text: T.winText.replace('{t}', t), art: true, buttons }), 700);
  }

  function lose() {
    finished = true;
    stopTimer();
    Platform.gameplayStop();
    openModal({
      title: T.loseTitle, text: T.loseText,
      buttons: [
        { label: T.revive, primary: true, action: async () => {
          if (!(await Platform.showRewarded())) return;
          hearts = 1; finished = false;
          renderHearts(); closeModal(); startTimer();
          Platform.gameplayStart();
        } },
        { label: T.restart, action: () => startGame(mode, levelIndex) }
      ]
    });
  }

  async function copy(text, btn) {
    // если скопировать не вышло, показываем текст, чтобы его можно было выделить вручную
    if (await Platform.copyText(text)) btn.textContent = T.copied;
    else els.modalText.textContent = text;
  }

  // ---------- экраны ----------
  function openModal({ title, text, art, buttons }) {
    els.modalTitle.textContent = title;
    els.modalText.textContent = text || '';
    els.modalArt.innerHTML = art ? SNOWMAN : '';
    els.modalArt.hidden = !art;
    els.modalButtons.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'btn' + (b.primary ? ' primary' : '');
      btn.textContent = b.label;
      btn.addEventListener('click', () => b.action(btn));
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
    stopTimer();
    Platform.gameplayStop();
    closeModal();
    puzzle = null;
    show('menu');
    els.play.innerHTML = `${T.play}<span class="sub">${T.level} ${save.level + 1}</span>`;
    const solved = save.daily === todayKey();
    els.daily.innerHTML = `${T.daily}${solved ? `<span class="sub">${T.dailyDone}</span>` : ''}`;
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T[el.dataset.i18n]; });
    document.title = T.title;
    document.documentElement.lang = lang;
    $('menu-art').innerHTML = SNOWMAN;
  }

  async function main() {
    await Platform.init();
    lang = STR[Platform.lang] ? Platform.lang : 'en';
    T = STR[lang];
    applyI18n();
    const saved = await Platform.load();
    if (saved && typeof saved.level === 'number') save = { level: saved.level, daily: saved.daily || '', best: saved.best || {} };

    Platform.onPause = () => { Sound.paused = true; stopTimer(); };
    Platform.onResume = () => { Sound.paused = false; if (puzzle && !finished && els.modal.hidden) startTimer(); };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) Platform.onPause(); else Platform.onResume();
    });

    els.play.addEventListener('click', () => startGame('level', save.level));
    els.daily.addEventListener('click', () => startGame('daily', 0));
    $('btn-rules').addEventListener('click', () => openModal({ title: T.rulesTitle, text: T.rules, art: true, buttons: [{ label: T.ok, primary: true, action: closeModal }] }));
    $('btn-home').addEventListener('click', openMenu);
    els.hint.addEventListener('click', hint);
    els.clear.addEventListener('click', clearMarks);
    els.board.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', layout);
    document.addEventListener('contextmenu', e => e.preventDefault());

    // для автотестов: index.html#debug
    if (location.hash === '#debug') window.__snowmen = { puzzle: () => puzzle };

    openMenu();
    Platform.ready();
  }

  main();
})();
