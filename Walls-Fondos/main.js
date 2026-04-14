/* ============================
   DATA
   ============================ */
const CATEGORIES = [
  { id: 'populares', name: 'Populares',  emoji: '🔥', count: 82,  prefix: 'popular',   ext: 'jpg', moods: ['all'] },
  { id: 'anime',     name: 'Anime',      emoji: '⚡', count: 53,  prefix: 'anime',     ext: 'jpg', moods: ['all','anime'] },
  { id: 'dark',      name: 'Dark',       emoji: '🌑', count: 50,  prefix: 'dark',      ext: 'jpg', moods: ['all','dark'] },
  { id: 'coches',    name: 'Coches',     emoji: '🚗', count: 50,  prefix: 'coches',    ext: 'jpg', moods: ['all','cars'] },
  { id: 'juegos',    name: 'Juegos',     emoji: '🎮', count: 50,  prefix: 'juego',     ext: 'jpg', moods: ['all','games'] },
  { id: 'memes',     name: 'Memes',      emoji: '😂', count: 50,  prefix: 'meme',      ext: 'jpg', moods: ['all'] },
  { id: 'animales',  name: 'Animales',   emoji: '🐾', count: 50,  prefix: 'animales',  ext: 'jpg', moods: ['all','nature'] },
  { id: 'amor',      name: 'Amor',       emoji: '❤️', count: 50,  prefix: 'amor',      ext: 'jpg', moods: ['all'] },
  { id: 'paisajes',  name: 'Paisajes',   emoji: '🏔️', count: 50,  prefix: 'paisaje',   ext: 'jpg', moods: ['all','nature'] },
  { id: 'comics',    name: 'Comics',     emoji: '💥', count: 50,  prefix: 'comics',    ext: 'jpg', moods: ['all','anime'] },
  { id: 'abstracto', name: 'Abstracto',  emoji: '🎨', count: 34,  prefix: 'abstracto', ext: 'jpg', moods: ['all','art'] },
  { id: 'random',    name: 'Random',     emoji: '🎲', count: 120, prefix: 'random',    ext: 'jpg', moods: ['all'] },
  { id: 'aesthetic', name: 'Aesthetic',  emoji: '✨', count: 24,  prefix: 'aesthetic', ext: 'jpg', moods: ['all','art'] },
  { id: 'aiwalls',   name: 'AI Walls',   emoji: '🤖', count: 27,  prefix: 'ai',        ext: 'jpg', moods: ['all','art'] },
  { id: 'neon',      name: 'Neon',       emoji: '💡', count: 18,  prefix: 'neon',      ext: 'jpg', moods: ['all','dark'] },
  { id: 'raperos',   name: 'Raperos',    emoji: '🎤', count: 30,  prefix: 'rap',       ext: 'jpg', moods: ['all'] },
  { id: 'musica',    name: 'Música',     emoji: '🎵', count: 30,  prefix: 'music',     ext: 'jpg', moods: ['all'] },
  { id: 'deporte',   name: 'Deporte',    emoji: '⚽', count: 30,  prefix: 'deporte',   ext: 'jpg', moods: ['all'] },
  { id: 'funny',     name: 'Funny',      emoji: '🤣', count: 30,  prefix: 'funny',     ext: 'jpg', moods: ['all'] },
  { id: '3d',        name: '3D',         emoji: '🔷', count: 16,  prefix: '3d',        ext: 'jpg', moods: ['all','art'] },
  { id: 'labubu',    name: 'Labubu',     emoji: '🧸', count: 19,  prefix: 'labubu',    ext: 'jpg', moods: ['all'] },
  { id: 'carspace',  name: 'Carspace',   emoji: '🏁', count: 20,  prefix: 'carspace',  ext: 'png', moods: ['all','cars'] },
  { id: 'live',      name: 'Live',       emoji: '🎬', count: 66,  prefix: 'live',      ext: 'mp4', moods: ['all','live'], isLive: true },
];

