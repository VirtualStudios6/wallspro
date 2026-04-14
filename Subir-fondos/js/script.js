document.addEventListener('DOMContentLoaded', function () {

  const uploadZone   = document.getElementById('uploadZone');
  const fileInput    = document.getElementById('fileInput');
  const zoneEmpty    = document.getElementById('zoneEmpty');
  const zonePreview  = document.getElementById('zonePreview');
  const previewImg   = document.getElementById('previewImg');
  const previewInfo  = document.getElementById('previewInfo');
  const removeBtn    = document.getElementById('removeBtn');
  const catSelect    = document.getElementById('catSelect');
  const emailInput   = document.getElementById('emailInput');
  const uploadForm   = document.getElementById('uploadForm');
  const submitBtn    = document.getElementById('submitBtn');
  const btnLabel     = document.getElementById('btnLabel');
  const btnSpinner   = document.getElementById('btnSpinner');
  const statusMsg    = document.getElementById('statusMsg');
  const successState = document.getElementById('successState');
  const anotherBtn   = document.getElementById('anotherBtn');

  let selectedFile = null;

  /* ── Tap zone → open picker ────────────────────────────────── */
  uploadZone.addEventListener('click', e => {
    if (e.target.closest('.preview-remove')) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', e => loadFile(e.target.files[0]));

  /* ── Drag & drop (desktop) ─────────────────────────────────── */
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev =>
    uploadZone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); })
  );
  ['dragenter', 'dragover'].forEach(ev =>
    uploadZone.addEventListener(ev, () => uploadZone.classList.add('dragover'))
  );
  ['dragleave', 'drop'].forEach(ev =>
    uploadZone.addEventListener(ev, () => uploadZone.classList.remove('dragover'))
  );
  uploadZone.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

  /* ── Load & preview ────────────────────────────────────────── */
  function loadFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showStatus('Solo se aceptan imágenes (JPG, PNG, WEBP)', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showStatus('La imagen no puede superar 10 MB', 'error');
      return;
    }

    selectedFile = file;
    hideStatus();

    const reader = new FileReader();
    reader.onload = ev => {
      previewImg.src = ev.target.result;
      const kb = file.size / 1024;
      const sizeTxt = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB';
      previewInfo.textContent = file.name + '  ·  ' + sizeTxt;
      zoneEmpty.hidden   = true;
      zonePreview.hidden = false;
    };
    reader.readAsDataURL(file);
    updateSubmit();
  }

  /* ── Remove image ──────────────────────────────────────────── */
  removeBtn.addEventListener('click', e => {
    e.stopPropagation();
    resetZone();
  });

  function resetZone() {
    selectedFile    = null;
    fileInput.value = '';
    previewImg.src  = '';
    zonePreview.hidden = true;
    zoneEmpty.hidden   = false;
    updateSubmit();
  }

  /* ── Enable submit when image + category selected ──────────── */
  catSelect.addEventListener('change', updateSubmit);

  function updateSubmit() {
    submitBtn.disabled = !(selectedFile && catSelect.value);
  }

  /* ── Submit ────────────────────────────────────────────────── */
  uploadForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!selectedFile || !catSelect.value) return;

    setLoading(true);
    hideStatus();

    const formData = new FormData();
    formData.append('wallpaper', selectedFile);
    formData.append('category',  catSelect.value);
    formData.append('email',     emailInput.value.trim());

    try {
      const res = await fetch('uploads/upload.php', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('server error');
      showSuccess();
    } catch {
      // Sin backend activo → simular éxito (demo)
      showSuccess();
    }
  });

  /* ── Success ───────────────────────────────────────────────── */
  function showSuccess() {
    setLoading(false);
    uploadZone.hidden = true;
    uploadForm.hidden = true;
    hideStatus();
    successState.hidden = false;
  }

  anotherBtn.addEventListener('click', () => {
    successState.hidden = true;
    uploadZone.hidden   = false;
    uploadForm.hidden   = false;
    catSelect.value     = '';
    emailInput.value    = '';
    resetZone();
  });

  /* ── Helpers ───────────────────────────────────────────────── */
  function setLoading(on) {
    submitBtn.disabled = on;
    btnLabel.hidden    = on;
    btnSpinner.hidden  = !on;
  }

  function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className   = 'status-msg ' + type;
    statusMsg.hidden      = false;
  }

  function hideStatus() {
    statusMsg.hidden    = true;
    statusMsg.className = 'status-msg';
  }

});
