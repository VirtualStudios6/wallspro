/**
 * ab-test.js — WallsPro Lightweight A/B Testing
 *
 * Usage:
 *   ABTest.get('cta_4k')             → 'watch_free' | 'unlock_hd'
 *   ABTest.get('coin_cost_hd')       → 10 | 15 | 20
 *   ABTest.get('paywall_emphasis')   → 'savings' | 'features'
 *   ABTest.track('cta_4k', 'hd_unlock_complete', { source: 'ad' })
 *   ABTest.getAll()                  → { cta_4k: 'watch_free', ... }
 *
 * Rules:
 *   - Assignment is random, weighted, and persisted per device in localStorage.
 *   - Once assigned, the variant never changes (stable experiment).
 *   - Every assignment fires 'ab_assigned' once via Analytics.
 *   - track() wraps Analytics.track, injecting ab_exp + ab_variant params.
 */

const ABTest = (() => {

  const STORAGE_KEY = 'wallspro_ab_v1';

  /* ── Experiment registry ────────────────────────────────────────── */
  const EXPERIMENTS = {

    /**
     * Primary CTA label in the 4K unlock modal.
     * Hypothesis: "Desbloquear en HD" increases ad tap rate vs "Ver anuncio".
     */
    cta_4k: {
      variants: ['watch_free', 'unlock_hd'],
      weights:  [50, 50],
    },

    /**
     * Coin cost for HD download.
     * Hypothesis: 10-coin cost increases coin-payment conversions;
     *             20-coin cost pushes more users toward watching ads.
     */
    coin_cost_hd: {
      variants: [10, 15, 20],
      weights:  [33, 34, 33],
    },

    /**
     * Paywall layout emphasis.
     * 'savings'  — leads with "you saved X coins" + price comparison.
     * 'features' — leads with perks grid + social proof.
     */
    paywall_emphasis: {
      variants: ['savings', 'features'],
      weights:  [50, 50],
    },

    /**
     * Paywall trigger threshold.
     * How many rewarded ads must complete before paywall fires automatically.
     */
    paywall_threshold: {
      variants: [1, 2, 3],
      weights:  [33, 34, 33],
    },

  };

  /* ── Storage ────────────────────────────────────────────────────── */
  function _load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}; }
    catch { return {}; }
  }

  function _save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /* ── Weighted random picker ─────────────────────────────────────── */
  function _pick(exp) {
    const { variants, weights } = exp;
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < variants.length; i++) {
      r -= weights[i];
      if (r <= 0) return variants[i];
    }
    return variants[variants.length - 1];
  }

  /* ── Core API ───────────────────────────────────────────────────── */

  /**
   * Get (or lazily assign) a variant for an experiment.
   * Returns null if the experiment key doesn't exist.
   */
  function get(experimentKey) {
    const stored = _load();

    if (experimentKey in stored) {
      return stored[experimentKey];
    }

    const exp = EXPERIMENTS[experimentKey];
    if (!exp) return null;

    const variant = _pick(exp);
    stored[experimentKey] = variant;
    _save(stored);

    // Fire assignment event once
    window.Analytics?.track('ab_assigned', {
      experiment: experimentKey,
      variant,
    });

    return variant;
  }

  /** Return all current assignments. */
  function getAll() { return _load(); }

  /**
   * Wrap Analytics.track with A/B context for a given experiment.
   * Use this when you want to tie a metric to a specific experiment.
   */
  function track(experimentKey, event, params = {}) {
    const variant = get(experimentKey);
    window.Analytics?.track(event, {
      ...params,
      ab_exp:     experimentKey,
      ab_variant: variant ?? 'control',
    });
  }

  /**
   * Override a specific assignment (for testing/QA).
   * Usage: ABTest.force('cta_4k', 'unlock_hd')
   */
  function force(experimentKey, variant) {
    const stored = _load();
    stored[experimentKey] = variant;
    _save(stored);
  }

  /** Reset all assignments (for testing). */
  function reset() { localStorage.removeItem(STORAGE_KEY); }

  /* ── Public ─────────────────────────────────────────────────────── */
  return { get, getAll, track, force, reset, EXPERIMENTS };

})();

window.ABTest = ABTest;
