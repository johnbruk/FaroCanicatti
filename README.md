# Il Faro di Canicattì

Portale cittadino web/PWA per raccogliere segnalazioni dei cittadini e offrire una prima area di gestione multiutente per amministratori e uffici comunali.

## Funzionalità incluse

- Landing page responsive del portale "Il Faro di Canicattì".
- Form cittadino per inviare segnalazioni con categoria, luogo, descrizione, priorità e allegato.
- Codice pratica automatico e salvataggio demo in `localStorage`.
- Dashboard amministrativa con filtro per stato, assegnazione al ruolo corrente e avanzamento pratica.
- Manifest PWA, icona e service worker per installabilità e cache offline degli asset principali.

## Avvio locale

Metodo più semplice, senza installare nulla: apri `index.html` con doppio click.

Metodo opzionale se hai Node.js/npm:

```bash
npm run start
```

## Build

```bash
npm run build
```

## Pacchetto scaricabile

Per creare un pacchetto ZIP pronto da condividere o scaricare:

```bash
npm run package
```

Il file viene generato in `release/il-faro-canicatti-portale.zip`. Dopo averlo estratto, aprire `index.html` con doppio click. Se hai Node.js/npm puoi usare anche `npm run start`.

## Anteprima locale passo passo

Se non sai come scaricare o aprire il pacchetto, leggi `ANTEPRIMA_LOCALE.md`. Ora il metodo più semplice è aprire `index.html` con doppio click; `npm run start` resta solo un metodo opzionale se hai Node.js/npm.

## Pubblicazione su GitHub

Se vuoi caricare tutto su GitHub per scaricare più facilmente lo ZIP, segui `GITHUB_UPLOAD.md`. In questa copia locale non è configurato alcun remoto GitHub, quindi prima bisogna creare o collegare un repository remoto.

## Se lo ZIP non esiste

Se nel repository non trovi `release/il-faro-canicatti-portale.zip`, leggi `SE_ZIP_NON_ESISTE.md`. Puoi comunque aprire il sito direttamente facendo doppio click su `index.html`, senza usare lo ZIP.

## Avvio senza npm, Node.js o Python

Se Git Bash mostra `bash: npm: command not found`, puoi comunque aprire il portale facendo doppio click su `index.html`. Leggi `SENZA_NPM.md` per i passaggi dettagliati.

## Direzione design

Il layout usa una direzione istituzionale chiara ispirata ad Articolo30: pagine bianche, griglie pulite, testi leggibili, accenti Controcorrente molto misurati e logo SVG del Faro 1 di Canicattì.

## Anteprima online

Per vedere il portale online tramite GitHub Pages, leggi `GITHUB_PAGES_PREVIEW.md`. Dopo l'attivazione su GitHub, l'URL previsto è `https://johnbruk.github.io/FaroCanicatti/`.
