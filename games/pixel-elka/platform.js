// Обёртка над SDK площадки. Сейчас — Яндекс Игры; вне Яндекса игра работает
// автономно (сохранение в localStorage, реклама за награду выдаётся сразу).
const Platform = {
  ysdk: null,
  player: null,
  lang: 'ru',
  onPause: () => {},
  onResume: () => {},

  async init() {
    try {
      if (typeof YaGames !== 'undefined') {
        this.ysdk = await YaGames.init();
        this.lang = (this.ysdk.environment && this.ysdk.environment.i18n.lang) || 'ru';
        try { this.player = await this.ysdk.getPlayer({ scopes: false }); } catch (e) { /* без игрока — только localStorage */ }
        this.ysdk.on && this.ysdk.on('game_api_pause', () => this.onPause());
        this.ysdk.on && this.ysdk.on('game_api_resume', () => this.onResume());
      }
    } catch (e) {
      console.warn('SDK init failed', e);
    }
    if (!this.ysdk) this.lang = (navigator.language || 'ru').slice(0, 2);
  },

  ready() {
    try { this.ysdk && this.ysdk.features.LoadingAPI.ready(); } catch (e) {}
  },
  gameplayStart() {
    try { this.ysdk && this.ysdk.features.GameplayAPI.start(); } catch (e) {}
  },
  gameplayStop() {
    try { this.ysdk && this.ysdk.features.GameplayAPI.stop(); } catch (e) {}
  },

  async load() {
    let local = null, remote = null;
    try { local = JSON.parse(localStorage.getItem('pixel_elka_save') || 'null'); } catch (e) {}
    if (this.player) {
      try { remote = (await this.player.getData(['save'])).save || null; } catch (e) {}
    }
    const level = s => (s && s.level) || 0;
    return level(remote) > level(local) ? remote : local;
  },

  save(data) {
    try { localStorage.setItem('pixel_elka_save', JSON.stringify(data)); } catch (e) {}
    if (this.player) this.player.setData({ save: data }).catch(() => {});
  },

  showInterstitial() {
    return new Promise(resolve => {
      if (!this.ysdk) return resolve();
      this.ysdk.adv.showFullscreenAdv({ callbacks: {
        onOpen: () => this.onPause(),
        onClose: () => { this.onResume(); resolve(); },
        onError: () => { this.onResume(); resolve(); },
        onOffline: () => resolve()
      } });
    });
  },

  // Возвращает true, если награду нужно выдать.
  showRewarded() {
    return new Promise(resolve => {
      if (!this.ysdk) return resolve(true);
      let rewarded = false;
      this.ysdk.adv.showRewardedVideo({ callbacks: {
        onOpen: () => this.onPause(),
        onRewarded: () => { rewarded = true; },
        onClose: () => { this.onResume(); resolve(rewarded); },
        onError: () => { this.onResume(); resolve(false); }
      } });
    });
  }
};
