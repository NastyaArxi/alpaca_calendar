// Обёртка над SDK площадок: ВКонтакте (VK Bridge) и Яндекс Игры.
// Вне площадок игра работает автономно: сохранение в localStorage, награда за рекламу выдаётся сразу.
const Platform = {
  kind: 'none', // 'vk' | 'yandex' | 'none'
  ysdk: null,
  player: null,
  vk: null,
  lang: 'ru',
  onPause: () => {},
  onResume: () => {},

  // Вызов VK Bridge с таймаутом, чтобы игра не зависла, если ВКонтакте не ответил.
  vkSend(method, params, ms = 3000) {
    return Promise.race([
      this.vk.send(method, params),
      new Promise((_, reject) => setTimeout(() => reject(new Error(method + ' timeout')), ms))
    ]);
  },

  async init() {
    const params = new URLSearchParams(location.search);
    if (params.has('vk_app_id') && typeof vkBridge !== 'undefined') {
      this.kind = 'vk';
      this.vk = vkBridge;
      this.lang = (params.get('vk_language') || 'ru').slice(0, 2);
      try { await this.vkSend('VKWebAppInit'); } catch (e) { console.warn('VK init failed', e); }
      return;
    }
    try {
      if (typeof YaGames !== 'undefined') {
        this.ysdk = await YaGames.init();
        this.kind = 'yandex';
        this.lang = (this.ysdk.environment && this.ysdk.environment.i18n.lang) || 'ru';
        try { this.player = await this.ysdk.getPlayer({ scopes: false }); } catch (e) { /* без игрока — только localStorage */ }
        this.ysdk.on && this.ysdk.on('game_api_pause', () => this.onPause());
        this.ysdk.on && this.ysdk.on('game_api_resume', () => this.onResume());
        return;
      }
    } catch (e) {
      console.warn('SDK init failed', e);
    }
    this.lang = (navigator.language || 'ru').slice(0, 2);
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
    try { local = JSON.parse(localStorage.getItem('snowmen_save') || 'null'); } catch (e) {}
    try {
      if (this.kind === 'vk') {
        const res = await this.vkSend('VKWebAppStorageGet', { keys: ['save'] });
        const item = res.keys && res.keys.find(k => k.key === 'save');
        remote = item && item.value ? JSON.parse(item.value) : null;
      } else if (this.player) {
        remote = (await this.player.getData(['save'])).save || null;
      }
    } catch (e) {}
    const level = s => (s && s.level) || 0;
    return level(remote) > level(local) ? remote : local;
  },

  save(data) {
    try { localStorage.setItem('snowmen_save', JSON.stringify(data)); } catch (e) {}
    if (this.kind === 'vk') this.vk.send('VKWebAppStorageSet', { key: 'save', value: JSON.stringify(data) }).catch(() => {});
    else if (this.player) this.player.setData({ save: data }).catch(() => {});
  },

  async showInterstitial() {
    if (this.kind === 'vk') {
      this.onPause();
      try { await this.vk.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' }); } catch (e) {}
      this.onResume();
      return;
    }
    if (!this.ysdk) return;
    return new Promise(resolve => {
      this.ysdk.adv.showFullscreenAdv({ callbacks: {
        onOpen: () => this.onPause(),
        onClose: () => { this.onResume(); resolve(); },
        onError: () => { this.onResume(); resolve(); },
        onOffline: () => resolve()
      } });
    });
  },

  // Возвращает true, если награду нужно выдать.
  async showRewarded() {
    if (this.kind === 'vk') {
      this.onPause();
      let ok = false;
      try { ok = !!(await this.vk.send('VKWebAppShowNativeAds', { ad_format: 'reward' })).result; } catch (e) {}
      this.onResume();
      return ok;
    }
    if (!this.ysdk) return true;
    return new Promise(resolve => {
      let rewarded = false;
      this.ysdk.adv.showRewardedVideo({ callbacks: {
        onOpen: () => this.onPause(),
        onRewarded: () => { rewarded = true; },
        onClose: () => { this.onResume(); resolve(rewarded); },
        onError: () => { this.onResume(); resolve(false); }
      } });
    });
  },

  // Копирование текста: в приложении ВКонтакте буфер обмена браузера может быть недоступен.
  async copyText(text) {
    if (this.kind === 'vk') {
      try { await this.vkSend('VKWebAppCopyText', { text }); return true; } catch (e) {}
    }
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
  }
};
