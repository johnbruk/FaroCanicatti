const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const packageDir = path.join(root, 'release', 'il-faro-canicatti-portale');
const zipPath = path.join(root, 'release', 'il-faro-canicatti-portale.zip');
const files = [
  'README.md',
  'ANTEPRIMA_LOCALE.md',
  'GITHUB_UPLOAD.md',
  'SE_ZIP_NON_ESISTE.md',
  'SENZA_NPM.md',
  'COME_USARE_STANDALONE.md',
  'PORTALE_STANDALONE.html',
  'package.json',
  'index.html',
  'manifest.webmanifest',
  'service-worker.js',
  'icons/icon.svg',
  'src/main.js',
  'src/styles.css',
  'scripts/serve-static-app.js',
  'docs/ARCHITECTURE.md'
];

fs.rmSync(packageDir, { recursive: true, force: true });
fs.mkdirSync(packageDir, { recursive: true });

for (const file of files) {
  const source = path.join(root, file);
  const destination = path.join(packageDir, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.writeFileSync(
  path.join(packageDir, 'ANTEPRIMA.md'),
  `# Anteprima - Il Faro di Canicattì\n\nPer vedere il portale in locale:\n\n1. Estrai questo pacchetto ZIP.\n2. Apri un terminale nella cartella estratta.\n3. Esegui questo comando:\n\n\`\`\`bash\nnpm run start\n\`\`\`\n\noppure, se hai Node.js:\n\n\`\`\`bash\nnpm run start\n\`\`\`\n\n4. Apri il browser su http://127.0.0.1:5173/\n\nIl portale è una demo statica/PWA: le segnalazioni vengono salvate nel localStorage del browser. Non serve Python.\n`
);

fs.rmSync(zipPath, { force: true });
const zip = spawnSync('zip', ['-r', zipPath, 'il-faro-canicatti-portale'], {
  cwd: path.join(root, 'release'),
  stdio: 'inherit'
});

if (zip.status !== 0) {
  throw new Error('Impossibile creare il pacchetto ZIP. Verifica che il comando zip sia disponibile.');
}

fs.rmSync(packageDir, { recursive: true, force: true });
console.log(`Pacchetto creato: ${path.relative(root, zipPath)}`);
