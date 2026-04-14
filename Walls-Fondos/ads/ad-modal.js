/**
 * ad-modal.js — WallsPro Ad UI v4
 *
 * API:
 *   AdModal.show4K(imgSrc)       — 4K unlock flow (A/B tested CTA + coin cost)
 *   AdModal.showPaywall(trigger) — Premium paywall (A/B savings vs features)
 *   AdModal.showChoice(opts)     — Legacy alias → show4K()
 *
 * A/B experiments consumed:
 *   cta_4k           — 'watch_free' | 'unlock_hd'
 *   coin_cost_hd     — 10 | 15 | 20
 *   paywall_emphasis — 'savings' | 'features'
 */

const AdModal = (() => {

  /* ── Styles (injected once) ─────────────────────────────────────── */
  function _ensureStyles() {
    if (document.getElementById('__am-styles')) return;
    const s  = document.createElement('style');
    s.id     = '__am-styles';
    s.textContent = `
      /* ── Overlay ────────────────────────────────── */
      .am-overlay {
        position: fixed; inset: 0; z-index: 9000;
        display: flex; align-items: flex-end; justify-content: center;
        animation: am-fade-in 0.22s ease both;
        -webkit-backdrop-filter: blur(6px);
        backdrop-filter: blur(6px);
      }
      .am-overlay--dark { background: rgba(0,0,0,0.82); }
      @keyframes am-fade-in  { from { opacity: 0 } to { opacity: 1 } }
      @keyframes am-fade-out { from { opacity: 1 } to { opacity: 0 } }

      /* ── Sheet ──────────────────────────────────── */
      .am-4k-sheet, .am-pw-sheet {
        width: 100%; max-width: 480px;
        background: #0d0d15;
        border-radius: 28px 28px 0 0;
        animation: am-slide-up 0.32s cubic-bezier(0.34,1.15,0.64,1) both;
        overflow: hidden;
        padding-bottom: env(safe-area-inset-bottom,0px);
      }
      @keyframes am-slide-up {
        from { transform: translateY(110%) }
        to   { transform: translateY(0) }
      }

      .am-handle {
        width: 36px; height: 4px;
        background: rgba(255,255,255,0.12);
        border-radius: 2px;
        margin: 10px auto 0;
      }

      /* ── 4K preview ─────────────────────────────── */
      .am-4k-preview {
        position: relative; height: 200px; overflow: hidden;
      }
      .am-4k-bg {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover;
        filter: blur(18px) brightness(0.42) saturate(1.4);
        transform: scale(1.08);
      }
      .am-4k-thumb {
        position: absolute; left: 50%; top: 50%;
        transform: translate(-50%,-50%);
        height: 140px; aspect-ratio: 9/16; object-fit: cover;
        border-radius: 14px;
        border: 2px solid rgba(255,255,255,0.15);
        box-shadow: 0 8px 40px rgba(0,0,0,0.7);
        filter: blur(6px) brightness(0.68);
      }
      .am-4k-lock {
        position: absolute; left: 50%; top: 50%;
        transform: translate(-50%,-50%);
        width: 52px; height: 52px;
        background: rgba(124,58,237,0.9); border-radius: 50%;
        display: grid; place-items: center;
        box-shadow: 0 0 32px rgba(124,58,237,0.6);
        animation: am-pulse 2s ease-in-out infinite;
      }
      @keyframes am-pulse {
        0%,100% { box-shadow: 0 0 32px rgba(124,58,237,0.6) }
        50%      { box-shadow: 0 0 52px rgba(124,58,237,0.95) }
      }
      .am-4k-lock svg { width: 22px; height: 22px; }
      .am-4k-badge {
        position: absolute; top: 12px; right: 12px;
        background: linear-gradient(135deg,#7c3aed,#a855f7);
        color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
        padding: 4px 10px; border-radius: 20px;
      }

      /* ── 4K body ────────────────────────────────── */
      .am-4k-body { padding: 18px 20px 0; }
      .am-4k-title {
        font-size: 20px; font-weight: 800; color: #f0f0f5;
        line-height: 1.25; text-align: center;
      }
      .am-4k-sub {
        font-size: 13px; color: #9090a8; text-align: center; margin-top: 4px;
      }
      .am-4k-social {
        display: flex; align-items: center; justify-content: center;
        gap: 6px; margin-top: 8px;
        font-size: 12px; color: #6b6b80; font-weight: 500;
      }
      .am-4k-social-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #22c55e; flex-shrink: 0;
        box-shadow: 0 0 6px rgba(34,197,94,0.7);
      }

      /* ── Progress bar (coins insufficient) ──────── */
      .am-4k-progress-wrap {
        margin: 10px 16px 0;
        background: rgba(167,139,250,0.07);
        border: 1px solid rgba(167,139,250,0.14);
        border-radius: 12px; padding: 10px 12px;
      }
      .am-4k-progress-bar {
        height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;
      }
      .am-4k-progress-fill {
        height: 100%; border-radius: 4px;
        background: linear-gradient(90deg,#7c3aed,#a78bfa);
        transition: width 0.4s ease;
      }
      .am-4k-progress-label {
        font-size: 11px; color: #9090a8; margin-top: 6px; text-align: center;
      }
      .am-4k-progress-label strong { color: #a78bfa; }

      /* ── 4K actions ─────────────────────────────── */
      .am-4k-actions { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px 4px; }

      /* Primary */
      .am-4k-primary {
        display: flex; align-items: center; gap: 14px;
        padding: 16px 18px; border-radius: 16px; border: none; cursor: pointer;
        background: linear-gradient(135deg,#7c3aed,#a855f7);
        text-align: left; position: relative; overflow: hidden;
        transition: opacity 0.15s, transform 0.12s;
      }
      .am-4k-primary::after {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%);
        pointer-events: none;
      }
      .am-4k-primary:hover  { opacity: 0.92; }
      .am-4k-primary:active { transform: scale(0.97); }

      .am-4k-primary-icon {
        width: 44px; height: 44px; border-radius: 14px;
        background: rgba(255,255,255,0.22);
        display: grid; place-items: center; flex-shrink: 0;
      }
      .am-4k-primary-icon svg { width: 22px; height: 22px; }
      .am-4k-primary-text { flex: 1; }
      .am-4k-primary-label {
        font-size: 16px; font-weight: 800; color: #fff;
        display: flex; align-items: center; gap: 6px;
      }
      .am-4k-primary-sub { font-size: 12px; color: rgba(255,255,255,0.72); margin-top: 2px; }
      .am-4k-free-tag {
        font-size: 11px; font-weight: 700; color: #fff;
        background: rgba(255,255,255,0.22);
        padding: 3px 9px; border-radius: 20px; white-space: nowrap;
      }

      /* Secondary */
      .am-4k-secondary {
        display: flex; align-items: center; gap: 14px;
        padding: 13px 16px; border-radius: 14px;
        border: 1.5px solid rgba(255,255,255,0.1);
        background: #1a1a26; cursor: pointer; text-align: left;
        transition: border-color 0.15s, background 0.15s, transform 0.12s;
      }
      .am-4k-secondary:hover  { background: #20202e; border-color: rgba(255,255,255,0.18); }
      .am-4k-secondary:active { transform: scale(0.97); }
      .am-4k-secondary.disabled { opacity: 0.38; cursor: not-allowed; pointer-events: none; }

      .am-4k-sec-icon {
        width: 40px; height: 40px; border-radius: 12px;
        background: rgba(167,139,250,0.12);
        display: grid; place-items: center; flex-shrink: 0;
      }
      .am-4k-sec-icon svg { width: 20px; height: 20px; }
      .am-4k-sec-body { flex: 1; }
      .am-4k-sec-label { font-size: 15px; font-weight: 700; color: #f0f0f5; }
      .am-4k-sec-sub   { font-size: 12px; color: #9090a8; margin-top: 2px; }

      .am-4k-badge-tag {
        font-size: 11px; font-weight: 700;
        background: rgba(255,255,255,0.08); color: #9090a8;
        padding: 3px 8px; border-radius: 20px; white-space: nowrap;
      }

      /* Tertiary */
      .am-4k-tertiary {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        padding: 11px; border-radius: 12px;
        border: 1.5px solid rgba(124,58,237,0.2);
        background: rgba(124,58,237,0.06); cursor: pointer;
        font-size: 13px; font-weight: 600; color: #a78bfa;
        transition: border-color 0.15s, background 0.15s, transform 0.12s;
      }
      .am-4k-tertiary:hover  { border-color: rgba(124,58,237,0.4); background: rgba(124,58,237,0.1); }
      .am-4k-tertiary:active { transform: scale(0.97); }
      .am-4k-tertiary svg { width: 14px; height: 14px; }

      .am-4k-footer { text-align: center; padding: 10px 20px 14px; }
      .am-4k-later {
        font-size: 12px; color: #6b6b80;
        background: none; border: none; cursor: pointer;
        padding: 4px 12px;
        text-decoration: underline; text-underline-offset: 3px;
      }
      .am-4k-later:active { opacity: 0.6; }

      /* ── Ripple ─────────────────────────────────── */
      @keyframes am-ripple {
        0%   { transform: scale(0); opacity: 0.35 }
        100% { transform: scale(4); opacity: 0 }
      }
      .am-ripple-host { position: relative; overflow: hidden; }
      .am-ripple {
        position: absolute; border-radius: 50%;
        width: 40px; height: 40px;
        background: rgba(255,255,255,0.35);
        pointer-events: none;
        transform: scale(0);
        animation: am-ripple 0.5s ease-out forwards;
      }

      /* ── Paywall ────────────────────────────────── */
      .am-pw-header {
        padding: 16px 20px 0;
        display: flex; align-items: center; justify-content: space-between;
      }
      .am-pw-close {
        width: 30px; height: 30px; border-radius: 50%;
        background: rgba(255,255,255,0.08); border: none;
        cursor: pointer; color: #9090a8; font-size: 18px;
        display: grid; place-items: center; transition: background 0.2s;
      }
      .am-pw-close:hover { background: rgba(255,255,255,0.14); }

      .am-pw-hero {
        padding: 12px 20px 0;
        display: flex; flex-direction: column; align-items: center; gap: 6px;
      }
      .am-pw-crown {
        width: 64px; height: 64px; border-radius: 20px;
        background: linear-gradient(135deg,#7c3aed,#f43f5e);
        display: grid; place-items: center;
        box-shadow: 0 8px 32px rgba(124,58,237,0.45);
      }
      .am-pw-crown svg { width: 32px; height: 32px; }
      .am-pw-title {
        font-size: 22px; font-weight: 800; color: #f0f0f5;
        text-align: center; letter-spacing: -0.3px;
      }
      .am-pw-tagline { font-size: 13px; color: #9090a8; text-align: center; }

      /* Social proof */
      .am-pw-social {
        text-align: center; font-size: 12px; color: #6b6b80;
        margin-top: 4px;
      }

      /* Savings bar */
      .am-pw-savings-bar {
        margin: 10px 16px 0;
        background: rgba(34,197,94,0.06);
        border: 1px solid rgba(34,197,94,0.18);
        border-radius: 12px; padding: 9px 14px;
        font-size: 12px; color: #9090a8; text-align: center;
        line-height: 1.4;
      }
      .am-pw-savings-bar strong { color: #4ade80; }

      /* Perks grid */
      .am-pw-perks {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 8px; padding: 12px 16px 0;
      }
      .am-pw-perk {
        display: flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 12px; padding: 10px 12px;
        font-size: 13px; color: #f0f0f5;
      }
      .am-pw-perk-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #a78bfa; flex-shrink: 0;
      }

      /* Plans */
      .am-pw-plans {
        display: flex; flex-direction: column; gap: 8px; padding: 12px 16px 0;
      }
      .am-pw-plan-wrap { position: relative; }
      .am-pw-urgency-label {
        position: absolute; top: -8px; left: 16px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
        background: linear-gradient(135deg,#f43f5e,#f97316);
        color: #fff; padding: 2px 10px; border-radius: 20px;
        pointer-events: none;
      }
      .am-pw-plan {
        display: flex; align-items: center; gap: 14px;
        border: 1.5px solid rgba(255,255,255,0.1);
        border-radius: 16px; padding: 14px 16px;
        cursor: pointer; background: #1a1a26;
        transition: border-color 0.15s, background 0.15s, transform 0.12s;
      }
      .am-pw-plan:hover  { border-color: rgba(124,58,237,0.5); }
      .am-pw-plan:active { transform: scale(0.98); }
      .am-pw-plan.popular {
        border-color: #7c3aed;
        background: rgba(124,58,237,0.1);
        box-shadow: 0 0 0 1px rgba(124,58,237,0.35);
      }
      .am-pw-plan-radio {
        width: 20px; height: 20px; border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.2);
        flex-shrink: 0; display: grid; place-items: center;
      }
      .am-pw-plan.popular .am-pw-plan-radio {
        border-color: #7c3aed; background: #7c3aed;
      }
      .am-pw-plan.popular .am-pw-plan-radio::after {
        content: ''; width: 8px; height: 8px; border-radius: 50%; background: #fff;
      }
      .am-pw-plan-body { flex: 1; }
      .am-pw-plan-label { font-size: 15px; font-weight: 700; color: #f0f0f5; }
      .am-pw-plan-per   { font-size: 12px; color: #9090a8; margin-top: 2px; }
      .am-pw-plan-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
      .am-pw-plan-price { font-size: 18px; font-weight: 800; color: #a78bfa; }
      .am-pw-badge {
        font-size: 10px; font-weight: 700;
        background: linear-gradient(135deg,#7c3aed,#a855f7);
        color: #fff; padding: 2px 8px; border-radius: 20px;
      }

      /* CTA */
      .am-pw-cta-wrap { padding: 14px 16px 6px; }
      .am-pw-cta {
        width: 100%; padding: 16px; border: none; border-radius: 16px; cursor: pointer;
        font-size: 16px; font-weight: 800; color: #fff; letter-spacing: 0.02em;
        background: linear-gradient(135deg,#7c3aed,#a855f7);
        box-shadow: 0 8px 32px rgba(124,58,237,0.45);
        transition: opacity 0.15s, transform 0.12s;
      }
      .am-pw-cta:hover  { opacity: 0.92; }
      .am-pw-cta:active { transform: scale(0.97); }

      .am-pw-legal {
        font-size: 11px; color: #6b6b80;
        text-align: center; line-height: 1.5;
        padding: 4px 20px 14px;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Dismiss helper ─────────────────────────────────────────────── */
  function _dismiss(overlay, cb) {
    overlay.style.animation = 'am-fade-out 0.18s ease both';
    const sheet = overlay.querySelector('.am-4k-sheet, .am-pw-sheet');
    if (sheet) sheet.style.animation = 'am-slide-up 0.2s ease reverse both';
    setTimeout(() => { overlay.remove(); cb?.(); }, 180);
  }

  /* ── Ripple ─────────────────────────────────────────────────────── */
  function _addRipple(btn, e) {
    btn.classList.add('am-ripple-host');
    const r     = document.createElement('div');
    r.className = 'am-ripple';
    const rect  = btn.getBoundingClientRect();
    r.style.left = (e.clientX - rect.left  - 20) + 'px';
    r.style.top  = (e.clientY - rect.top   - 20) + 'px';
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }

  /* ══════════════════════════════════════════════════════════════════
     4K UNLOCK MODAL
     ══════════════════════════════════════════════════════════════════ */

  function show4K(imgSrc) {
    return new Promise(resolve => {
      _ensureStyles();

      if (window.Premium?.isActive()) { resolve('premium'); return; }

      /* ── A/B variants ── */
      const ctaVariant  = window.ABTest?.get('cta_4k') ?? 'watch_free';
      const cost        = window.ABTest?.get('coin_cost_hd') ?? window.Coins?.COSTS.hd_download ?? 15;
      const balance     = window.Coins?.getBalance() ?? 0;
      const canAfford   = balance >= cost;
      const coinsNeeded = cost - balance;
      const adEarns     = window.Coins?.EARN?.watched_ad ?? 10;

      /* ── Copy variants ── */
      const primaryLabel = ctaVariant === 'unlock_hd'
        ? 'Desbloquear en HD'
        : 'Ver anuncio';
      const primarySub = ctaVariant === 'unlock_hd'
        ? 'Descarga gratis en 4K · +10 monedas de regalo'
        : 'Gratis · +10 monedas de regalo';
      const coinsLabel = canAfford
        ? `Desbloquear ahora`
        : `Usar monedas`;
      const coinsSub = canAfford
        ? `${cost} 🪙 · Tu saldo: ${balance}`
        : `Sin saldo suficiente · Tienes ${balance} de ${cost}`;

      /* ── Progress bar when coins insufficient but >0 ── */
      const showProgress  = !canAfford && balance > 0;
      const progressPct   = Math.min(97, Math.round((balance / cost) * 100));
      const progressHtml  = showProgress ? `
        <div class="am-4k-progress-wrap">
          <div class="am-4k-progress-bar">
            <div class="am-4k-progress-fill" style="width:${progressPct}%"></div>
          </div>
          <div class="am-4k-progress-label">
            Te faltan <strong>${coinsNeeded} 🪙</strong> · ve un anuncio y gana
            <strong>${adEarns}</strong> ahora
          </div>
        </div>
      ` : '';

      /* ── Track ── */
      window.Analytics?.trackFunnel('hd_unlock',
        window.Analytics.Events?.HD_ATTEMPT ?? 'hd_unlock_attempt',
        { balance, canAfford, ctaVariant, cost }
      );
      window.Coins?.incrementHDAttempt();

      const overlay = document.createElement('div');
      overlay.className = 'am-overlay am-overlay--dark';

      overlay.innerHTML = `
        <div class="am-4k-sheet" role="dialog" aria-modal="true" aria-label="Desbloquear 4K">
          <div class="am-handle"></div>

          <div class="am-4k-preview">
            <img class="am-4k-bg"    src="${imgSrc}" alt="" aria-hidden="true">
            <img class="am-4k-thumb" src="${imgSrc}" alt="" aria-hidden="true">
            <div class="am-4k-lock" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </div>
            <span class="am-4k-badge">ULTRA HD · 4K</span>
          </div>

          <div class="am-4k-body">
            <div class="am-4k-title">Calidad Ultra HD</div>
            <div class="am-4k-sub">Wallpaper en resolución máxima 4K</div>
            <div class="am-4k-social">
              <span class="am-4k-social-dot"></span>
              Miles de usuarios ya descargan en 4K gratis
            </div>
          </div>

          ${progressHtml}

          <div class="am-4k-actions">

            <button class="am-4k-primary" id="am-watch" type="button">
              <div class="am-4k-primary-icon">
                <svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div class="am-4k-primary-text">
                <div class="am-4k-primary-label">
                  ${primaryLabel}
                  <span class="am-4k-free-tag">GRATIS</span>
                </div>
                <div class="am-4k-primary-sub">${primarySub}</div>
              </div>
            </button>

            <button class="am-4k-secondary ${canAfford ? '' : 'disabled'}" id="am-coins" type="button">
              <div class="am-4k-sec-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div class="am-4k-sec-body">
                <div class="am-4k-sec-label">${coinsLabel}</div>
                <div class="am-4k-sec-sub">${coinsSub}</div>
              </div>
              ${!canAfford ? '<span class="am-4k-badge-tag">Sin saldo</span>' : ''}
            </button>

            <button class="am-4k-tertiary" id="am-premium" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Acceso ilimitado — desde 1,00 €/mes · Sin anuncios
            </button>

          </div>

          <div class="am-4k-footer">
            <button class="am-4k-later" id="am-later" type="button">Ahora no</button>
          </div>
        </div>
      `;

      const done = (choice) => {
        // Track specific funnel step before dismissing
        if (choice === 'ad') {
          window.Analytics?.trackFunnel('hd_unlock',
            window.Analytics.Events?.HD_AD_START ?? 'hd_ad_start',
            { ctaVariant }
          );
        } else if (choice === 'coins') {
          window.Analytics?.trackFunnel('hd_unlock',
            window.Analytics.Events?.HD_COIN_START ?? 'hd_coin_start',
            {}
          );
        } else {
          window.Analytics?.trackFunnel('hd_unlock',
            window.Analytics.Events?.HD_MODAL_CLOSE ?? 'hd_modal_close',
            { ctaVariant }
          );
        }
        _dismiss(overlay, () => resolve(choice));
      };

      overlay.querySelector('#am-watch').addEventListener('click', e => {
        _addRipple(e.currentTarget, e);
        done('ad');
      });

      if (canAfford) {
        overlay.querySelector('#am-coins').addEventListener('click', e => {
          _addRipple(e.currentTarget, e);
          done('coins');
        });
      }

      overlay.querySelector('#am-premium').addEventListener('click', () => {
        _dismiss(overlay, () => {
          showPaywall('4k_modal').then(res => resolve(res ? 'premium' : null));
        });
      });

      overlay.querySelector('#am-later').addEventListener('click', () => done(null));
      overlay.addEventListener('click', e => { if (e.target === overlay) done(null); });

      document.body.appendChild(overlay);
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     PREMIUM PAYWALL
     ══════════════════════════════════════════════════════════════════ */

  function showPaywall(trigger = 'organic') {
    return new Promise(resolve => {
      _ensureStyles();

      window.Analytics?.trackFunnel('premium',
        window.Analytics.Events?.PREMIUM_OPEN ?? 'premium_open',
        { trigger }
      );

      const plans         = window.Premium?.getPlans() ?? {};
      let   selectedPlan  = 'yearly';
      const emphasis      = window.ABTest?.get('paywall_emphasis') ?? 'savings';

      /* ── Savings indicator ── */
      const history     = window.Coins?.getHistory() ?? [];
      const totalEarned = history
        .filter(h => h.type === 'earn')
        .reduce((sum, h) => sum + h.amount, 0);
      const savingsHtml = (emphasis === 'savings' && totalEarned > 0)
        ? `<div class="am-pw-savings-bar">
             Has ganado <strong>${totalEarned} 🪙</strong> viendo anuncios
             — con Premium no necesitas ninguno más
           </div>`
        : '';

      /* ── Plan rows ── */
      const planRows = Object.entries(plans).map(([key, p]) => `
        <div class="am-pw-plan-wrap">
          ${p.popular ? '<div class="am-pw-urgency-label">⚡ Más popular</div>' : ''}
          <div class="am-pw-plan ${p.popular ? 'popular' : ''}" data-plan="${key}"
               role="radio" aria-checked="${p.popular}" tabindex="0">
            <div class="am-pw-plan-radio"></div>
            <div class="am-pw-plan-body">
              <div class="am-pw-plan-label">${p.label}</div>
              <div class="am-pw-plan-per">${p.perMonth ?? p.sublabel ?? ''}</div>
            </div>
            <div class="am-pw-plan-right">
              <div class="am-pw-plan-price">${p.price}</div>
              ${p.badge ? `<span class="am-pw-badge">${p.badge}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('');

      const overlay = document.createElement('div');
      overlay.className = 'am-overlay am-overlay--dark';

      overlay.innerHTML = `
        <div class="am-pw-sheet" role="dialog" aria-modal="true" aria-label="Acceso ilimitado">
          <div class="am-handle"></div>

          <div class="am-pw-header">
            <div></div>
            <button class="am-pw-close" id="am-pw-close" type="button" aria-label="Cerrar">×</button>
          </div>

          <div class="am-pw-hero">
            <div class="am-pw-crown" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="white">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div class="am-pw-title">Acceso ilimitado</div>
            <div class="am-pw-tagline">Todo sin límites, sin anuncios</div>
            <div class="am-pw-social">✦ Más de 12.000 usuarios ya sin anuncios</div>
          </div>

          ${savingsHtml}

          <div class="am-pw-perks">
            <div class="am-pw-perk"><div class="am-pw-perk-dot"></div>Sin anuncios</div>
            <div class="am-pw-perk"><div class="am-pw-perk-dot"></div>4K ilimitado</div>
            <div class="am-pw-perk"><div class="am-pw-perk-dot"></div>AI ilimitada</div>
            <div class="am-pw-perk"><div class="am-pw-perk-dot"></div>Exclusivos</div>
          </div>

          <div class="am-pw-plans" role="radiogroup" aria-label="Plan">${planRows}</div>

          <div class="am-pw-cta-wrap">
            <button class="am-pw-cta" id="am-pw-subscribe" type="button">
              Desbloquear todo ahora
            </button>
          </div>

          <p class="am-pw-legal">
            Renovación automática. Cancela cuando quieras.<br>
            Los precios pueden variar según tu región.
          </p>
        </div>
      `;

      /* ── Plan selection ── */
      overlay.querySelectorAll('.am-pw-plan').forEach(el => {
        el.addEventListener('click', () => {
          overlay.querySelectorAll('.am-pw-plan').forEach(p => {
            p.classList.remove('popular');
            p.setAttribute('aria-checked', 'false');
          });
          el.classList.add('popular');
          el.setAttribute('aria-checked', 'true');
          selectedPlan = el.dataset.plan;
          window.Analytics?.track(
            window.Analytics.Events?.PREMIUM_PLAN_SELECT ?? 'premium_plan_select',
            { plan: selectedPlan, emphasis }
          );
        });
      });

      /* ── Subscribe ── */
      overlay.querySelector('#am-pw-subscribe').addEventListener('click', e => {
        _addRipple(e.currentTarget, e);
        window.Analytics?.trackFunnel('premium',
          window.Analytics.Events?.PREMIUM_CTA_TAP ?? 'premium_cta_tap',
          { plan: selectedPlan, emphasis }
        );

        const plan = plans[selectedPlan];
        if (!plan) return;

        // Production: trigger Google Play Billing here.
        window.Premium?.activate(plan.months);

        _dismiss(overlay, () => {
          _showSuccessToast('¡Bienvenido al acceso ilimitado! ✦');
          resolve(true);
        });
      });

      /* ── Close / drop-off ── */
      const onClose = () => {
        window.Analytics?.trackFunnel('premium',
          window.Analytics.Events?.PREMIUM_CLOSE ?? 'premium_close',
          { selectedPlan, trigger, emphasis }
        );
        _dismiss(overlay, () => resolve(false));
      };

      overlay.querySelector('#am-pw-close').addEventListener('click', onClose);
      overlay.addEventListener('click', e => { if (e.target === overlay) onClose(); });

      document.body.appendChild(overlay);
    });
  }

  /* ── Legacy alias ───────────────────────────────────────────────── */
  function showChoice({ imgSrc = '' } = {}) { return show4K(imgSrc); }

  /* ── Success toast ──────────────────────────────────────────────── */
  function _showSuccessToast(msg) {
    const t       = document.createElement('div');
    t.className   = 'app-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('app-toast--show'));
    setTimeout(() => {
      t.classList.remove('app-toast--show');
      setTimeout(() => t.remove(), 300);
    }, 3200);
  }

  /* ── Public ─────────────────────────────────────────────────────── */
  return { show4K, showPaywall, showChoice, showPremiumPage: showPaywall };

})();

window.AdModal = AdModal;
