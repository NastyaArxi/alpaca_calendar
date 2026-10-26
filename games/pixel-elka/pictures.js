// Пиксельные картинки уровней. '.' — пусто, остальные символы — ключи PALETTE.
// Чтобы добавить уровень, достаточно дописать картинку в PICTURES.
(function (root) {
  const PALETTE = {
    g: '#1f8a3f', G: '#6fd36f', b: '#8a5530', y: '#ffd23f', o: '#ff8a1c',
    r: '#e63946', R: '#a4161a', w: '#ffffff', B: '#2f6fe0', c: '#7fd8ff',
    s: '#ffc896', k: '#3a3f58', p: '#ff7eb6', n: '#a9b1c4', v: '#9b5de5'
  };

  const PICTURES = [
    { id: 'tree', name: { ru: 'Ёлка', en: 'Christmas tree' }, rows: [
      '.......yy.......',
      '......yyyy......',
      '.......gg.......',
      '......gggg......',
      '.....ggrggg.....',
      '....gggggggg....',
      '......gggg......',
      '.....ggggBgg....',
      '....gyggggggg...',
      '...gggggggrggg..',
      '.....gggggg.....',
      '....ggBggggyg...',
      '...gggggggggggg.',
      '..gggrggggBggggg',
      '.......bb.......',
      '......bbbb......'
    ] },
    { id: 'snowflake', name: { ru: 'Снежинка', en: 'Snowflake' }, rows: [
      '.......c.......',
      '....c..c..c....',
      '.....c.c.c.....',
      '..c...ccc...c..',
      '...c...c...c...',
      '....c..w..c....',
      '.c...cwwwc...c.',
      'ccccwwwwwwwcccc',
      '.c...cwwwc...c.',
      '....c..w..c....',
      '...c...c...c...',
      '..c...ccc...c..',
      '.....c.c.c.....',
      '....c..c..c....',
      '.......c.......'
    ] },
    { id: 'mandarin', name: { ru: 'Мандарин', en: 'Tangerine' }, rows: [
      '................',
      '.........gg.....',
      '........gGGg....',
      '.......bgGg.....',
      '.....oobooo.....',
      '...ooooooooooo..',
      '..oyyoooooooooo.',
      '..oyoooooooooooo',
      '.ooooooooooooooo',
      '.ooooooooooooooo',
      '.ooooooooooooooo',
      '.ooooooooooooooR',
      '..ooooooooooooR.',
      '...ooooooooooR..',
      '.....oooooRR....',
      '................'
    ] },
    { id: 'star', name: { ru: 'Звезда', en: 'Star' }, rows: [
      '.......yy.......',
      '.......yy.......',
      '......yyyy......',
      '......yyyy......',
      'yyyyyyyooyyyyyyy',
      '.yyyyyooooyyyyy.',
      '..yyyyooooyyyy..',
      '...yyyyooyyyy...',
      '....yyyyyyyy....',
      '....yyyyyyyy....',
      '...yyyyyyyyyy...',
      '...yyyy..yyyy...',
      '..yyyy....yyyy..',
      '..yyy......yyy..',
      '.yy..........yy.',
      '................'
    ] },
    { id: 'ball', name: { ru: 'Ёлочный шар', en: 'Bauble' }, rows: [
      '................',
      '......yyyy......',
      '......y..y......',
      '.....nnnnnn.....',
      '.....rrrrrr.....',
      '...rrrrrrrrrr...',
      '..rrwwrrrrrrrr..',
      '..rwwrrrrrrrrr..',
      '.yyyyyyyyyyyyyy.',
      '.rrrrrrrrrrrrrr.',
      '.ryryryryryryry.',
      '.rrrrrrrrrrrrrr.',
      '..rrrrrrrrrrrr..',
      '...rrrrrrrrrr...',
      '.....rrrrrr.....',
      '................'
    ] },
    { id: 'gift', name: { ru: 'Подарок', en: 'Gift' }, rows: [
      '................',
      '....rr....rr....',
      '...r..r..r..r...',
      '...r...rr...r...',
      '....rrrrrrrr....',
      '.BBBBBBrrBBBBBB.',
      '.BBBBBBrrBBBBBB.',
      '.rrrrrrrrrrrrrr.',
      '..BBBBBrrBBBBB..',
      '..BBBBBrrBBBBB..',
      '..BcBBBrrBBBcB..',
      '..BBBBBrrBBBBB..',
      '..BBBcBrrBcBBB..',
      '..BBBBBrrBBBBB..',
      '..BBBBBrrBBBBB..',
      '................'
    ] },
    { id: 'bell', name: { ru: 'Колокольчик', en: 'Bell' }, rows: [
      '................',
      '.......yy.......',
      '......y..y......',
      '......yyyy......',
      '.....yyyyyy.....',
      '....yyyywyyy....',
      '....yyyywyyy....',
      '....yyyyyyyy....',
      '...yyyyyyyyyy...',
      '...yyyyyyyyyy...',
      '..yyyyyyyyyyyy..',
      '.oooooooooooooo.',
      '.......oo.......',
      '..gg........gg..',
      '.gRRg......gRRg.',
      '..gg........gg..'
    ] },
    { id: 'mitten', name: { ru: 'Варежка', en: 'Mitten' }, rows: [
      '................',
      '......rrrrr.....',
      '.....rrrrrrr....',
      '....rrwrrwrrr...',
      '....rrrrrrrrr...',
      '.rr.rrwrrwrrr...',
      'rrrrrrrrrrrrr...',
      'rrwrrrrwrrwrr...',
      'rrrrrrrrrrrrr...',
      '.rrrrwrrwrrrr...',
      '..rrrrrrrrrrr...',
      '...rrrrrrrrrr...',
      '...wwwwwwwwww...',
      '...wcwcwcwcww...',
      '...wwwwwwwwww...',
      '................'
    ] },
    { id: 'snowman', name: { ru: 'Снеговик', en: 'Snowman' }, rows: [
      '.....kkkkkk.....',
      '......kkkk......',
      '....kkkkkkkk....',
      '.....wwwwww.....',
      '....wwkwwkww....',
      '....wwwwoooo....',
      '.....wwwwww.....',
      '...rrrrrrrrrr...',
      '....wwwrrwww....',
      '...wwwwkwwwww...',
      '..wwwwwwwwwwww..',
      '..wwwwwkwwwwww..',
      '..wwwwwwwwwwww..',
      '...wwwwkwwwww...',
      '....wwwwwwww....',
      '................'
    ] },
    { id: 'santa', name: { ru: 'Дед Мороз', en: 'Grandfather Frost' }, rows: [
      '......rrrr......',
      '.....rrrrrrw....',
      '....rrrrrrr.ww..',
      '...wwwwwwwwwww..',
      '...wwwwwwwwww...',
      '....ssssssss....',
      '....skssssks....',
      '....ssssssss....',
      '...wwssppssww...',
      '..wwwwwwwwwwww..',
      '..wwwwwwwwwwww..',
      '..wwwwwwwwwwww..',
      '...wwwwwwwwww...',
      '....wwwwwwww....',
      '.....wwwwww.....',
      '......wwww......'
    ] }
  ];

  // Выравниваем строки по ширине, чтобы опечатка в длине не ломала уровень.
  for (const pic of PICTURES) {
    const w = Math.max(...pic.rows.map(r => r.length));
    pic.rows = pic.rows.map(r => r.padEnd(w, '.'));
    pic.w = w;
    pic.h = pic.rows.length;
  }

  const api = { PALETTE, PICTURES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(this);