const FEATURED = [
  { id: 'populares', img: 'populares/fondos/popular1.jpg', label: 'Populares', badge: 'Top' },
  { id: 'anime',     img: 'anime/fondos/anime1.jpg',       label: 'Anime',     badge: 'Nuevo' },
  { id: 'dark',      img: 'dark/fondos/dark1.jpg',         label: 'Dark',      badge: null },
  { id: 'aiwalls',   img: 'aiwalls/fondos/ai1.jpg',        label: 'AI Walls',  badge: 'IA' },
  { id: 'coches',    img: 'coches/fondos/coches1.jpg',     label: 'Coches',    badge: null },
  { id: 'neon',      img: 'neon/fondos/neon1.jpg',         label: 'Neon',      badge: null },
  { id: 'live',      img: 'live/fondos/live1.mp4',         label: 'Live',      badge: 'Live', isVideo: true },
  { id: 'anime',     img: 'anime/fondos/anime5.jpg',       label: 'Anime',     badge: null },
  { id: 'dark',      img: 'dark/fondos/dark5.jpg',         label: 'Dark',      badge: null },
  { id: 'juegos',    img: 'juegos/fondos/juego1.jpg',      label: 'Juegos',    badge: null },
];

// Trending: ordered by popularity (most downloaded categories)
const TRENDING = [
  { id: 'populares', name: 'Populares', img: 'populares/fondos/popular1.jpg' },
  { id: 'anime',     name: 'Anime',     img: 'anime/fondos/anime3.jpg' },
  { id: 'dark',      name: 'Dark',      img: 'dark/fondos/dark2.jpg' },
  { id: 'random',    name: 'Random',    img: 'random/fondos/random1.jpg' },
  { id: 'aiwalls',   name: 'AI Walls',  img: 'aiwalls/fondos/ai2.jpg' },
  { id: 'neon',      name: 'Neon',      img: 'neon/fondos/neon2.jpg' },
  { id: 'coches',    name: 'Coches',    img: 'coches/fondos/coches2.jpg' },
  { id: 'aesthetic', name: 'Aesthetic', img: 'aesthetic/fondos/aesthetic1.jpg' },
];

/* ============================
   FAVORITES — localStorage
   ============================ */
const FAVS_KEY = 'walls_favs_v1';

function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY)) || []; }
  catch { return []; }
}

function saveFavs(arr) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(arr));
  updateFavsBadge();
}

function toggleFav(src) {
  const favs = getFavs();
  const idx = favs.indexOf(src);
  if (idx === -1) favs.push(src);
  else favs.splice(idx, 1);
  saveFavs(favs);
  return idx === -1; // true = added
}

function updateFavsBadge() {
  const badge = document.getElementById('navFavsBadge');
  if (!badge) return; // element absent on non-home pages
  const count = getFavs().length;
  badge.textContent = count > 99 ? '99+' : count;
  badge.hidden = count === 0;
}

/* ============================
   HERO — WALLPAPER OF THE DAY
   ============================ */
(function buildWotd() {
  // Rotate daily using day-of-year as seed
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const nonLive = CATEGORIES.filter(c => c.ext !== 'mp4');
  const cat = nonLive[dayOfYear % nonLive.length];

  const wotdCard = document.getElementById('wotdCard');
  const wotdBg   = document.getElementById('wotdBg');
  const wotdCat  = document.getElementById('wotdCategory');
  const wotdFav  = document.getElementById('wotdFav');

  const imgSrc = `${cat.id}/fondos/${cat.prefix}1.${cat.ext}`;
  wotdBg.src = imgSrc;
  wotdBg.alt = cat.name;
  wotdCat.textContent = `${cat.emoji}  ${cat.name}`;
  wotdCard.href = `${cat.id}/index.html`;

  // Fav button on hero
  const favs = getFavs();
  if (favs.includes(imgSrc)) wotdFav.classList.add('saved');

  wotdFav.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFav(imgSrc);
    wotdFav.classList.toggle('saved', added);
  });
})();

