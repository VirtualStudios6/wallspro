/**
 * ad-service.js — WallsPro AdMob Service v3
 *
 * Changes from v2:
 *  - Interstitial cooldown: 60 s (up from 45 s)
 *  - REWARDED_GRACE_MS: skip interstitial for 120 s after a rewarded ad
 *  - beginCriticalAction() / endCriticalAction() — block interstitials
 *    during download, modal, or any sensitive flow
 *  - recordRewardedAd() forwarded to Premium for paywall trigger
 *
 * ⚠️  BEFORE PUBLISHING:
 *   1. Replace AD_UNITS with real AdMob IDs from admob.google.com
 *   2. Set IS_TESTING = false
 *   3. Confirm AdMob App ID is in AndroidManifest.xml + iOS Info.plist
 */

const AdService = (() => {

  /* ── Configuration ──────────────────────────────────────────────── */
  const CFG = {
    AD_UNITS: {
      banner:       'ca-app-pub-3940256099942544/6300978111',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded:     'ca-app-pub-3940256099942544/5224354917',
    },

    IS_TESTING: true,             // ← false before publishing

    INTERSTITIAL_COOLDOWN_MS:  60_000,  // 60 s between interstitials
    INTERSTITIAL_MIN_ACTIONS:       3,  // min user actions before first
    REWARDED_GRACE_MS:        120_000,  // no interstitial within 2 min of a rewarded ad
  };

  /* ── AdMob event strings (@capacitor-community/admob v9) ────────── */
  const EV = {
    reward:          'onRewardedVideoAdReward',
    rewardDismissed: 'onRewardedVideoAdDismissed',
    rewardFailed:    'onRewardedVideoAdFailedToLoad',
    intDismissed:    'interstitialAdDismissed',
    intFailed:       'interstitialAdFailedToLoad',
  };

  /* ── State ──────────────────────────────────────────────────────── */
  let _initialized    = false;
  let _bannerVisible  = false;
  let _intReady       = false;
  let _lastIntTime    = 0;
  let _lastRewardTime = 0;
  let _actionCount    = 0;
  let _criticalDepth  = 0;  // supports nested beginCritical calls

  /* ── Plugin accessor ────────────────────────────────────────────── */
  function _plugin() {
    if (!window.Capacitor?.isNativePlatform()) return null;
    return window.Capacitor?.Plugins?.AdMob ?? null;
  }

  /* ── Initialize ─────────────────────────────────────────────────── */
  async function init() {
    if (_initialized) return;
    const p = _plugin();
    if (!p) {
      // Running in browser / web preview — ads are disabled, app still works.
      console.info('[AdService] Not a native platform — ads disabled');
      return;
    }
    try {
      await p.initialize({
        requestTrackingAuthorization: true,  // triggers iOS ATT prompt
        initializeForTesting: CFG.IS_TESTING,
      });
      _initialized = true;
      console.info('[AdService] AdMob initialized', CFG.IS_TESTING ? '(TEST MODE)' : '(PRODUCTION)');
      _prepareInterstitial();
    } catch (e) {
      // Initialization failure must NEVER crash the app.
      // Common causes: missing APPLICATION_ID in AndroidManifest.xml,
      // missing GADApplicationIdentifier in Info.plist, or no network.
      console.error('[AdService] Init failed — ads disabled for this session:', e?.message ?? e);
    }
  }

  /* ── Banner ─────────────────────────────────────────────────────── */
  async function showBanner() {
    if (_bannerVisible || !_initialized || _isPremium()) return;
    const p = _plugin();
    if (!p) return;
    try {
      await p.showBanner({
        adId:      CFG.AD_UNITS.banner,
        adSize:    'ADAPTIVE_BANNER',
        position:  'BOTTOM_CENTER',
        margin:    0,
        isTesting: CFG.IS_TESTING,
        npa:       false,
      });
      _bannerVisible = true;
      document.body.classList.add('has-banner');
      _track('BANNER_SHOWN', 'ad_banner_shown');
    } catch (e) {
      console.warn('[AdService] Banner failed', e);
    }
  }

  async function hideBanner() {
    if (!_bannerVisible) return;
    const p = _plugin();
    if (!p) return;
    try {
      await p.hideBanner();
      _bannerVisible = false;
      document.body.classList.remove('has-banner');
    } catch {}
  }

  async function removeBanner() {
    const p = _plugin();
    if (!p) return;
    try {
      await p.removeBanner();
      _bannerVisible = false;
      document.body.classList.remove('has-banner');
    } catch {}
  }

  /* ── Interstitial ───────────────────────────────────────────────── */
  async function _prepareInterstitial() {
    const p = _plugin();
    if (!p || !_initialized) return;
    try {
      await p.prepareInterstitial({
        adId:      CFG.AD_UNITS.interstitial,
        isTesting: CFG.IS_TESTING,
      });
      _intReady = true;
    } catch (e) {
      _intReady = false;
      console.warn('[AdService] Prepare interstitial failed', e);
    }
  }

  /**
   * Attempt to show an interstitial.
   * Respects: cooldown, rewarded grace period, critical actions, min-actions gate.
   * @returns {Promise<boolean>} true if shown
   */
  async function showInterstitial(reason = 'browse') {
    if (_isPremium())                                            return false;
    if (_criticalDepth > 0)                                     return false;
    const now = Date.now();
    if ((now - _lastIntTime) < CFG.INTERSTITIAL_COOLDOWN_MS)    return false;
    if ((now - _lastRewardTime) < CFG.REWARDED_GRACE_MS)        return false;
    if (_actionCount < CFG.INTERSTITIAL_MIN_ACTIONS || !_intReady) return false;

    const p = _plugin();
    if (!p) return false;

    return new Promise(resolve => {
      let done    = false;
      let handles = []; // store listener handles so we can remove them

      const finish = (shown) => {
        if (done) return;
        done = true;
        // Always remove listeners — prevents them stacking across multiple calls
        handles.forEach(h => h?.remove?.());
        handles = [];
        if (shown) {
          _lastIntTime  = Date.now();
          _actionCount  = 0;
          _intReady     = false;
          _track('INTERSTITIAL_SHOWN', 'ad_interstitial_shown', { reason });
          setTimeout(_prepareInterstitial, 3000);
        }
        resolve(shown);
      };

      Promise.all([
        p.addListener(EV.intDismissed, () => finish(true)),
        p.addListener(EV.intFailed,    () => finish(false)),
      ]).then(hs => {
        handles = hs; // capture handles before the ad can dismiss
        p.showInterstitial().catch(() => finish(false));
      });
    });
  }

  /** Call after each meaningful user action (view, navigate, like). */
  function incrementAction() { _actionCount++; }

  /** Prevent interstitials during critical flows (download, modal). */
  function beginCriticalAction() { _criticalDepth++; }
  function endCriticalAction()   { _criticalDepth = Math.max(0, _criticalDepth - 1); }

  /* ── Rewarded ───────────────────────────────────────────────────── */
  /**
   * Show a rewarded ad. Premium users are instantly rewarded.
   * On completion: adds +10 coins, records for paywall trigger,
   *   and sets rewarded grace period to suppress next interstitial.
   *
   * @param {string} reason  'hd_download' | 'unlock_wallpaper' | 'ai_gen'
   * @returns {Promise<{rewarded: boolean, source: string}>}
   */
  async function showRewarded(reason = 'unknown') {
    if (_isPremium()) {
      return { rewarded: true, source: 'premium' };
    }

    const p = _plugin();
    if (!p || !_initialized) {
      return { rewarded: false, source: 'unavailable' };
    }

    _track('REWARDED_VIEW', 'ad_rewarded_view', { reason });

    return new Promise(async (resolve) => {
      const listeners = [];
      let rewarded    = false;
      let done        = false;

      const cleanup = () => listeners.forEach(l => l?.remove?.());

      const finish = (didReward) => {
        if (done) return;
        done = true;
        cleanup();

        if (didReward) {
          _lastRewardTime = Date.now();
          window.Coins?.add(10, 'watched_ad');
          window.Premium?.recordRewardedAd();
          _track('REWARDED_COMPLETE', 'ad_rewarded_complete', { reason });
        } else {
          _track('REWARDED_SKIP', 'ad_rewarded_skip', { reason });
        }

        resolve({ rewarded: didReward, source: didReward ? 'ad' : 'skipped' });
      };

      try {
        await p.prepareRewardVideoAd({
          adId:      CFG.AD_UNITS.rewarded,
          isTesting: CFG.IS_TESTING,
        });

        listeners.push(
          await p.addListener(EV.reward,          () => { rewarded = true; }),
          await p.addListener(EV.rewardDismissed, () => finish(rewarded)),
          await p.addListener(EV.rewardFailed,    () => finish(false)),
        );

        await p.showRewardVideoAd();

      } catch (e) {
        console.warn('[AdService] Rewarded failed', e);
        cleanup();
        resolve({ rewarded: false, source: 'error' });
      }
    });
  }

  /* ── Helpers ────────────────────────────────────────────────────── */
  function _isPremium() { return window.Premium?.isActive() ?? false; }

  function _track(eventKey, fallback, params = {}) {
    const ev = window.Analytics?.Events?.[eventKey] ?? fallback;
    window.Analytics?.track(ev, params);
  }

  /* ── Public ─────────────────────────────────────────────────────── */
  return {
    init,
    showBanner,
    hideBanner,
    removeBanner,
    showInterstitial,
    showRewarded,
    incrementAction,
    beginCriticalAction,
    endCriticalAction,
    get isReady()     { return _initialized; },
    get isAvailable() { return _initialized; },   // alias — used by external callers
    get hasBanner()   { return _bannerVisible; },
  };

})();

window.AdService = AdService;
