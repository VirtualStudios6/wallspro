/**
 * category.js — WallsPro v3
 *
 * Shared gallery + lightbox logic for all category pages.
 * Each script.js just defines `const images = [...]` and calls `initGallery(images)`.
 *
 * Monetization:
 *  - 4K HD button → show4K() modal with blurred preview
 *  - Smart paywall trigger after 2 rewarded ads OR 2 HD attempts
 *  - Interstitial after every 7th wallpaper view (with critical-action guard)
 *  - AdService.beginCriticalAction() wraps all download flows
 */

/* ══════════════════════════════════════════════════════════════════
   SAVE TO GALLERY (native + web)
   ══════════════════════════════════════════════════════════════════ */
async function saveToGallery(src) {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { Media, Filesystem } = window.Capacitor.Plugins;
      if (!Media || !Filesystem) throw new Error('plugins missing');

      const response  = await fetch(src);
      const blob      = await response.blob();
      const base64    = await _blobToBase64(blob);
      const fileName  = 'walls_' + Date.now() + '.' + (src.split('.').pop() || 'jpg');

      await Filesystem.writeFile({ path: fileName, data: base64, directory: 'CACHE' });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: 'CACHE' });
      await Media.savePhoto({ path: uri });
      await Filesystem.deleteFile({ path: fileName, directory: 'CACHE' });

      showToast('Guardado en tu galería ✓');
    } catch (err) {
      console.error('[category] saveToGallery:', err);
      showToast('No se pudo guardar. Inténtalo de nuevo.');
    }
    return;
  }

  // Web fallback
  const a    = document.createElement('a');
  a.href     = src;
  a.download = src.split('/').pop();
  a.click();
}

function _blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader    = new FileReader();
    reader.onload   = () => resolve(reader.result.split(',')[1]);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}

/* ══════════════════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════════════════ */
function showToast(msg) {
  const t       = document.createElement('div');
  t.className   = 'app-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('app-toast--show'));
  setTimeout(() => {
    t.classList.remove('app-toast--show');
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

/* ══════════════════════════════════════════════════════════════════
   FAVOURITES
   ══════════════════════════════════════════════════════════════════ */
const FAVS_KEY = 'walls_favs_v1';

function _getFavs() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY)) || []; }
  catch { return []; }
}
function _saveFavs(arr) { localStorage.setItem(FAVS_KEY, JSON.stringify(arr)); }
function _isFav(src)    { return _getFavs().includes(src); }
function _toggleFav(src) {
  const favs  = _getFavs();
  const idx   = favs.indexOf(src);
  if (idx === -1) favs.push(src);
  else            favs.splice(idx, 1);
  _saveFavs(favs);
  return idx === -1;
}

/* ══════════════════════════════════════════════════════════════════
   AD MODULE LAZY LOADER
   ══════════════════════════════════════════════════════════════════ */
let _adReady = false;

function _loadAdModules() {
  if (_adReady || window.AdModal) { _adReady = true; return Promise.resolve(); }

  const mods = ['ab-test.js', 'analytics.js', 'coins.js', 'premium.js', 'ad-modal.js', 'ad-service.js'];
  const base  = document.querySelector('script[src*="category.js"]')?.src
    ? new URL('../ads/', document.querySelector('script[src*="category.js"]').src).href
    : '../ads/';

  return mods.reduce((chain, m) =>
    chain.then(() => new Promise(res => {
      if (document.querySelector(`script[src*="${m}"]`)) { res(); return; }
      const s  = document.createElement('script');
      s.src    = base + m;
      s.onload = res;
      s.onerror = res;
      document.head.appendChild(s);
    })),
    Promise.resolve()
  ).then(() => {
    _adReady = true;
    window.Coins?.claimDailyBonus();
    if (window.AdService) {
      window.AdService.init().then(() => window.AdService.showBanner());
    }
  });
}

// Start loading immediately, non-blocking
const _adModulesPromise = _loadAdModules();