/* ============================
   TRENDING
   ============================ */
const trendingScroll = document.getElementById('trendingScroll');
TRENDING.forEach((item, i) => {
  const a = document.createElement('a');
  a.className = 'trending-card';
  a.href = `${item.id}/index.html`;

  const rankClass = i < 3 ? ` rank-${i + 1}` : '';
  a.innerHTML = `
    <img src="${item.img}" alt="${item.name}" loading="lazy">
    <div class="trending-card-overlay"></div>
    <span class="trending-rank${rankClass}">${i + 1}</span>
    <div class="trending-card-info">
      <span class="trending-card-name">${item.name}</span>
    </div>
  `;
  trendingScroll.appendChild(a);
});

/* ============================
   FEATURED
   ============================ */
const featuredScroll = document.getElementById('featuredScroll');
FEATURED.forEach(item => {
  const a = document.createElement('a');
  a.className = 'featured-card';
  a.href = `${item.id}/index.html`;

  const mediaEl = item.isVideo
    ? `<video autoplay muted loop playsinline preload="none" style="width:100%;height:100%;object-fit:cover;">
         <source src="${item.img}" type="video/mp4">
       </video>`
    : `<img src="${item.img}" alt="${item.label}" loading="lazy">`;

  const badge = item.badge
    ? `<span class="badge${item.badge === 'Live' ? ' live-badge' : ''}">${item.badge}</span>`
    : '';

  a.innerHTML = `
    <div class="featured-thumb">${mediaEl}${badge}</div>
    <div class="featured-card-label">${item.label}</div>
  `;
  featuredScroll.appendChild(a);
});

/* ============================
   CATEGORIES GRID
   ============================ */
const catsGrid  = document.getElementById('catsGrid');
const catsPill  = document.getElementById('catsPill');
let currentMood = 'all';

// Lifted to module scope so it can be disconnected before each rebuild,
// preventing abandoned observers from accumulating on mood-filter switches.
let _catsObserver = null;

function buildCatsGrid() {
  // Disconnect previous observer before clearing the grid — ensures no
  // stale callbacks fire against nodes that are about to be removed.
  _catsObserver?.disconnect();
  catsGrid.innerHTML = '';

  const visible = CATEGORIES.filter(c => c.moods.includes(currentMood));
  catsPill.textContent = visible.length;

  // Read localStorage once per render, not once per card (was N reads before).
  const favs = getFavs();

  visible.forEach((cat, idx) => {
    // Native ad card every 8 real items
    if (idx > 0 && idx % 8 === 0) {
      const adCard = document.createElement('div');
      adCard.className = 'cat-card cat-ad-card';
      adCard.innerHTML = `
        <div class="cat-overlay" style="background:rgba(124,58,237,0.08)"></div>
        <div class="cat-ad-inner">
          <div class="cat-ad-label">PATROCINADO</div>
          <div class="cat-ad-title">WallsPro Premium</div>
          <div class="cat-ad-sub">Sin anuncios · 4K ilimitado</div>
        </div>
      `;
      adCard.addEventListener('click', () => window.AdModal?.showPremiumPage());
      catsGrid.appendChild(adCard);
    }

    const a = document.createElement('a');
    a.className = 'cat-card';
    a.href = `${cat.id}/index.html`;

    const thumb = cat.ext === 'mp4'
      ? `<video autoplay muted loop playsinline preload="none"
          style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">
          <source src="${cat.id}/fondos/${cat.prefix}1.${cat.ext}" type="video/mp4">
         </video>`
      : `<img data-src="${cat.id}/fondos/${cat.prefix}1.${cat.ext}" alt="${cat.name}" loading="lazy">`;

    const liveDot = cat.isLive ? `<span class="cat-live-dot"></span>` : '';

    const catFavCount = favs.filter(f => f.startsWith(`${cat.id}/`)).length;
    const favBadge = catFavCount > 0
      ? `<span class="cat-fav-badge visible">♥ ${catFavCount}</span>`
      : `<span class="cat-fav-badge"></span>`;

    a.innerHTML = `
      ${thumb}
      <div class="cat-overlay"></div>
      ${liveDot}
      ${favBadge}
      <div class="cat-info">
        <span class="cat-emoji">${cat.emoji}</span>
        <span class="cat-name">${cat.name}</span>
        <span class="cat-count">${cat.count} fondos</span>
      </div>
    `;
    catsGrid.appendChild(a);
  });

  // Lazy-load category thumbnails.
  // Handlers set BEFORE src — cached images fire 'load' synchronously at src
  // assignment, before any handler set afterward would ever be reached.
  _catsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const img = e.target;
      img.onload  = () => img.classList.add('loaded');
      img.onerror = () => img.classList.add('loaded');
      img.src = img.dataset.src;
      // Clear handlers when already cached to prevent the async load event
      // from firing a second time and causing double-processing.
      if (img.complete) {
        img.onload = img.onerror = null;
        img.classList.add('loaded');
      }
      obs.unobserve(img);
    });
  }, { rootMargin: '120px' });

  catsGrid.querySelectorAll('img[data-src]').forEach(img => _catsObserver.observe(img));
}

