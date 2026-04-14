/**
 * analytics.js — WallsPro Event Tracking v3
 *
 * Changes from v2:
 *  - Full conversion funnel events
 *  - Drop-off tracking (paywall close, modal abandon)
 *  - A/B variant tagging (ab_exp, ab_variant params)
 *  - getFunnelReport() — per-step conversion rates
 *  - trackFunnel(step, params) — funnel-aware track shortcut
 *
 * Firebase/GA4: uncomment the relevant section in track().
 */

const Analytics = (() => {

  /* ── Storage configuration ─────────────────────────────────────────
     MAX_EVENTS  Hard count ceiling.  Oldest events are dropped first (FIFO).
     TRIM_TO     Target count used by overflow recovery and manual prune().
     MAX_BYTES   Byte-length safety net (pre-write check).  Each serialised
                 event is ~250-350 bytes; 400 events ≈ 120 KB — well within
                 the 5 MB localStorage quota even when other keys are present.
     ──────────────────────────────────────────────────────────────────── */
  const STORE = {
    KEY:        'wallspro_analytics_v2',
    MAX_EVENTS: 400,
    TRIM_TO:    250,     // used when quota-recovery or manual prune fires
    MAX_BYTES:  120_000, // ~120 KB  (conservative; 1 char ≈ 2 bytes in UTF-16)
  };

  /* ── Canonical event names ──────────────────────────────────────── */
  const Events = {
    // Ads
    BANNER_SHOWN:         'ad_banner_shown',
    INTERSTITIAL_SHOWN:   'ad_interstitial_shown',
    REWARDED_VIEW:        'ad_rewarded_view',
    REWARDED_COMPLETE:    'ad_rewarded_complete',
    REWARDED_SKIP:        'ad_rewarded_skip',
    // 4K unlock funnel
    HD_ATTEMPT:           'hd_unlock_attempt',     // modal opened
    HD_AD_START:          'hd_ad_start',           // user tapped "Watch ad"
    HD_COIN_START:        'hd_coin_start',         // user tapped "Use coins"
    HD_COMPLETE:          'hd_unlock_complete',    // successfully downloaded
    HD_MODAL_CLOSE:       'hd_modal_close',        // tapped "Later" / backdrop
    // Premium funnel
    PREMIUM_OPEN:         'premium_open',
    PREMIUM_PLAN_SELECT:  'premium_plan_select',
    PREMIUM_CTA_TAP:      'premium_cta_tap',
    PREMIUM_PURCHASE:     'premium_purchase',
    PREMIUM_CLOSE:        'premium_close',          // drop-off
    PREMIUM_EXPIRED:      'premium_expired',
    // Coins
    COIN_EARNED:          'coin_earned',
    COIN_SPENT:           'coin_spent',
    DAILY_BONUS:          'daily_bonus_claimed',
    BONUS_COINS_OPEN:     'bonus_coins_open',
    BONUS_COINS_EARN:     'bonus_coins_earn',
    // A/B
    AB_ASSIGNED:          'ab_assigned',
    // Referral
    REFERRAL_GENERATED:   'referral_generated',
    REFERRAL_CLAIMED:     'referral_claimed',
    REFERRAL_SHARE:       'referral_share',
    // UX
    WALLPAPER_VIEWED:     'wallpaper_viewed',
    WALLPAPER_DOWNLOADED: 'wallpaper_downloaded',
    PAGE_VIEW:            'page_view',
  };

  /* ── Conversion funnel definition ───────────────────────────────── */
  //  Each array is a funnel. Steps are ordered; drop-off = (step N+1) / (step N).
  const FUNNELS = {
    hd_unlock: [
      Events.HD_ATTEMPT,
      Events.HD_AD_START,
      Events.REWARDED_VIEW,
      Events.REWARDED_COMPLETE,
      Events.HD_COMPLETE,
    ],
    premium: [
      Events.PREMIUM_OPEN,
      Events.PREMIUM_PLAN_SELECT,
      Events.PREMIUM_CTA_TAP,
      Events.PREMIUM_PURCHASE,
    ],
  };

  /* ── Core track ─────────────────────────────────────────────────── */
  function track(event, params = {}) {
    // Always append current A/B assignments so every event is segmentable
    const abAssignments = window.ABTest?.getAll() ?? {};
    const entry = {
      event,
      params: { ...params, session: _sessionId(), ...abAssignments },
      ts: Date.now(),
    };

    _store(entry);

    // ── Firebase Analytics (uncomment when SDK added) ─────────────
    // if (window.firebase?.analytics) {
    //   const { getAnalytics, logEvent } = window.firebase;
    //   logEvent(getAnalytics(), event, { ...params, ...abAssignments });
    // }

    // ── Google Analytics 4 ────────────────────────────────────────
    // if (window.gtag) { window.gtag('event', event, { ...params, ...abAssignments }); }
  }

  /**
   * Convenience: track a funnel step with the funnel name attached.
   * Easier to filter in any analytics backend.
   */
  function trackFunnel(funnelName, event, params = {}) {
    track(event, { ...params, funnel: funnelName });
  }

  /* ── Convenience wrappers ───────────────────────────────────────── */
  function trackPageView(page)                    { track(Events.PAGE_VIEW, { page }); }
  function trackDownload(category, isHD = false)  { track(Events.WALLPAPER_DOWNLOADED, { category, hd: isHD }); }
  function trackView(category)                    { track(Events.WALLPAPER_VIEWED, { category }); }

  /* ── Storage ────────────────────────────────────────────────────── */

  /**
   * Safe read.  Returns [] on missing or corrupt data and wipes the corrupt
   * key so future writes don't keep re-hitting the same parse error.
   */
  function _load() {
    try {
      const raw  = localStorage.getItem(STORE.KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error('not-array');
      return data;
    } catch {
      console.warn('[Analytics] corrupt storage — resetting');
      try { localStorage.removeItem(STORE.KEY); } catch {}
      return [];
    }
  }

  /**
   * Safe write with two layers of overflow protection:
   *
   *   Layer 1 — byte pre-check (fast path, no I/O)
   *     If the serialised JSON exceeds MAX_BYTES, trim to TRIM_TO before
   *     attempting the write.  Avoids a guaranteed QuotaExceededError.
   *
   *   Layer 2 — QuotaExceededError recovery (other keys consumed quota)
   *     If setItem still throws, halve the array and retry once.  This
   *     reclaims space by removing the oldest half of events.
   */
  function _write(data) {
    let json = JSON.stringify(data);

    // Layer 1: byte ceiling — trim oldest (tail) until under the limit
    if (json.length > STORE.MAX_BYTES) {
      data.length = STORE.TRIM_TO;
      json = JSON.stringify(data);
    }

    try {
      localStorage.setItem(STORE.KEY, json);
    } catch (e) {
      const isQuota = e?.name === 'QuotaExceededError'
                   || e?.name === 'NS_ERROR_DOM_QUOTA_REACHED'; // Firefox
      if (isQuota) {
        // Layer 2: other keys may have consumed remaining quota.
        // Halve the event list (drops oldest half) and retry exactly once.
        data.length = Math.max(1, Math.floor(data.length / 2));
        try {
          localStorage.setItem(STORE.KEY, JSON.stringify(data));
        } catch {
          // Storage genuinely unavailable — give up without crashing.
          console.warn('[Analytics] quota exceeded, events not persisted');
        }
      } else {
        console.warn('[Analytics] store failed:', e?.name);
      }
    }
  }

  /**
   * Append one event, enforce count ceiling, then persist.
   * New events go to the front (index 0); oldest are at the back — FIFO.
   */
  function _store(entry) {
    const data = _load();
    data.unshift(entry);
    // Count ceiling: trim tail (oldest) to MAX_EVENTS
    if (data.length > STORE.MAX_EVENTS) data.length = STORE.MAX_EVENTS;
    _write(data);
  }

  /**
   * Read up to `limit` of the most-recent events.
   * @param {number} [limit=50]
   * @returns {Array}
   */
  function getEvents(limit = 50) {
    return _load().slice(0, limit);
  }

  /**
   * Manually trim stored events to `keepCount` (default: TRIM_TO).
   * Useful for the analytics dashboard or emergency storage recovery.
   * @param {number} [keepCount]
   * @returns {number} Remaining event count after prune.
   */
  function prune(keepCount = STORE.TRIM_TO) {
    const data = _load();
    if (data.length <= keepCount) return data.length;
    data.length = Math.max(0, keepCount);
    _write(data);
    return data.length;
  }

  /**
   * Returns a snapshot of current storage usage.
   * Useful for the analytics dashboard capacity indicator.
   * @returns {{ events: number, byteEst: number, maxEvents: number, maxBytes: number, pctFull: number }}
   */
  function getStorageInfo() {
    try {
      const raw    = localStorage.getItem(STORE.KEY) ?? '[]';
      const count  = _load().length;
      const bytes  = raw.length * 2; // UTF-16: 2 bytes per code unit
      return {
        events:    count,
        byteEst:   bytes,
        maxEvents: STORE.MAX_EVENTS,
        maxBytes:  STORE.MAX_BYTES,
        // Use byte fill as the primary gauge — it's the actual quota pressure
        pctFull:   Math.min(100, Math.round((bytes / STORE.MAX_BYTES) * 100)),
      };
    } catch {
      return { events: 0, byteEst: 0, maxEvents: STORE.MAX_EVENTS, maxBytes: STORE.MAX_BYTES, pctFull: 0 };
    }
  }

  /* ── Conversion rates ───────────────────────────────────────────── */
  function getConversionRate() {
    const all    = getEvents(STORE.MAX_EVENTS);
    const count  = ev => all.filter(e => e.event === ev).length;
    return {
      rewardedViews:        count(Events.REWARDED_VIEW),
      rewardedCompletions:  count(Events.REWARDED_COMPLETE),
      rewardedRate:         _rate(count(Events.REWARDED_VIEW), count(Events.REWARDED_COMPLETE)),
      premiumOpens:         count(Events.PREMIUM_OPEN),
      premiumPurchases:     count(Events.PREMIUM_PURCHASE),
      premiumRate:          _rate(count(Events.PREMIUM_OPEN), count(Events.PREMIUM_PURCHASE)),
      hdAttempts:           count(Events.HD_ATTEMPT),
      hdConversions:        count(Events.HD_COMPLETE),
      hdRate:               _rate(count(Events.HD_ATTEMPT), count(Events.HD_COMPLETE)),
    };
  }

  /**
   * Compute per-step drop-off for a named funnel.
   * Returns an array of { event, count, rate } objects.
   *
   * @param {'hd_unlock'|'premium'} funnelName
   */
  function getFunnelReport(funnelName) {
    const steps = FUNNELS[funnelName];
    if (!steps) return [];
    const all = getEvents(STORE.MAX_EVENTS);
    return steps.map((ev, i) => {
      const count = all.filter(e => e.event === ev).length;
      const prev  = i === 0
        ? count
        : all.filter(e => e.event === steps[i - 1]).length;
      return {
        step:  i + 1,
        event: ev,
        count,
        dropOffRate: prev > 0 ? Math.round((1 - count / prev) * 100) : 0,
      };
    });
  }

  /** Per A/B variant conversion breakdown for a given experiment + metric event. */
  function getABReport(experimentKey, successEvent) {
    const all     = getEvents(STORE.MAX_EVENTS);
    const assigns = {};
    const success = {};

    all.forEach(e => {
      const v = e.params?.[experimentKey];
      if (!v) return;
      if (!assigns[v]) { assigns[v] = 0; success[v] = 0; }
      assigns[v]++;
      if (e.event === successEvent) success[v]++;
    });

    return Object.keys(assigns).map(variant => ({
      variant,
      impressions: assigns[variant],
      conversions: success[variant] ?? 0,
      rate: _rate(assigns[variant], success[variant] ?? 0),
    }));
  }

  /* ── Helpers ────────────────────────────────────────────────────── */
  function _rate(total, converted) {
    return total > 0 ? Math.round((converted / total) * 100) : 0;
  }

  let _sid = null;
  function _sessionId() {
    if (!_sid) _sid = Math.random().toString(36).slice(2, 10);
    return _sid;
  }

  /* ── Public ─────────────────────────────────────────────────────── */
  return {
    track,
    trackFunnel,
    trackPageView,
    trackDownload,
    trackView,
    getEvents,
    getConversionRate,
    getFunnelReport,
    getABReport,
    prune,
    getStorageInfo,
    Events,
    FUNNELS,
  };

})();

window.Analytics = Analytics;