/* ══════════════════════════════════════════════════════════════════
   GALLERY INIT
   ══════════════════════════════════════════════════════════════════ */
function initGallery(images) {
  const gallery     = document.getElementById('gallery');
  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const downloadBtn = document.getElementById('download-btn');
  const likeBtn     = document.getElementById('like-btn');
  const closeBtn    = document.getElementById('closeBtn');
  const prevBtn     = document.getElementById('prevBtn');
  const nextBtn     = document.getElementById('nextBtn');
  const counter     = document.getElementById('lightboxCounter');

  // Fail fast with a clear message rather than a cryptic TypeError deep in the
  // event handlers.  Any missing element means the HTML template is broken.
  const _required = { gallery, lightbox, lightboxImg, downloadBtn, likeBtn, closeBtn, prevBtn, nextBtn, counter };
  const _missing  = Object.entries(_required).filter(([, el]) => !el).map(([k]) => k);
  if (_missing.length) {
    console.error('[initGallery] Missing DOM elements:', _missing.join(', '));
    return;
  }

  /* ── Inject extra lightbox buttons ── */
  const actionsEl = lightbox?.querySelector('.actions');
  let hdBtn    = null;
  let earnBtn  = null;
  let shareBtn = null;

  if (actionsEl) {
    // 4K HD button
    hdBtn           = document.createElement('button');
    hdBtn.type      = 'button';
    hdBtn.className = 'action-btn action-btn--4k';
    hdBtn.setAttribute('aria-label', 'Descargar 4K HD');
    hdBtn.title     = '4K HD';
    hdBtn.innerHTML = `
      <svg viewBox="0 0 32 32" width="26" height="26">
        <text x="1" y="22" font-size="16" font-weight="900" fill="#a78bfa"
              font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">4K</text>
      </svg>`;
    actionsEl.appendChild(hdBtn);

    // "Earn coins" bonus button — extra rewarded ad entry point
    earnBtn           = document.createElement('button');
    earnBtn.type      = 'button';
    earnBtn.className = 'action-btn action-btn--earn';
    earnBtn.setAttribute('aria-label', 'Ganar monedas viendo anuncio');
    earnBtn.title     = '+10 monedas';
    earnBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#a78bfa" stroke-width="2"/>
        <path d="M12 8v4l3 3" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 12h1" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
    actionsEl.appendChild(earnBtn);

    // Share button — issue #8
    shareBtn           = document.createElement('button');
    shareBtn.type      = 'button';
    shareBtn.className = 'action-btn action-btn--share';
    shareBtn.setAttribute('aria-label', 'Compartir app');
    shareBtn.title     = 'Compartir';
    shareBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>`;
    actionsEl.appendChild(shareBtn);
  }

  /* ── Build gallery grid ── */
  images.forEach(({ src, alt }) => {
    const img         = document.createElement('img');
    img.dataset.src   = src;
    img.alt           = alt;
    img.className     = 'gallery-img';
    img.crossOrigin   = 'anonymous';
    gallery.appendChild(img);
  });

  /* ── Lazy-load images ── */
  let _loadedCount = 0;
  const _totalImgs = images.length;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const img = e.target;
      // Set handlers BEFORE assigning src so they are in place before any
      // async load event fires.
      img.onload  = () => { img.classList.add('visible'); _maybeDisconnect(); };
      img.onerror = () => { img.classList.add('visible'); _maybeDisconnect(); };
      img.src = img.dataset.src;
      // img.complete is true synchronously when the URL is already cached.
      // Modern browsers still fire the load event asynchronously afterward,
      // which would call _maybeDisconnect() a second time and corrupt the
      // counter — causing io.disconnect() to fire early and leaving later
      // images stuck at opacity:0 forever.
      // Fix: clear the handlers so only one path runs.
      if (img.complete) {
        img.onload = img.onerror = null;
        img.classList.add('visible');
        _maybeDisconnect();
      }
      obs.unobserve(img);
    });
  }, { rootMargin: '200px' });

  function _maybeDisconnect() {
    if (++_loadedCount >= _totalImgs) io.disconnect();
  }

  gallery.querySelectorAll('.gallery-img').forEach(img => io.observe(img));

  /* ════════════════════════════════════
     STATE
     ════════════════════════════════════ */
  let currentIndex = 0;
  let currentSrc   = '';
  let _viewCount   = 0;

  /* ════════════════════════════════════
     LIGHTBOX
     ════════════════════════════════════ */
  gallery.addEventListener('click', e => {
    const img = e.target.closest('.gallery-img');
    if (!img) return;
    currentIndex = Array.from(gallery.children).indexOf(img);
    _openLightbox(currentIndex);
  });

  function _openLightbox(index) {
    const { src, alt } = images[index];
    currentSrc         = src;
    lightboxImg.src    = src;
    lightboxImg.alt    = alt;
    likeBtn.setAttribute('aria-pressed', String(_isFav(src)));
    counter.textContent = (index + 1) + ' / ' + images.length;
    lightbox.classList.add('active');
    currentIndex = index;

    // Analytics + interstitial gate
    _viewCount++;
    window.AdService?.incrementAction();
    window.Analytics?.track(
      window.Analytics?.Events?.WALLPAPER_VIEWED ?? 'wallpaper_viewed'
    );

    // Interstitial every 7th view (non-blocking, skip during any active modal)
    if (_viewCount % 7 === 0) {
      window.AdService?.showInterstitial('browse');
    }
  }

  function _closeLightbox() {
    lightbox.classList.remove('active');
  }

  /* ── Normal download ── */
  downloadBtn.addEventListener('click', async e => {
    e.preventDefault();
    // Issue #7: show interstitial BEFORE saving.
    // No beginCriticalAction() here — that would block the ad.
    // showInterstitial() respects its own cooldown + grace period, so
    // it returns false immediately when not due; download always completes.
    await (window.AdService?.showInterstitial('download') ?? Promise.resolve());

    window.AdService?.beginCriticalAction();
    try {
      await saveToGallery(currentSrc);
      window.Analytics?.track(
        window.Analytics?.Events?.WALLPAPER_DOWNLOADED ?? 'wallpaper_downloaded',
        { hd: false }
      );
      window.AdService?.incrementAction();
    } finally {
      window.AdService?.endCriticalAction();
    }
  });

  /* ── 4K HD download ── */
  if (hdBtn) {
    hdBtn.addEventListener('click', async () => {
      await _adModulesPromise;
      window.AdService?.beginCriticalAction();
      try {
        await _handle4KFlow();
      } finally {
        window.AdService?.endCriticalAction();
      }
    });
  }

  /* ── Earn coins (bonus rewarded ad) ── */
  if (earnBtn) {
    earnBtn.addEventListener('click', async () => {
      await _adModulesPromise;
      window.AdService?.beginCriticalAction();
      try {
        window.Analytics?.track(
          window.Analytics?.Events?.BONUS_COINS_OPEN ?? 'bonus_coins_open'
        );
        const result = await window.AdService?.showRewarded('bonus_coins')
          ?? { rewarded: false, source: 'unavailable' };

        if (result.rewarded) {
          // +10 coins already added inside AdService.showRewarded()
          const newBal = window.Coins?.getBalance() ?? 0;
          showToast(`+10 monedas ganadas! 🪙 Saldo: ${newBal}`);
          window.Analytics?.track(
            window.Analytics?.Events?.BONUS_COINS_EARN ?? 'bonus_coins_earn',
            { balance: newBal }
          );
          // Smart paywall after warmup
          if (window.Premium?.shouldShowPaywall()) {
            setTimeout(() => window.AdModal?.showPaywall('bonus_earn_gate'), 1500);
          }
        }
      } finally {
        window.AdService?.endCriticalAction();
      }
    });
  }

  /* ── Share app (issue #8) ── */
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareUrl  = 'https://play.google.com/store/apps/details?id=com.wallsapp.fondos';
      const shareText = '¡Descarga WallsPro — fondos HD y 4K gratis para tu móvil!';
      try {
        if (navigator.share) {
          await navigator.share({ title: 'WallsPro', text: shareText, url: shareUrl });
        } else {
          await navigator.clipboard.writeText(shareUrl).catch(() => {});
          showToast('Enlace copiado al portapapeles');
        }
      } catch {
        // User cancelled share — no action needed
      }
    });
  }

  async function _handle4KFlow() {
    // Premium users: instant download
    if (window.Premium?.isActive()) {
      await saveToGallery(currentSrc);
      showToast('4K descargado  ✦');
      window.Analytics?.track(
        window.Analytics?.Events?.HD_COMPLETE ?? 'hd_unlock_complete',
        { source: 'premium' }
      );
      return;
    }

    if (!window.AdModal) {
      // Issue #5: never instant-download for non-premium users.
      // If ad modules failed to load, inform the user rather than
      // giving away 4K content for free.
      showToast('Función no disponible. Inténtalo más tarde.');
      return;
    }

    const choice = await window.AdModal.show4K(currentSrc);

    if (choice === 'ad') {
      const result = await window.AdService?.showRewarded('hd_download')
        ?? { rewarded: false, source: 'unavailable' };

      if (result.rewarded) {
        await saveToGallery(currentSrc);
        showToast('4K descargado  ✓');
        window.Analytics?.track(
          window.Analytics?.Events?.HD_COMPLETE ?? 'hd_unlock_complete',
          { source: 'ad' }
        );

        // Smart paywall: offer upgrade after enough engagement
        if (window.Premium?.shouldShowPaywall()) {
          setTimeout(() => window.AdModal.showPaywall('rewarded_gate'), 1500);
        }
      } else {
        showToast('Anuncio no completado');
      }

    } else if (choice === 'coins') {
      // Use A/B-tested cost (same value that was shown in the modal)
      const cost = window.ABTest?.get('coin_cost_hd') ?? window.Coins?.COSTS.hd_download ?? 15;
      const ok   = window.Coins?.spend(cost, 'hd_download');
      if (ok) {
        await saveToGallery(currentSrc);
        showToast('4K descargado  ✓');
        window.Analytics?.track(
          window.Analytics?.Events?.HD_COMPLETE ?? 'hd_unlock_complete',
          { source: 'coins' }
        );

        // Smart paywall after coins run low
        if (window.Premium?.shouldShowPaywall()) {
          setTimeout(() => window.AdModal.showPaywall('coin_gate'), 1500);
        }
      } else {
        // Coins.spend() returned false → insufficient balance.
        // Tell the user rather than silently closing the modal.
        const bal = window.Coins?.getBalance() ?? 0;
        showToast(`Monedas insuficientes. Tienes ${bal} 🪙, necesitas ${cost}.`);
      }

    }
    // 'premium' case is handled inside showPaywall() triggered by show4K()
  }

  /* ── Navigation controls ── */
  closeBtn.addEventListener('click', _closeLightbox);

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    _openLightbox(currentIndex);
  });

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % images.length;
    _openLightbox(currentIndex);
  });

  likeBtn.addEventListener('click', () => {
    const added = _toggleFav(currentSrc);
    likeBtn.setAttribute('aria-pressed', String(added));
    showToast(added ? '♥  Añadido a favoritos' : 'Eliminado de favoritos');
  });

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) _closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     _closeLightbox();
    if (e.key === 'ArrowLeft')  prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });

  let _touchX = 0;
  lightbox.addEventListener('touchstart', e => {
    _touchX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].screenX - _touchX;
    if (Math.abs(diff) > 50) diff > 0 ? prevBtn.click() : nextBtn.click();
  });
}
