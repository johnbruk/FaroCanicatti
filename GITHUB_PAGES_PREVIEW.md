# Anteprima online con GitHub Pages

Puoi vedere il portale online direttamente da GitHub usando **GitHub Pages**.

## Cosa viene pubblicato

Il progetto è statico, quindi GitHub Pages può pubblicare direttamente:

```text
index.html
src/styles.css
src/main.js
icons/icon.svg
manifest.webmanifest
service-worker.js
```

Non serve backend per questa anteprima.

## URL previsto

Dopo l'attivazione, l'anteprima sarà di solito raggiungibile qui:

```text
https://johnbruk.github.io/FaroCanicatti/
```

## Come attivarla su GitHub

1. Apri il repository:

```text
https://github.com/johnbruk/FaroCanicatti
```

2. Vai su **Settings**.
3. Vai su **Pages**.
4. In **Build and deployment**, scegli:

```text
Source: GitHub Actions
```

5. Salva se GitHub te lo richiede.
6. Torna nella tab **Actions**.
7. Apri il workflow:

```text
Deploy static preview to GitHub Pages
```

8. Se non parte da solo, clicca **Run workflow**.
9. Quando il workflow è verde, apri:

```text
https://johnbruk.github.io/FaroCanicatti/
```

## Quando si aggiorna l'anteprima

Ogni volta che fai merge o push sul branch `main`, il workflow `.github/workflows/pages.yml` pubblica nuovamente il sito.

## Se l'anteprima non si vede subito

Aspetta 1-2 minuti dopo il completamento dell'azione GitHub. A volte GitHub Pages impiega qualche istante ad aggiornare la cache.

## Se vedi una pagina 404

Controlla:

1. che la PR sia stata mergiata su `main`;
2. che in **Settings > Pages** la sorgente sia **GitHub Actions**;
3. che nella tab **Actions** il workflow sia verde;
4. che l'URL sia esattamente:

```text
https://johnbruk.github.io/FaroCanicatti/
```
