# Se `release/il-faro-canicatti-portale.zip` non esiste

Se nel tuo repository non trovi questo file:

```text
release/il-faro-canicatti-portale.zip
```

non è un problema: puoi comunque vedere il sito e puoi rigenerare il pacchetto.

## Soluzione più semplice: avvia il sito senza ZIP

Dopo aver clonato o scaricato il repository, entra nella cartella principale del progetto, cioè quella dove vedi `index.html`.

In Git Bash:

```bash
cd ~/Desktop/FaroCanicatti
```

Se il progetto è in un'altra cartella, adattare il percorso.

Poi apri il sito direttamente facendo doppio click su:

```text
index.html
```

Questa è la soluzione migliore: **lo ZIP e npm non servono per vedere il sito**.

## Rigenerare lo ZIP dal repository

Se vuoi comunque creare lo ZIP, dalla cartella principale del progetto esegui:

```bash
npm run package
```

Questo comando crea:

```text
release/il-faro-canicatti-portale.zip
```

## Se `npm run package` non funziona

Per usare `npm run start` o `npm run package`, controlla di avere Node.js installato:

```bash
node -v
npm -v
```

Se questi comandi non funzionano, installa Node.js da:

```text
https://nodejs.org/
```

Poi chiudi e riapri Git Bash e riprova:

```bash
npm run package
```

## Se il comando `zip` non esiste su Git Bash

Su alcuni Windows, Git Bash potrebbe non avere il comando `zip`. In questo caso puoi comunque vedere il sito senza ZIP aprendo `index.html` con doppio click.

Oppure puoi creare lo ZIP manualmente da Esplora file:

1. Seleziona tutti i file del progetto.
2. Tasto destro.
3. Clicca su **Invia a**.
4. Clicca su **Cartella compressa**.

## Scaricare tutto il repository da GitHub come ZIP

Se il repository è su GitHub, puoi anche scaricare tutto senza usare `release/il-faro-canicatti-portale.zip`:

1. Apri il repository su GitHub.
2. Clicca sul pulsante verde **Code**.
3. Clicca su **Download ZIP**.
4. Estrai lo ZIP scaricato.
5. Entra nella cartella estratta.
6. Fai doppio click su `index.html`.

## Regola pratica

- Vuoi solo vedere il sito? Non ti serve lo ZIP interno e non ti serve npm: fai doppio click su `index.html`.
- Vuoi condividere un pacchetto? Usa `npm run package` per generare `release/il-faro-canicatti-portale.zip`.

## Errore: Python was not found

Se Windows mostra `Python was not found`, non usare Python: apri direttamente `index.html` con doppio click.

## Se npm non esiste

Se Git Bash mostra `bash: npm: command not found`, apri direttamente `index.html` con doppio click oppure leggi `SENZA_NPM.md`.
