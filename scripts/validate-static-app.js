const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const requiredFiles = [
  'index.html',
  'src/main.js',
  'src/auth.js',
  'src/styles.css',
  'manifest.webmanifest',
  'service-worker.js',
  'icons/controcorrente.svg',
  'scripts/serve-static-app.js'
];

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File richiesto mancante: ${file}`);
  }
}

// Il manifest deve essere JSON valido.
JSON.parse(fs.readFileSync(path.join(process.cwd(), 'manifest.webmanifest'), 'utf8'));

// I file JS (moduli ES inclusi) vengono validati con `node --check`,
// che comprende la sintassi import/export a differenza di `new Function`.
const jsFiles = ['src/main.js', 'src/auth.js', 'src/api.js', 'service-worker.js', 'scripts/serve-static-app.js'];
for (const file of jsFiles) {
  execFileSync(process.execPath, ['--check', path.join(process.cwd(), file)], { stdio: 'pipe' });
}

console.log('Static app validation completed successfully.');
