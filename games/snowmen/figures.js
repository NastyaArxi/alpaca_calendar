// Фигурки на поле: снеговик в разных нарядах и Дед Мороз (главный приз календаря 31 декабря).
(function (root) {
  const INK = '#1F2A44';
  const OUT = `stroke="${INK}" stroke-width="1.1"`;

  // Тело снеговика из макета (viewBox 40×48). Шапки нарядов нарисованы под старую голову,
  // поэтому они чуть увеличены и сдвинуты, чтобы сесть на новую.
  function snowman(hat, scarf, own) {
    return '<svg viewBox="0 0 40 48" aria-hidden="true">' +
      '<ellipse cx="20" cy="46" rx="10" ry="2" fill="rgba(31,42,68,.18)"/>' +
      `<circle cx="20" cy="35" r="10.5" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/>` +
      `<circle cx="20" cy="19" r="7.5" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/>` +
      `<rect x="11.5" y="24.5" width="17" height="4.4" rx="2.2" fill="${scarf}"/><rect x="22.5" y="26" width="4" height="8" rx="1.6" fill="${scarf}"/>` +
      `<circle cx="17.3" cy="18" r="1.3" fill="${INK}"/><circle cx="22.7" cy="18" r="1.3" fill="${INK}"/>` +
      '<path d="M20 20.3 L27 21.4 L20 22.6 Z" fill="#FF8A2A"/>' +
      '<circle cx="15.6" cy="21.4" r="1.4" fill="#F7A1A9"/><circle cx="24.4" cy="21.4" r="1.4" fill="#F7A1A9"/>' +
      `<circle cx="20" cy="33" r="1.3" fill="${INK}"/><circle cx="20" cy="38" r="1.3" fill="${INK}"/>` +
      (own ? hat : `<g transform="translate(-3 1.4) scale(1.15)">${hat}</g>`) + '</svg>';
  }

  const DESIGN_HAT = '<rect x="12.5" y="3" width="15" height="9" rx="2" fill="#E03C4E"/><rect x="9.5" y="10.5" width="21" height="3.2" rx="1.6" fill="#B82A3B"/>';

  const HATS = {
    topRed: '<rect x="13.5" y="7" width="13" height="2.6" rx="1.2" fill="#d93a52"/><rect x="15.5" y="2" width="9" height="6" rx="1.5" fill="#d93a52"/>',
    ushanka: `<path d="M13.2 11 Q20 2.5 26.8 11 Z" fill="#8a5a3a" ${OUT}/><rect x="12.5" y="9" width="15" height="3.2" rx="1.6" fill="#d9b48a" ${OUT}/>` +
      `<rect x="11.6" y="11" width="3.2" height="6.5" rx="1.6" fill="#d9b48a" ${OUT}/><rect x="25.2" y="11" width="3.2" height="6.5" rx="1.6" fill="#d9b48a" ${OUT}/>`,
    elf: `<path d="M13.5 10 L21 0.8 L26.5 10 Z" fill="#2e7a58" ${OUT}/><rect x="13" y="8.6" width="14" height="2.6" rx="1.3" fill="#d93a52"/><circle cx="21" cy="1.4" r="1.8" fill="#ffd23f" ${OUT}/>`,
    beanie: `<path d="M13.5 11 Q20 2 26.5 11 Z" fill="#2f6fe0" ${OUT}/><rect x="13.2" y="9" width="13.6" height="2.8" rx="1.2" fill="#9cc2ff"/><circle cx="20" cy="3.4" r="2.3" fill="#fff" ${OUT}/>`,
    crown: `<path d="M13.5 10.5 L13.5 4 L16.8 7 L20 2.5 L23.2 7 L26.5 4 L26.5 10.5 Z" fill="#f5c542" ${OUT}/><circle cx="20" cy="8" r="1.3" fill="#d93a52"/>`,
    topBlack: '<rect x="13.5" y="7" width="13" height="2.6" rx="1.2" fill="#2b2b3a"/><rect x="15.5" y="1.5" width="9" height="6.5" rx="1.5" fill="#2b2b3a"/>' +
      '<rect x="15.5" y="5.6" width="9" height="1.6" fill="#d93a52"/><ellipse cx="23" cy="5" rx="2" ry="1" fill="#2e7a58"/><circle cx="21.5" cy="5.4" r="0.9" fill="#d93a52"/>',
    earmuffs: '<path d="M13.6 13 Q20 4 26.4 13" stroke="#ff7eb6" stroke-width="1.8" fill="none"/>' +
      `<circle cx="13.6" cy="14.3" r="2.7" fill="#ffb3d6" ${OUT}/><circle cx="26.4" cy="14.3" r="2.7" fill="#ffb3d6" ${OUT}/>`,
    tangerine: `<path d="M13.5 11 Q20 2.5 26.5 11 Z" fill="#ff8a1c" ${OUT}/><path d="M20 4 q3 -3 5 -1.5 q-2 2.5 -5 1.5z" fill="#2e7a58"/>`,
    holly: '<ellipse cx="15.5" cy="9.6" rx="2.6" ry="1.2" fill="#2e7a58" transform="rotate(-20 15.5 9.6)"/>' +
      '<ellipse cx="24.5" cy="9.6" rx="2.6" ry="1.2" fill="#2e7a58" transform="rotate(20 24.5 9.6)"/>' +
      '<ellipse cx="20" cy="8.4" rx="2.6" ry="1.2" fill="#2e7a58"/><circle cx="18.6" cy="9.4" r="1" fill="#d93a52"/><circle cx="21.4" cy="9.4" r="1" fill="#d93a52"/>',
    hockey: `<path d="M13 13.5 Q13 5 20 5 Q27 5 27 13.5 L25 13.5 Q25 8 20 8 Q15 8 15 13.5 Z" fill="#2f6fe0" ${OUT}/><rect x="19" y="5" width="2" height="3" fill="#fff"/>`,
    kokoshnik: `<path d="M12.8 11 Q20 -1.5 27.2 11 Z" fill="#d93a52" ${OUT}/><path d="M15.5 10.5 Q20 3 24.5 10.5" stroke="#f5c542" stroke-width="1.3" fill="none"/>` +
      '<circle cx="20" cy="4.6" r="1.1" fill="#fff"/><circle cx="16.6" cy="7.2" r="0.8" fill="#fff"/><circle cx="23.4" cy="7.2" r="0.8" fill="#fff"/>'
  };

  const DED_MOROZ = '<svg viewBox="0 -4 40 48" aria-hidden="true">' +
    `<line x1="31.5" y1="9" x2="31.5" y2="38" stroke="#c9a227" stroke-width="1.6" stroke-linecap="round"/>` +
    `<circle cx="31.5" cy="8.4" r="2.2" fill="#7fd8ff" stroke="#fff" stroke-width="0.8"/>` +
    `<path d="M11 38 L14 20 Q20 17 26 20 L29 38 Z" fill="#c81f37" ${OUT}/>` +
    '<rect x="19" y="21" width="2" height="14" fill="#fff"/>' +
    `<rect x="10.5" y="35" width="19" height="3.4" rx="1.7" fill="#fff" ${OUT}/>` +
    `<circle cx="12" cy="29" r="2.3" fill="#fff" ${OUT}/><circle cx="30.4" cy="27" r="2.3" fill="#fff" ${OUT}/>` +
    `<circle cx="20" cy="13.5" r="5" fill="#ffd2a8" ${OUT}/>` +
    `<path d="M14.6 14 Q15 25 20 26.5 Q25 25 25.4 14 Q20 18.5 14.6 14 Z" fill="#fff" ${OUT}/>` +
    `<path d="M16.6 16.3 Q20 14.6 23.4 16.3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
    `<circle cx="18.3" cy="12.4" r="0.9" fill="${INK}"/><circle cx="21.7" cy="12.4" r="0.9" fill="${INK}"/><circle cx="20" cy="14.2" r="1" fill="#f28b8b"/>` +
    `<path d="M14.5 10 Q20 2 25.5 10 Z" fill="#c81f37" ${OUT}/><rect x="13.5" y="8.4" width="13" height="3" rx="1.5" fill="#fff" ${OUT}/>` +
    '</svg>';

  // Порядок = порядок в гардеробе. day — день декабря, в который наряд выдаёт календарь.
  const FIGURES = [
    { id: 'classic', day: 0, name: { ru: 'Классика', en: 'Classic' }, svg: snowman(DESIGN_HAT, '#2E7D5B', true) },
    { id: 'ushanka', day: 2, name: { ru: 'Ушанка', en: 'Ushanka' }, svg: snowman(HATS.ushanka, '#d93a52') },
    { id: 'elf', day: 5, name: { ru: 'Колпак эльфа', en: 'Elf hat' }, svg: snowman(HATS.elf, '#d93a52') },
    { id: 'beanie', day: 8, name: { ru: 'Шапка с помпоном', en: 'Bobble hat' }, svg: snowman(HATS.beanie, '#2f6fe0') },
    { id: 'crown', day: 11, name: { ru: 'Корона', en: 'Crown' }, svg: snowman(HATS.crown, '#9b5de5') },
    { id: 'topBlack', day: 14, name: { ru: 'Цилиндр с остролистом', en: 'Holly top hat' }, svg: snowman(HATS.topBlack, '#d93a52') },
    { id: 'earmuffs', day: 17, name: { ru: 'Наушники', en: 'Earmuffs' }, svg: snowman(HATS.earmuffs, '#ff7eb6') },
    { id: 'tangerine', day: 20, name: { ru: 'Шапка-мандарин', en: 'Tangerine hat' }, svg: snowman(HATS.tangerine, '#ff8a1c') },
    { id: 'holly', day: 23, name: { ru: 'Венок из остролиста', en: 'Holly wreath' }, svg: snowman(HATS.holly, '#2e7a58') },
    { id: 'hockey', day: 26, name: { ru: 'Хоккейный шлем', en: 'Hockey helmet' }, svg: snowman(HATS.hockey, '#d93a52') },
    { id: 'kokoshnik', day: 28, name: { ru: 'Кокошник', en: 'Kokoshnik' }, svg: snowman(HATS.kokoshnik, '#f5c542') },
    { id: 'dedmoroz', day: 31, name: { ru: 'Дед Мороз', en: 'Grandfather Frost' }, svg: DED_MOROZ }
  ];

  function figure(id) { return FIGURES.find(f => f.id === id) || FIGURES[0]; }
  function figureForDay(day) { return FIGURES.find(f => f.day === day) || null; }

  const api = { FIGURES, figure, figureForDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Figures = api;
})(this);
