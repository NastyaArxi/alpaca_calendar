/* Der Goldene Krug — интерактив без фреймворков */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var STAR = '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M11 1l2.6 7.4H21l-6 4.6 2.3 7.4L11 15.8 4.7 20.4 7 13 1 8.4h7.4z" fill="#120E09"/></svg>';

  /* ---------- бегущие строки (контент дублируется для бесшовной петли) ---------- */
  $$('[data-marquee]').forEach(function (el) {
    var words = el.getAttribute('data-marquee').split('|');
    var html = words.concat(words).map(function (w) { return '<span>' + esc(w) + STAR + '</span>'; }).join('');
    el.innerHTML = html;
  });
  $$('[data-marquee2]').forEach(function (el) {
    var words = el.getAttribute('data-marquee2').split('|');
    el.innerHTML = words.concat(words).map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
  });

  /* ---------- пузырьки в hero ---------- */
  var bubbleLayer = $('.hero__bubbles');
  if (bubbleLayer && !reduceMotion) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 26; i++) {
      var r = (function (k) { return function (n) { var x = Math.sin((k + 1) * n) * 10000; return x - Math.floor(x); }; })(i);
      var size = 6 + Math.round(r(12.9) * 22);
      var b = document.createElement('span');
      b.className = 'bubble';
      b.style.cssText = 'left:' + (r(78.2) * 100).toFixed(1) + '%;width:' + size + 'px;height:' + size + 'px;animation-duration:' + (6 + r(3.7) * 9).toFixed(1) + 's;animation-delay:-' + (r(5.1) * 12).toFixed(1) + 's';
      frag.appendChild(b);
    }
    bubbleLayer.appendChild(frag);
  }

  /* ---------- параллакс и «прожектор» за курсором ---------- */
  var hero = $('.hero');
  if (hero && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    var raf = null, pos = [0.5, 0.5];
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      pos = [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height];
      if (!raf) raf = requestAnimationFrame(function () {
        raf = null;
        hero.style.setProperty('--mx', pos[0].toFixed(3));
        hero.style.setProperty('--my', pos[1].toFixed(3));
      });
    });
    hero.addEventListener('mouseleave', function () {
      hero.style.setProperty('--mx', 0.5);
      hero.style.setProperty('--my', 0.5);
    });
  }

  /* ---------- сорта на полке ---------- */
  var sorts = [
    { name: 'Helles', style: 'Мюнхенское светлое', abv: '4,9%', c: '#F2C14E', notes: 'Мягкий солод, хлебная корочка, чистый сухой финиш.' },
    { name: 'Hefeweizen', style: 'Пшеничное', abv: '5,4%', c: '#EBB65A', notes: 'Банан, гвоздика и бархатная мутность живых дрожжей.' },
    { name: 'Pilsner', style: 'Пильзнер', abv: '4,8%', c: '#F5D36A', notes: 'Благородный хмель, звонкая горчинка, хрусткая свежесть.' },
    { name: 'Rauchbier', style: 'Копчёное', abv: '5,6%', c: '#A0561F', notes: 'Буковый дым, ветчина и карамель. Пиво из Бамберга.' },
    { name: 'Dunkel', style: 'Тёмное баварское', abv: '5,2%', c: '#6B3A1A', notes: 'Ржаной хлеб, орех, лёгкий кофе — тёмное, но не тяжёлое.' },
    { name: 'Doppelbock', style: 'Двойной бок', abv: '7,5%', c: '#3A1D0C', notes: 'Сухофрукты, шоколад, тепло. «Жидкий хлеб» монахов.' }
  ];
  var sortsEl = $('#sorts');
  if (sortsEl) {
    sortsEl.innerHTML = sorts.map(function (s, k) {
      var lvl = 68 + (k % 3) * 4;
      return '<article class="sort card">' +
        '<span class="sort__no" aria-hidden="true">0' + (k + 1) + '</span>' +
        '<div class="sort__mug" aria-hidden="true" style="animation-delay:-' + (k * 0.7).toFixed(1) + 's">' +
          '<div class="sort__glass">' +
            '<div class="sort__liquid" style="height:' + lvl + '%;background:linear-gradient(180deg,' + s.c + ',' + s.c + 'CC)">' +
              '<span class="bub" style="left:25%;animation-delay:.2s"></span><span class="bub" style="left:60%;animation-delay:.9s"></span>' +
            '</div>' +
            '<div class="sort__foam" style="bottom:' + (lvl - 2) + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="sort__body">' +
          '<p class="sort__meta">' + esc(s.style) + ' · ' + s.abv + '</p>' +
          '<h3>' + esc(s.name) + '</h3>' +
          '<p class="sort__notes">' + esc(s.notes) + '</p>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- меню с вкладками ---------- */
  var menu = {
    beer: {
      img: 'img/pour.webp', alt: 'Светлое пиво наливается в высокий бокал, густая пена', hit: 'Сет 5×0,2',
      items: [
        { name: 'Helles', tag: '4,9%', desc: 'Светлое мюнхенское: мягкий солод, лёгкая хлебная сладость, чистый финиш.', price: '390 / 690' },
        { name: 'Hefeweizen', tag: '5,4%', desc: 'Нефильтрованное пшеничное с нотами банана и гвоздики. Подаём в высоком бокале.', price: '420 / 740' },
        { name: 'Dunkel', tag: '5,2%', desc: 'Тёмное баварское: корочка ржаного хлеба, карамель, орех.', price: '430 / 760' },
        { name: 'Pilsner', tag: '4,8%', desc: 'Хмелевое и сухое, с благородной горчинкой. Классика из Богемии в немецком прочтении.', price: '390 / 690' },
        { name: 'Rauchbier', tag: '5,6%', desc: 'Копчёное пиво из Бамберга. Пахнет костром и ветчиной — попробуйте с рулькой.', price: '480 / 840' },
        { name: 'Doppelbock', tag: '7,5%', desc: 'Густое «жидкий хлеб» монахов: сухофрукты, тёмный шоколад, тепло.', price: '520 / —' }
      ]
    },
    food: {
      img: 'img/hall.webp', alt: 'Сводчатый зал пивной: длинные деревянные столы, кружки и закуски', hit: 'Haxe',
      items: [
        { name: 'Schweinshaxe', tag: 'хит', desc: 'Свиная рулька, томлёная 6 часов, с хрустящей корочкой. Квашеная капуста, горчица, хрен.', price: '1 290' },
        { name: 'Brezel', tag: 'с маслом', desc: 'Огромный брецель с крупной солью и обацдой — баварским сырным кремом.', price: '360' },
        { name: 'Bratwurst-Platte', tag: '3 вида', desc: 'Нюрнбергские, тюрингские и белые мюнхенские колбаски на гриле.', price: '980' },
        { name: 'Kartoffelsalat', tag: 'по-швабски', desc: 'Тёплый картофельный салат с бульоном, луком и огурцом.', price: '420' },
        { name: 'Käsespätzle', tag: 'veggie', desc: 'Яичная лапша шпецле, запечённая с альпийским сыром и жареным луком.', price: '640' },
        { name: 'Apfelstrudel', tag: 'тёплый', desc: 'Яблочный штрудель с ванильным соусом и шариком мороженого.', price: '450' }
      ]
    }
  };
  var panel = $('#menu-panel'), menuImg = $('#menu-img'), menuHit = $('#menu-hit'), menuSide = $('.menu__side');
  var tabs = $$('.tabs [role="tab"]');

  function renderMenu(key, animateImg) {
    var data = menu[key];
    panel.innerHTML = data.items.map(function (it, k) {
      return '<div class="item" style="--d:' + (k * 0.07).toFixed(2) + 's">' +
        '<span class="item__no">0' + (k + 1) + '</span>' +
        '<div class="item__main"><p class="item__name">' + esc(it.name) + ' <span class="item__tag">' + esc(it.tag) + '</span></p>' +
        '<p class="item__desc">' + esc(it.desc) + '</p></div>' +
        '<span class="item__price">' + esc(it.price) + '</span>' +
      '</div>';
    }).join('');
    menuHit.textContent = data.hit;
    if (animateImg && !reduceMotion) {
      menuSide.classList.add('is-swapping');
      setTimeout(function () { menuImg.src = data.img; menuImg.alt = data.alt; menuSide.classList.remove('is-swapping'); }, 300);
    } else {
      menuImg.src = data.img; menuImg.alt = data.alt;
    }
  }
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    renderMenu(tab.getAttribute('data-tab'), true);
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, idx) {
    t.addEventListener('click', function () { if (t.getAttribute('aria-selected') !== 'true') selectTab(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        selectTab(next, true);
      }
    });
  });
  if (panel) renderMenu('beer', false);

  /* ---------- «Gemütlichkeit» прыгающими буквами ---------- */
  $$('[data-letters]').forEach(function (el) {
    el.innerHTML = el.getAttribute('data-letters').split('').map(function (ch, k) {
      return '<span aria-hidden="true" style="animation-delay:' + (k * 0.09).toFixed(2) + 's">' + esc(ch) + '</span>';
    }).join('');
  });

  /* ---------- карточки вечеров: переворот по нажатию ---------- */
  $$('.flip__in').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  });

  /* ---------- появление при прокрутке + счётчики ---------- */
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    if (reduceMotion) { el.textContent = to; return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('.count');
  if ('IntersectionObserver' in window) {
    counters.forEach(function (c) { if (!reduceMotion) c.textContent = '0'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('.count', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- анимации, привязанные к прокрутке ---------- */
  var pin = $('[data-scroll="pin"]');
  var hz = $('[data-scroll="hz"]');
  var hzTrack = hz && $('.hz__track', hz);
  var ticking = false;

  function sectionProgress(sec) {
    var rect = sec.getBoundingClientRect();
    var stage = sec.firstElementChild.offsetHeight;
    var span = sec.offsetHeight - stage;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / span));
  }
  function measureHz() {
    if (!hzTrack) return;
    var shift = Math.min(0, window.innerWidth - hzTrack.scrollWidth);
    hz.style.setProperty('--hz-shift', shift + 'px');
  }
  function onScroll() {
    ticking = false;
    var max = doc.scrollHeight - window.innerHeight;
    doc.style.setProperty('--scroll', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    if (reduceMotion) return;
    if (pin) pin.style.setProperty('--p', sectionProgress(pin).toFixed(4));
    if (hz) hz.style.setProperty('--p', sectionProgress(hz).toFixed(4));
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', function () { measureHz(); requestTick(); });
  window.addEventListener('load', function () { measureHz(); requestTick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureHz);
  measureHz();
  onScroll();

  /* ---------- бронирование ---------- */
  var form = $('#reserve-form'), done = $('#form-done'), doneMsg = $('#form-done-msg');
  if (form) {
    var dateInput = form.elements.date;
    var today = new Date();
    var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = iso;

    function check(input) {
      var err = input.parentNode.querySelector('.field__err');
      var ok = input.value.trim() !== '';
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (err) err.hidden = ok;
      return ok;
    }
    [form.elements.name, dateInput].forEach(function (input) {
      input.addEventListener('blur', function () { if (input.getAttribute('aria-invalid')) check(input); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') check(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okName = check(form.elements.name);
      var okDate = check(dateInput);
      if (!okName) { form.elements.name.focus(); return; }
      if (!okDate) { dateInput.focus(); return; }
      var name = form.elements.name.value.trim();
      var guests = form.querySelector('input[name="guests"]:checked').value;
      var d = new Date(dateInput.value + 'T00:00:00');
      var dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      doneMsg.textContent = name + ', ждём вас ' + dateStr + ' в ' + form.elements.time.value + ', гостей: ' + guests + '. Мы перезвоним, чтобы подтвердить бронь.';
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
    $('#form-reset').addEventListener('click', function () {
      form.reset();
      $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      done.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
  }
})();
