/**
 * coins.js — WallsPro Coin Economy v3
 *
 * Changes from v2:
 *  - Daily cap: max 30 coins earned from ads per calendar day
 *  - incrementHDAttempt() / getHDAttempts() for paywall trigger
 *  - Referral reward support
 *  - Analytics events use canonical names
 */

const Coins = (() => {

  const STORAGE_KEY   = 'wallspro_coins_v2';
  const DAILY_KEY     = 'wallspro_daily_v1';
  const DAY_CAP_KEY   = 'wallspro_day_cap_v1';
  const HD_ATTS_KEY   = 'wallspro_hd_atts_v1';

  /* ── Economy config ─────────────────────────────────────────────── */
  const EARN = {
    first_visit:  20,
    daily_login:   5,
    watched_ad:   10,
    referral:     50,
  };

  const COSTS = {
    hd_download:  15,
    ai_generate:  25,
    premium_wall: 30,
  };

  const DAILY_AD_CAP = 30; // max coins from ads per day

  /* ── Storage ────────────────────────────────────────────────────── */
  function _load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { balance: 0, history: [] }; }
    catch { return { balance: 0, history: [] }; }
  }

  function _save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    _notifyListeners(data.balance);
  }

  function _loadDayCap() {
    try {
      const today  = new Date().toDateString();
      const stored = JSON.parse(localStorage.getItem(DAY_CAP_KEY)) ?? {};
      if (stored.date !== today) return { date: today, earned: 0 };
      return stored;
    } catch { return { date: new Date().toDateString(), earned: 0 }; }
  }

  function _saveDayCap(cap) {
    localStorage.setItem(DAY_CAP_KEY, JSON.stringify(cap));
  }

  /* ── Core API ───────────────────────────────────────────────────── */
  function getBalance() { return _load().balance; }

  function add(amount, reason = '') {
    if (amount <= 0) return getBalance();

    // Enforce daily cap for ad rewards
    if (reason === 'watched_ad') {
      const cap     = _loadDayCap();
      const allowed = Math.min(amount, DAILY_AD_CAP - cap.earned);
      if (allowed <= 0) {
        _toast('Límite diario de monedas alcanzado 🪙');
        return getBalance();
      }
      amount        = allowed;
      cap.earned   += amount;
      _saveDayCap(cap);
    }

    const data = _load();
    data.balance += amount;
    data.history.unshift({ type: 'earn', amount, reason, ts: Date.now() });
    if (data.history.length > 100) data.history.length = 100;
    _save(data);
    _showEarnToast(amount, reason);
    window.Analytics?.track(
      window.Analytics.Events?.COIN_EARNED ?? 'coin_earned',
      { amount, reason, balance: data.balance }
    );
    return data.balance;
  }

  function spend(amount, reason = '') {
    if (amount <= 0) return true;
    const data = _load();
    if (data.balance < amount) return false;
    data.balance -= amount;
    data.history.unshift({ type: 'spend', amount, reason, ts: Date.now() });
    if (data.history.length > 100) data.history.length = 100;
    _save(data);
    window.Analytics?.track(
      window.Analytics.Events?.COIN_SPENT ?? 'coin_spent',
      { amount, reason, balance: data.balance }
    );
    return true;
  }

  function canAfford(amount) { return getBalance() >= amount; }
  function getHistory()      { return _load().history; }

  /* ── Daily bonus ────────────────────────────────────────────────── */
  function claimDailyBonus() {
    const today   = new Date().toDateString();
    const last    = localStorage.getItem(DAILY_KEY);
    if (last === today) return false;
    localStorage.setItem(DAILY_KEY, today);
    const isFirst = !last;
    add(isFirst ? EARN.first_visit : EARN.daily_login, isFirst ? 'first_visit' : 'daily_login');
    window.Analytics?.track(
      window.Analytics.Events?.DAILY_BONUS ?? 'daily_bonus_claimed',
      { isFirst }
    );
    return true;
  }

  /* ── HD attempt tracking (paywall trigger) ──────────────────────── */
  function incrementHDAttempt() {
    const n = (parseInt(localStorage.getItem(HD_ATTS_KEY) ?? '0')) + 1;
    localStorage.setItem(HD_ATTS_KEY, String(n));
    return n;
  }
  function getHDAttempts() {
    return parseInt(localStorage.getItem(HD_ATTS_KEY) ?? '0');
  }

  /* ── Referral reward ────────────────────────────────────────────── */
  function claimReferral(code) {
    const usedKey = 'wallspro_ref_used';
    const used    = JSON.parse(localStorage.getItem(usedKey) ?? '[]');
    if (used.includes(code)) return false; // already claimed
    used.push(code);
    localStorage.setItem(usedKey, JSON.stringify(used));
    add(EARN.referral, 'referral');
    window.Analytics?.track(
      window.Analytics.Events?.REFERRAL_CLAIMED ?? 'referral_claimed',
      { code }
    );
    return true;
  }

  /* ── Listeners ──────────────────────────────────────────────────── */
  const _listeners = [];

  function onUpdate(fn) {
    _listeners.push(fn);
    fn(getBalance()); // fire immediately
    return () => {
      const i = _listeners.indexOf(fn);
      if (i >= 0) _listeners.splice(i, 1);
    };
  }

  function _notifyListeners(balance) {
    _listeners.forEach(fn => fn(balance));
  }

  /* ── Toasts ─────────────────────────────────────────────────────── */
  function _toast(msg) {
    if (typeof showToast === 'function') { showToast(msg); return; }
    const t = document.createElement('div');
    t.className = 'app-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('app-toast--show'));
    setTimeout(() => {
      t.classList.remove('app-toast--show');
      setTimeout(() => t.remove(), 300);
    }, 2800);
  }

  function _showEarnToast(amount, reason) {
    const labels = {
      first_visit: '¡Bienvenido!',
      daily_login: 'Bonus diario',
      watched_ad:  'Recompensa',
      referral:    '¡Invitación canjeada!',
    };
    _toast(`${labels[reason] ?? 'Ganaste'}  +${amount} 🪙`);
  }

  /* ── Public ─────────────────────────────────────────────────────── */
  return {
    getBalance, add, spend, canAfford, getHistory,
    claimDailyBonus, claimReferral,
    incrementHDAttempt, getHDAttempts,
    onUpdate,
    COSTS, EARN,
  };

})();

window.Coins = Coins;
