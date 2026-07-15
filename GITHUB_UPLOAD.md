# Come caricare questo portale su GitHub e scaricarlo

Al momento questo repository locale non ha un remoto GitHub configurato. Per questo non è possibile fare `git push` automaticamente da questa macchina finché non viene collegato a un repository GitHub.

## Obiettivo

Caricare tutto il progetto su GitHub, compreso il pacchetto:

```text
release/il-faro-canicatti-portale.zip
```

Così potrai scaricarlo facilmente dal browser.

## Metodo più semplice: caricare da browser

1. Vai su GitHub.
2. Crea un nuovo repository, ad esempio:

```text
FaroCanicatti
```

3. Entra nel repository appena creato.
4. Clicca su **Add file**.
5. Clicca su **Upload files**.
6. Trascina dentro GitHub tutti i file e le cartelle del progetto.
7. Clicca su **Commit changes**.
8. A quel punto troverai lo ZIP in:

```text
release/il-faro-canicatti-portale.zip
```

9. Clicca sul file ZIP.
10. Clicca su **Download raw file** per scaricarlo.

## Metodo consigliato se usi il terminale

Dopo aver creato un repository vuoto su GitHub, copia l'URL del repository. Sarà simile a questo:

```text
https://github.com/TUO-UTENTE/FaroCanicatti.git
```

Poi, nella cartella locale del progetto, esegui:

```bash
git remote add origin https://github.com/TUO-UTENTE/FaroCanicatti.git
git push -u origin work
```

Se vuoi usare il branch `main` invece di `work`, esegui:

```bash
git branch -M main
git push -u origin main
```

## Se GitHub chiede login o token

GitHub non accetta più la password normale da terminale. Potrebbe chiederti un **Personal Access Token**.

In alternativa, usa GitHub Desktop o il caricamento via browser, che è più semplice.

## Dopo il push

Una volta caricato il repository su GitHub:

1. Apri GitHub dal browser.
2. Vai nella cartella `release`.
3. Clicca su `il-faro-canicatti-portale.zip`.
4. Clicca su **Download raw file**.
5. Estrai lo ZIP.
6. Segui le istruzioni in `ANTEPRIMA_LOCALE.md`.

## Perché qui non ho potuto fare push direttamente

Il comando:

```bash
git remote -v
```

non mostra nessun repository remoto configurato. Senza un URL GitHub collegato e senza credenziali di accesso, questa macchina non sa dove caricare il progetto.
