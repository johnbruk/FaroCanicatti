# Come scaricare e vedere l'anteprima del portale

Non sei tu a sbagliare: in questa chat il file ZIP non viene mostrato come allegato cliccabile. Il pacchetto esiste nel repository al percorso:

```text
release/il-faro-canicatti-portale.zip
```

## Se stai guardando il repository su GitHub

1. Apri la cartella `release`.
2. Clicca su `il-faro-canicatti-portale.zip`.
3. Clicca su **Download raw file** oppure **Raw** per scaricare lo ZIP.
4. Estrai lo ZIP sul tuo computer.
5. Entra nella cartella estratta `il-faro-canicatti-portale`.

## Se hai il repository sul computer

Dal terminale, dentro la cartella del repository, il file si trova qui:

```bash
release/il-faro-canicatti-portale.zip
```

Puoi estrarlo con:

```bash
unzip release/il-faro-canicatti-portale.zip -d anteprima-faro
cd anteprima-faro/il-faro-canicatti-portale
```

## Come avviare il sito locale

### Metodo consigliato senza installare nulla

1. Entra nella cartella estratta `il-faro-canicatti-portale`.
2. Fai doppio click su `index.html`.
3. Il portale si aprirà nel browser.

### Metodo opzionale con Node.js/npm

Se hai Node.js installato puoi anche eseguire:

```bash
npm run start
```

Poi apri il browser su:

```text
http://127.0.0.1:5173/
```

## Problemi comuni

### Vedo una pagina bianca o senza stile

Se hai aperto `index.html` con doppio click e vedi problemi, usa il metodo opzionale `npm run start` oppure installa Node.js.

### Il browser dice che la porta 5173 è occupata

Usa un'altra porta, ad esempio:

```bash
node scripts/serve-static-app.js 8080
```

Poi apri:

```text
http://127.0.0.1:8080/
```

### Ho estratto lo ZIP ma vedo solo una lista di file

Controlla di aver avviato il comando dentro la cartella `il-faro-canicatti-portale`, non nella cartella superiore.

## Verifica rapida

Se il server funziona, nel terminale vedrai una riga simile a:

```text
Il Faro di Canicattì è avviato su http://127.0.0.1:5173/
```

A quel punto il portale è raggiungibile dal browser all'indirizzo `http://127.0.0.1:5173/`.

## Errore: Python was not found

Non usare Python. Apri `index.html` con doppio click. Se vuoi usare un server locale, installa Node.js e poi usa:

```bash
npm run start
```

## Se npm non esiste

Se Git Bash mostra `bash: npm: command not found`, apri direttamente `index.html` con doppio click oppure leggi `SENZA_NPM.md`.
