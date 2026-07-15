const fs = require('node:fs');
const path = require('node:path');

const requiredFiles = [
  'index.html',
  'src/main.js',
  'src/styles.css',
  'manifest.webmanifest',
  'service-worker.js',
  'icons/icon.svg',
  'scripts/serve-static-app.js'
];

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File richiesto mancante: ${file}`);
  }
}

JSON.parse(fs.readFileSync(path.join(process.cwd(), 'manifest.webmanifest'), 'utf8'));
new Function(fs.readFileSync(path.join(process.cwd(), 'src/main.js'), 'utf8'));
new Function(fs.readFileSync(path.join(process.cwd(), 'service-worker.js'), 'utf8'));
new Function(fs.readFileSync(path.join(process.cwd(), 'scripts/serve-static-app.js'), 'utf8'));

console.log('Static app validation completed successfully.');