buildCatsGrid();

/* ============================
   MOOD FILTERS
   ============================ */
document.getElementById('moodRow').addEventListener('click', e => {
  const pill = e.target.closest('.mood-pill');
  if (!pill) return;
  document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  currentMood = pill.dataset.mood;
  buildCatsGrid();
});

/* ============================
   TOAST
   Makes coin/referral toasts visible on the home page.
   coins.js checks `typeof showToast === 'function'` and uses
   this instead of its own fallback, which relies on shared.css.
   ============================ */
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'app-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('app-toast--show'));
  setTimeout(() => {
    t.classList.remove('app-toast--show');
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

/* ============================
   SEARCH — pure renderer, no event wiring here
   ============================ */
const searchResults = document.getElementById('searchResults');

function renderSearch(q) {
  const filtered = q
    ? CATEGORIES.filter(c => c.name.toLowerCase().includes(q) || c.id.includes(q))
    : CATEGORIES;

  searchResults.innerHTML = '';
  filtered.forEach(cat => {
    const a = document.createElement('a');
    a.className = 'search-result-card';
    a.href = `${cat.id}/index.html`;
    a.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span>${cat.name}</span>`;
    searchResults.appendChild(a);
  });
}

/* ============================
   FAVORITES — pure grid renderer, no event wiring here
   ============================ */
const favsGrid  = document.getElementById('favsGrid');
const favsEmpty = document.getElementById('favsEmpty');

function renderFavsGrid() {
  const favs = getFavs();
  favsGrid.innerHTML = '';

  if (favs.length === 0) {
    favsEmpty.hidden = false;
    return;
  }
  favsEmpty.hidden = true;

  favs.forEach(src => {
    const div = document.createElement('div');
    div.className = 'favs-item';
    const catId = src.split('/')[0];
    div.innerHTML = `
      <img src="${src}" alt="Favorito" loading="lazy">
      <button type="button" class="favs-item-remove" aria-label="Quitar favorito">✕</button>
    `;
    div.querySelector('.favs-item-remove').addEventListener('click', () => {
      toggleFav(src);
      renderFavsGrid();
      buildCatsGrid();
    });
    div.addEventListener('click', e => {
      if (e.target.closest('.favs-item-remove')) return;
      window.location.href = `${catId}/index.html`;
    });
    favsGrid.appendChild(div);
  });
}

/* ============================
   UI STATE MANAGER
   Single source of truth for which overlay is active.
   All event listeners for overlays/keyboard are wired here —
   no scattered handlers, no duplicate keydown listeners,
   no live getElementById calls inside callbacks.
   ============================ */
const UI = (() => {
  // All interactive overlay elements cached once at startup
  const _o = {
    favsOverlay:   document.getElementById('favsOverlay'),
    navFavs:       document.getElementById('navFavs'),
    closeFavs:     document.getElementById('closeFavs'),
    searchOverlay: document.getElementById('searchOverlay'),
    openSearch:    document.getElementById('openSearch'),
    closeSearch:   document.getElementById('closeSearch'),
    searchInput:   document.getElementById('searchInput'),
  };

  // Which overlay is currently on screen — prevents double-open
  let _active = null; // 'favs' | 'search' | null

  /* ── Favorites ── */
  function openFavs() {
    if (_active === 'favs') return;
    _active = 'favs';
    _o.favsOverlay.hidden = false;
    renderFavsGrid();
  }

  function closeFavs() {
    if (_active !== 'favs') return;
    _active = null;
    _o.favsOverlay.hidden = true;
  }

  /* ── Search ── */
  function openSearch() {
    if (_active === 'search') return;
    _active = 'search';
    _o.searchOverlay.hidden = false;
    _o.searchInput.focus();
    renderSearch('');
  }

  function closeSearch() {
    if (_active !== 'search') return;
    _active = null;
    _o.searchOverlay.hidden = true;
    _o.searchInput.value = '';
  }

  /* ── Close whatever is currently open ── */
  function closeActive() {
    if (_active === 'favs')   closeFavs();
    if (_active === 'search') closeSearch();
  }

  /* ── Wire all listeners in one place ── */
  function init() {
    const missing = Object.entries(_o).filter(([, el]) => !el).map(([k]) => k);
    if (missing.length) {
      console.warn('[UI] Missing elements:', missing.join(', '));
    }

    // Favorites
    _o.navFavs?.addEventListener('click', e => { e.preventDefault(); openFavs(); });
    _o.closeFavs?.addEventListener('click', closeFavs);
    _o.favsOverlay?.addEventListener('click', e => {
      if (e.target === _o.favsOverlay) closeFavs(); // backdrop tap
    });

    // Search
    _o.openSearch?.addEventListener('click', openSearch);
    _o.closeSearch?.addEventListener('click', closeSearch);
    _o.searchInput?.addEventListener('input', () => {
      renderSearch(_o.searchInput.value.trim().toLowerCase());
    });

    // One unified Escape handler — replaces the two separate ones that were here
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeActive();
    });
  }

  return { init, openFavs, closeFavs, openSearch, closeSearch, closeActive };
})();

/* ============================
   INIT
   ============================ */
updateFavsBadge();
UI.init();

// Auto-open Favorites when arriving via #favs (e.g. Upload page nav → home)
if (location.hash === '#favs') {
  history.replaceState(null, '', location.pathname);
  UI.openFavs();
}

// ── Ad system bootstrap ────────────────────────────────────────────
(async function initAds() {
  // Daily coin bonus (first visit = 20, returning = 5)
  window.Coins?.claimDailyBonus();

  // Subscribe coin balance → header badge with pop animation
  window.Coins?.onUpdate(balance => {
    const badge = document.getElementById('coinBadge');
    const count = document.getElementById('coinCount');
    if (!badge || !count) return;

    const prev = parseInt(count.textContent || '0');
    count.textContent = balance;
    badge.hidden = false;

    // Animate on increase
    if (balance > prev) {
      badge.classList.remove('coin-badge--pop');
      void badge.offsetWidth; // reflow
      badge.classList.add('coin-badge--pop');
    }
  });

  // AdMob: init + show banner (native only, no-op in browser)
  if (window.AdService) {
    await window.AdService.init();
    window.AdService.showBanner();
  }

  // Coin badge tap → open coin sheet
  document.getElementById('coinBadge')?.addEventListener('click', _showCoinSheet);
})();

/* ============================
   COIN BOTTOM SHEET
   Shows balance + "Watch Ad → +10" entry point.
   ============================ */
function _showCoinSheet() {
  if (document.getElementById('_coinSheet')) return; // already open

  const balance = window.Coins?.getBalance() ?? 0;
  const overlay = document.createElement('div');
  overlay.id        = '_coinSheet';
  overlay.className = 'coin-sheet-overlay';
  overlay.innerHTML = `
    <div class="coin-sheet" role="dialog" aria-modal="true" aria-label="Mis monedas">
      <div class="coin-sheet-handle"></div>
      <div class="coin-sheet-header">
        <span class="coin-sheet-title">Mis monedas</span>
        <button type="button" class="coin-sheet-close" id="_coinSheetClose" aria-label="Cerrar">×</button>
      </div>
      <div class="coin-sheet-balance">
        <div class="coin-sheet-balance-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#a78bfa">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <div class="coin-sheet-balance-num" id="_coinSheetNum">${balance}</div>
          <div class="coin-sheet-balance-label">monedas disponibles</div>
        </div>
      </div>
      <div class="coin-sheet-divider"></div>
      <div class="coin-sheet-actions">
        <button type="button" class="coin-sheet-btn coin-sheet-btn--primary" id="_coinSheetWatchAd">
          <div class="coin-sheet-btn-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#a78bfa" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <div class="coin-sheet-btn-text">
            <div class="coin-sheet-btn-label">Ver anuncio</div>
            <div class="coin-sheet-btn-sub">Recompensa disponible ahora</div>
          </div>
          <span class="coin-sheet-btn-reward">+10 🪙</span>
        </button>
        <button type="button" class="coin-sheet-btn" id="_coinSheetPremium">
          <div class="coin-sheet-btn-icon" style="background:rgba(244,63,94,0.15)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f43f5e" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div class="coin-sheet-btn-text">
            <div class="coin-sheet-btn-label">Premium · Sin anuncios</div>
            <div class="coin-sheet-btn-sub">4K ilimitado · desde 1,99 €/mes</div>
          </div>
          <span class="coin-sheet-btn-reward" style="color:#f43f5e">→</span>
        </button>
      </div>
      <p class="coin-sheet-note">Las monedas se usan para descargar fondos 4K.<br>Máx. 30 monedas/día por anuncios.</p>
    </div>
  `;

  document.body.appendChild(overlay);

  // Keep balance number in sync while sheet is open.
  // Store the unsubscribe handle so we can remove the listener on close —
  // without this, each open/close cycle stacks one dead Coins listener.
  const sheetNum = overlay.querySelector('#_coinSheetNum');
  const _unsub = window.Coins?.onUpdate(b => {
    if (sheetNum) sheetNum.textContent = b;
  });

  function _closeSheet() {
    _unsub?.();  // remove the onUpdate listener — prevents accumulation
    overlay.style.animation = 'cs-fade-out 0.18s ease both';
    overlay.querySelector('.coin-sheet').style.animation = 'none';
    overlay.querySelector('.coin-sheet').style.transform = 'translateY(100%)';
    overlay.querySelector('.coin-sheet').style.transition = 'transform 0.22s ease';
    setTimeout(() => overlay.remove(), 220);
  }

  overlay.querySelector('#_coinSheetClose').addEventListener('click', _closeSheet);
  overlay.addEventListener('click', e => { if (e.target === overlay) _closeSheet(); });

  // Watch Ad → +10 coins
  overlay.querySelector('#_coinSheetWatchAd').addEventListener('click', async () => {
    const btn = overlay.querySelector('#_coinSheetWatchAd');
    btn.disabled = true;
    btn.querySelector('.coin-sheet-btn-sub').textContent = 'Cargando anuncio…';

    try {
      const result = await window.AdService?.showRewarded('bonus_coins')
        ?? { rewarded: false, source: 'unavailable' };

      if (result.rewarded) {
        const newBal = window.Coins?.getBalance() ?? 0;
        btn.querySelector('.coin-sheet-btn-sub').textContent = `¡+10 ganadas! Saldo: ${newBal} 🪙`;
        showToast(`+10 monedas ganadas! Saldo: ${newBal}`);
        window.Analytics?.track(
          window.Analytics?.Events?.BONUS_COINS_EARN ?? 'bonus_coins_earn',
          { balance: newBal, source: 'coin_sheet' }
        );
        if (window.Premium?.shouldShowPaywall()) {
          setTimeout(() => { _closeSheet(); window.AdModal?.showPaywall('coin_sheet'); }, 1200);
        }
      } else {
        btn.querySelector('.coin-sheet-btn-sub').textContent = 'Anuncio no completado. Inténtalo de nuevo.';
        btn.disabled = false;
      }
    } catch {
      btn.querySelector('.coin-sheet-btn-sub').textContent = 'Error al cargar anuncio.';
      btn.disabled = false;
    }
  });

  // Premium CTA
  overlay.querySelector('#_coinSheetPremium').addEventListener('click', () => {
    _closeSheet();
    setTimeout(() => window.AdModal?.showPaywall('coin_sheet'), 240);
  });
}

/* ============================
   REFERRAL SYSTEM
   ============================ */
(function initReferral() {
  const REF_KEY  = 'wallspro_ref_code';
  const SHOWN_KEY = 'wallspro_ref_banner_shown';

  // Generate or retrieve this user's referral code
  let code = localStorage.getItem(REF_KEY);
  if (!code) {
    code = 'WP-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    localStorage.setItem(REF_KEY, code);
    window.Analytics?.track(
      window.Analytics?.Events?.REFERRAL_GENERATED ?? 'referral_generated',
      { code }
    );
  }

  // Check URL for incoming referral: ?ref=WP-XXXXX
  const urlRef = new URLSearchParams(location.search).get('ref');
  if (urlRef && urlRef !== code) {
    window.Coins?.claimReferral(urlRef);
  }

  // Show the referral banner once per session (after 8 s)
  if (sessionStorage.getItem(SHOWN_KEY)) return;
  setTimeout(() => {
    sessionStorage.setItem(SHOWN_KEY, '1');
    _showReferralBanner(code);
  }, 8000);
})();

function _showReferralBanner(code) {
  if (document.getElementById('ref-banner')) return;
  const banner       = document.createElement('div');
  banner.id          = 'ref-banner';
  banner.className   = 'ref-banner';
  banner.setAttribute('role', 'complementary');
  banner.innerHTML   = `
    <div class="ref-banner-inner">
      <div class="ref-banner-left">
        <div class="ref-banner-title">Invita amigos · Gana monedas</div>
        <div class="ref-banner-sub">Tu amigo y tú recibís +50 🪙 cada uno</div>
      </div>
      <button type="button" class="ref-banner-btn" id="ref-share">Compartir</button>
      <button type="button" class="ref-banner-close" id="ref-close" aria-label="Cerrar">×</button>
    </div>
  `;

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('ref-banner--show'));

  document.getElementById('ref-close').addEventListener('click', () => {
    banner.classList.remove('ref-banner--show');
    setTimeout(() => banner.remove(), 300);
  });

  document.getElementById('ref-share').addEventListener('click', async () => {
    const url  = location.origin + location.pathname + '?ref=' + code;
    const text = `¡Descarga WallsPro y obtén fondos HD gratis! Usa mi código ${code}: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'WallsPro', text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      const btn = document.getElementById('ref-share');
      if (btn) { btn.textContent = '¡Copiado!'; setTimeout(() => { btn.textContent = 'Compartir'; }, 2000); }
    }
  });
}
