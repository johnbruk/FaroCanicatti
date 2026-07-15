# Flusso di lavoro con Pull Request manuale

In questo progetto non usiamo il push diretto da questo ambiente verso GitHub, perché la rete può bloccare `git push` con errore proxy/403.

Il flusso corretto è quindi basato su Pull Request manuale.

## Procedura per ogni modifica

1. L'assistente modifica i file nel repository locale.
2. L'assistente esegue i controlli disponibili, per esempio:

```bash
npm run build
```

3. L'assistente verifica che non ci siano file binari tracciati, come ZIP, PNG, JPG, PDF, database locali o cartelle build.
4. L'assistente crea un commit locale con le modifiche.
5. L'assistente prepara titolo e descrizione della Pull Request.
6. L'utente carica o aggiorna manualmente la PR su GitHub.
7. L'utente esegue il merge della PR su `main`.
8. GitHub Actions pubblica l'anteprima su GitHub Pages.

## File da non includere nella PR

Non includere:

- `node_modules/`
- `dist/`
- `build/`
- file `.zip`
- file `.pdf`
- database locali `.sqlite`, `.sqlite3`, `.db`
- immagini binarie non necessarie `.png`, `.jpg`, `.jpeg`, `.webp`, `.ico`
- font binari `.woff`, `.woff2`, `.ttf`, `.otf`

Gli asset grafici devono essere preferibilmente SVG testuali.

## Anteprima dopo il merge

Dopo il merge su `main`, l'anteprima online si aggiorna tramite GitHub Pages.

URL previsto:

```text
https://johnbruk.github.io/FaroCanicatti/
```

Se l'anteprima non si aggiorna subito:

1. aprire la tab **Actions**;
2. controllare il workflow **Deploy static preview to GitHub Pages**;
3. se necessario, eseguire **Run workflow**;
4. attendere 1-2 minuti.

## Responsabilità operative

### Assistente

- Modifica codice e documentazione.
- Esegue controlli locali.
- Evita file binari in Git.
- Crea commit locali.
- Prepara titolo e descrizione PR.

### Utente

- Carica/aggiorna la PR su GitHub.
- Esegue il merge su `main`.
- Controlla GitHub Actions e GitHub Pages.
- Verifica visivamente l'anteprima online.
