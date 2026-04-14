/**
 * premium.js — WallsPro Premium System v3
 *
 * Changes from v2:
 *  - recordRewardedAd() tracks completions for smart paywall trigger
 *  - shouldShowPaywall() — fires after 2 rewarded ads OR 2 HD attempts
 *  - getPlans() returns richer plan objects for the upgraded paywall UI
 */

const Premium = (() => {

  const KEY           = 'wallspro_premium_v2';
  const REWARDED_KEY  = 'wallspro_rewarded_count_v1';

  /* ── Plans ──────────────────────────────────────────────────────── */
  const PLANS = {
    monthly: {
      id:       'wallspro_premium_monthly',
      label:    '1 mes',
      sublabel: 'Flexibilidad total',
      price:    '1,99 €',
      perMonth: '1,99 €/mes',
      months:   1,
      badge:    null,
      popular:  false,
    },
    yearly: {
      id:       'wallspro_premium_yearly',
      label:    '1 año',
      sublabel: 'El más elegido',
      price:    '11,99 €',
      perMonth: '1,00 €/mes',
      months:   12,
      badge:    'Ahorra 50%',
      popular:  true,
    },
  };

  /* ── Storage ────────────────────────────────────────────────────── */
  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY)) ?? { active: false }; }
    catch { return { active: false }; }
  }
  function _save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  /* ── Core API ───────────────────────────────────────────────────── */
  function isActive() {
    const data = _load();
    if (!data.active) return false;
    if (data.expiry && Date.now() > data.expiry) {
      _save({ active: false });
      window.Analytics?.track(
        window.Analytics.Events?.PREMIUM_EXPIRED ?? 'premium_expired'
      );
      _notifyListeners(false);
      return false;
    }
    return true;
  }

  function activate(months = 1) {
    const expiry = Date.now() + months * 30 * 24 * 60 * 60 * 1000;
    _save({
      active:      true,
      expiry,
      plan:        months >= 12 ? 'yearly' : 'monthly',
      activatedAt: Date.now(),
    });
    window.Analytics?.track(
      window.Analytics.Events?.PREMIUM_PURCHASE ?? 'premium_purchase',
      { months, plan: months >= 12 ? 'yearly' : 'monthly' }
    );
    window.AdService?.removeBanner();
    _notifyListeners(true);
  }

  function deactivate() {
    _save({ active: false });
    _notifyListeners(false);
  }

  function getDaysLeft() {
    const data = _load();
    if (!data.active || !data.expiry) return 0;
    return Math.max(0, Math.ceil((data.expiry - Date.now()) / 86400000));
  }

  function getInfo() {
    const data = _load();
    return {
      active:      isActive(),
      daysLeft:    getDaysLeft(),
      plan:        data.plan ?? null,
      activatedAt: data.activatedAt ?? null,
    };
  }

  /* ── Smart paywall trigger ──────────────────────────────────────── */
  function recordRewardedAd() {
    const n = parseInt(localStorage.getItem(REWARDED_KEY) ?? '0') + 1;
    localStorage.setItem(REWARDED_KEY, String(n));
    return n;
  }

  function getRewardedCount() {
    return parseInt(localStorage.getItem(REWARDED_KEY) ?? '0');
  }

  /**
   * Returns true when user is "warm" enough to see the paywall.
   * Threshold is A/B tested via ABTest.get('paywall_threshold') → 1 | 2 | 3.
   * Falls back to 2 if ABTest module is not loaded yet.
   */
  function shouldShowPaywall() {
    if (isActive()) return false;
    const threshold  = window.ABTest?.get('paywall_threshold') ?? 2;
    const rewarded   = getRewardedCount();
    const hdAttempts = window.Coins?.getHDAttempts() ?? 0;
    return rewarded >= threshold || hdAttempts >= threshold;
  }

  /* ── Listeners ──────────────────────────────────────────────────── */
  const _listeners = [];
  function onChange(fn)            { _listeners.push(fn); }
  function _notifyListeners(state) { _listeners.forEach(fn => fn(state)); }

  /* ── Plans getter ───────────────────────────────────────────────── */
  function getPlans() { return PLANS; }

  /* ── Public ─────────────────────────────────────────────────────── */
  return {
    isActive,
    activate,
    deactivate,
    getDaysLeft,
    getInfo,
    getPlans,
    onChange,
    recordRewardedAd,
    getRewardedCount,
    shouldShowPaywall,
  };

})();

window.Premium = Premium;
