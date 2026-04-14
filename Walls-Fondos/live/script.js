const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxVideo = document.getElementById('lightbox-video');
const downloadBtn = document.getElementById('download-btn');
const likeBtn = document.getElementById('like-btn');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const closeBtn = document.getElementById('closeBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('lightboxCounter');

const totalVideos = 66;
const videos = Array.from({ length: totalVideos }, (_, k) => ({
  src: `fondos/live${k + 1}.mp4`,
  alt: `Live wallpaper ${k + 1}`
}));

let currentIndex = 0;
let isMuted = true;

// Build grid of video thumbnails
videos.forEach(({ src, alt }, idx) => {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.dataset.index = idx;

  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('webkit-playsinline', '');
  video.dataset.src = src;
  video.alt = alt;

  const playIcon = document.createElement('div');
  playIcon.className = 'play-icon';
  playIcon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

  const badge = document.createElement('span');
  badge.className = 'live-badge-thumb';
  badge.textContent = 'LIVE';

  item.appendChild(video);
  item.appendChild(badge);
  item.appendChild(playIcon);
  gallery.appendChild(item);
});

// Lazy load + autoplay on hover
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const item = e.target;
    const video = item.querySelector('video');
    if (video && !video.src) {
      video.src = video.dataset.src;
      video.load();
    }
    obs.unobserve(item);
  });
}, { rootMargin: '300px' });

document.querySelectorAll('.gallery-item').forEach(item => {
  observer.observe(item);

  const video = item.querySelector('video');

  item.addEventListener('mouseenter', () => {
    if (video.readyState >= 2) {
      video.play().catch(() => {});
    } else {
      video.addEventListener('canplay', () => video.play().catch(() => {}), { once: true });
    }
  });
  item.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
});

// Open lightbox
gallery.addEventListener('click', e => {
  const item = e.target.closest('.gallery-item');
  if (!item) return;
  currentIndex = parseInt(item.dataset.index, 10);
  openLightbox(currentIndex);
});

function openLightbox(index) {
  const { src } = videos[index];
  lightboxVideo.src = src;
  lightboxVideo.muted = isMuted;
  lightboxVideo.load();
  lightboxVideo.play().catch(() => {});
  const saved = _isFav(src);
  likeBtn.setAttribute('aria-pressed', String(saved));
  counter.textContent = (index + 1) + ' / ' + videos.length;
  lightbox.classList.add('active');
  currentIndex = index;
  updateMuteIcon();
}

function closeLightbox() {
  lightbox.classList.remove('active');
  lightboxVideo.pause();
  lightboxVideo.src = '';
}

// ── Guardar video en galería ───────────────────────────────────────
downloadBtn.addEventListener('click', async e => {
  e.preventDefault();
  const src = lightboxVideo.src || lightboxVideo.currentSrc;
  if (!src) return;

  // Guard interstitials during download — same pattern as category.js
  window.AdService?.beginCriticalAction();
  try {
    if (window.Capacitor?.isNativePlatform()) {
      const { Filesystem, Media } = window.Capacitor.Plugins;
      if (!Filesystem || !Media) throw new Error('plugins missing');

      const response = await fetch(src);
      if (!response.ok) throw new Error(`fetch ${response.status}`);
      const blob   = await response.blob();
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      const fileName = 'walls_live_' + Date.now() + '.mp4';
      await Filesystem.writeFile({ path: fileName, data: base64, directory: 'CACHE' });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: 'CACHE' });
      await Media.saveVideo({ path: uri });
      await Filesystem.deleteFile({ path: fileName, directory: 'CACHE' });
      showToast('Guardado en tu galería ✓');
    } else {
      // Web fallback
      const a = document.createElement('a');
      a.href = src; a.download = src.split('/').pop(); a.click();
    }
  } catch (err) {
    console.error('[live] download:', err);
    showToast('No se pudo guardar. Inténtalo de nuevo.');
  } finally {
    window.AdService?.endCriticalAction();
  }
});

closeBtn.addEventListener('click', closeLightbox);

prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + videos.length) % videos.length;
  openLightbox(currentIndex);
});

nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % videos.length;
  openLightbox(currentIndex);
});

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  lightboxVideo.muted = isMuted;
  updateMuteIcon();
});

function updateMuteIcon() {
  muteIcon.innerHTML = isMuted
    ? `<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`
    : `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>`;
  muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
}

likeBtn.addEventListener('click', () => {
  const src = lightboxVideo.src || lightboxVideo.currentSrc;
  if (!src) return;
  const added = _toggleFav(src);
  likeBtn.setAttribute('aria-pressed', String(added));
  showToast(added ? '♥  Añadido a favoritos' : 'Eliminado de favoritos');
});

lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'm' || e.key === 'M') muteBtn.click();
});

let touchStartX = 0;
lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) > 50) diff > 0 ? prevBtn.click() : nextBtn.click();
});
