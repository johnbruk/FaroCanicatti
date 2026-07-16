/**
 * Suite E2E / UAT / regressione — Il Faro 1 di Canicattì (frontend)
 * Guida il browser come un utente reale e verifica i flussi principali,
 * la stabilità (invii ripetuti) e l'accessibilità di base.
 *
 * Richiede un server che serva il build statico (vedi npm run test:e2e).
 *   BASE     URL del sito (default http://127.0.0.1:5291/FaroCanicatti/)
 *   PW_CHROME percorso del binario Chromium (per l'ambiente locale)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://127.0.0.1:5291/FaroCanicatti/';
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'it-IT' };
const GEO = { geolocation: { latitude: 37.3639, longitude: 13.8496 }, permissions: ['geolocation'] };

let pass = 0, fail = 0;
const results = [];
const ok = (n) => { pass++; results.push('  ✓ ' + n); };
const ko = (n, e) => { fail++; results.push('  ✗ ' + n + (e ? ' → ' + e : '')); };
async function expect(name, fn) { try { const v = await fn(); if (v === false) ko(name, 'assert falso'); else ok(name); } catch (e) { ko(name, e.message.split('\n')[0].slice(0, 120)); } }

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

async function newPage(withGeo) {
  const ctx = await browser.newContext(withGeo ? { ...MOBILE, ...GEO } : MOBILE);
  const errs = [];
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  return { ctx, page, errs };
}

async function fillGuest(page) {
  await page.getByPlaceholder('Mario').fill('Giovanni');
  await page.getByPlaceholder('Rossi').fill('Bruccoleri');
  await page.getByPlaceholder('CA1234567').fill('CA9988776');
  await page.getByPlaceholder('Via Roma 1').fill('Via Nazionale 10');
  await page.getByPlaceholder('92024').fill('92024');
  await page.getByPlaceholder('333 1234567').fill('3331122334');
  await page.getByPlaceholder('nome@email.it').fill('giovanni@example.it');
  await page.locator('.consent input[type="checkbox"]').check();
}

// ---- 1. Home + accessibilità ----
{
  const { ctx, page, errs } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await expect('home: sezioni chiave presenti', async () =>
    await page.locator('#segnala').count() && await page.locator('#mappa').count() &&
    await page.locator('#traccia').count() && await page.locator('#faq').count() && await page.locator('#contatti').count());
  await expect('a11y: lingua pagina = it', async () => (await page.locator('html').getAttribute('lang')) === 'it');
  await expect('a11y: un solo <h1>', async () => (await page.locator('h1').count()) === 1);
  await expect('a11y: tutte le immagini hanno attributo alt', async () => {
    const imgs = await page.locator('img').all();
    for (const i of imgs) if ((await i.getAttribute('alt')) === null) return false;
    return true;
  });
  await expect('a11y: 9 categorie selezionabili', async () => (await page.locator('.category-card').count()) === 9);
  await expect('home: nessun errore console', async () => errs.length === 0 || (results.push('    (console: ' + errs[0] + ')'), false));
  await ctx.close();
}

// ---- 2. Validazioni del wizard ----
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Invia una segnalazione' }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Continua' }).click();
  await expect('validazione: senza categoria blocca con messaggio', async () =>
    (await page.locator('.form-message').textContent())?.includes('categoria'));
  await page.locator('.category-card', { hasText: 'Strade e marciapiedi' }).click();
  await page.getByRole('button', { name: 'Continua' }).click(); // step 2
  await page.getByRole('button', { name: 'Continua' }).click(); // manca indirizzo
  await expect('validazione: senza indirizzo blocca', async () =>
    (await page.locator('.form-message').textContent())?.includes('indirizzo'));
  await ctx.close();
}

// ---- 3. Invio completo come ospite (con GPS) ----
{
  const { ctx, page, errs } = await newPage(true);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Invia una segnalazione' }).first().click();
  await page.waitForTimeout(500);
  await page.locator('.category-card', { hasText: 'Rifiuti e pulizia' }).click();
  await page.getByRole('button', { name: 'Continua' }).click();
  await page.getByRole('button', { name: /Usa la mia posizione/ }).click();
  await page.waitForTimeout(1200);
  await expect('invio: GPS mostra la mappa', async () => (await page.locator('iframe').count()) >= 1);
  await page.getByRole('button', { name: 'Continua' }).click();
  await page.locator('textarea').fill('Cassonetti stracolmi da giorni in tutta la via, cattivo odore e degrado.');
  await page.getByRole('button', { name: 'Continua' }).click();
  await fillGuest(page);
  await page.getByRole('button', { name: 'Continua' }).click();
  await page.getByRole('button', { name: 'Invia segnalazione' }).click();
  await page.waitForTimeout(700);
  await expect('invio: conferma verde con codice pratica', async () => {
    const el = page.locator('.form-message.is-ok');
    return (await el.count()) === 1 && /FARO-\d{4}-\d{3}/.test(await el.textContent());
  });
  await expect('invio: nessun errore console', async () => errs.length === 0);
  await ctx.close();
}

// ---- 4. Login SPID ----
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Accedi/ }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Entra con SPID/ }).click();
  await page.getByRole('button', { name: 'Poste ID' }).click();
  await page.waitForTimeout(1000);
  await expect('login SPID: chip utente visibile', async () => (await page.locator('.user-name').first().textContent())?.length > 0);
  await ctx.close();
}

// ---- 5. Login social + obbligo carta d'identità ----
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Accedi/ }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Google' }).click();
  await page.waitForTimeout(1000);
  await expect('social: compare la richiesta della carta d\'identità', async () =>
    (await page.getByText('Completa i dati della carta').count()) === 1);
  await page.getByPlaceholder('Mario').fill('Anna');
  await page.getByPlaceholder('Rossi').fill('Verdi');
  await page.getByPlaceholder('CA1234567').fill('CA5551234');
  await page.getByPlaceholder('Via Roma 1').fill('Via Garibaldi 5');
  await page.getByPlaceholder('92024').fill('92024');
  await page.getByPlaceholder('333 1234567').fill('3339998877');
  await page.getByRole('button', { name: 'Conferma identità' }).click();
  await page.waitForTimeout(600);
  await expect('social: dopo la carta d\'identità l\'utente è identificato', async () =>
    (await page.locator('.user-name').first().textContent())?.includes('Anna'));
  await ctx.close();
}

// ---- 6. Tracciamento ----
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Es. FARO-2026-001').fill('FARO-2026-001');
  await page.locator('#traccia').getByRole('button', { name: 'Cerca' }).click();
  await page.waitForTimeout(400);
  await expect('tracking: codice valido trovato', async () => (await page.locator('#traccia .mine-card .code').count()) >= 1);
  await page.getByPlaceholder('Es. FARO-2026-001').fill('FARO-0000-000');
  await page.locator('#traccia').getByRole('button', { name: 'Cerca' }).click();
  await page.waitForTimeout(400);
  await expect('tracking: codice inesistente → messaggio', async () => (await page.locator('.track-miss').count()) === 1);
  await ctx.close();
}

// ---- 7. Back office: cambio stato ----
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const card = page.locator('.report-card').first();
  await card.locator('select').selectOption('Risolta');
  await page.waitForTimeout(400);
  await expect('back office: lo stato passa a Risolta', async () =>
    (await card.locator('.badge').first().textContent())?.includes('Risolta'));
  await ctx.close();
}

// ---- 8. Stabilità: invii ripetuti ----
{
  const { ctx, page, errs } = await newPage(true);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const codes = new Set();
  for (let k = 0; k < 3; k++) {
    await page.getByRole('link', { name: 'Invia una segnalazione' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.category-card').nth(k).click();
    await page.getByRole('button', { name: 'Continua' }).click();
    await page.getByRole('button', { name: /Usa la mia posizione/ }).click();
    await page.waitForTimeout(900);
    await page.getByRole('button', { name: 'Continua' }).click();
    await page.locator('textarea').fill(`Segnalazione di test numero ${k + 1} con descrizione valida e sufficiente.`);
    await page.getByRole('button', { name: 'Continua' }).click();
    await fillGuest(page);
    await page.getByRole('button', { name: 'Continua' }).click();
    await page.getByRole('button', { name: 'Invia segnalazione' }).click();
    await page.waitForTimeout(600);
    const m = await page.locator('.form-message.is-ok').textContent();
    const code = m.match(/FARO-\d{4}-\d{3}/)?.[0];
    if (code) codes.add(code);
  }
  await expect('stabilità: 3 invii → 3 codici distinti', async () => codes.size === 3);
  await expect('stabilità: nessun errore console dopo invii ripetuti', async () => errs.length === 0);
  await ctx.close();
}

await browser.close();
console.log('\n' + results.join('\n'));
console.log(`\n  RISULTATO: ${pass} superati, ${fail} falliti`);
process.exit(fail === 0 ? 0 : 1);
