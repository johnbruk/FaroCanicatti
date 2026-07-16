# Demo — Il Faro 1 di Canicattì

Guida per presentare il portale ai colleghi di movimento.

## 🌐 Come aprirla

- **Link:** https://johnbruk.github.io/FaroCanicatti/
- **QR code:** `docs/qr-faro.png` (inquadralo col telefono per aprirla al volo)
- Funziona da **smartphone** come una web app: dal browser si può "Aggiungi a
  schermata Home" e diventa un'app installata.

> In questa demo i dati inseriti restano **sul dispositivo di chi prova** (nessun
> server): perfetto per far sperimentare tutti in autonomia.

## 🎬 Copione della demo (~5 minuti)

1. **Apri la home** — logo Controcorrente "Il Faro di Canicattì", la missione e i
   numeri (pratiche gestite, risolte, uffici collegati).
2. **"Invia una segnalazione"** — parte il percorso guidato in 5 passi:
   - **Categoria**: scegli es. *Strade e marciapiedi*.
   - **Dove**: tocca **"Usa la mia posizione"** → la posizione GPS appare su
     **Google Maps** (in strada prende il punto esatto dove sei).
   - **Cosa**: **scatta/carica una foto** e scrivi la descrizione.
   - **Chi**: mostra le due strade — **SPID/CIE** (un tocco) oppure i dati
     (nome, cognome, carta d'identità, indirizzo, contatti).
   - **Riepilogo → Invia**: appare il **codice pratica** (es. FARO-2026-009).
3. **Traccia una pratica** — inserisci un codice (es. `FARO-2026-001`) e mostra
   la **timeline degli stati** (Ricevuta → In lavorazione → Risolta).
4. **Accedi con SPID** — scegli un Identity Provider (es. Poste ID): compare il
   tuo profilo e **"Le mie segnalazioni"**.
5. **Accesso alternativo** — mostra **Google/Apple/Facebook**: spiega che
   richiedono comunque i **dati della carta d'identità** (l'account social non
   verifica l'identità).
6. **Area operatori (back office)** — cambia lo stato di una pratica e mostra che
   la **timeline si aggiorna**: è la vista del Comune.
7. **In fondo**: FAQ, contatti URP, note su accessibilità e privacy.

## 💬 Messaggi chiave da trasmettere

- **Semplice per tutti**: pensata per l'uso in strada, da chiunque, con pochi tocchi.
- **Trasparente**: ogni segnalazione ha un codice e uno stato tracciabile.
- **Istituzionale ma nostra**: identità Controcorrente su un impianto in stile
  Pubblica Amministrazione (accessibilità, privacy, SPID/CIE).
- **Già solida**: frontend + backend + database reali, testati (37 test verdi).

## ⚙️ Cosa è reale e cosa è simulato

| Elemento | Stato |
|---|---|
| Interfaccia, wizard, foto, Google Maps, tracciamento | **Reale** |
| Backend API + database PostgreSQL | **Reale** (in `apps/api`, pronto per un host) |
| Accesso SPID/CIE e social | **Simulato** (l'impianto è pronto per l'integrazione vera) |
| Dati della demo online | Salvati sul dispositivo (per far provare tutti) |

## 🚀 Prossimi passi dopo la demo

- Pubblicare backend + database su un host (Render/Railway/Fly.io) per dati
  condivisi e registrazione reale degli utenti.
- Integrazione **SPID/CIE** vera (accreditamento AgID) e OAuth per i social.
- Foto su storage cloud e mappa georeferenziata (PostGIS).
