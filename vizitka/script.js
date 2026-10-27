(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Scroll progress + header ---------- */
  const header = $('.header');
  const progress = $('.progress');
  const hobbyImg = $('.hobby__photo img');
  let ticking = false;
  const onScroll = () => {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    progress.style.setProperty('--p', p.toFixed(4));
    header.classList.toggle('is-scrolled', h.scrollTop > 10);
    if (hobbyImg && !reduce) {
      const r = hobbyImg.parentElement.getBoundingClientRect();
      const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
      hobbyImg.style.setProperty('--shift', (t * -30).toFixed(1) + 'px');
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const burger = $('.burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Active nav link with sliding underline ---------- */
  const links = $$('.nav a');
  const line = $('.nav__line');
  const moveLine = (a) => {
    if (!a) return;
    links.forEach((l) => l.classList.toggle('is-active', l === a));
    line.style.width = a.offsetWidth + 'px';
    line.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop + a.offsetHeight - 2}px)`;
    line.style.top = '0';
    line.style.bottom = 'auto';
  };
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) moveLine(links.find((a) => a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObs.observe(s));
  addEventListener('resize', () => moveLine($('.nav a.is-active')));
  document.fonts && document.fonts.ready.then(() => moveLine($('.nav a.is-active')));

  /* ---------- Reveal on scroll ---------- */
  $$('.reveal-group').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--stagger', i)));
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('is-in');
      revealObs.unobserve(el);
      if (el.matches('.reveal-group')) {
        // drop the stagger once revealed, so hover effects react instantly
        setTimeout(() => [...el.children].forEach((c) => c.style.setProperty('--stagger', 0)), 1000 + el.children.length * 90);
      }
      $$('[data-count]', el).forEach(countUp);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .reveal-group, .section-head, .steps').forEach((el) => revealObs.observe(el));

  /* ---------- Counters ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = +el.dataset.count;
    if (reduce) { el.textContent = target; return; }
    const dur = 1600;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Typewriter in hero code card ---------- */
  const typed = $('#typed');
  const code = [
    ['k', 'const'], ['', ' nastya = {\n  stack: ['], ['s', '"HTML"'], ['', ', '], ['s', '"MJML"'], ['', '],\n  tested: '],
    ['g', '"40+ клиентов"'], ['', ',\n  focus: '], ['s', '"письма, которые\n    не ломаются"'], ['', '\n};']
  ];
  const renderCode = (n) => {
    let left = n;
    let html = '';
    for (const [cls, txt] of code) {
      if (left <= 0) break;
      const part = txt.slice(0, left).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      left -= txt.length;
      html += cls ? `<span class="${cls}">${part}</span>` : part;
    }
    typed.innerHTML = html;
  };
  const total = code.reduce((a, [, t]) => a + t.length, 0);
  if (reduce) renderCode(total);
  else {
    let n = 0;
    setTimeout(function tick() {
      renderCode(++n);
      if (n < total) setTimeout(tick, 18 + Math.random() * 40);
    }, 1500);
  }

  /* ---------- Contribution graph in hero ---------- */
  const contrib = $('.contrib');
  if (contrib) {
    const cells = Array.from({ length: 84 }, () => contrib.appendChild(document.createElement('i')));
    const level = () => { const r = Math.random(); return r < 0.35 ? 0 : r < 0.6 ? 1 : r < 0.8 ? 2 : r < 0.93 ? 3 : 4; };
    cells.forEach((c) => { c.dataset.l = level(); });
    if (!reduce) setInterval(() => { for (let k = 0; k < 6; k++) cells[(Math.random() * cells.length) | 0].dataset.l = level(); }, 700);
  }

  /* ---------- Pointer effects (desktop only) ---------- */
  if (fine && !reduce) {
    const root = document.documentElement;
    const visual = $('[data-parallax]');
    addEventListener('pointermove', (e) => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
      if (visual) {
        visual.style.setProperty('--px', (e.clientX / innerWidth - 0.5).toFixed(3));
        visual.style.setProperty('--py', (e.clientY / innerHeight - 0.5).toFixed(3));
      }
    }, { passive: true });

    // spotlight + 3D tilt on cards
    $$('.card').forEach((card) => {
      const tilt = card.classList.contains('tilt');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--cx', x * 100 + '%');
        card.style.setProperty('--cy', y * 100 + '%');
        if (tilt && card.parentElement.classList.contains('is-in')) {
          card.classList.add('is-tilting');
          card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 7}deg) translateY(-4px)`;
        }
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });

    // magnetic buttons
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Swipe helper ---------- */
  const onSwipe = (el, prev, next) => {
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
      x0 = null;
    });
  };
  const pad = (n) => String(n).padStart(2, '0');
  const makeDots = (box, items, onPick) => items.map((it, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot';
    b.setAttribute('aria-label', `${k + 1}: ${it.title}`);
    b.innerHTML = '<span aria-hidden="true"></span>';
    b.addEventListener('click', () => onPick(k));
    box.appendChild(b);
    return b;
  });

  /* ---------- Sites slider ---------- */
  const sites = [
    { host: 'trosbarrier.ru', img: './assets/035ba706d694969b32a6e95c18ff41a6.png', alt: 'Обложка кейса ТросБарьер: первый экран сайта и форма заявки на телефоне', year: 'B2B · 2026', tech: 'Дизайн + вёрстка', title: 'ТросБарьер', text: 'Сайт поставщика оцинкованного троса, сетки и крепежа, сделанный с нуля: от смыслов до аналитики. Каталог от 0,65 до 56 мм, таблица наличия, FAQ, блог и кнопка «Получить расчёт» на каждом экране.', url: 'https://trosbarrier.ru/', repo: '' },
    { host: 'nastyaarxi5.github.io', img: './assets/843b08aaa2f22d764f1d0df18b0b9531.jpg', alt: 'Первый экран сайта аукциона «Оно тебе надо»', year: 'Яндекс Практикум', tech: 'HTML/CSS', title: '«Оно тебе надо»', text: 'Сайт аукциона вещей: выразительная типографика и адаптивная сетка. Проект курса «Профессиональная вёрстка на HTML и CSS».', url: 'https://nastyaarxi5.github.io/', repo: 'https://github.com/NastyaArxi/nastyaarxi5.github.io' },
    { host: 'nastyaarxi6.github.io', img: './assets/6287036166be6bfa972bca467b31aeb6.jpg', alt: 'Первый экран сайта «Посмотри в окно»', year: 'Яндекс Практикум', tech: 'JavaScript', title: '«Посмотри в окно»', text: 'Сервис с формой поиска по городу и времени суток. Вёрстка и JavaScript-интерактив.', url: 'https://nastyaarxi6.github.io/', repo: 'https://github.com/NastyaArxi/nastyaarxi6.github.io' },
    { host: 'nastyaarxi.github.io', img: './assets/87e4355cbc5dbe765ac4c4fcdaf0eeec.png', alt: 'Обложка: лендинг каталога Blizko', year: '2019', tech: 'HTML', title: 'Blizko: товары для дома и ремонта', text: 'Лендинг каталога для покупателей в Москве: категории товаров для строительства и ремонта, баннер скидок и блок для продавцов.', url: 'https://nastyaarxi.github.io/', repo: 'https://github.com/NastyaArxi/nastyaarxi.github.io' },
    { host: 'nastyaarxi.github.io', img: './assets/da633df7ca8d7f1e2f59adf3dc76c57b.png', alt: 'Обложка: лендинг Blizko для продавцов с кейсами', year: '2022', tech: 'Figma · Bootstrap', title: 'Blizko: кейсы и заявки', text: 'Дизайн и вёрстка лендинга для продавцов: кейсы магазинов с цифрами, интервью владельцев, карусель отзывов и форма заявки на пакет со скидкой.', url: 'https://nastyaarxi.github.io/nastyaarxi2.github.io/', repo: 'https://github.com/NastyaArxi/nastyaarxi2.github.io' },
    { host: 'nastyaarxi.github.io', img: './assets/9b804719645abe9a5fe5341eb7548fdf.png', alt: 'Обложка: лендинг Blizko для бизнеса', year: '2022', tech: 'Figma · Bootstrap', title: 'Blizko для бизнеса', text: 'Дизайн и вёрстка лендинга портала: цифры площадки, категории, три шага к продажам, преимущества и отзывы клиентов.', url: 'https://nastyaarxi.github.io/nastyaarxi3.github.io/', repo: 'https://github.com/NastyaArxi/nastyaarxi3.github.io' }
  ];
  // preload screenshots so slide changes don't flash
  sites.forEach((s) => { const i = new Image(); i.src = s.img; });

  const site = $('#site');
  const f = (k) => $(`[data-f="${k}"]`, site);
  ['host', 'year', 'tech', 'title', 'text'].forEach((k) => f(k).setAttribute('data-anim', ''));
  $('.site__links', site).setAttribute('data-anim', '');
  const siteDots = makeDots($('#siteDots'), sites, (k) => goSite(k));
  let si = 0;
  let autoTimer = null;
  const AUTO = 7000;
  site.style.setProperty('--dur', AUTO + 'ms');

  const fillSite = (i) => {
    const d = sites[i];
    f('host').textContent = d.host;
    f('year').textContent = d.year;
    f('tech').textContent = d.tech;
    f('title').textContent = d.title;
    f('text').textContent = d.text;
    f('img').src = d.img;
    f('img').alt = d.alt;
    f('url').href = d.url;
    f('repo').href = d.repo || '#';
    f('repo').hidden = !d.repo;
    $('#siteCount').textContent = `${pad(i + 1)} / ${pad(sites.length)}`;
    siteDots.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  };
  const restartTimer = () => {
    site.classList.remove('is-playing');
    void site.offsetWidth;
    clearTimeout(autoTimer);
    if (reduce || !siteVisible) return;
    site.classList.add('is-playing');
    autoTimer = setTimeout(() => goSite(si + 1), AUTO);
  };
  let busy = false;
  function goSite(i, dir) {
    const n = sites.length;
    const next = ((i % n) + n) % n;
    if (next === si || busy) { restartTimer(); return; }
    dir = dir || (next > si ? 1 : -1);
    si = next;
    if (reduce) { fillSite(si); return; }
    busy = true;
    site.style.setProperty('--dir', dir);
    site.classList.toggle('back', dir < 0);
    site.classList.add('is-out');
    setTimeout(() => {
      fillSite(si);
      requestAnimationFrame(() => {
        site.classList.remove('is-out');
        busy = false;
        restartTimer();
      });
    }, 420);
  }
  fillSite(0);
  $('#sitePrev').addEventListener('click', () => goSite(si - 1, -1));
  $('#siteNext').addEventListener('click', () => goSite(si + 1, 1));
  onSwipe(site, () => goSite(si - 1, -1), () => goSite(si + 1, 1));

  let siteVisible = false;
  const pause = () => { clearTimeout(autoTimer); site.classList.add('is-paused'); };
  const resume = () => { site.classList.remove('is-paused'); restartTimer(); };
  site.addEventListener('pointerenter', pause);
  site.addEventListener('pointerleave', resume);
  site.addEventListener('focusin', pause);
  site.addEventListener('focusout', resume);
  new IntersectionObserver(([en]) => {
    siteVisible = en.isIntersecting;
    if (siteVisible) restartTimer(); else clearTimeout(autoTimer);
  }, { threshold: 0.4 }).observe(site);

  /* ---------- Certificates carousel ---------- */
  const certs = [
    { img: './assets/b3c0ced9a016000ccf8e1fd64866ab2f.jpg', meta: '2025 · WEXLER', title: 'Python: от основ до продвинутого уровня' },
    { img: './assets/79fb3e9f0e29d61148373aed563aa01b.jpg', meta: '2025 · WEXLER', title: 'SQL: практический курс' },
    { img: './assets/c7f7da9eaf3b65cd56eacc563a8081c9.jpg', meta: '2025 · WEXLER', title: 'Основы программирования' },
    { img: './assets/59c7e7a9def328c27ec0202459417a86.jpg', meta: '2024 · Mindbox', title: 'CRM: от бизнес-концепции к маркетингу' },
    { img: './assets/385cf04e8a4fc47bb0432a0aca4de02b.jpg', meta: '2024 · SendPulse Academy', title: 'Основы email-маркетинга' },
    { img: './assets/067d924626084301e7f241e9159b5b75.jpg', meta: '2024 · Skillbox', title: 'Теория монтажа' },
    { img: './assets/75812420c61622a42059b748d7626992.jpg', meta: '2024 · Яндекс Практикум', title: 'Профессиональная вёрстка на HTML и CSS' },
    { img: './assets/66950f2a2d23c485a9f0250032fd1f82.jpg', meta: '2022 · WAYUP', title: 'JavaScript: новый уровень' },
    { img: './assets/6014306e947ef4ac15e75ab2353aff81.jpg', meta: 'WAYUP', title: 'Веб-разработчик: код фрилансера' },
    { img: './assets/9c302fb836bc0937c2a2363a1844fd3c.png', meta: '2021 · WAYUP', title: 'Веб-дизайнер' }
  ];
  const track = $('#certTrack');
  track.innerHTML = certs.map((c) => `
    <li class="cert">
      <div class="cert__frame"><img src="${c.img}" alt="Сертификат: ${c.title}" loading="lazy"></div>
      <div class="cert__cap"><b>${c.title}</b><span>${c.meta}</span></div>
    </li>`).join('');
  const certEls = $$('.cert', track);
  const certDots = makeDots($('#certDots'), certs, (k) => goCert(k));
  let ci = 0;
  const perView = () => +getComputedStyle(track).getPropertyValue('--per') || 1;
  function goCert(i) {
    const n = certs.length;
    ci = ((i % n) + n) % n;
    const per = perView();
    const pos = Math.min(ci, n - per);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    const w = certEls[0].getBoundingClientRect().width;
    track.style.transform = `translateX(${-pos * (w + gap)}px)`;
    certEls.forEach((el, k) => el.classList.toggle('is-current', k === ci));
    certDots.forEach((b, k) => b.setAttribute('aria-pressed', String(k === ci)));
    $('#certCount').textContent = `${pad(ci + 1)} / ${pad(n)}`;
  }
  goCert(0);
  $('#certPrev').addEventListener('click', () => goCert(ci - 1));
  $('#certNext').addEventListener('click', () => goCert(ci + 1));
  onSwipe($('#certs-viewport'), () => goCert(ci - 1), () => goCert(ci + 1));
  addEventListener('resize', () => goCert(ci));
})();
