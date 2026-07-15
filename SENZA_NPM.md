# Se Git Bash dice `bash: npm: command not found`

Questo errore significa che sul computer non è installato Node.js oppure Git Bash non trova il comando `npm`.

Da ora il portale può essere visto anche **senza npm, senza Node.js e senza Python**.

## Metodo più semplice: doppio click

1. Apri la cartella del progetto.
2. Cerca il file:

```text
index.html
```

3. Fai doppio click su `index.html`.
4. Il portale si aprirà nel browser.

## Se hai scaricato lo ZIP da GitHub

1. Estrai lo ZIP.
2. Entra nella cartella estratta.
3. Fai doppio click su `index.html`.

## Limiti del doppio click

Con doppio click il sito funziona come anteprima statica, ma alcune funzioni PWA avanzate, come il service worker offline, funzionano solo quando il sito è servito via `http://`.

Per vedere solo grafica, form demo e dashboard demo, il doppio click basta.

## Metodo opzionale con npm

Se in futuro installerai Node.js, potrai usare anche:

```bash
npm run start
```

ma non è più obbligatorio.

## Dove installare Node.js se ti servirà

Se vuoi comunque avere `npm`, installa Node.js da:

```text
https://nodejs.org/
```

Dopo l'installazione, chiudi e riapri Git Bash e controlla:

```bash
node -v
npm -v
```
