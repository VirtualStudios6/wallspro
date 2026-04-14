/**
 * Build script: copia los archivos web a www/
 * Uso: node build.js
 */
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const WWW  = path.join(ROOT, 'www');

// ── Limpiar y recrear www/ ───────────────────────────────────────
if (fs.existsSync(WWW)) {
  fs.rmSync(WWW, { recursive: true, force: true });
}
fs.mkdirSync(WWW);

// ── Carpetas a copiar ────────────────────────────────────────────
const folders = ['Walls-Fondos', 'Subir-fondos', 'Walls-Politicas'];

for (const folder of folders) {
  const src = path.join(ROOT, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(WWW, folder), { recursive: true });
    console.log(`  ✓ ${folder}`);
  }
}

// ── index.html raíz (redirige a la app principal) ────────────────
// NOTE: No <meta http-equiv="refresh"> — it fires a second navigation and
// causes a white flash before the splash hides. JS replace() is synchronous
// and fast enough; it runs before the WebView paints.
const rootHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>WallsPro</title>
  <style>
    html,body{margin:0;padding:0;background:#0a0a0f;height:100%;}
  </style>
  <script>window.location.replace('Walls-Fondos/index.html');</script>
</head>
<body></body>
</html>`;

fs.writeFileSync(path.join(WWW, 'index.html'), rootHtml);

console.log('\n  Build completo → www/\n');
